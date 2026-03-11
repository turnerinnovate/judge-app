import { NextResponse } from 'next/server';

const payload = {
  error: 'TOURNAMENT_FEATURE_REMOVED',
  message: 'INNOVATE AI COACH excludes tournament scoring, brackets, and placements.',
  product: 'INNOVATE AI COACH',
};

export async function GET() {
  return NextResponse.json(payload, { status: 410 });
}

export async function POST() {
  return NextResponse.json(payload, { status: 410 });
type PlacementRequest = {
  tieBreakOrder?: string[];
  competitorScores: Array<{
    competitorId: string;
    officialTotal: number;
    tieBreakValues?: Record<string, number>;
  }>;
};

export async function POST(req: Request) {
  const { competitorScores, tieBreakOrder = ['RuleCompliance', 'Accuracy', 'Presentation'] } = (await req.json()) as PlacementRequest;

  const sorted = [...competitorScores].sort((a, b) => {
    if (b.officialTotal !== a.officialTotal) return b.officialTotal - a.officialTotal;
    for (const category of tieBreakOrder) {
      const diff = (b.tieBreakValues?.[category] ?? 0) - (a.tieBreakValues?.[category] ?? 0);
      if (diff !== 0) return diff;
    }
    return a.competitorId.localeCompare(b.competitorId);
  });

  const placements = sorted.map((entry, idx) => {
    const previous = sorted[idx - 1];
    const isTieWithPrevious = !!previous
      && previous.officialTotal === entry.officialTotal
      && tieBreakOrder.every((category) => (previous.tieBreakValues?.[category] ?? 0) === (entry.tieBreakValues?.[category] ?? 0));

    return {
      ...entry,
      placement: isTieWithPrevious ? idx : idx + 1,
      tieStatus: isTieWithPrevious ? 'TIED_AFTER_TIEBREAK' : 'RESOLVED',
      tieBreakAudit: tieBreakOrder.map((category) => ({ category, score: entry.tieBreakValues?.[category] ?? 0 })),
    };
  });

  return NextResponse.json({
    productMode: 'TOURNAMENT_MODE',
    placements,
    leaderboardSnapshotAt: new Date().toISOString(),
    tieBreakOrder,
    notes: ['Placements become official only after human panel finalization and audit recording.'],
  });
}
