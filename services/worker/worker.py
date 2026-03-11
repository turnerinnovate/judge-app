"""Async worker primitives for analysis + training coaching + tournament judging orchestration."""
from dataclasses import dataclass, field
from datetime import datetime
from statistics import median
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
    "SCORE_TOURNAMENT_PERFORMANCE",
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

    if job.type == "SCORE_TOURNAMENT_PERFORMANCE":
        return _process_tournament_scoring(job)

    job.status = "COMPLETED"
    job.result = {"status": "NOOP_COMPLETE"}
    _event(job, "COMPLETED", job.result)
    return job


def _process_analysis_job(job: Job) -> Job:
    quality = float(job.payload.get("quality", 0.75))
    confidence = float(job.payload.get("confidence", 0.7))
    product_mode = str(job.payload.get("productMode", "TRAINING_MODE"))

    if quality < 0.45 or confidence < 0.5:
        job.status = "NEEDS_HUMAN_REVIEW"
        job.result = {
            "reason": "Low analysis confidence or poor video quality.",
            "recommendedAction": "Re-record video or manual instructor review.",
            "productMode": product_mode,
        }
        _event(job, "NEEDS_HUMAN_REVIEW", job.result)
        return job

    job.status = "COMPLETED"
    job.result = {
        "analysisStatus": "COMPLETED",
        "confidence": confidence,
        "quality": quality,
        "productMode": product_mode,
        "coachingEligible": product_mode == "TRAINING_MODE",
    }
    _event(job, "COMPLETED", job.result)
    return job


def _process_tournament_scoring(job: Job) -> Job:
    ai_score = float(job.payload.get("aiScore", 0.0))
    human_scores = [float(v) for v in job.payload.get("humanScores", [])]
    overall_confidence = float(job.payload.get("confidence", 0.75))

    if overall_confidence < 0.6 and not human_scores:
        job.status = "NEEDS_HUMAN_REVIEW"
        job.result = {
            "reason": "Tournament confidence below threshold without human panel scores.",
            "recommendedAction": "Collect human panel scores before finalization.",
            "provenance": {
                "aiScore": ai_score,
                "confidence": overall_confidence,
                "computedAt": datetime.utcnow().isoformat(),
            },
        }
        _event(job, "NEEDS_HUMAN_REVIEW", job.result)
        return job

    official = sum(human_scores) / len(human_scores) if human_scores else ai_score
    panel_median = median(human_scores) if human_scores else ai_score

    job.status = "COMPLETED"
    job.result = {
        "officialScore": round(official, 3),
        "recommendationScore": round(ai_score, 3),
        "officialSource": "HUMAN_PANEL_AVERAGE" if human_scores else "AI_IF_CONFIGURED",
        "confidenceExplanation": _confidence_explanation(overall_confidence),
        "provenance": {
            "aiScore": ai_score,
            "humanScores": human_scores,
            "panelMedian": round(panel_median, 3),
            "varianceFromAI": round(abs(official - ai_score), 3),
            "computedAt": datetime.utcnow().isoformat(),
        },
    }
    _event(job, "COMPLETED", job.result)
    return job


def _confidence_explanation(confidence: float) -> List[str]:
    if confidence < 0.6:
        return ["Low confidence tournament recommendation.", "Human judge review required before official recording."]
    if confidence < 0.75:
        return ["Moderate confidence recommendation.", "Panel confirmation strongly advised."]
    return ["High confidence recommendation.", "Still advisory: official outcomes remain reviewable."]


if __name__ == "__main__":
    demo = Job(
        id="demo-1",
        organization_id="org-demo",
        type="SCORE_TOURNAMENT_PERFORMANCE",
        status="QUEUED",
        payload={"aiScore": 8.1, "humanScores": [8.0, 8.3, 7.9], "confidence": 0.81},
    )
    print(process_job(demo))
