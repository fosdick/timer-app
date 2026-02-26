"""
python-api / main.py
--------------------
FastAPI service for the yoga pose SVG pipeline.

Endpoints
  POST /trace
    Accept a sketch photo (JPEG / PNG) and an optional MediaPipe keypoints
    JSON file. Returns a clean, web-ready SVG.  If keypoints are supplied the
    SVG is normalised: rotated so the shoulder line is horizontal and
    translated so the body bounding-box is centred in the canvas.

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
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
from typing import Annotated, Optional

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
    version="0.2.0",
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
        "normalization": "available",
    }


# ── Image preprocessing ───────────────────────────────────────────────────────

def preprocess(image_bytes: bytes, threshold: int, blur_radius: int, edge_margin: int) -> np.ndarray:
    """
    Convert a sketch photo to a clean binary image (white ink on black bg)
    ready for tracing.

    Steps
      1. Decode to grayscale
      2. Optional Gaussian blur to soften JPEG noise
      3. Adaptive threshold — handles uneven lighting / tracing-paper texture
      4. Invert so ink lines are WHITE on BLACK (potrace convention)
      5. Light morphological close to bridge tiny gaps in ink strokes
      6. Black-out a border of edge_margin pixels on all four sides — eliminates
         spiral binding (left edge), paper boundary rectangle (all edges), and
         corner noise artefacts before the image reaches either tracer.
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

    # Zero out the edge margin — black border kills binding/paper-edge artefacts
    # before the image reaches either tracer (potrace or opencv).
    if edge_margin > 0:
        h, w = cleaned.shape
        m = edge_margin
        cleaned[:m, :]    = 0   # top
        cleaned[h - m:, :] = 0  # bottom
        cleaned[:, :m]    = 0   # left  (catches spiral binding)
        cleaned[:, w - m:] = 0  # right

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

def trace_with_opencv(
    binary: np.ndarray,
    simplify: float,
    min_area: int,
    max_area_fraction: float,
) -> str:
    """
    Find contours in the binary image and convert them to SVG <path> elements.
    Uses Douglas-Peucker simplification to reduce point count.

    Note: edge_margin masking is applied upstream in preprocess() so both this
    path and the potrace path receive a clean, border-zeroed image.

    Filters applied here:
      min_area         — drop tiny specks (noise)
      max_area_fraction — drop contours that cover most of the image (secondary
                          safety net for any large artefact that survived masking)
    Returns the SVG string.
    """
    h, w = binary.shape
    total_area = h * w
    contours, _ = cv2.findContours(binary, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)

    paths = []
    for contour in contours:
        area = cv2.contourArea(contour)

        # ── Size filters ──────────────────────────────────────────────────────
        if area < min_area:
            continue   # too small — noise / speck

        if area > max_area_fraction * total_area:
            continue   # too large — almost certainly the paper boundary rectangle

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


# ── SVG normalisation via MediaPipe keypoints ─────────────────────────────────

def normalize_svg(
    svg_str: str,
    keypoints_data: list,
    img_width: int,
    img_height: int,
    padding: float = 0.15,
    vis_threshold: float = 0.5,
) -> str:
    """
    Re-centre and rotate an SVG using MediaPipe pose keypoints.

    Algorithm
    ─────────
    1. Filter keypoints by visibility threshold (default 0.5).
    2. Compute body bounding box in pixel space from visible keypoints.
    3. Compute body centre (midpoint of bounding box).
    4. Compute shoulder-line angle; apply inverse rotation to level the pose.
    5. Compose into a single SVG transform:
         translate(svg_cx - body_cx, svg_cy - body_cy)
         rotate(angle, body_cx, body_cy)
       which rotates the figure around body_cx/cy then translates it to the
       SVG canvas centre.
    6. Update the <svg> viewBox to a tight square crop around the normalised
       body, with `padding` fraction of extra whitespace on each side.

    Returns the modified SVG string (unchanged if no usable keypoints found).
    """
    W, H = float(img_width), float(img_height)
    svg_cx = W / 2.0
    svg_cy = H / 2.0

    # ── Filter visible keypoints ───────────────────────────────────────────────
    kp = {k["name"]: k for k in keypoints_data if k.get("visibility", 0) >= vis_threshold}
    if not kp:
        return svg_str   # nothing to work with

    # ── Pixel coordinates of all visible keypoints ────────────────────────────
    all_pts = np.array([[k["x"] * W, k["y"] * H] for k in kp.values()])
    kp_min  = all_pts.min(axis=0)
    kp_max  = all_pts.max(axis=0)
    body_cx = float((kp_min[0] + kp_max[0]) / 2.0)
    body_cy = float((kp_min[1] + kp_max[1]) / 2.0)

    # ── Rotation: level the shoulder line ─────────────────────────────────────
    # MediaPipe landmark conventions (person faces camera):
    #   left_shoulder.x  >  right_shoulder.x  (mirrored horizontally)
    # We want the vector from right_shoulder → left_shoulder to be horizontal.
    angle_deg = 0.0
    ls = kp.get("left_shoulder")
    rs = kp.get("right_shoulder")
    if ls and rs:
        dx = (ls["x"] - rs["x"]) * W
        dy = (ls["y"] - rs["y"]) * H
        angle_deg = -math.degrees(math.atan2(dy, dx))
        # Clamp to ±45° — anything bigger is likely a non-standard pose or bad
        # keypoint; don't over-rotate.
        angle_deg = max(-45.0, min(45.0, angle_deg))

    # ── Composite SVG transform ───────────────────────────────────────────────
    # SVG applies transforms left-to-right (inner-to-outer in matrix terms).
    # "translate(tx, ty) rotate(a, cx, cy)" means:
    #   1. rotate by `a` degrees around (cx, cy)
    #   2. translate by (tx, ty)
    tx = svg_cx - body_cx
    ty = svg_cy - body_cy
    transform = (
        f"translate({tx:.3f},{ty:.3f}) "
        f"rotate({angle_deg:.4f},{body_cx:.3f},{body_cy:.3f})"
    )

    # ── Updated viewBox — tight square crop around body ───────────────────────
    body_w   = float(kp_max[0] - kp_min[0])
    body_h   = float(kp_max[1] - kp_min[1])
    half_span = max(body_w, body_h) * (0.5 + padding)
    vb_x   = svg_cx - half_span
    vb_y   = svg_cy - half_span
    vb_size = half_span * 2.0

    # ── Patch the SVG string ───────────────────────────────────────────────────
    svg_out = _update_svg_tag(svg_str, vb_x, vb_y, vb_size)
    svg_out = _wrap_svg_content(svg_out, transform)
    return svg_out


def _update_svg_tag(svg_str: str, vb_x: float, vb_y: float, vb_size: float) -> str:
    """Replace width, height, and viewBox in the opening <svg> tag."""
    vb = f"{vb_x:.2f} {vb_y:.2f} {vb_size:.2f} {vb_size:.2f}"
    # viewBox="..."
    svg_str = re.sub(r'viewBox="[^"]*"', f'viewBox="{vb}"', svg_str, count=1)
    # width="..."  (may or may not be present)
    if re.search(r'\swidth="[^"]*"', svg_str):
        svg_str = re.sub(r'\swidth="[^"]*"', f' width="{vb_size:.2f}"', svg_str, count=1)
    # height="..."
    if re.search(r'\sheight="[^"]*"', svg_str):
        svg_str = re.sub(r'\sheight="[^"]*"', f' height="{vb_size:.2f}"', svg_str, count=1)
    return svg_str


def _wrap_svg_content(svg_str: str, transform: str) -> str:
    """Insert <g transform="..."> immediately after the opening <svg ...> tag."""
    svg_start = svg_str.find('<svg')
    if svg_start == -1:
        return svg_str
    # Find the closing '>' of the opening <svg tag.
    # Attribute values are always quoted so the first bare '>' after '<svg' is it.
    tag_end_idx = svg_str.index('>', svg_start) + 1
    close_idx   = svg_str.rfind('</svg>')
    if close_idx == -1:
        return svg_str

    inner = svg_str[tag_end_idx:close_idx]
    return (
        svg_str[:tag_end_idx]
        + f'\n<g transform="{transform}">'
        + inner
        + '</g>\n'
        + svg_str[close_idx:]
    )


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

    # Optional keypoints for normalisation
    keypoints_file: Annotated[
        Optional[UploadFile],
        File(description=(
            "Optional: MediaPipe keypoints JSON for this pose "
            "(the *_keypoints.json produced by files-detector). "
            "When supplied the SVG is rotated and centred automatically."
        )),
    ] = None,

    # Preprocessing — applies to both potrace and opencv
    threshold: Annotated[int,   Form(ge=0,   le=50)]  = 8,
    blur_radius: Annotated[int, Form(ge=0,   le=21)]  = 3,
    edge_margin: Annotated[int, Form(ge=0,   le=300)] = 40,

    # potrace options (used when potrace is available)
    turdsize:     Annotated[int,   Form(ge=0,   le=500)]  = 10,
    alphamax:     Annotated[float, Form(ge=0.0, le=1.34)] = 1.0,
    opttolerance: Annotated[float, Form(ge=0.0, le=5.0)]  = 0.2,

    # OpenCV fallback options
    simplify:          Annotated[float, Form(ge=0.1, le=20.0)] = 2.0,
    min_area:          Annotated[int,   Form(ge=0,   le=2000)] = 50,
    max_area_fraction: Annotated[float, Form(ge=0.0, le=1.0)]  = 0.5,

    # Normalisation options
    norm_padding:       Annotated[float, Form(ge=0.0, le=1.0)]  = 0.15,
    norm_vis_threshold: Annotated[float, Form(ge=0.0, le=1.0)]  = 0.5,
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=415, detail="Upload a JPEG, PNG, or WebP image.")

    image_bytes = await file.read()

    try:
        binary = preprocess(image_bytes, threshold=threshold, blur_radius=blur_radius, edge_margin=edge_margin)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        if POTRACE_AVAILABLE:
            svg = trace_with_potrace(binary, turdsize=turdsize, alphamax=alphamax, opttolerance=opttolerance)
        else:
            svg = trace_with_opencv(binary, simplify=simplify, min_area=min_area, max_area_fraction=max_area_fraction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tracing failed: {e}")

    # ── Optional normalisation ─────────────────────────────────────────────────
    if keypoints_file is not None:
        try:
            kp_bytes = await keypoints_file.read()
            kp_data  = json.loads(kp_bytes)
            keypoints = kp_data.get("keypoints", [])
            if not keypoints:
                raise ValueError("No 'keypoints' array found in JSON.")
            h, w = binary.shape
            svg = normalize_svg(
                svg, keypoints, img_width=w, img_height=h,
                padding=norm_padding, vis_threshold=norm_vis_threshold,
            )
        except Exception as e:
            # Non-fatal — return the raw SVG with a warning header
            return Response(
                content=svg,
                media_type="image/svg+xml",
                headers={
                    "Content-Disposition": f'attachment; filename="{_svg_filename(file.filename)}"',
                    "X-Normalisation-Error": str(e),
                },
            )

    filename = _svg_filename(file.filename)
    normalised = "true" if keypoints_file is not None else "false"
    return Response(
        content=svg,
        media_type="image/svg+xml",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Normalised": normalised,
        },
    )


def _svg_filename(original: Optional[str]) -> str:
    return os.path.splitext(original or "pose")[0] + ".svg"
