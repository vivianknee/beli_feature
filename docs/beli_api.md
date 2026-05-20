# Beli API — Reverse Engineering Notes

Beli does not publish a public API. This document tracks what has been discovered
by intercepting the Beli iOS app's network traffic using mitmproxy.

## How to capture traffic

1. Install mitmproxy on your Mac: `brew install mitmproxy`
2. Run `mitmweb` and note the proxy address (default: `127.0.0.1:8080`)
3. On your iPhone: Settings → Wi-Fi → your network → Configure Proxy → Manual → enter your Mac's IP + port 8080
4. Install the mitmproxy CA cert on the iPhone (visit `mitm.it` in Safari)
5. Open the Beli app and perform actions (log in, bookmark a place, search)
6. Watch the mitmweb UI at `http://localhost:8081` for captured requests

## Discovered Endpoints

> Status: **NOT YET CAPTURED** — fill in this table as you intercept traffic.

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Login | POST | `TBD` | Returns auth token |
| Search places | GET | `TBD` | Query param: `q` |
| Bookmark (want-to-try) | POST | `TBD` | Requires place_id |
| Get user profile | GET | `TBD` | |

## Headers to watch for

- `Authorization` — likely `Bearer <token>` but confirm format
- Any `X-App-Version`, `X-Device-Id`, or similar headers that may be required
- The base URL — could be `api.beli.app` or similar

## Next steps

Once endpoints are confirmed, update `backend/app/services/beli_client.py`
with the real URLs and request/response shapes.
