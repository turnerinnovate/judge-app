# INNOVATE AI JUDGE

Production-oriented monorepo for AI-assisted martial arts training and tournament judging.

## Architecture

- `apps/web`: Next.js 14 App Router application for dashboards, judge console, and APIs.
- `services/analysis`: FastAPI + MediaPipe/OpenCV heuristics for pose and weapon analysis.
- `services/worker`: async orchestration worker for queued analysis and scoring jobs.
- `packages/rules-engine`: versioned ruleset parser and validation.
- `packages/scoring`: training and tournament scoring engines.
- `packages/judging`: rubric scoring, AI shadow judge, human override provenance, placements, outlier detection.
- `packages/analysis`: temporal alignment (DTW), phase segmentation helpers.
- `packages/types`: shared domain models/types.
- `packages/storage`: S3 abstraction with local fallback.
- `prisma`: PostgreSQL schema, migrations and seed data.

```text
Video Upload -> AnalysisJob QUEUED -> Worker -> FastAPI Analysis
        -> metrics + confidence + phase segmentation
        -> AI shadow/assist score using rubric + rule references
        -> human judge review / override / finalize
        -> official placement + leaderboard snapshots
        -> immutable audit/provenance trail
```

## Setup

### Prereqs
- Node 20+
- Python 3.11+
- PostgreSQL 15+
- ffmpeg (optional for frame extraction)

### Environment
Copy `.env.example` to `.env` and fill values.

### DB
```bash
npx prisma migrate dev
npx prisma db seed
```

### Run app
```bash
cd apps/web && npm run dev
```

### Quick standalone run (no build)
Open `index.html` directly in a browser to run a static demo of Training Mode and Tournament Mode judge recommendation flows.


### Run analysis service
```bash
cd services/analysis && uvicorn app.main:app --reload --port 8001
```

### Run worker
```bash
cd services/worker && python worker.py
```

### Test
```bash
python -m pytest services/worker/tests services/analysis/tests
```


## Product boundary contract

- **Training Mode** is an AI coaching product: instructional language, drill assignments, and longitudinal skill progression.
- **Tournament Mode** is an AI judging assistant: rubric scoring, rule references, confidence-gated recommendations, and judge-review workflows.
- Both products reuse shared analysis primitives (pose normalization, phase segmentation, temporal alignment), but they intentionally do not share final score semantics.

## Tournament judging flow (real judging assistant)

1. **AI_SHADOW_JUDGE** rubric scoring (`/api/judge` with `action=ai_shadow_score`).
2. **AI_ASSIST_JUDGE** recommendation visible to panel with confidence + rule references.
3. **HUMAN_FINAL_JUDGE** override/finalization (`action=human_override` or `panel_finalize`).
4. Placement computation with tie-break categories (`/api/tournament`).
5. Outlier detection for judge consistency review (z-score + modified z-score in shared judging package).

## Implemented

### Fully implemented (beta-quality)
- Multi-tenant schema with organization scoping and role model.
- Versioned ruleset/rubric and deduction model.
- Training and tournament scoring engines with explainable category outputs.
- Judge modes: training, AI shadow, AI assist, and human final review distinction.
- Outlier detection against panel average and robust median deviation.
- Human override workflow with provenance trail.
- Placement logic with configurable tie-break order.
- Async job lifecycle (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `NEEDS_HUMAN_REVIEW`).
- FastAPI analysis endpoints with phase segmentation, DTW alignment, confidence + video quality heuristics.
- Seeded ATA-style traditional forms + traditional weapons templates/rubrics/ruleset.
- Audit + score provenance persistence model.

### Heuristic implementations
- 2D pose and weapon path approximation from landmarks.
- Weapon control metrics via hand-relative trajectory/arc stability.
- Automatic phase segmentation using coarse temporal chunking.
- Confidence estimation from landmark completeness, blur proxy, visibility ratio.

### Scaffolded for next phase
- Creative/xtreme/sparring/combat weapon event special logic.
- Live websocket scoreboard push.
- Full browser uploader/visual overlay UX.
- Production message queue integration (currently polling loop design).

## Judging Principles

Training feedback, tournament recommendations, and official outcomes are isolated pathways. AI never claims certainty; all scored outputs include confidence, rationale, and rule references. Human review remains authoritative unless explicit tournament config enables AI finalization.

## Limitations

- Best with one performer in frame and stable camera.
- 2D pose limits depth/rotation precision.
- Weapon detection is heuristic in MVP.
- Low confidence analyses should be re-recorded or human-reviewed.
- Official tournament use should keep human final review enabled.

## Roadmap

1. Kalman smoothing + camera compensation.
2. Multi-angle synchronized capture support.
3. Full division-specific tie-break modules.
4. Judge calibration longitudinal analytics.
5. Replay overlays and keyframe diff UI.
