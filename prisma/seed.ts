import { PrismaClient, EventType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({ data: { name: 'Demo ATA School' } });

  await prisma.user.createMany({ data: [
    { email: 'owner@demo.test', name: 'Owner', role: UserRole.ORGANIZATION_OWNER, organizationId: org.id },
    { email: 'instructor@demo.test', name: 'Instructor', role: UserRole.INSTRUCTOR, organizationId: org.id },
  await prisma.user.createMany({ data: [
    { email: 'owner@demo.test', name: 'Owner', role: UserRole.ORGANIZATION_OWNER, organizationId: org.id },
    { email: 'instructor@demo.test', name: 'Instructor', role: UserRole.INSTRUCTOR, organizationId: org.id },
    { email: 'judge@demo.test', name: 'Judge', role: UserRole.JUDGE, organizationId: org.id },
    { email: 'student@demo.test', name: 'Student', role: UserRole.STUDENT, organizationId: org.id },
    { email: 'parent@demo.test', name: 'Parent', role: UserRole.PARENT, organizationId: org.id },
  ]});

  const athlete = await prisma.athleteProfile.create({
    data: {
      organizationId: org.id,
      displayName: 'Student Athlete',
      rank: '2nd Degree Black Belt',
      weaponStyle: 'Bo Staff',
    },
  });

  const traditionalForm = await prisma.formTemplate.create({
    data: { name: 'Songahm 5', eventType: EventType.TRADITIONAL_FORM },
  });

  const traditionalWeapon = await prisma.formTemplate.create({
    data: { name: 'Bahng Mahng Ee', eventType: EventType.TRADITIONAL_WEAPON },
  });

  await prisma.techniquePhase.createMany({ data: [
    { formTemplateId: traditionalForm.id, label: 'Opening Stance', order: 1 },
    { formTemplateId: traditionalForm.id, label: 'Middle Combination', order: 2 },
    { formTemplateId: traditionalForm.id, label: 'Finishing Sequence', order: 3 },
  ]});

  await prisma.referencePerformance.createMany({ data: [
    { formTemplateId: traditionalForm.id, videoUrl: 's3://demo/model/songahm5.mp4' },
    { formTemplateId: traditionalWeapon.id, videoUrl: 's3://demo/model/bahng-mang-ee.mp4' },
  ]});

  const submission = await prisma.studentSubmission.create({
    data: {
      athleteId: athlete.id,
      formTemplateId: traditionalForm.id,
      videoUrl: 's3://demo/student/songahm5-attempt-1.mp4',
    },
  });

  await prisma.submissionScore.create({
    data: {
      submissionId: submission.id,
      overall: 7.3,
      categoryBreakdown: { Stances: 7.0, HandTechniques: 7.4, Kicks: 7.2, Balance: 7.6, Timing: 7.0, Accuracy: 7.5 },
      confidence: 0.79,
    },
  });

  await prisma.submissionFeedback.create({
    data: {
      submissionId: submission.id,
      summary: 'Good overall control. Focus on wider front stances in phase transitions.',
      strengths: ['Balance on turns', 'Consistent hand technique speed'],
      weaknesses: ['Front stance width in phase 2', 'Kick re-chamber timing'],
      recommendations: ['Front stance ladder drill', 'Kick chamber hold drill'],
    },
  });

  await prisma.skillProgressRecord.createMany({ data: [
    { athleteId: athlete.id, dimension: 'stances', score: 6.8 },
    { athleteId: athlete.id, dimension: 'kicks', score: 7.1 },
    { athleteId: athlete.id, dimension: 'balance', score: 7.5 },
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
