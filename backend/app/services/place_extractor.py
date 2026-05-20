"""
Uses Claude to extract eating establishment names from all available text sources
(transcript, OCR, captions/description).
"""

import json
import anthropic
from app.config import settings
from app.models.schemas import Place

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


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


def extract_places(
    transcript: str,
    ocr_text: str,
    captions: str,
    description: str,
) -> list[Place]:
    """
    Sends all text sources to Claude and returns extracted Place objects.
    """
    user_content = f"""AUDIO TRANSCRIPT:
{transcript or "(none)"}

ON-SCREEN TEXT (OCR):
{ocr_text or "(none)"}

VIDEO CAPTIONS/SUBTITLES:
{captions or "(none)"}

POST DESCRIPTION:
{description or "(none)"}
"""

    client = _get_client()
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    data = json.loads(raw)
    return [
        Place(
            name=item["name"],
            type=item.get("type"),
            confidence=float(item.get("confidence", 0.8)),
            source=item.get("source", "combined"),
        )
        for item in data
    ]
