import type { ScoreResult } from '../../types/src';
import type { RuleSetDef } from '../../rules-engine/src';

export function scorePerformance(
  measurements: Record<string, number>,
  ruleset: RuleSetDef,
  mode: ScoreResult['mode'],
  confidence: ScoreResult['confidence'],
): ScoreResult {
  const categories = ruleset.categories.map((cat) => {
    const raw = Math.max(cat.minScore, Math.min(cat.maxScore, measurements[cat.name] ?? cat.minScore));
    return { name: cat.name, raw, weight: cat.weight, weighted: raw * cat.weight, rationale: `Mapped from metric ${cat.name}` };
  });
  const totalBeforeDeduction = categories.reduce((a, c) => a + c.weighted, 0);
  const deductions = (measurements.deductions as unknown as string[] | undefined)?.map((code) => {
    const rule = ruleset.deductions.find((d) => d.code === code);
    return rule ? { code, points: rule.points, rationale: rule.description, ruleReference: code } : null;
  }).filter(Boolean) as ScoreResult['deductions'] ?? [];

  const total = Math.max(0, totalBeforeDeduction - deductions.reduce((a, d) => a + d.points, 0));
  return {
    total,
    categories,
    deductions,
    confidence,
    ruleReferences: deductions.map((d) => d.ruleReference),
    requiresHumanReview: confidence.overall < ruleset.thresholds.confidenceHumanReview,
    mode,
  };
}
