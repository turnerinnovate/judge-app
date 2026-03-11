import { NextResponse } from 'next/server';

type JudgeRequest = {
  action: 'ai_shadow_score' | 'human_override' | 'panel_finalize';
  rubric?: {
    id: string;
    confidenceHumanReviewThreshold?: number;
    confidenceAssistThreshold?: number;
    categories: Array<{ name: string; weight: number; min: number; max: number; ruleReference?: string }>;
    deductionRules: Array<{ code: string; points: number; reason: string; ruleReference?: string }>;
    tieBreakOrder?: string[];
  };
  metrics?: Record<string, number>;
  deductions?: string[];
  confidence?: { overall: number; pose: number; segmentation: number; weapon: number };
  rationale?: string[];
  aiPacket?: { total: number; rubricId: string; generatedAt?: string; recommendation?: string };
  humanOverride?: { judgeId: string; total: number; reason: string; categoryOverrides?: Record<string, number> };
  panelScores?: Array<{ judgeId: string; score: number }>;
};

export async function GET() {
  return NextResponse.json({
    productMode: 'TOURNAMENT_MODE',
    judgeConsole: {
      heading: 'Tournament Judge Console',
      workflow: ['AI shadow recommendation', 'Human judge scoring', 'Panel finalize', 'Placement publish'],
      guardrails: ['AI output is advisory', 'Low confidence requires human review', 'All overrides require rationale'],
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as JudgeRequest;

  if (body.action === 'ai_shadow_score') {
    const rubric = body.rubric!;
    const confidence = body.confidence ?? { overall: 0.7, pose: 0.72, segmentation: 0.7, weapon: 0.66 };
    const weighted = rubric.categories.map((category) => {
      const raw = clamp(body.metrics?.[category.name] ?? category.min, category.min, category.max);
      const normalized = normalize(raw, category.min, category.max);
      return {
        ...category,
        raw: round(raw),
        normalized,
        weightedNormalized: round(normalized * category.weight),
        confidence: round(Math.max(0, Math.min(1, confidence.overall - Math.abs(raw - 7) * 0.03))),
      };
    });

    const weightSum = weighted.reduce((acc, c) => acc + c.weight, 0) || 1;
    const normalizedScore = weighted.reduce((acc, c) => acc + c.weightedNormalized, 0) / weightSum;

    const matchedDeductions = (body.deductions ?? [])
      .map((code) => rubric.deductionRules.find((rule) => rule.code === code))
      .filter(Boolean) as Array<{ code: string; points: number; reason: string; ruleReference?: string }>;

    const deductionTotal = matchedDeductions.reduce((a, d) => a + d.points, 0);
    const finalTotal = clamp(round(normalizedScore * 10 - deductionTotal), 0, 10);
    const requiresHumanReview = confidence.overall < (rubric.confidenceHumanReviewThreshold ?? 0.65);
    const allowAssist = confidence.overall >= (rubric.confidenceAssistThreshold ?? 0.55);

    return NextResponse.json({
      productMode: 'TOURNAMENT_MODE',
      mode: 'AI_SHADOW_JUDGE',
      total: finalTotal,
      scoreBreakdown: {
        normalizedScore: round(normalizedScore * 10),
        deductionTotal: round(deductionTotal),
      },
      categoryScores: weighted,
      deductions: matchedDeductions,
      confidence,
      confidenceExplanation: [
        `Pose tracking ${(confidence.pose * 100).toFixed(1)}%`,
        `Phase segmentation ${(confidence.segmentation * 100).toFixed(1)}%`,
        `Weapon visibility ${(confidence.weapon * 100).toFixed(1)}%`,
        allowAssist ? 'Confidence passes AI assist threshold.' : 'Confidence below assist threshold; recommendation should be considered weak.',
        requiresHumanReview ? 'Confidence is below tournament review threshold; human judge confirmation is required.' : 'Confidence permits assist recommendation, but AI remains non-official.',
      ],
      recommendation: requiresHumanReview ? 'REQUIRE_HUMAN_REVIEW' : 'ALLOW_ASSIST_RECOMMENDATION',
      requiresHumanReview,
      ruleReferences: [
        ...new Set([
          ...rubric.categories.map((category) => category.ruleReference ?? `RUBRIC:${category.name}`),
          ...matchedDeductions.map((deduction) => deduction.ruleReference ?? deduction.code),
        ]),
      ],
      rationale: body.rationale ?? [],
      provenance: {
        ruleSetVersion: body.rubric?.id,
        generatedAt: new Date().toISOString(),
        metricSnapshot: body.metrics ?? {},
        modeBoundary: 'AI_ASSIST_NOT_OFFICIAL_RESULT',
      },
    });
  }

  if (body.action === 'human_override') {
    const aiScore = body.aiPacket?.total ?? 0;
    const humanScore = clamp(body.humanOverride?.total ?? aiScore, 0, 10);
    return NextResponse.json({
      productMode: 'TOURNAMENT_MODE',
      officialScore: humanScore,
      recommendationScore: aiScore,
      varianceFromAI: round(Math.abs(humanScore - aiScore)),
      officialSource: 'HUMAN_OVERRIDE',
      provenanceTrail: [
        {
          type: 'AI_RECOMMENDATION',
          actor: 'AI_SHADOW_JUDGE',
          timestamp: body.aiPacket?.generatedAt ?? new Date().toISOString(),
          payload: { score: aiScore, rubricId: body.aiPacket?.rubricId, recommendation: body.aiPacket?.recommendation ?? 'ALLOW_ASSIST_RECOMMENDATION' },
        },
        {
          type: 'HUMAN_OVERRIDE',
          actor: body.humanOverride?.judgeId ?? 'unknown',
          timestamp: new Date().toISOString(),
          payload: {
            reason: body.humanOverride?.reason ?? 'No reason provided',
            score: humanScore,
            categoryOverrides: body.humanOverride?.categoryOverrides ?? {},
          },
        },
      ],
    });
  }

  const panel = body.panelScores ?? [];
  const mean = panel.length ? panel.reduce((a, p) => a + p.score, 0) / panel.length : 0;
  const panelMedian = computeMedian(panel.map((p) => p.score));
  const variance = panel.length ? panel.reduce((a, p) => a + (p.score - mean) ** 2, 0) / panel.length : 0;
  const std = Math.sqrt(variance) || 1;
  const mad = computeMedian(panel.map((p) => Math.abs(p.score - panelMedian))) || 1;

  const outliers = panel.map((p) => {
    const z = (p.score - mean) / std;
    const modifiedZ = (0.6745 * (p.score - panelMedian)) / mad;
    const isOutlier = Math.abs(z) > 1.75 || Math.abs(modifiedZ) > 3.5;
    return {
      ...p,
      zScore: round(z),
      modifiedZScore: round(modifiedZ),
      deviationFromMedian: round(p.score - panelMedian),
      isOutlier,
    };
  });

  return NextResponse.json({
    productMode: 'TOURNAMENT_MODE',
    officialScore: clamp(round(mean), 0, 10),
    officialSource: 'HUMAN_PANEL_AVERAGE',
    panelStats: {
      mean: round(mean),
      median: round(panelMedian),
      spread: round(std),
      flaggedOutlierCount: outliers.filter((entry) => entry.isOutlier).length,
    },
    outliers,
    confidenceExplanation: ['Panel finalization used human scores. AI recommendations remain advisory and audit-tracked.'],
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Number(value.toFixed(3));
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0;
  return round(clamp((value - min) / (max - min), 0, 1));
}

function computeMedian(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
