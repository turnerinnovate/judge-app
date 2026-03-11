export type RubricCategoryDef = { name: string; minScore: number; maxScore: number; weight: number; description: string };
export type RuleSetDef = {
  governingBody: string;
  seasonLabel: string;
  eventType: string;
  version: string;
  categories: RubricCategoryDef[];
  deductions: { code: string; points: number; description: string }[];
  thresholds: { confidenceHumanReview: number };
};

export function validateRuleset(ruleset: RuleSetDef): string[] {
  const errors: string[] = [];
  const totalWeight = ruleset.categories.reduce((a, c) => a + c.weight, 0);
  if (Math.abs(totalWeight - 1) > 0.001) errors.push('Category weights must sum to 1.0');
  if (!ruleset.categories.length) errors.push('At least one category required');
  return errors;
}
