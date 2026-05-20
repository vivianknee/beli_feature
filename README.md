# Beli Reel Saver

Share TikTok and Instagram Reels into this app to automatically extract restaurant, cafe, and bakery names — then save them directly to your Beli account with one tap.

## How it works

1. **Share** a food reel from TikTok or Instagram to this app
2. The backend **extracts place names** from the video (audio transcription + OCR + caption parsing + AI)
3. A **checklist** of found places appears in the app
4. Select the ones you want → tap **Done** → they're saved to your Beli bookmarks

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo) with iOS Share Extension |
| Backend API | Python FastAPI |
| Video download | yt-dlp |
| Audio transcription | OpenAI Whisper |
| Frame OCR | PaddleOCR |
| Place extraction | Claude API (Anthropic) |
| Beli integration | Reverse-engineered internal API |

## Project Structure

```
beli_feature/
├── app/          # React Native (Expo) mobile app
├── backend/      # Python FastAPI server
└── docs/         # API reverse engineering notes, architecture docs
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy and fill in your env vars
cp .env.example .env

uvicorn app.main:app --reload
```

Requires: Python 3.11+, FFmpeg installed on the system.

### App

```bash
cd app
npm install
npx expo start
```

Requires: Node 18+, Expo CLI, Xcode (for iOS share extension).

## Beli API

Beli does not have a public API. See `docs/beli_api.md` for reverse-engineering notes and the discovered endpoints. The `BeliClient` in `backend/app/services/beli_client.py` implements these calls.

To discover Beli's endpoints yourself, set up mitmproxy on your device and log into the Beli app while intercepting traffic.

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key for place name extraction |
| `BELI_BASE_URL` | Beli API base URL (see docs/beli_api.md) |
| `SECRET_KEY` | JWT signing secret for the backend |
