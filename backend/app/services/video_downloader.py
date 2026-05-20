"""
Downloads video/photo posts and extracts metadata using yt-dlp.
Falls back to page scraping for TikTok photo slideshows (not supported by yt-dlp).
"""

import os
import re
import glob
import yt_dlp


class DownloadResult:
    def __init__(
        self,
        video_path: str | None,
        audio_path: str | None,
        image_paths: list[str],
        captions: str,
        description: str,
        title: str,
    ):
        self.video_path = video_path
        self.audio_path = audio_path
        self.image_paths = image_paths
        self.captions = captions
        self.description = description
        self.title = title

    @property
    def is_photo_post(self) -> bool:
        return len(self.image_paths) > 0 and not self.video_path


def _clean_url(url: str) -> str:
    from urllib.parse import urlparse, urlunparse
    parsed = urlparse(url)
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))


def _is_tiktok_photo(url: str) -> bool:
    return "tiktok.com" in url and "/photo/" in url


def _scrape_tiktok_photo(url: str) -> DownloadResult:
    """
    TikTok photo slideshows aren't downloadable via yt-dlp.
    Fetch the page and pull the description from meta tags — that's
    usually where food creators tag the restaurants.
    """
    import httpx
    from html import unescape

    clean = _clean_url(url)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        ),
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        resp = httpx.get(clean, headers=headers, follow_redirects=True, timeout=15)
        html = resp.text
    except Exception as e:
        raise RuntimeError(f"Could not fetch TikTok page: {e}")

    def meta(name: str) -> str:
        # Try og: and name= variants
        for pattern in [
            rf'<meta[^>]+property=["\']og:{name}["\'][^>]+content=["\']([^"\']+)["\']',
            rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:{name}["\']',
            rf'<meta[^>]+name=["\']{name}["\'][^>]+content=["\']([^"\']+)["\']',
        ]:
            m = re.search(pattern, html, re.IGNORECASE)
            if m:
                return unescape(m.group(1))
        return ""

    description = meta("description") or meta("title") or ""
    title = meta("title") or ""

    return DownloadResult(
        video_path=None,
        audio_path=None,
        image_paths=[],
        captions="",
        description=description,
        title=title,
    )


def download(url: str, output_dir: str) -> DownloadResult:
    # TikTok photo posts — yt-dlp can't handle these, scrape metadata instead
    if _is_tiktok_photo(url):
        return _scrape_tiktok_photo(url)

    ydl_opts = {
        "outtmpl": os.path.join(output_dir, "%(id)s.%(ext)s"),
        "writeautomaticsub": True,
        "writesubtitles": True,
        "subtitleslangs": ["en", "en-US"],
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
        except yt_dlp.utils.UnsupportedError:
            clean = _clean_url(url)
            if clean == url:
                raise
            info = ydl.extract_info(clean, download=True)

    entries = info.get("entries") or [info]
    first = entries[0]

    vid_id = first.get("id", info.get("id", "post"))
    title = first.get("title", info.get("title", ""))
    description = first.get("description", info.get("description", ""))
    captions = _collect_captions(output_dir, vid_id, first)

    image_paths = _find_images(output_dir)
    video_path = _find_video(output_dir, vid_id)
    audio_path = _extract_audio(video_path, output_dir, vid_id) if video_path else None

    return DownloadResult(
        video_path=video_path,
        audio_path=audio_path,
        image_paths=image_paths,
        captions=captions,
        description=description,
        title=title,
    )


def _find_video(output_dir: str, vid_id: str) -> str | None:
    for ext in ("mp4", "webm", "mkv"):
        p = os.path.join(output_dir, f"{vid_id}.{ext}")
        if os.path.exists(p):
            return p
    for ext in ("mp4", "webm", "mkv"):
        matches = glob.glob(os.path.join(output_dir, f"*.{ext}"))
        if matches:
            return matches[0]
    return None


def _find_images(output_dir: str) -> list[str]:
    images = []
    for ext in ("jpg", "jpeg", "png", "webp"):
        images.extend(glob.glob(os.path.join(output_dir, f"*.{ext}")))
    return sorted(images)


def _extract_audio(video_path: str, output_dir: str, vid_id: str) -> str | None:
    audio_path = os.path.join(output_dir, f"{vid_id}.mp3")
    opts = {
        "outtmpl": os.path.join(output_dir, f"{vid_id}.%(ext)s"),
        "format": "bestaudio/best",
        "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "128"}],
        "quiet": True,
        "no_warnings": True,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([f"file:{video_path}"])
        return audio_path if os.path.exists(audio_path) else None
    except Exception:
        return None


def _collect_captions(output_dir: str, video_id: str, info: dict) -> str:
    lines = []
    for source in ("automatic_captions", "subtitles"):
        for lang_data in info.get(source, {}).values():
            for entry in lang_data:
                if entry.get("ext") in ("json3", "vtt", "srt"):
                    path = os.path.join(output_dir, f"{video_id}.{entry['ext']}")
                    if os.path.exists(path):
                        with open(path) as f:
                            lines.append(f.read())
                        break
    return "\n".join(lines)
