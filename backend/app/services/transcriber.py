"""
Transcribes video audio to text using OpenAI Whisper (runs locally, no API cost).
"""

from app.config import settings

_model = None


def transcribe_audio(audio_path: str) -> str:
    """
    Runs Whisper on the given audio file and returns the full transcript as a string.
    Returns empty string if openai-whisper is not installed.
    """
    try:
        import whisper
    except ImportError:
        return ""

    global _model
    if _model is None:
        _model = whisper.load_model(settings.whisper_model)

    result = _model.transcribe(audio_path, fp16=False)
    return result.get("text", "").strip()
