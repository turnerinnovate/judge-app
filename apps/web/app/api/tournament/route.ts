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
}
