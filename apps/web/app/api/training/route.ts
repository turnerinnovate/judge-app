import { NextResponse } from 'next/server';

type TrainingRequest = {
  athleteId?: string;
  eventType?: string;
  metrics?: {
    stance?: number;
    handTechniques?: number;
    kicks?: number;
    timing?: number;
    balance?: number;
    accuracy?: number;
  };
};

export async function POST(req: Request) {
  const payload = (await req.json()) as TrainingRequest;
  const metrics = payload.metrics ?? {};

  const categories = [
    scoreCategory('Stances', metrics.stance ?? 6.2, 0.22),
    scoreCategory('Hand Techniques', metrics.handTechniques ?? 6.8, 0.18),
    scoreCategory('Kicks', metrics.kicks ?? 6.0, 0.15),
    scoreCategory('Timing', metrics.timing ?? 6.6, 0.15),
    scoreCategory('Balance', metrics.balance ?? 6.9, 0.15),
    scoreCategory('Accuracy', metrics.accuracy ?? 6.3, 0.15),
  ];

  const overall = round(categories.reduce((acc, item) => acc + item.weighted, 0));

  return NextResponse.json({
    productMode: 'TRAINING_MODE',
    coachingTone: 'AI_COACH',
    eventType: payload.eventType ?? 'TRADITIONAL_FORM',
    overall,
    categories,
    strengths: [
      'Strong balance recovery after pivots.',
      'Hand techniques stay consistent during phase transitions.',
    ],
    weaknesses: [
      'Front stance narrows in phase 2; hips stop short before punch extension.',
      'Kick chamber is late in phase 4 and causes rhythm drift.',
    ],
    practicePriorities: [
      'Front stance width ladder drill (3 sets x 10 reps).',
      'Kick chamber hold + extension sequence (5 x 20 seconds each leg).',
    ],
    recommendedDrills: [
      {
        name: 'Phase 2 stance-reset drill',
        purpose: 'Build wider base before block-to-punch transition.',
        dosage: '2 rounds x 90 seconds',
      },
      {
        name: 'Re-chamber rhythm metronome drill',
        purpose: 'Stabilize chamber timing before extension.',
        dosage: '4 rounds x 60 seconds at 60 BPM',
      },
    ],
    longTermProgression: {
      trend: 'IMPROVING',
      notes: 'Stance stability has improved for three consecutive submissions.',
      nextFocusWindow: '2 weeks',
    },
    confidence: {
      overall: 0.8,
      pose: 0.84,
      segmentation: 0.77,
      weapon: 0.72,
      explanation: ['Confidence supports coaching recommendations; low confidence should trigger re-record guidance.'],
    },
  });
}

function scoreCategory(name: string, raw: number, weight: number) {
  const boundedRaw = Math.max(0, Math.min(10, raw));
  return { name, raw: round(boundedRaw), weight, weighted: round(boundedRaw * weight) };
}

function round(value: number) {
  return Number(value.toFixed(3));
}
