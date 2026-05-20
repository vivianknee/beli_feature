"""
Beli-facing routes: auth proxy and save-places endpoint.
The app sends the user's Beli credentials once to get a token, then uses that
token on subsequent requests. Tokens are never stored server-side.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    BeliAuthRequest,
    BeliAuthResponse,
    SavePlacesRequest,
    SavePlacesResponse,
)
from app.services.beli_client import BeliClient, BeliAuthError

router = APIRouter()


@router.post("/beli/auth", response_model=BeliAuthResponse)
async def beli_login(body: BeliAuthRequest):
    """Authenticates with Beli and returns a session token for use in /beli/save."""
    try:
        token, user_id, display_name = await BeliClient.login(body.email, body.password)
    except BeliAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return BeliAuthResponse(token=token, user_id=user_id, display_name=display_name)


@router.post("/beli/save", response_model=SavePlacesResponse)
async def save_places_to_beli(body: SavePlacesRequest):
    """
    Saves the given list of place names to the user's Beli bookmarks.
    The client must supply the token obtained from /beli/auth.
    """
    client = BeliClient(token=body.beli_token)

    saved: list[str] = []
    failed: list[str] = []

    for name in body.place_names:
        success = await client.save_place_by_name(name)
        if success:
            saved.append(name)
        else:
            failed.append(name)

    return SavePlacesResponse(saved=saved, failed=failed)
