"""
Local extraction CLI.

Usage:
    python extract_cli.py <tiktok-or-instagram-url>

Example:
    python extract_cli.py "https://www.tiktok.com/@user/video/123456"
"""

import sys
import os
import json
import tempfile

# ── Dependency checks ────────────────────────────────────────────────────────

missing = []
try:
    import yt_dlp
except ImportError:
    missing.append("yt-dlp")

try:
    import whisper
except ImportError:
    missing.append("openai-whisper")

try:
    import anthropic
except ImportError:
    missing.append("anthropic")

if missing:
    sys.exit(f"Missing packages. Run:  pip install {' '.join(missing)}")

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    sys.exit("Set your API key first:  export ANTHROPIC_API_KEY=sk-ant-...")

# OCR is optional — skip gracefully if PaddleOCR isn't installed
try:
    from paddleocr import PaddleOCR
    import cv2
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

# ── Pipeline steps ────────────────────────────────────────────────────────────

def download(url: str, out_dir: str) -> dict:
    print("  Downloading video...")
    opts = {
        "outtmpl": os.path.join(out_dir, "%(id)s.%(ext)s"),
        "format": "mp4/best",
        "writeautomaticsub": True,
        "writesubtitles": True,
        "subtitleslangs": ["en", "en-US"],
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }],
        "keepvideo": True,
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)

    vid_id = info.get("id", "video")
    return {
        "id": vid_id,
        "title": info.get("title", ""),
        "description": info.get("description", ""),
        "audio_path": os.path.join(out_dir, f"{vid_id}.mp3"),
        "video_path": os.path.join(out_dir, f"{vid_id}.mp4"),
    }


def transcribe(audio_path: str) -> str:
    print("  Transcribing audio (this takes ~30s on first run while model downloads)...")
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, fp16=False)
    return result.get("text", "").strip()


def ocr_frames(video_path: str) -> str:
    if not OCR_AVAILABLE:
        return ""
    print("  Running OCR on frames...")
    ocr = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=False, show_log=False)
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    interval = int(fps * 2)  # sample every 2 seconds
    seen, lines = set(), []
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % interval == 0:
            res = ocr.ocr(frame, cls=True)
            if res and res[0]:
                for line in res[0]:
                    t = line[1][0].strip()
                    if t and t not in seen:
                        seen.add(t)
                        lines.append(t)
        i += 1
    cap.release()
    return "\n".join(lines)


SYSTEM_PROMPT = """You extract the names of eating establishments (restaurants, cafes, bakeries,
bars, food stalls, etc.) from text scraped from food social media videos.

Return ONLY a JSON array:
[{"name": "...", "type": "restaurant|cafe|bakery|bar|food_stall|unknown", "confidence": 0.95, "source": "transcript|ocr|caption|combined"}]

Rules:
- Only named establishments, not generic phrases ("a local cafe") or food items
- Merge duplicates across sources into one entry with source="combined"
- Return [] if none found
"""

def extract_places(transcript: str, ocr_text: str, description: str) -> list[dict]:
    print("  Asking Claude to extract place names...")
    client = anthropic.Anthropic(api_key=API_KEY)
    msg = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": f"""AUDIO TRANSCRIPT:\n{transcript or "(none)"}

ON-SCREEN TEXT (OCR):\n{ocr_text or "(none)"}

POST DESCRIPTION:\n{description or "(none)"}"""}],
    )
    raw = msg.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python extract_cli.py <url>")

    url = sys.argv[1]
    if "tiktok.com" not in url and "instagram.com" not in url:
        print("Warning: URL doesn't look like TikTok or Instagram, proceeding anyway...")

    print(f"\nExtracting places from:\n  {url}\n")

    with tempfile.TemporaryDirectory() as tmp:
        info = download(url, tmp)
        transcript = transcribe(info["audio_path"])
        ocr_text = ocr_frames(info["video_path"])
        places = extract_places(transcript, ocr_text, info["description"])

    # ── Print results ────────────────────────────────────────────────────────
    print(f"\n{'─' * 50}")
    print(f"  Video: {info['title'] or url}")
    print(f"{'─' * 50}")

    if not places:
        print("  No eating establishments found.")
    else:
        print(f"  Found {len(places)} place{'s' if len(places) != 1 else ''}:\n")
        for i, p in enumerate(places, 1):
            emoji = {"restaurant": "🍽", "cafe": "☕️", "bakery": "🥐",
                     "bar": "🍸", "food_stall": "🥡"}.get(p.get("type", ""), "📍")
            conf = int(p.get("confidence", 0) * 100)
            print(f"  {i}. {emoji}  {p['name']}")
            print(f"       type={p.get('type','?')}  confidence={conf}%  source={p.get('source','?')}")

    print(f"\n{'─' * 50}")

    if not OCR_AVAILABLE:
        print("  Note: PaddleOCR not installed — OCR step was skipped.")
        print("        Install it for better results on text-heavy videos:")
        print("        pip install paddlepaddle paddleocr opencv-python-headless")
    print()


if __name__ == "__main__":
    main()
