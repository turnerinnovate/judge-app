# INNOVATE AI COACH Architecture

## Core principle
Single-product architecture: **training and coaching only**.

## Services
1. **Web App (`apps/web`)**
   - Instructor/student/parent experiences.
   - Training API endpoints (`/api/training`, `/api/health`).
   - Tournament endpoints are disabled with HTTP 410.

2. **Analysis Service (`services/analysis`)**
   - Accepts frame-based payloads.
   - Produces video quality, confidence, and phase annotation heuristics.

3. **Worker (`services/worker`)**
   - Handles `ANALYZE_REFERENCE_VIDEO`, `ANALYZE_STUDENT_SUBMISSION`, `RECALCULATE_PROGRESS_METRICS`, `RENDER_VISUALIZATION`.
   - Emits coaching-ready outcomes and progress summaries.

## Training pipeline
1. Instructor model upload and analysis.
2. Student upload and analysis.
3. Temporal alignment + phase comparison.
4. Weighted category score generation.
5. Timestamped coaching feedback with confidence.
6. Progress trend recalculation.

## Data trust
- All feedback includes confidence and quality considerations.
- Low-confidence analysis requests re-record guidance.
- Instructor review remains a first-class workflow.
