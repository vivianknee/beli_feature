from pydantic import BaseModel, HttpUrl
from typing import Optional


class ExtractRequest(BaseModel):
    video_url: str  # TikTok or Instagram Reel URL


class Place(BaseModel):
    name: str
    type: Optional[str] = None  # "restaurant", "cafe", "bakery", etc.
    confidence: float  # 0.0–1.0, how confident the AI is this is a real place name
    source: str  # "transcript", "ocr", "caption", or "combined"


class ExtractResponse(BaseModel):
    places: list[Place]
    video_title: Optional[str] = None
    raw_transcript: Optional[str] = None  # omitted in production, useful for debugging


class SavePlacesRequest(BaseModel):
    beli_token: str
    place_names: list[str]


class SavePlacesResponse(BaseModel):
    saved: list[str]
    failed: list[str]


class BeliAuthRequest(BaseModel):
    email: str
    password: str


class BeliAuthResponse(BaseModel):
    token: str
    user_id: str
    display_name: str
