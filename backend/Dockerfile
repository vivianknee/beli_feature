FROM python:3.11-slim

# FFmpeg is required by Whisper and yt-dlp
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper model so first request isn't slow
ARG WHISPER_MODEL=base
RUN python -c "import whisper; whisper.load_model('${WHISPER_MODEL}')"

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
