# Architecture Summary

## Separation of concerns
- **Training mode** is an AI coaching product focused on improvement, drill generation, and longitudinal skill progression.
- **Tournament mode** is an AI judging-assistant product focused on rubric/ruleset scoring, confidence gating, and judge review.
- **Official outcome** is a human-authoritative workflow with override/finalization and placement processing.
- Both modes reuse analysis infrastructure (pose normalization, phase segmentation, temporal alignment), but scoring language and persistence semantics remain product-specific.

## Tournament judging domain pipeline
1. Analysis service emits phase metrics and confidence.
2. Rubric engine maps metrics to weighted category scores with deduction references.
3. AI shadow judge packet is generated with confidence explanation and review gating.
4. Judge console captures human scores, allows explicit override, and stores rationale.
5. Official result is finalized with provenance trail.
6. Placement engine applies deterministic tie-break order and snapshots leaderboard.
7. Outlier detection highlights judge deviations (z-score + modified z-score) for admin review.

## Services
1. Web app/API orchestrates auth, organization scoping, and review workflows.
2. Analysis service computes pose-derived metrics, phase segmentation, and confidence.
3. Worker executes asynchronous job lifecycle and reconciliation updates.
4. Shared packages host deterministic scoring and rules logic.

## Data trust model
- Every AI recommendation stores confidence, rationale, and rule references.
- Human override and finalization are first-class entities.
- Score provenance and audit logs are immutable event records.
- Tournament AI output is assistive unless explicit tournament configuration permits automated finalization.

## Tournament-ready judging details
- Rubric scoring uses normalized category values before applying category weights to prevent weight-scale distortion across categories with different min/max ranges.
- Confidence output is signal-specific (pose, segmentation, weapon) and is translated into explicit review guidance for judges.
- Panel finalization reports central tendency and spread, then flags outliers via both z-score and modified z-score for robust small-panel behavior.
- Placement responses carry tie-break audit values and tie status so final standing decisions are reviewable.
