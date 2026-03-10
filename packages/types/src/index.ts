export type ConfidenceBundle = { overall: number; pose: number; segmentation: number; weapon: number; rationale: string[] };
export type CategoryScore = { name: string; raw: number; weighted: number; weight: number; rationale: string };
export type Deduction = { code: string; points: number; rationale: string; ruleReference: string };
export type ScoreResult = {
  total: number;
  categories: CategoryScore[];
  deductions: Deduction[];
  confidence: ConfidenceBundle;
  ruleReferences: string[];
  requiresHumanReview: boolean;
  mode: 'TRAINING_JUDGE' | 'AI_SHADOW_JUDGE' | 'AI_ASSIST_JUDGE' | 'HUMAN_FINAL_JUDGE';
};
