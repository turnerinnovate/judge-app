export type JudgeMode = 'TRAINING_JUDGE' | 'AI_SHADOW_JUDGE' | 'AI_ASSIST_JUDGE' | 'HUMAN_FINAL_JUDGE';

export type RubricCategory = {
  name: string;
  weight: number;
  min: number;
  max: number;
  tieBreakPriority?: number;
  judgeHint?: string;
};

export type DeductionRule = {
  code: string;
  points: number;
  reason: string;
  ruleReference?: string;
};

export type RubricDefinition = {
  id: string;
  eventType: string;
  categories: RubricCategory[];
  deductionRules: DeductionRule[];
  minConfidenceForAutoAssist: number;
  minConfidenceBeforeHumanReview: number;
};

export type PerformanceMetrics = {
  categoryMetrics: Record<string, number>;
  deductionCodes: string[];
  confidence: { pose: number; segmentation: number; weapon: number; overall: number };
  rationale: string[];
  ruleHits?: string[];
};

export type JudgeScorePacket = {
  mode: JudgeMode;
  rubricId: string;
  total: number;
  scoreBreakdown: { normalizedScore: number; deductionTotal: number };
  categoryScores: Array<{ name: string; raw: number; normalized: number; weightedNormalized: number; weight: number; confidence: number }>;
  deductions: Array<{ code: string; points: number; reason: string; ruleReference?: string }>;
  confidence: number;
  confidenceExplanation: string[];
  recommendation: 'ALLOW_ASSIST' | 'REQUIRE_HUMAN_REVIEW';
  requiresHumanReview: boolean;
  ruleReferences: string[];
  rationale: string[];
  provenance: {
    generatedAt: string;
    metricSnapshot: Record<string, number>;
    deductionCodes: string[];
    modeBoundary: 'TOURNAMENT_ASSIST_ONLY';
  };
};

export function scoreWithRubric(rubric: RubricDefinition, metrics: PerformanceMetrics, mode: JudgeMode): JudgeScorePacket {
  const categoryScores = rubric.categories.map((c) => {
    const raw = clamp(metrics.categoryMetrics[c.name] ?? c.min, c.min, c.max);
    const normalized = normalize(raw, c.min, c.max);
    const confidence = clamp(metrics.confidence.overall - Math.abs(raw - ((c.max + c.min) / 2)) * 0.05, 0, 1);
    return { name: c.name, raw, normalized, weight: c.weight, weightedNormalized: normalized * c.weight, confidence };
  });

  const matchedDeductions = metrics.deductionCodes
    .map((code) => rubric.deductionRules.find((d) => d.code === code))
    .filter(Boolean) as DeductionRule[];

  const weightSum = categoryScores.reduce((acc, c) => acc + c.weight, 0) || 1;
  const normalizedScore = categoryScores.reduce((acc, c) => acc + c.weightedNormalized, 0) / weightSum;
  const deductionTotal = matchedDeductions.reduce((acc, d) => acc + d.points, 0);
  const total = clamp(normalizedScore * 10 - deductionTotal, 0, 10);
  const requiresHumanReview = metrics.confidence.overall < rubric.minConfidenceBeforeHumanReview;

  return {
    mode,
    rubricId: rubric.id,
    total,
    scoreBreakdown: { normalizedScore: round(normalizedScore * 10), deductionTotal: round(deductionTotal) },
    categoryScores,
    deductions: matchedDeductions.map((d) => ({ code: d.code, points: d.points, reason: d.reason, ruleReference: d.ruleReference })),
    confidence: metrics.confidence.overall,
    confidenceExplanation: buildConfidenceExplanation(metrics.confidence),
    recommendation: requiresHumanReview ? 'REQUIRE_HUMAN_REVIEW' : 'ALLOW_ASSIST',
    requiresHumanReview,
    ruleReferences: [...new Set([...(metrics.ruleHits ?? []), ...matchedDeductions.map((d) => d.ruleReference ?? d.code)])],
    rationale: metrics.rationale,
    provenance: {
      generatedAt: new Date().toISOString(),
      metricSnapshot: metrics.categoryMetrics,
      deductionCodes: metrics.deductionCodes,
      modeBoundary: 'TOURNAMENT_ASSIST_ONLY',
    },
  };
}

export function generateAIShadowJudgeScore(rubric: RubricDefinition, metrics: PerformanceMetrics): JudgeScorePacket {
  return scoreWithRubric(rubric, metrics, 'AI_SHADOW_JUDGE');
}

export type HumanOverrideInput = {
  humanJudgeId: string;
  humanTotal: number;
  humanCategoryScores?: Array<{ name: string; raw: number }>;
  overrideReason: string;
};

export type FinalizedScore = {
  officialTotal: number;
  officialSource: 'HUMAN_OVERRIDE' | 'HUMAN_PANEL_AVERAGE' | 'AI_IF_CONFIGURED';
  recommendationTotal: number;
  varianceFromAI: number;
  provenanceTrail: Array<{ type: string; actor: string; timestamp: string; payload: Record<string, unknown> }>;
};

export function applyHumanOverride(aiPacket: JudgeScorePacket, input: HumanOverrideInput): FinalizedScore {
  return {
    officialTotal: clamp(input.humanTotal, 0, 10),
    officialSource: 'HUMAN_OVERRIDE',
    recommendationTotal: aiPacket.total,
    varianceFromAI: Math.abs(clamp(input.humanTotal, 0, 10) - aiPacket.total),
    provenanceTrail: [
      {
        type: 'AI_RECOMMENDATION',
        actor: aiPacket.mode,
        timestamp: aiPacket.provenance.generatedAt,
        payload: { total: aiPacket.total, rubricId: aiPacket.rubricId, recommendation: aiPacket.recommendation },
      },
      {
        type: 'HUMAN_OVERRIDE',
        actor: input.humanJudgeId,
        timestamp: new Date().toISOString(),
        payload: {
          overrideReason: input.overrideReason,
          humanTotal: input.humanTotal,
          humanCategoryScores: input.humanCategoryScores ?? [],
        },
      },
    ],
  };
}

export type PanelOutlierResult = {
  judgeId: string;
  score: number;
  zScore: number;
  modifiedZScore: number;
  deviationFromMedian: number;
  severity: 'NONE' | 'MODERATE' | 'HIGH';
  isOutlier: boolean;
};

export function detectJudgeOutliers(panel: Array<{ judgeId: string; score: number }>): PanelOutlierResult[] {
  if (!panel.length) return [];
  const scores = panel.map((p) => p.score);
  const mean = avg(scores);
  const std = Math.sqrt(avg(scores.map((s) => (s - mean) ** 2))) || 1;

  const median = computeMedian(scores);
  const absoluteDeviations = scores.map((s) => Math.abs(s - median));
  const mad = computeMedian(absoluteDeviations) || 1;

  return panel.map((p) => {
    const zScore = (p.score - mean) / std;
    const modifiedZScore = (0.6745 * (p.score - median)) / mad;
    const deviationFromMedian = p.score - median;
    const magnitude = Math.max(Math.abs(zScore), Math.abs(modifiedZScore));
    const severity = magnitude > 4 ? 'HIGH' : magnitude > 2 ? 'MODERATE' : 'NONE';
    const isOutlier = Math.abs(zScore) > 1.75 || Math.abs(modifiedZScore) > 3.5;
    return { judgeId: p.judgeId, score: p.score, zScore, modifiedZScore, deviationFromMedian, severity, isOutlier };
  });
}

export function computePlacements(
  competitors: Array<{ competitorId: string; officialTotal: number; tieBreakValues: Record<string, number> }>,
  tieBreakOrder: string[],
) {
  const sorted = [...competitors].sort((a, b) => {
    if (b.officialTotal !== a.officialTotal) return b.officialTotal - a.officialTotal;
    for (const key of tieBreakOrder) {
      const diff = (b.tieBreakValues[key] ?? 0) - (a.tieBreakValues[key] ?? 0);
      if (diff !== 0) return diff;
    }
    return a.competitorId.localeCompare(b.competitorId);
  });

  return sorted.map((c, i) => {
    const prev = sorted[i - 1];
    const tiedWithPrev = !!prev
      && prev.officialTotal === c.officialTotal
      && tieBreakOrder.every((key) => (prev.tieBreakValues[key] ?? 0) === (c.tieBreakValues[key] ?? 0));
    const placement = tiedWithPrev ? i : i + 1;

    return {
      competitorId: c.competitorId,
      placement,
      officialTotal: c.officialTotal,
      tieBreakValues: c.tieBreakValues,
      tieStatus: tiedWithPrev ? 'TIED_AFTER_TIEBREAK' : 'RESOLVED',
    };
  });
}

export function aggregateOfficialScore(humanScores: number[], aiAssist?: number) {
  if (!humanScores.length) return clamp(aiAssist ?? 0, 0, 10);
  return clamp(avg(humanScores), 0, 10);
}

export function buildConfidenceExplanation(confidence: PerformanceMetrics['confidence']): string[] {
  const explanations = [
    `Pose confidence: ${(confidence.pose * 100).toFixed(1)}%`,
    `Segmentation confidence: ${(confidence.segmentation * 100).toFixed(1)}%`,
    `Weapon confidence: ${(confidence.weapon * 100).toFixed(1)}%`,
  ];
  if (confidence.overall < 0.65) {
    explanations.push('Overall confidence below tournament threshold; human review is required before official result.');
  } else {
    explanations.push('Confidence is sufficient for assist recommendations, but final results remain human-authoritative.');
  }
  return explanations;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const avg = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(values.length, 1);
const round = (value: number) => Number(value.toFixed(3));
const normalize = (value: number, min: number, max: number) => (max === min ? 0 : clamp((value - min) / (max - min), 0, 1));
const computeMedian = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};
