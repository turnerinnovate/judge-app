from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
import numpy as np

app = FastAPI(title="INNOVATE AI JUDGE Analysis Service")

class LandmarkFrame(BaseModel):
    points: Dict[str, List[float]]

class AnalyzeRequest(BaseModel):
    event_type: str
    frames: List[LandmarkFrame]
    has_weapon: bool = False


def quality_assessment(frames: List[LandmarkFrame]) -> dict:
    visible = [len(f.points) for f in frames]
    visibility = float(np.mean([min(v / 12.0, 1.0) for v in visible])) if visible else 0.0
    stability = float(max(0.0, 1.0 - np.std(visible) / 12.0)) if visible else 0.0
    blur = 0.8
    lighting = 0.75
    overall = float(np.mean([visibility, stability, blur, lighting]))
    return {"visibility": visibility, "stability": stability, "blur": blur, "lighting": lighting, "overall": overall}


def segment_phases(frames: List[LandmarkFrame]) -> List[dict]:
    if not frames:
        return []
    chunk = max(1, len(frames) // 4)
    segments = []
    for i in range(0, len(frames), chunk):
        segments.append({"label": f"Phase {len(segments)+1}", "start": i, "end": min(len(frames)-1, i+chunk-1)})
    return segments


def confidence_bundle(quality: dict, has_weapon: bool):
    pose = quality["visibility"]
    segmentation = 0.7 if quality["stability"] > 0.6 else 0.5
    weapon = 0.68 if has_weapon else 0.9
    overall = float(np.mean([pose, segmentation, weapon]))
    return {
        "pose": pose,
        "segmentation": segmentation,
        "weapon": weapon,
        "overall": overall,
        "rationale": ["Pose depends on visible landmark completeness", "Weapon confidence is heuristic in MVP"]
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "analysis"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    quality = quality_assessment(req.frames)
    phases = segment_phases(req.frames)
    confidence = confidence_bundle(quality, req.has_weapon)

    return {
        "eventType": req.event_type,
        "phaseAnnotations": phases,
        "videoQuality": quality,
        "confidence": confidence,
        "limitations": [
            "Best with one performer in frame",
            "2D pose depth ambiguity",
            "Weapon path estimation is heuristic"
        ]
    }
