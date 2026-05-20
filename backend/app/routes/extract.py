"""
POST /extract  — takes a TikTok or Instagram URL (video reel or photo slideshow),
runs the full pipeline, and returns a list of extracted eating establishment names.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException

from app.models.schemas import ExtractRequest, ExtractResponse
from app.services.video_downloader import download
from app.services.transcriber import transcribe_audio
from app.services.frame_ocr import extract_text_from_video, extract_text_from_images
from app.services.place_extractor import extract_places

import tempfile

router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=4)


def _run_pipeline(url: str) -> ExtractResponse:
    with tempfile.TemporaryDirectory() as tmpdir:
        result = download(url, tmpdir)

        transcript = ""
        ocr_text = ""

        if result.is_photo_post:
            ocr_text = extract_text_from_images(result.image_paths)
        else:
            with ThreadPoolExecutor(max_workers=2) as inner:
                t_future = inner.submit(transcribe_audio, result.audio_path) if result.audio_path else None
                o_future = inner.submit(extract_text_from_video, result.video_path) if result.video_path else None
                try:
                    transcript = t_future.result(timeout=180) if t_future else ""
                except Exception as e:
                    print(f"Transcription failed (skipping): {e}")
                    transcript = ""
                try:
                    ocr_text = o_future.result(timeout=60) if o_future else ""
                except Exception as e:
                    print(f"OCR failed (skipping): {e}")
                    ocr_text = ""

        places = extract_places(
            transcript=transcript,
            ocr_text=ocr_text,
            captions=result.captions,
            description=result.description,
        )

        return ExtractResponse(places=places, video_title=result.title)


@router.post("/extract", response_model=ExtractResponse)
async def extract_places_from_url(body: ExtractRequest):
    url = body.video_url.strip()
    if "tiktok.com" not in url and "instagram.com" not in url:
        raise HTTPException(status_code=400, detail="Only TikTok and Instagram URLs are supported.")

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(_executor, _run_pipeline, url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return result
