"""
Basic tests for the extraction pipeline.
These use mocked services so they run without FFmpeg, Whisper, or PaddleOCR installed.
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200


def test_extract_rejects_non_social_urls():
    resp = client.post("/api/extract", json={"video_url": "https://youtube.com/watch?v=abc"})
    assert resp.status_code == 400


@patch("app.routes.extract._run_pipeline")
def test_extract_returns_places(mock_pipeline):
    from app.models.schemas import ExtractResponse, Place

    mock_pipeline.return_value = ExtractResponse(
        places=[
            Place(name="Blue Bottle Coffee", type="cafe", confidence=0.95, source="transcript"),
            Place(name="Tartine Bakery", type="bakery", confidence=0.9, source="ocr"),
        ],
        video_title="Best SF Coffee Spots",
    )

    resp = client.post("/api/extract", json={"video_url": "https://www.tiktok.com/@user/video/123"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["places"]) == 2
    assert data["places"][0]["name"] == "Blue Bottle Coffee"
