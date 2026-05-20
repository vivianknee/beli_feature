"""
Extracts on-screen text from video frames or photo slideshow images using PaddleOCR.
Skipped gracefully if cv2 / paddleocr are not installed.
"""


def _run_ocr(images) -> str:
    """
    images: list of numpy arrays (frames or loaded photos)
    Returns deduplicated text from all images joined as a string.
    """
    try:
        from paddleocr import PaddleOCR
    except ImportError:
        return ""

    ocr = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=False, show_log=False)
    seen: set[str] = set()
    lines: list[str] = []

    for img in images:
        result = ocr.ocr(img, cls=True)
        if result and result[0]:
            for line in result[0]:
                text = line[1][0].strip()
                if text and text not in seen:
                    seen.add(text)
                    lines.append(text)

    return "\n".join(lines)


def extract_text_from_video(video_path: str, sample_interval_seconds: float = 2.0) -> str:
    """Samples frames from a video and runs OCR on each."""
    try:
        import cv2
    except ImportError:
        return ""

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return ""

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = int(fps * sample_interval_seconds)

    frames = []
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i % frame_interval == 0:
            frames.append(frame)
        i += 1
    cap.release()

    return _run_ocr(frames)


def extract_text_from_images(image_paths: list[str]) -> str:
    """Runs OCR on a list of image file paths (for photo slideshows)."""
    try:
        import cv2
    except ImportError:
        return ""

    images = []
    for path in image_paths:
        img = cv2.imread(path)
        if img is not None:
            images.append(img)

    return _run_ocr(images)
