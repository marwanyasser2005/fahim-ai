import { applyApiHeaders, consumeRateLimit, isSameOrigin, parseJsonBody, rejectRateLimit } from './_lib/security.mjs';
import { AuthenticationError, ServerConfigurationError, createAdminClient, requireAuthenticatedUser } from './_lib/supabase-auth.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function send(response, status, body) {
  return response.status(status).json(body);
}

async function requireAdmin(request) {
  const { user } = await requireAuthenticatedUser(request);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('user_roles')
    .select('roles!inner(key)')
    .eq('user_id', user.id);
  if (error) throw new ServerConfigurationError('Role verification is unavailable.');
  const allowed = (data || []).some((row) => {
    const roles = Array.isArray(row.roles) ? row.roles : [row.roles];
    return roles.some((role) => role?.key === 'admin');
  });
  if (!allowed) {
    const error = new Error('Administrator permission is required.');
    error.status = 403;
    throw error;
  }
  return { user, admin };
}

async function listRegistry(admin) {
  const [courseResult, certificateResult] = await Promise.all([
    admin.from('courses').select('id,title,is_published').eq('is_published', true).order('created_at', { ascending: false }).limit(100),
    admin.from('certificates').select('id,user_id,course_id,certificate_number,status,issued_at,issuer_name,evidence_snapshot').order('issued_at', { ascending: false }).limit(100),
  ]);
  if (courseResult.error) throw courseResult.error;
  if (certificateResult.error) throw certificateResult.error;
  return { courses: courseResult.data || [], certificates: certificateResult.data || [] };
}

async function issueCertificate(admin, body, actorId) {
  const learnerId = String(body.learnerId || '').trim();
  const courseId = String(body.courseId || '').trim();
  const completionPercent = Number(body.completionPercent);
  const finalAssessmentScore = Number(body.finalAssessmentScore);
  const reviewNote = String(body.reviewNote || '').trim().slice(0, 1_000);
  if (!UUID.test(learnerId) || !UUID.test(courseId)) return { status: 400, body: { error: 'A valid learner and course are required.' } };
  if (completionPercent !== 100) return { status: 400, body: { error: 'Completion must be verified at 100%.' } };
  if (!Number.isFinite(finalAssessmentScore) || finalAssessmentScore < 70 || finalAssessmentScore > 100) return { status: 400, body: { error: 'Final assessment score must be between 70 and 100.' } };
  if (reviewNote.length < 8) return { status: 400, body: { error: 'A concise reviewer note is required.' } };

  const [{ data: profile }, { data: course }, { data: existing }] = await Promise.all([
    admin.from('profiles').select('id,full_name').eq('id', learnerId).maybeSingle(),
    admin.from('courses').select('id,title,is_published').eq('id', courseId).maybeSingle(),
    admin.from('certificates').select('id,status').eq('user_id', learnerId).eq('course_id', courseId).maybeSingle(),
  ]);
  if (!profile?.full_name?.trim()) return { status: 409, body: { error: 'The learner must have a verified display name before issuance.' } };
  if (!course?.id || !course.is_published) return { status: 409, body: { error: 'Only a published course can issue a completion credential.' } };
  if (existing?.status === 'revoked') return { status: 409, body: { error: 'This credential was revoked and requires a separate reinstatement review.' } };
  if (existing?.id) return { status: 200, body: { certificate: existing, alreadyIssued: true } };

  const evidence = {
    completionPercent,
    finalAssessmentScore,
    reviewNote,
    reviewedAt: new Date().toISOString(),
    reviewedBy: actorId,
    policy: 'fahim_completion_v1',
    accreditation: 'not_academically_accredited',
  };
  const { data, error } = await admin.from('certificates').insert({
    user_id: learnerId,
    course_id: courseId,
    status: 'issued',
    credential_type: 'completion',
    issuer_name: 'Marwan Abdelghaffar',
    evidence_snapshot: evidence,
    metadata: { publicLabel: 'Certificate of Completion', issuerTitle: 'Founder of Fahim AI', nonAccredited: true, issuancePolicy: 'admin_reviewed_completion_v1' },
  }).select('id,certificate_number,status,issued_at').single();
  if (error) throw error;

  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action: 'certificate.completion_issued',
    entity_type: 'certificate',
    entity_id: data.id,
    metadata: { learner_id: learnerId, course_id: courseId, completion_percent: completionPercent, final_assessment_score: finalAssessmentScore },
  });
  return { status: 201, body: { certificate: data, verifyPath: `/verify/${data.id}` } };
}

async function createCredentialCourse(admin, body, actorId) {
  const titleAr = String(body.titleAr || '').trim().slice(0, 160);
  const titleEn = String(body.titleEn || '').trim().slice(0, 160);
  const description = String(body.description || '').trim().slice(0, 1_000);
  if (titleAr.length < 3 || titleEn.length < 3) return { status: 400, body: { error: 'Arabic and English course titles are required.' } };
  const { data, error } = await admin.from('courses').insert({
    title: { ar: titleAr, en: titleEn },
    description,
    teacher_id: actorId,
    category: 'education',
    level: 'beginner',
    duration_weeks: 1,
    price: 0,
    is_published: true,
  }).select('id,title,is_published').single();
  if (error) {
    // Older Fahim schemas store a plain title instead of localized JSON.
    const fallback = await admin.from('courses').insert({
      title: `${titleAr} / ${titleEn}`,
      description,
      teacher_id: actorId,
      category: 'education',
      level: 'beginner',
      duration_weeks: 1,
      price: 0,
      is_published: true,
    }).select('id,title,is_published').single();
    if (fallback.error) throw fallback.error;
    return { status: 201, body: { course: fallback.data } };
  }
  return { status: 201, body: { course: data } };
}

export default async function handler(request, response) {
  applyApiHeaders(request, response);
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return send(response, 405, { error: 'Method not allowed.' });
  }
  try {
    const rate = await consumeRateLimit(request, { namespace: 'admin-certificates', limit: 40, windowMs: 10 * 60 * 1_000 });
    if (!rate.allowed) return rejectRateLimit(response, rate, send);
    const { user, admin } = await requireAdmin(request);
    if (request.method === 'GET') return send(response, 200, await listRegistry(admin));
    if (!isSameOrigin(request)) return send(response, 403, { error: 'Cross-site request rejected.' });
    const body = parseJsonBody(request, { maxBytes: 8_000 });
    const result = body.action === 'create_course'
      ? await createCredentialCourse(admin, body, user.id)
      : await issueCertificate(admin, body, user.id);
    return send(response, result.status, result.body);
  } catch (error) {
    const status = error instanceof AuthenticationError || error instanceof ServerConfigurationError ? error.status : Number(error?.status) || 500;
    return send(response, status, { error: status >= 500 ? 'Credential registry operation failed.' : error.message });
  }
}
