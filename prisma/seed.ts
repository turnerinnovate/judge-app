import { PrismaClient, EventType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({ data: { name: 'Demo ATA School' } });
  await prisma.user.createMany({ data: [
    { email: 'owner@demo.test', name: 'Owner', role: UserRole.ORGANIZATION_OWNER, organizationId: org.id },
    { email: 'instructor@demo.test', name: 'Instructor', role: UserRole.INSTRUCTOR, organizationId: org.id },
    { email: 'judge@demo.test', name: 'Judge', role: UserRole.JUDGE, organizationId: org.id },
    { email: 'student@demo.test', name: 'Student', role: UserRole.STUDENT, organizationId: org.id },
    { email: 'parent@demo.test', name: 'Parent', role: UserRole.PARENT, organizationId: org.id },
  ]});

  const ruleset = await prisma.ruleSet.create({
    data: {
      organizationId: org.id,
      governingBody: 'ATA',
      seasonLabel: '2026',
      eventType: EventType.TOURNAMENT_TRADITIONAL_FORM,
      version: 'v1.0',
      config: {
        tieBreak: ['RuleCompliance', 'Accuracy', 'Presentation'],
        confidenceThresholds: { autoAssist: 0.72, humanReview: 0.6 },
        timeLimits: { minSec: 45, maxSec: 120 }
      }
    }
  });

  const rubric = await prisma.scoringRubric.create({ data: { ruleSetId: ruleset.id, name: 'ATA Traditional Form Rubric' } });
  await prisma.rubricCategory.createMany({ data: [
    { rubricId: rubric.id, name: 'Accuracy', minScore: 0, maxScore: 10, weight: 0.2, description: 'Correct technique execution' },
    { rubricId: rubric.id, name: 'Technique Quality', minScore: 0, maxScore: 10, weight: 0.2, description: 'Power and clean lines' },
    { rubricId: rubric.id, name: 'Balance', minScore: 0, maxScore: 10, weight: 0.15, description: 'Stability and control' },
    { rubricId: rubric.id, name: 'Timing', minScore: 0, maxScore: 10, weight: 0.15, description: 'Rhythm and transitions' },
    { rubricId: rubric.id, name: 'Presentation', minScore: 0, maxScore: 10, weight: 0.15, description: 'Focus/spirit' },
    { rubricId: rubric.id, name: 'Rule Compliance', minScore: 0, maxScore: 10, weight: 0.15, description: 'Conformance with event constraints' }
  ]});

  await prisma.deductionRule.createMany({ data: [
    { rubricId: rubric.id, code: 'BOUNDARY_STEP', points: 0.3, description: 'Out of ring boundary step' },
    { rubricId: rubric.id, code: 'LOSS_OF_BALANCE', points: 0.5, description: 'Hands/foot touch for recovery' },
    { rubricId: rubric.id, code: 'WEAPON_DROP', points: 1.0, description: 'Weapon dropped' }
  ]});
}

main().finally(() => prisma.$disconnect());
