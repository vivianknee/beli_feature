"""
Beli API client.

Beli does not have a public API. The endpoints here were discovered by intercepting
traffic from the Beli iOS app using mitmproxy. See docs/beli_api.md for details
on how to capture and update these if Beli changes their API.

STATUS: Endpoints are placeholders until reverse engineering is complete.
        Replace base URL, headers, and request shapes once confirmed.
"""

import httpx
from app.config import settings


class BeliAuthError(Exception):
    pass


class BeliClient:
    def __init__(self, token: str):
        self.token = token
        self._base = settings.beli_base_url
        self._headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            # TODO: add any required app-specific headers discovered via mitmproxy
            # e.g. "X-App-Version": "3.x.x", "X-Platform": "ios"
        }

    # ------------------------------------------------------------------
    # Auth (called before creating a BeliClient instance)
    # ------------------------------------------------------------------

    @staticmethod
    async def login(email: str, password: str) -> tuple[str, str, str]:
        """
        Returns (token, user_id, display_name).
        TODO: confirm endpoint and request/response shape via mitmproxy.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.beli_base_url}/auth/login",
                json={"email": email, "password": password},
                timeout=10,
            )
        if resp.status_code != 200:
            raise BeliAuthError(f"Beli login failed: {resp.status_code} {resp.text}")
        data = resp.json()
        return data["token"], data["userId"], data["displayName"]

    # ------------------------------------------------------------------
    # Bookmarks / Want-to-try list
    # ------------------------------------------------------------------

    async def search_place(self, name: str) -> str | None:
        """
        Searches Beli's place database for a restaurant by name.
        Returns the Beli place_id if found, None otherwise.
        TODO: confirm search endpoint and response shape.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self._base}/places/search",
                params={"q": name, "limit": 1},
                headers=self._headers,
                timeout=10,
            )
        if resp.status_code != 200:
            return None
        results = resp.json().get("places", [])
        return results[0]["id"] if results else None

    async def bookmark_place(self, place_id: str) -> bool:
        """
        Adds a place to the user's "want to try" list in Beli.
        Returns True on success.
        TODO: confirm bookmark endpoint and request shape.
        """
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._base}/users/me/bookmarks",
                json={"placeId": place_id},
                headers=self._headers,
                timeout=10,
            )
        return resp.status_code in (200, 201)

    # ------------------------------------------------------------------
    # Convenience: search + bookmark in one call
    # ------------------------------------------------------------------

    async def save_place_by_name(self, name: str) -> bool:
        """
        Finds a place by name and bookmarks it. Returns True if successful.
        """
        place_id = await self.search_place(name)
        if not place_id:
            return False
        return await self.bookmark_place(place_id)
