"""Async worker primitives for training-only analysis and coaching workflows."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List


@dataclass
class Job:
    id: str
    organization_id: str
    type: str
    status: str
    payload: Dict[str, Any]
    result: Dict[str, Any] | None = None
    error: str | None = None
    history: List[Dict[str, Any]] = field(default_factory=list)


ALLOWED_TYPES = {
    "ANALYZE_REFERENCE_VIDEO",
    "ANALYZE_STUDENT_SUBMISSION",
    "RECALCULATE_PROGRESS_METRICS",
    "RENDER_VISUALIZATION",
}


def _event(job: Job, stage: str, detail: Dict[str, Any] | None = None) -> None:
    job.history.append({"timestamp": datetime.utcnow().isoformat(), "stage": stage, "detail": detail or {}})


def process_job(job: Job) -> Job:
    _event(job, "RECEIVED", {"status": job.status, "type": job.type})
    if job.type not in ALLOWED_TYPES:
        job.status = "FAILED"
        job.error = f"Unsupported job type: {job.type}"
        _event(job, "FAILED", {"error": job.error})
        return job

    job.status = "PROCESSING"
    _event(job, "PROCESSING")

    if job.type in {"ANALYZE_REFERENCE_VIDEO", "ANALYZE_STUDENT_SUBMISSION"}:
        return _process_analysis_job(job)

    if job.type == "RECALCULATE_PROGRESS_METRICS":
        return _process_progress_job(job)

    if job.type == "RENDER_VISUALIZATION":
        job.status = "COMPLETED"
        job.result = {"status": "COMPLETED", "artifactType": "KEYFRAME_SNAPSHOTS", "count": int(job.payload.get("snapshotCount", 4))}
        _event(job, "COMPLETED", job.result)
        return job

    job.status = "COMPLETED"
    job.result = {"status": "NOOP_COMPLETE"}
    _event(job, "COMPLETED", job.result)
    return job


def _process_analysis_job(job: Job) -> Job:
    quality = float(job.payload.get("quality", 0.75))
    confidence = float(job.payload.get("confidence", 0.7))

    if quality < 0.45 or confidence < 0.5:
        job.status = "FAILED"
        job.result = {
            "reason": "Low analysis confidence or poor video quality.",
            "recommendedAction": "Re-record with full body visible, stable camera, and improved lighting.",
            "confidence": confidence,
            "quality": quality,
        }
        _event(job, "FAILED", job.result)
        return job

    job.status = "COMPLETED"
    job.result = {
        "analysisStatus": "COMPLETED",
        "confidence": confidence,
        "quality": quality,
        "coachingEligible": True,
    }
    _event(job, "COMPLETED", job.result)
    return job


def _process_progress_job(job: Job) -> Job:
    latest = float(job.payload.get("latestScore", 0))
    previous = float(job.payload.get("previousScore", 0))
    delta = round(latest - previous, 3)
    trend = "IMPROVING" if delta > 0.25 else "DECLINING" if delta < -0.25 else "STABLE"

    job.status = "COMPLETED"
    job.result = {
        "trend": trend,
        "delta": delta,
        "latestScore": latest,
        "previousScore": previous,
        "recommendation": "Prioritize stance and transition drills." if delta <= 0 else "Maintain progress with consistency rounds.",
    }
    _event(job, "COMPLETED", job.result)
    return job


if __name__ == "__main__":
    demo = Job(
        id="demo-1",
        organization_id="org-demo",
        type="RECALCULATE_PROGRESS_METRICS",
        status="QUEUED",
        payload={"latestScore": 7.6, "previousScore": 7.1},
    )
    print(process_job(demo))
