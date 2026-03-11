# INNOVATE AI COACH

AI-powered martial arts training platform for model-vs-student video coaching.

## Product scope
This repository is **training-only**:
- ✅ Model video upload + student submission analysis
- ✅ Phase-aware coaching feedback and progress tracking
- ❌ No tournament judging
- ❌ No tournament scoring/brackets/placements

## Architecture
- `apps/web`: Next.js app + training APIs.
- `services/analysis`: FastAPI analysis service (pose/quality/phase heuristics).
- `services/worker`: async training job processor.
- `packages/analysis`: DTW and temporal helpers.
- `packages/scoring`: training score computation.
- `packages/storage`: storage abstraction.
- `packages/types`: shared domain types.
- `prisma`: schema, migration, seed.

```text
Model upload -> ANALYZE_REFERENCE_VIDEO job
Student upload -> ANALYZE_STUDENT_SUBMISSION job
-> phase metrics + temporal alignment
-> training scoring + drill recommendations
-> RECALCULATE_PROGRESS_METRICS
-> student progress history and instructor review
```

## Setup
### Prerequisites
- Node 20+
- Python 3.11+
- PostgreSQL 15+

### Environment
Copy `.env.example` to `.env`.

### DB
```bash
npx prisma migrate dev
npx prisma db seed
```

### Run web app
```bash
cd apps/web && npm run dev
```

### Run analysis service
```bash
cd services/analysis && uvicorn app.main:app --reload --port 8001
```

### Run worker
```bash
cd services/worker && python worker.py
```

### Run tests
```bash
python -m pytest services/analysis/tests services/worker/tests
```

### Quick static demo
Open `index.html` directly in a browser.

## Implemented training capabilities
- Training scoring endpoint with weighted categories and coaching-focused output.
- Phase-level correction timeline and confidence messaging.
- Video-quality-aware analysis gating in worker.
- Progress recalculation job with trend/delta output.
- Visualization job metadata for keyframe snapshot render pipeline.

## Honest limitations
- Current analysis service uses deterministic heuristics (not full production MediaPipe/OpenCV pipeline yet).
- Best results when one performer is fully visible in stable lighting.
- Weapon tracking remains heuristic in MVP.
- AI feedback supports instructors and does not replace instructor judgment.

## Next highest-value improvements
1. Persistent upload + signed URL storage flow.
2. True landmark extraction pipeline (MediaPipe/OpenCV + smoothing).
3. Instructor phase/checkpoint annotation UI.
4. Student progress charts in dashboard (radar + trend).
5. Expanded training-type rules for creative/xtreme techniques.
