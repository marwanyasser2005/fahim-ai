import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Building2,
  Check,
  ClipboardPlus,
  Copy,
  GraduationCap,
  KeyRound,
  Loader2,
  Plus,
  School,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ClassSignalCard from '@/components/teacher/ClassSignalCard';
import PilotEvidenceCard from '@/components/teacher/PilotEvidenceCard';
import {
  createClassAssignment,
  createImpactPilot,
  createTeacherClass,
  createTeacherOrganization,
  joinTeacherClass,
  loadImpactPilots,
  loadTeacherCockpit,
  type CockpitClass,
  type CockpitOrganization,
  type ImpactPilot,
  type TeacherCockpitData,
} from '@/lib/teacherCockpit';

type Tab = 'overview' | 'classes' | 'impact';

const copy = {
  ar: {
    eyebrow: 'غرفة قيادة المعلم',
    title: 'اعرف أين يتعطّل الفهم، ثم تدخّل بالدليل.',
    body: 'فصول حقيقية، إشارات أخطاء مجمعة، تكليفات قابلة للمراجعة، ومعمل Pilot لا يعرض نتيجة قبل اكتمال الحد الأدنى للعينة.',
    overview: 'نظرة عامة', classes: 'الفصول والتكليفات', impact: 'معمل الأثر',
    noClaims: 'لا توجد بيانات عرض أو نتائج مولّدة داخل هذه الصفحة. كل رقم يأتي من نشاط طلاب الفصل أو تقييم مسجل.',
  },
  en: {
    eyebrow: 'Teacher command room',
    title: 'See where understanding breaks—then intervene with evidence.',
    body: 'Real classes, privacy-safe misconception signals, reviewable assignments, and a pilot lab that reports no result before the sample gate is met.',
    overview: 'Overview', classes: 'Classes & assignments', impact: 'Impact lab',
    noClaims: 'This page contains no generated cohorts or demo outcomes. Every number comes from class activity or an administered assessment.',
  },
} as const;

const emptyData: TeacherCockpitData = { organizations: [], classes: [] };

export default function TeacherCockpit({ language }: { language: 'ar' | 'en' }) {
  const { user } = useAuth();
  const rtl = language === 'ar';
  const t = copy[language];
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<TeacherCockpitData>(emptyData);
  const [pilots, setPilots] = useState<ImpactPilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const cockpit = await loadTeacherCockpit();
      setData(cockpit);
      setPilots(await loadImpactPilots(cockpit.classes.map((item) => item.id)));
    } catch (reason) { setError((reason as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const totals = useMemo(() => ({
    learners: data.classes.reduce((sum, item) => sum + item.memberCount, 0),
    active: data.classes.reduce((sum, item) => sum + item.activeLearners30d, 0),
    assignments: data.classes.reduce((sum, item) => sum + item.assignmentCount, 0),
    reportablePilots: pilots.filter((pilot) => pilot.status === 'analysis' || pilot.status === 'complete').length,
  }), [data.classes, pilots]);

  const notify = (message: string) => { setSuccess(message); window.setTimeout(() => setSuccess(''), 4500); };
  const reportError = (reason: unknown) => {
    const raw = reason instanceof Error ? reason.message : String(reason);
    const safe = raw.toLowerCase().includes('permission') || raw.toLowerCase().includes('row-level security')
      ? (rtl ? 'لا تملك صلاحية تنفيذ هذا الإجراء داخل هذه المؤسسة.' : 'You do not have permission to perform this action in this organization.')
      : raw.toLowerCase().includes('jwt') || raw.toLowerCase().includes('session')
        ? (rtl ? 'انتهت الجلسة. حدّث الصفحة وسجّل الدخول من جديد.' : 'Your session expired. Refresh and sign in again.')
        : raw;
    setError(safe);
  };
  const tabs: { key: Tab; label: string; icon: typeof School }[] = [
    { key: 'overview', label: t.overview, icon: BarChart3 },
    { key: 'classes', label: t.classes, icon: School },
    { key: 'impact', label: t.impact, icon: Activity },
  ];

  return <main className="teacher-cockpit-page">
    <section className="teacher-cockpit-hero">
      <div className="atlas-grid absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-[96rem] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 xl:grid-cols-[1fr_.68fr] xl:items-end">
          <div>
            <p className="atlas-kicker"><School className="h-4 w-4" />{t.eyebrow}</p>
            <h1 className="atlas-display mt-6 max-w-5xl text-4xl sm:text-6xl">{t.title}</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--muted)]">{t.body}</p>
          </div>
          <div className="teacher-integrity-card"><ShieldCheck /><div><strong>{rtl ? 'نزاهة القياس مدمجة في المنتج' : 'Measurement integrity is built in'}</strong><p>{t.noClaims}</p></div></div>
        </div>
        <div className="teacher-tabs mt-10" role="tablist" aria-label={t.eyebrow}>{tabs.map(({ key, label, icon: Icon }) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={tab === key ? 'active' : ''}><Icon className="h-4 w-4" />{label}</button>)}</div>
      </div>
    </section>

    <div className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {error ? <div role="alert" className="mb-6 border border-rose-300 bg-rose-50 p-4 text-sm font-bold text-rose-900">{error}</div> : null}
      {success ? <div role="status" className="mb-6 flex items-center gap-2 border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900"><Check className="h-4 w-4" />{success}</div> : null}
      {loading ? <div className="grid min-h-96 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0F766E]" /></div> : <motion.div key={tab} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .22 }}>
        {tab === 'overview' ? <Overview language={language} totals={totals} classes={data.classes} pilots={pilots} onOpen={setTab} /> : null}
        {tab === 'classes' ? <ClassesPanel language={language} userId={user!.id} data={data} refresh={refresh} notify={notify} reportError={reportError} /> : null}
        {tab === 'impact' ? <ImpactPanel language={language} userId={user!.id} classes={data.classes} pilots={pilots} refresh={refresh} notify={notify} reportError={reportError} /> : null}
      </motion.div>}
    </div>
  </main>;
}

function Overview({ language, totals, classes, pilots, onOpen }: { language: 'ar' | 'en'; totals: { learners: number; active: number; assignments: number; reportablePilots: number }; classes: CockpitClass[]; pilots: ImpactPilot[]; onOpen: (tab: Tab) => void }) {
  const rtl = language === 'ar';
  const metrics = [
    { icon: UsersRound, value: totals.learners, label: rtl ? 'طلاب مرتبطون' : 'Connected learners' },
    { icon: Activity, value: totals.active, label: rtl ? 'متعلمين نشطين خلال 30 يومًا' : 'Active learners in 30 days' },
    { icon: BookOpenCheck, value: totals.assignments, label: rtl ? 'تكليفات منشورة' : 'Published assignments' },
    { icon: BarChart3, value: totals.reportablePilots, label: rtl ? 'دراسات بلغت بوابة التحليل' : 'Pilots at analysis gate' },
  ];
  return <div>
    <section className="teacher-overview-grid">{metrics.map(({ icon: Icon, value, label }, index) => <article key={label}><span>0{index + 1}</span><Icon /><strong>{value}</strong><p>{label}</p></article>)}</section>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <section className="atlas-panel p-6 sm:p-8"><div className="flex items-end justify-between gap-4 border-b border-[var(--border)] pb-5"><div><p className="atlas-section-number">CLASS HEALTH</p><h2 className="mt-2 text-2xl font-black">{rtl ? 'إشارة لا تقرير حضور' : 'A learning signal—not an attendance report'}</h2></div><button className="atlas-secondary" type="button" onClick={() => onOpen('classes')}>{rtl ? 'إدارة الفصول' : 'Manage classes'}</button></div>{classes.length ? <div className="divide-y divide-[var(--border)]">{classes.slice(0, 5).map((item) => <div key={item.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><strong className="text-sm">{item.title}</strong><p className="mt-1 text-xs text-[var(--muted)]">{item.subject || (rtl ? 'مادة عامة' : 'General subject')}</p></div><span className="text-xs font-black text-[#0F766E]">{item.activeLearners30d}/{item.memberCount} {rtl ? 'نشط' : 'active'}</span><span className="text-xs font-bold text-[var(--muted)]">{item.misconceptions.length} {rtl ? 'أنماط مجمعة' : 'aggregate patterns'}</span></div>)}</div> : <TeacherEmpty language={language} kind="classes" onAction={() => onOpen('classes')} />}</section>
      <section className="atlas-panel bg-[#14213D] p-6 text-white sm:p-8"><p className="atlas-section-number !text-[#F2B84B]">PILOT READINESS</p><h2 className="mt-3 text-2xl font-black">{rtl ? 'حوّل الادعاء إلى بروتوكول.' : 'Turn the claim into a protocol.'}</h2><p className="mt-3 text-sm leading-8 text-blue-100">{rtl ? 'ابدأ بهدف قابل للملاحظة، ثم سجّل pre وpost وdelayed. فَهيم يحجب المتوسطات الصغيرة تلقائيًا.' : 'Start with an observable outcome, then record pre, post, and delayed checks. Fahim suppresses small-sample averages automatically.'}</p><div className="mt-7 flex items-center justify-between border-t border-white/15 pt-5"><div><strong className="block text-3xl">{pilots.length}</strong><span className="text-xs text-blue-200">{rtl ? 'بروتوكولات فعلية' : 'real protocols'}</span></div><button type="button" onClick={() => onOpen('impact')} className="bg-[#F2B84B] px-4 py-3 text-xs font-black text-[#14213D]">{rtl ? 'افتح معمل الأثر' : 'Open impact lab'}</button></div></section>
    </div>
  </div>;
}

function ClassesPanel({ language, userId, data, refresh, notify, reportError }: { language: 'ar' | 'en'; userId: string; data: TeacherCockpitData; refresh: () => Promise<void>; notify: (message: string) => void; reportError: (reason: unknown) => void }) {
  const rtl = language === 'ar';
  const [busy, setBusy] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<CockpitOrganization['type']>('school');
  const [organizationId, setOrganizationId] = useState(data.organizations[0]?.id || '');
  const [classTitle, setClassTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [joinCode, setJoinCode] = useState('');
  const [latestJoinCode, setLatestJoinCode] = useState('');
  const [assignmentByClass, setAssignmentByClass] = useState<Record<string, { title: string; instructions: string; dueAt: string }>>({});

  useEffect(() => { if (!organizationId && data.organizations[0]) setOrganizationId(data.organizations[0].id); }, [data.organizations, organizationId]);

  const createOrganization = async (event: FormEvent) => { event.preventDefault(); if (organizationName.trim().length < 3) return; setBusy(true); try { const id = await createTeacherOrganization(organizationName, organizationType); setOrganizationId(id); setOrganizationName(''); await refresh(); notify(rtl ? 'تم إنشاء مساحة المؤسسة بصلاحيات المالك.' : 'Organization workspace created with owner access.'); } catch (reason) { reportError(reason); } finally { setBusy(false); } };
  const createClass = async (event: FormEvent) => { event.preventDefault(); if (!organizationId || classTitle.trim().length < 3) return; setBusy(true); try { const created = await createTeacherClass({ organizationId, title: classTitle, subject, academicYear }); setLatestJoinCode(created.joinCode); setClassTitle(''); setSubject(''); await refresh(); notify(rtl ? 'تم إنشاء الفصل. احتفظ بكود الانضمام الظاهر الآن.' : 'Class created. Save the one-time join code shown now.'); } catch (reason) { reportError(reason); } finally { setBusy(false); } };
  const join = async (event: FormEvent) => { event.preventDefault(); if (joinCode.trim().length !== 10) return; setBusy(true); try { await joinTeacherClass(joinCode); setJoinCode(''); await refresh(); notify(rtl ? 'تم الانضمام إلى الفصل بنجاح.' : 'You joined the class successfully.'); } catch (reason) { reportError(reason); } finally { setBusy(false); } };
  const addAssignment = async (classId: string) => { const form = assignmentByClass[classId]; if (!form?.title.trim() || form.instructions.trim().length < 5) return; setBusy(true); try { await createClassAssignment({ classId, title: form.title, instructions: form.instructions, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null, createdBy: userId }); setAssignmentByClass((state) => ({ ...state, [classId]: { title: '', instructions: '', dueAt: '' } })); await refresh(); notify(rtl ? 'تم نشر التكليف للفصل.' : 'Assignment published to the class.'); } catch (reason) { reportError(reason); } finally { setBusy(false); } };

  return <div className="grid gap-8 xl:grid-cols-[22rem_1fr]">
    <aside className="space-y-5">
      <form onSubmit={createOrganization} className="atlas-panel p-5"><p className="atlas-section-number">01 / ORGANIZATION</p><h2 className="mt-2 text-xl font-black">{rtl ? 'أنشئ مساحة تعليمية' : 'Create a learning organization'}</h2><div className="mt-5 space-y-3"><label><span className="atlas-label">{rtl ? 'اسم المؤسسة أو الفريق' : 'Organization or team name'}</span><input className="atlas-field mt-2 min-h-11" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></label><label><span className="atlas-label">{rtl ? 'النوع' : 'Type'}</span><select className="atlas-field mt-2 min-h-11" value={organizationType} onChange={(event) => setOrganizationType(event.target.value as CockpitOrganization['type'])}>{['school','university','academy','company','community'].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button disabled={busy || organizationName.trim().length < 3} className="atlas-primary w-full justify-center"><Building2 className="h-4 w-4" />{rtl ? 'إنشاء المساحة' : 'Create workspace'}</button></div></form>
      <form onSubmit={join} className="atlas-panel p-5"><p className="atlas-section-number">STUDENT ACCESS</p><h2 className="mt-2 text-xl font-black">{rtl ? 'انضم بكود الفصل' : 'Join with a class code'}</h2><p className="mt-2 text-xs leading-6 text-[var(--muted)]">{rtl ? 'الكود يُخزّن كبصمة مشفرة، مع حد خادمي للمحاولات، ولا يمكن للإدارة قراءته بعد الإنشاء.' : 'The code is stored as a secure digest with server-side attempt limits and cannot be read back after creation.'}</p><input aria-label={rtl ? 'كود الفصل' : 'Class code'} autoComplete="off" className="atlas-field mt-4 min-h-11 uppercase tracking-[.2em]" maxLength={10} value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} /><button disabled={busy || joinCode.length !== 10} className="atlas-secondary mt-3 w-full justify-center"><KeyRound className="h-4 w-4" />{rtl ? 'انضم الآن' : 'Join class'}</button></form>
    </aside>
    <section>
      <form onSubmit={createClass} className="teacher-create-class"><div><p className="atlas-section-number">02 / VERIFIED CLASS</p><h2>{rtl ? 'أنشئ فصلًا متصلًا بالدليل' : 'Create an evidence-connected class'}</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><select aria-label={rtl ? 'المؤسسة' : 'Organization'} className="atlas-field min-h-11" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}><option value="">{rtl ? 'اختر المؤسسة' : 'Choose organization'}</option>{data.organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input aria-label={rtl ? 'اسم الفصل' : 'Class title'} placeholder={rtl ? 'اسم الفصل' : 'Class title'} className="atlas-field min-h-11" value={classTitle} onChange={(event) => setClassTitle(event.target.value)} /><input aria-label={rtl ? 'المادة' : 'Subject'} placeholder={rtl ? 'المادة' : 'Subject'} className="atlas-field min-h-11" value={subject} onChange={(event) => setSubject(event.target.value)} /><input aria-label={rtl ? 'العام الدراسي' : 'Academic year'} placeholder={rtl ? 'العام الدراسي' : 'Academic year'} className="atlas-field min-h-11" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} /></div><button disabled={busy || !organizationId || classTitle.trim().length < 3} className="atlas-primary justify-center"><Plus className="h-4 w-4" />{rtl ? 'إنشاء الفصل' : 'Create class'}</button></form>
      {latestJoinCode ? <div className="teacher-join-code"><div><span>{rtl ? 'كود انضمام لمرة واحدة' : 'One-time class join code'}</span><strong>{latestJoinCode}</strong></div><button type="button" onClick={() => void navigator.clipboard.writeText(latestJoinCode)}><Copy className="h-4 w-4" />{rtl ? 'نسخ' : 'Copy'}</button></div> : null}
      <div className="mt-6 grid gap-6">{data.classes.length ? data.classes.map((item) => { const assignment = assignmentByClass[item.id] || { title: '', instructions: '', dueAt: '' }; return <ClassSignalCard key={item.id} item={item} language={language}><div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_12rem_auto]"><input aria-label={rtl ? 'عنوان التكليف' : 'Assignment title'} placeholder={rtl ? 'عنوان التكليف' : 'Assignment title'} className="atlas-field min-h-11" value={assignment.title} onChange={(event) => setAssignmentByClass((state) => ({ ...state, [item.id]: { ...assignment, title: event.target.value } }))} /><input aria-label={rtl ? 'تعليمات التكليف' : 'Assignment instructions'} placeholder={rtl ? 'مخرج واضح قابل للمراجعة' : 'A clear, reviewable outcome'} className="atlas-field min-h-11" value={assignment.instructions} onChange={(event) => setAssignmentByClass((state) => ({ ...state, [item.id]: { ...assignment, instructions: event.target.value } }))} /><input aria-label={rtl ? 'موعد التسليم' : 'Due date'} type="date" className="atlas-field min-h-11" value={assignment.dueAt} onChange={(event) => setAssignmentByClass((state) => ({ ...state, [item.id]: { ...assignment, dueAt: event.target.value } }))} /><button type="button" onClick={() => void addAssignment(item.id)} disabled={busy || !assignment.title.trim() || assignment.instructions.trim().length < 5} className="atlas-secondary justify-center"><ClipboardPlus className="h-4 w-4" />{rtl ? 'نشر' : 'Publish'}</button></div></ClassSignalCard>; }) : <TeacherEmpty language={language} kind="classes" />}</div>
    </section>
  </div>;
}

function ImpactPanel({ language, userId, classes, pilots, refresh, notify, reportError }: { language: 'ar' | 'en'; userId: string; classes: CockpitClass[]; pilots: ImpactPilot[]; refresh: () => Promise<void>; notify: (message: string) => void; reportError: (reason: unknown) => void }) {
  const rtl = language === 'ar';
  const [busy, setBusy] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [title, setTitle] = useState('');
  const [conceptKey, setConceptKey] = useState('');
  const [outcome, setOutcome] = useState('');
  const [metric, setMetric] = useState<ImpactPilot['primary_metric']>('assessment_score');
  const [minimum, setMinimum] = useState(3);
  useEffect(() => { if (!classId && classes[0]) setClassId(classes[0].id); }, [classId, classes]);
  const create = async (event: FormEvent) => { event.preventDefault(); if (!classId || title.trim().length < 3 || conceptKey.trim().length < 2 || outcome.trim().length < 12) return; setBusy(true); try { await createImpactPilot({ classId, title, conceptKey, outcomeStatement: outcome, primaryMetric: metric, minimumSampleSize: minimum, createdBy: userId }); setTitle(''); setConceptKey(''); setOutcome(''); await refresh(); notify(rtl ? 'تم إنشاء بروتوكول Pilot دون أي نتائج افتراضية.' : 'Pilot protocol created with no synthetic outcomes.'); } catch (reason) { reportError(reason); } finally { setBusy(false); } };
  const titleByClass = new Map(classes.map((item) => [item.id, item.title]));
  return <div>
    <section className="impact-method-strip"><div><Sparkles /><h2>{rtl ? 'من فرضية إلى دليل قابل للدفاع' : 'From hypothesis to defensible evidence'}</h2></div>{[(rtl ? 'هدف ملاحظ' : 'Observable outcome'), (rtl ? 'قياس قبلي' : 'Pre measure'), (rtl ? 'تدخل' : 'Intervention'), (rtl ? 'قياس بعدي' : 'Post measure'), (rtl ? 'استرجاع متأخر' : 'Delayed recall')].map((item, index) => <span key={item}><b>0{index + 1}</b>{item}</span>)}</section>
    <form onSubmit={create} className="atlas-panel mt-6 p-6 sm:p-8"><div className="grid gap-6 xl:grid-cols-[.6fr_1.4fr]"><div><p className="atlas-section-number">NEW PILOT PROTOCOL</p><h2 className="mt-3 text-2xl font-black">{rtl ? 'صمّم القياس قبل رؤية النتيجة.' : 'Design the measure before seeing the result.'}</h2><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{rtl ? 'هذه البنية تمنع تحويل Impression إلى نتيجة. لا يظهر التحسن إلا لطلاب لديهم pre وpost مكتملان.' : 'This structure prevents impressions from becoming outcomes. Change is reported only for learners with paired pre and post evidence.'}</p></div><div className="grid gap-3 md:grid-cols-2"><label><span className="atlas-label">{rtl ? 'الفصل' : 'Class'}</span><select className="atlas-field mt-2 min-h-11" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">{rtl ? 'اختر فصلًا' : 'Choose a class'}</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label><span className="atlas-label">{rtl ? 'عنوان التجربة' : 'Pilot title'}</span><input className="atlas-field mt-2 min-h-11" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label><span className="atlas-label">{rtl ? 'المفهوم' : 'Concept key'}</span><input className="atlas-field mt-2 min-h-11" value={conceptKey} onChange={(event) => setConceptKey(event.target.value)} placeholder="physics.newton.second-law" /></label><label><span className="atlas-label">{rtl ? 'المؤشر الأساسي' : 'Primary metric'}</span><select className="atlas-field mt-2 min-h-11" value={metric} onChange={(event) => setMetric(event.target.value as ImpactPilot['primary_metric'])}><option value="assessment_score">Assessment score</option><option value="recall_score">Delayed recall</option><option value="transfer_score">Transfer score</option></select></label><label className="md:col-span-2"><span className="atlas-label">{rtl ? 'النتيجة التعليمية القابلة للملاحظة' : 'Observable learning outcome'}</span><textarea className="atlas-field mt-2 min-h-24" value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder={rtl ? 'يشرح الطالب العلاقة ويطبقها على سؤال جديد لم يره أثناء التدخل.' : 'The learner explains the relationship and applies it to an unseen transfer question.'} /></label><label><span className="atlas-label">{rtl ? 'الحد الأدنى للعينة' : 'Minimum sample'}</span><input className="atlas-field mt-2 min-h-11" type="number" min="3" max="500" value={minimum} onChange={(event) => setMinimum(Math.max(3, Number(event.target.value) || 3))} /></label><button disabled={busy || !classId || title.trim().length < 3 || outcome.trim().length < 12} className="atlas-primary self-end justify-center"><Plus className="h-4 w-4" />{rtl ? 'إنشاء البروتوكول' : 'Create protocol'}</button></div></div></form>
    <div className="mt-6 grid gap-6">{pilots.length ? pilots.map((pilot) => <PilotEvidenceCard key={pilot.id} pilot={pilot} classTitle={titleByClass.get(pilot.class_id) || (rtl ? 'فصل' : 'Class')} userId={userId} language={language} onChanged={refresh} />) : <TeacherEmpty language={language} kind="impact" />}</div>
  </div>;
}

function TeacherEmpty({ language, kind, onAction }: { language: 'ar' | 'en'; kind: 'classes' | 'impact'; onAction?: () => void }) {
  const rtl = language === 'ar'; const Icon = kind === 'classes' ? GraduationCap : BarChart3;
  return <div className="teacher-empty-state"><span><Icon /></span><h3>{kind === 'classes' ? (rtl ? 'ابدأ بفصل حقيقي' : 'Start with a real class') : (rtl ? 'لا توجد بروتوكولات أثر بعد' : 'No impact protocols yet')}</h3><p>{kind === 'classes' ? (rtl ? 'أنشئ مساحة مؤسسة، ثم فصلًا، وشارك كود الانضمام مع طلابك.' : 'Create an organization, then a class, and share its secure join code.') : (rtl ? 'أنشئ Pilot بهدف قابل للقياس قبل تسجيل أي نتيجة.' : 'Create a pilot with an observable outcome before recording results.')}</p>{onAction ? <button type="button" onClick={onAction} className="atlas-primary mt-5">{rtl ? 'ابدأ الآن' : 'Start now'}</button> : null}</div>;
}
