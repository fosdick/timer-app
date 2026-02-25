"""
python-api / main.py
--------------------
FastAPI service for the yoga pose SVG pipeline.

Endpoint
  POST /trace
    Accept a sketch photo (JPEG / PNG) and return a clean, web-ready SVG.

Tracing strategy (two-tier)
  1. potrace  – preferred.  Produces smooth Bézier curves.
               Requires `potrace` binary on PATH.  Install with:
                 macOS:  brew install potrace
                 Ubuntu: apt install potrace
  2. OpenCV contours – fallback (no extra binary needed).
               Produces polygon paths; good enough for dev / iteration.

The active strategy is detected at startup and logged.

Run
  uvicorn main:app --reload --port 8001
"""

import io
import os
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from typing import Annotated

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Yoga Pose SVG Pipeline",
    description="Converts hand-drawn sketch photos to production-ready SVGs.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

POTRACE_AVAILABLE = shutil.which("potrace") is not None

@app.on_event("startup")
async def startup():
    strategy = "potrace (high quality)" if POTRACE_AVAILABLE else "OpenCV contours (fallback)"
    print(f"[python-api] tracer: {strategy}")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "tracer": "potrace" if POTRACE_AVAILABLE else "opencv",
    }


# ── Image preprocessing ───────────────────────────────────────────────────────

def preprocess(image_bytes: bytes, threshold: int, blur_radius: int) -> np.ndarray:
    """
    Convert a sketch photo to a clean binary image (white ink on black bg)
    ready for tracing.

    Steps
      1. Decode to grayscale
      2. Optional Gaussian blur to soften JPEG noise
      3. Adaptive threshold — handles uneven lighting / tracing-paper texture
      4. Invert so ink lines are WHITE on BLACK (potrace convention)
      5. Light morphological close to bridge tiny gaps in ink strokes
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    gray = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
    if gray is None:
        raise ValueError("Could not decode image — unsupported format?")

    # Blur (odd kernel size only)
    ksize = max(1, blur_radius | 1)   # ensure odd
    if ksize > 1:
        gray = cv2.GaussianBlur(gray, (ksize, ksize), 0)

    # Adaptive threshold — block size 31 works well for ~1000px wide scans
    binary = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=31,
        C=threshold,
    )

    # Invert: ink (dark) → white, background (light) → black
    inverted = cv2.bitwise_not(binary)

    # Small morphological close to connect broken ink strokes
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    cleaned = cv2.morphologyEx(inverted, cv2.MORPH_CLOSE, kernel)

    return cleaned


# ── Tracing: potrace ──────────────────────────────────────────────────────────

def trace_with_potrace(binary: np.ndarray, turdsize: int, alphamax: float, opttolerance: float) -> str:
    """
    Write the binary image to a temp PBM file, call potrace, read the SVG back.
    Returns the SVG string.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        pbm_path = os.path.join(tmpdir, "input.pbm")
        svg_path = os.path.join(tmpdir, "output.svg")

        # Save as PBM (potrace input format)
        # PIL PBM: 0 = black (foreground for potrace), 1 = white
        # Our binary: 255 = ink (foreground).  So we invert once more for PBM.
        pil_img = Image.fromarray(cv2.bitwise_not(binary))
        pil_img = pil_img.convert("1")   # 1-bit
        pil_img.save(pbm_path)

        cmd = [
            "potrace",
            "--svg",
            f"--turdsize={turdsize}",
            f"--alphamax={alphamax}",
            f"--opttolerance={opttolerance}",
            "--output", svg_path,
            pbm_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"potrace failed: {result.stderr}")

        with open(svg_path, "r") as f:
            return f.read()


# ── Tracing: OpenCV contours ──────────────────────────────────────────────────

def trace_with_opencv(binary: np.ndarray, simplify: float, min_area: int) -> str:
    """
    Find contours in the binary image and convert them to SVG <path> elements.
    Uses Douglas-Peucker simplification to reduce point count.
    Returns the SVG string.
    """
    h, w = binary.shape
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

    paths = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue   # skip noise / tiny specks

        # Douglas-Peucker simplification
        epsilon = simplify * cv2.arcLength(contour, closed=True) / 1000
        approx = cv2.approxPolyDP(contour, epsilon, closed=True)

        if len(approx) < 2:
            continue

        # Build SVG path data
        pts = approx.reshape(-1, 2)
        d = f"M {pts[0][0]} {pts[0][1]}"
        for pt in pts[1:]:
            d += f" L {pt[0]} {pt[1]}"
        d += " Z"
        paths.append(f'  <path d="{d}" />')

    path_block = "\n".join(paths)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}">\n'
        f'  <g fill="black" stroke="none">\n'
        f'{path_block}\n'
        f'  </g>\n'
        f'</svg>'
    )
    return svg


# ── /trace endpoint ───────────────────────────────────────────────────────────

@app.post(
    "/trace",
    response_class=Response,
    responses={
        200: {
            "content": {"image/svg+xml": {}},
            "description": "Clean SVG derived from the uploaded sketch photo.",
        }
    },
    summary="Convert a sketch photo to SVG",
)
async def trace(
    file: Annotated[UploadFile, File(description="Sketch photo (JPEG or PNG)")],

    # Preprocessing
    threshold: Annotated[int, Form(description="Adaptive threshold C value (2–20). Lower = more ink captured.", ge=0, le=50)] = 8,
    blur_radius: Annotated[int, Form(description="Gaussian blur radius before thresholding (0 = off, 3–7 recommended for photos).", ge=0, le=21)] = 3,

    # potrace options (used when potrace is available)
    turdsize: Annotated[int, Form(description="[potrace] Suppress speckles up to this area (px²).", ge=0, le=500)] = 10,
    alphamax: Annotated[float, Form(description="[potrace] Corner smoothing: 0 = sharp corners, 1.34 = all curves.", ge=0.0, le=1.34)] = 1.0,
    opttolerance: Annotated[float, Form(description="[potrace] Curve optimisation tolerance.", ge=0.0, le=5.0)] = 0.2,

    # OpenCV fallback options
    simplify: Annotated[float, Form(description="[opencv] Contour simplification factor (higher = fewer points).", ge=0.1, le=20.0)] = 2.0,
    min_area: Annotated[int, Form(description="[opencv] Minimum contour area to keep (px²). Removes noise.", ge=0, le=2000)] = 50,
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")

    image_bytes = await file.read()

    try:
        binary = preprocess(image_bytes, threshold=threshold, blur_radius=blur_radius)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        if POTRACE_AVAILABLE:
            svg = trace_with_potrace(binary, turdsize=turdsize, alphamax=alphamax, opttolerance=opttolerance)
        else:
            svg = trace_with_opencv(binary, simplify=simplify, min_area=min_area)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tracing failed: {e}")

    filename = os.path.splitext(file.filename or "pose")[0] + ".svg"
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
