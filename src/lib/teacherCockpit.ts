import { supabase } from '@/lib/supabase/client';

export type CockpitOrganization = {
  id: string;
  name: string;
  type: 'school' | 'university' | 'academy' | 'company' | 'community';
};

export type MisconceptionSignal = {
  conceptKey: string;
  category: string;
  learnerCount: number;
  eventCount: number;
};

export type CockpitClass = {
  id: string;
  organizationId: string;
  title: string;
  subject: string | null;
  academicYear: string | null;
  status: 'draft' | 'active' | 'archived';
  memberCount: number;
  assignmentCount: number;
  submissionCount: number;
  activeLearners30d: number;
  misconceptions: MisconceptionSignal[];
};

export type TeacherCockpitData = {
  organizations: CockpitOrganization[];
  classes: CockpitClass[];
};

export type ImpactPilot = {
  id: string;
  class_id: string;
  title: string;
  concept_key: string;
  outcome_statement: string;
  primary_metric: 'assessment_score' | 'recall_score' | 'transfer_score';
  status: 'draft' | 'recruiting' | 'active' | 'analysis' | 'complete' | 'archived';
  minimum_sample_size: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export type PilotPhase = 'pre' | 'post' | 'delayed';

export type PilotSummary = {
  pilotId: string;
  minimumSampleSize: number;
  measurementCount: number;
  uniqueLearners: number;
  phaseStats: Partial<Record<PilotPhase, { participantCount: number; averageScore: number | null; suppressed: boolean }>>;
  pairedLearners: number;
  averageChange: number | null;
  delayedRetention: number | null;
  isReportable: boolean;
  disclaimer: string;
};

export type ClassStudent = {
  class_id: string;
  user_id: string;
  joined_at: string;
};

function client() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

function dataOrThrow<T>(data: T | null, error: { message: string } | null) {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('The requested data was not returned.');
  return data;
}

export async function loadTeacherCockpit(): Promise<TeacherCockpitData> {
  const { data, error } = await client().rpc('my_teacher_cockpit_v1');
  const payload = dataOrThrow(data as TeacherCockpitData | null, error);
  return {
    organizations: Array.isArray(payload.organizations) ? payload.organizations : [],
    classes: Array.isArray(payload.classes) ? payload.classes : [],
  };
}

export async function createTeacherOrganization(name: string, type: CockpitOrganization['type']) {
  const { data, error } = await client().rpc('create_organization_v1', { p_name: name.trim(), p_type: type });
  return dataOrThrow(data as string | null, error);
}

export async function createTeacherClass(input: { organizationId: string; title: string; subject: string; academicYear: string }) {
  const { data, error } = await client().rpc('create_class_v1', {
    p_organization_id: input.organizationId,
    p_title: input.title.trim(),
    p_subject: input.subject.trim() || null,
    p_academic_year: input.academicYear.trim() || null,
  });
  return dataOrThrow(data as { classId: string; joinCode: string } | null, error);
}

export async function joinTeacherClass(joinCode: string) {
  const { data, error } = await client().rpc('join_class_v1', { p_join_code: joinCode.trim() });
  return dataOrThrow(data as string | null, error);
}

export async function createClassAssignment(input: { classId: string; title: string; instructions: string; dueAt: string | null; createdBy: string }) {
  const { data, error } = await client().from('assignments').insert({
    class_id: input.classId,
    created_by: input.createdBy,
    title: input.title.trim(),
    instructions: input.instructions.trim(),
    due_at: input.dueAt || null,
    status: 'published',
    rubric: [],
  }).select('id').single();
  return dataOrThrow(data as { id: string } | null, error).id;
}

export async function loadImpactPilots(classIds: string[]): Promise<ImpactPilot[]> {
  if (!classIds.length) return [];
  const { data, error } = await client()
    .from('impact_pilots')
    .select('id,class_id,title,concept_key,outcome_statement,primary_metric,status,minimum_sample_size,starts_at,ends_at,created_at')
    .in('class_id', classIds)
    .order('created_at', { ascending: false });
  return dataOrThrow((data || []) as ImpactPilot[], error);
}

export async function createImpactPilot(input: {
  classId: string;
  title: string;
  conceptKey: string;
  outcomeStatement: string;
  primaryMetric: ImpactPilot['primary_metric'];
  minimumSampleSize: number;
  createdBy: string;
}) {
  const { data, error } = await client()
    .from('impact_pilots')
    .insert({
      class_id: input.classId,
      title: input.title.trim(),
      concept_key: input.conceptKey.trim(),
      outcome_statement: input.outcomeStatement.trim(),
      primary_metric: input.primaryMetric,
      minimum_sample_size: input.minimumSampleSize,
      created_by: input.createdBy,
      status: 'draft',
    })
    .select('id')
    .single();
  return dataOrThrow(data as { id: string } | null, error).id;
}

export async function setImpactPilotStatus(pilotId: string, status: ImpactPilot['status']) {
  const { error } = await client().from('impact_pilots').update({ status }).eq('id', pilotId);
  if (error) throw new Error(error.message);
}

export async function loadClassStudents(classId: string): Promise<ClassStudent[]> {
  const { data, error } = await client()
    .from('class_members')
    .select('class_id,user_id,joined_at')
    .eq('class_id', classId)
    .eq('role', 'student')
    .order('joined_at', { ascending: true });
  return dataOrThrow((data || []) as ClassStudent[], error);
}

export async function saveImpactMeasurement(input: {
  pilotId: string;
  studentId: string;
  phase: PilotPhase;
  score: number;
  maxScore: number;
  evidenceNote: string;
  recordedBy: string;
}) {
  const { error } = await client().from('impact_measurements').upsert({
    pilot_id: input.pilotId,
    student_id: input.studentId,
    phase: input.phase,
    score: input.score,
    max_score: input.maxScore,
    evidence_note: input.evidenceNote.trim(),
    recorded_by: input.recordedBy,
    assessed_at: new Date().toISOString(),
  }, { onConflict: 'pilot_id,student_id,phase' });
  if (error) throw new Error(error.message);
}

export async function loadPilotSummary(pilotId: string): Promise<PilotSummary> {
  const { data, error } = await client().rpc('pilot_impact_summary_v1', { p_pilot_id: pilotId });
  return dataOrThrow(data as PilotSummary | null, error);
}

export type SmeImpactAssumptions = {
  teacherHourlyCost: number;
  minutesPerDiagnosis: number;
  minutesPerGrading: number;
  minutesPerFollowup: number;
  revenuePerStudent: number;
  hoursPerExtraStudent: number;
};

export type SmeImpact = {
  currency: string;
  activity: { agentSessions: number; assessmentsGraded: number; reviewsScheduled: number; activeLearners: number };
  assumptions: SmeImpactAssumptions;
  projection: { hoursSaved: number; costSaved: number; extraStudentCapacity: number; revenueEnabled: number };
  disclaimer: string;
};

export async function loadSmeImpact(orgId: string): Promise<SmeImpact> {
  const { data, error } = await client().rpc('sme_impact_summary_v1', { p_org_id: orgId });
  return dataOrThrow(data as SmeImpact | null, error);
}

export async function saveSmeAssumptions(orgId: string, patch: Partial<SmeImpactAssumptions>) {
  const row: Record<string, number | string> = { org_id: orgId };
  if (patch.teacherHourlyCost !== undefined) row.teacher_hourly_cost = patch.teacherHourlyCost;
  if (patch.minutesPerDiagnosis !== undefined) row.minutes_per_diagnosis = patch.minutesPerDiagnosis;
  if (patch.minutesPerGrading !== undefined) row.minutes_per_grading = patch.minutesPerGrading;
  if (patch.minutesPerFollowup !== undefined) row.minutes_per_followup = patch.minutesPerFollowup;
  if (patch.revenuePerStudent !== undefined) row.revenue_per_student = patch.revenuePerStudent;
  if (patch.hoursPerExtraStudent !== undefined) row.hours_per_extra_student = patch.hoursPerExtraStudent;
  const { error } = await client().from('sme_impact_assumptions').upsert(row, { onConflict: 'org_id' });
  if (error) throw new Error(error.message);
}
