"""
Standalone extraction quality test.
Tests the Claude extraction step only — no video download, Whisper, or PaddleOCR needed.

Run:
    pip install anthropic
    ANTHROPIC_API_KEY=sk-... python test_extraction.py
"""

import json
import os
import sys
import anthropic

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    sys.exit("Set ANTHROPIC_API_KEY first.")

client = anthropic.Anthropic(api_key=API_KEY)

SYSTEM_PROMPT = """You are a helpful assistant that extracts the names of eating establishments
(restaurants, cafes, bakeries, bars, food stalls, etc.) from text scraped from food-related
social media videos.

You will receive text from multiple sources: audio transcript, on-screen text (OCR), and the
video caption/description. Your job is to identify every specific eating establishment mentioned
or shown.

Return ONLY a JSON array of objects with this shape:
[
  {
    "name": "The establishment name as it appears",
    "type": "restaurant|cafe|bakery|bar|food_stall|unknown",
    "confidence": 0.95,
    "source": "transcript|ocr|caption|combined"
  }
]

Rules:
- Only include real, named establishments (not generic phrases like "a local cafe")
- If the same place appears in multiple sources, merge into one entry with source="combined" and higher confidence
- Confidence reflects how certain you are this is a real place name (not a misread or partial word)
- Do not include food items, dishes, or brands that aren't an establishment name
- If no establishments are found, return an empty array []
"""

# ---------------------------------------------------------------------------
# Test cases
# Each is a dict with keys: name, transcript, ocr, captions, description,
# and expected (list of place names we expect to find — used to grade output)
# ---------------------------------------------------------------------------

CASES = [
    {
        "name": "1. Simple name-drop in transcript",
        "transcript": "So today I'm taking you guys to Nobu in Malibu. The omakase here is insane.",
        "ocr": "",
        "captions": "",
        "description": "",
        "expected": ["Nobu"],
    },
    {
        "name": "2. Name only in OCR overlay (no speech)",
        "transcript": "So I found this really cute spot on my way to the beach.",
        "ocr": "Gjusta\nVenice, CA\n@gjusta",
        "captions": "",
        "description": "",
        "expected": ["Gjusta"],
    },
    {
        "name": "3. Name only in description / caption",
        "transcript": "come with me to try the best croissant in the city",
        "ocr": "",
        "captions": "",
        "description": "breakfast at Republique 🥐 #LA #food",
        "expected": ["Republique"],
    },
    {
        "name": "4. Multiple places in one reel",
        "transcript": "First stop is Sqirl for the ricotta toast, then we're heading over to Intelligentsia for coffee, and finishing the day at Night + Market.",
        "ocr": "SQIRL\nSilverLake",
        "captions": "",
        "description": "LA food tour 🍽 @sqirlla @intelligentsiacoffee @nightmarketla",
        "expected": ["Sqirl", "Intelligentsia", "Night + Market"],
    },
    {
        "name": "5. Should NOT extract food items or brands",
        "transcript": "I got a matcha latte and an avocado toast. So good.",
        "ocr": "Starbucks Reserve\nMatcha Latte $7",
        "captions": "",
        "description": "#matcha #breakfast",
        "expected": ["Starbucks Reserve"],  # the menu items should not appear
    },
    {
        "name": "6. Noisy OCR with partial words",
        "transcript": "We ended up at this tiny place called Horses.",
        "ocr": "H0RSES\nRestaurant & Bar\nLOS ANGEL ES\n5pm - 2am\nFOLLOW US @horsesla",
        "captions": "",
        "description": "",
        "expected": ["Horses"],
    },
    {
        "name": "7. Non-English reel (should still extract the English name)",
        "transcript": "Heute waren wir im Café Einstein in Berlin. Super gut.",
        "ocr": "Café Einstein\nUnter den Linden",
        "captions": "",
        "description": "Frühstück in Berlin ☕️ #berlin #cafe",
        "expected": ["Café Einstein"],
    },
    {
        "name": "8. No eating establishments (should return empty)",
        "transcript": "Today I'm showing you my morning routine. Wake up, stretch, journaling.",
        "ocr": "Morning Routine\nDay 1",
        "captions": "",
        "description": "#morningroutine #wellness",
        "expected": [],
    },
    {
        "name": "9. Ambiguous — generic name that could be a place",
        "transcript": "We went to this place called The Farm.",
        "ocr": "The Farm\nSarasota",
        "captions": "",
        "description": "#farmtotable",
        "expected": ["The Farm"],
    },
    {
        "name": "10. Place mentioned indirectly",
        "transcript": "You have to try the #1 ramen in NYC — they said it's from Ivan Ramen.",
        "ocr": "",
        "captions": "",
        "description": "Ivan Ramen NYC 🍜",
        "expected": ["Ivan Ramen"],
    },
]

# ---------------------------------------------------------------------------

def run_case(case: dict) -> tuple[list[dict], bool]:
    user_content = f"""AUDIO TRANSCRIPT:
{case["transcript"] or "(none)"}

ON-SCREEN TEXT (OCR):
{case["ocr"] or "(none)"}

VIDEO CAPTIONS/SUBTITLES:
{case["captions"] or "(none)"}

POST DESCRIPTION:
{case["description"] or "(none)"}
"""
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )
    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    results = json.loads(raw)

    extracted_names = [r["name"].lower() for r in results]
    expected_names = [e.lower() for e in case["expected"]]

    passed = all(
        any(exp in name or name in exp for name in extracted_names)
        for exp in expected_names
    ) and (len(expected_names) == 0) == (len(results) == 0)

    return results, passed


def main():
    passed = 0
    failed = 0

    for case in CASES:
        print(f"\n{'─' * 60}")
        print(f"  {case['name']}")
        print(f"{'─' * 60}")
        try:
            results, ok = run_case(case)
        except Exception as e:
            print(f"  ERROR: {e}")
            failed += 1
            continue

        status = "PASS" if ok else "FAIL"
        print(f"  Result:   {status}")
        print(f"  Expected: {case['expected']}")
        print(f"  Got:      {[r['name'] for r in results]}")
        if results:
            for r in results:
                conf = r.get("confidence", "?")
                src = r.get("source", "?")
                typ = r.get("type", "?")
                print(f"            • {r['name']!r:30s}  type={typ:12s}  conf={conf}  src={src}")

        if ok:
            passed += 1
        else:
            failed += 1

    total = passed + failed
    print(f"\n{'═' * 60}")
    print(f"  {passed}/{total} passed")
    print(f"{'═' * 60}\n")


if __name__ == "__main__":
    main()
