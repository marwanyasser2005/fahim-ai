import type { ReactNode } from 'react';
import { Activity, BookOpenCheck, BrainCircuit, ClipboardCheck, ShieldCheck, UsersRound } from 'lucide-react';
import type { CockpitClass } from '@/lib/teacherCockpit';

const misconceptionLabels: Record<string, { ar: string; en: string }> = {
  concept_confusion: { ar: 'خلط بين المفاهيم', en: 'Concept confusion' },
  formula_without_meaning: { ar: 'قانون بلا معنى', en: 'Formula without meaning' },
  unit_reasoning: { ar: 'استدلال الوحدات', en: 'Unit reasoning' },
  causal_reversal: { ar: 'عكس السبب والنتيجة', en: 'Causal reversal' },
  procedure_gap: { ar: 'فجوة إجرائية', en: 'Procedure gap' },
  language_bridge: { ar: 'فجوة المصطلح الثنائي', en: 'Bilingual terminology gap' },
};

export default function ClassSignalCard({ item, language, children }: { item: CockpitClass; language: 'ar' | 'en'; children?: ReactNode }) {
  const rtl = language === 'ar';
  const metrics = [
    { icon: UsersRound, value: item.memberCount, label: rtl ? 'طلاب' : 'Learners' },
    { icon: Activity, value: item.activeLearners30d, label: rtl ? 'نشطون خلال 30 يومًا' : 'Active in 30 days' },
    { icon: BookOpenCheck, value: item.assignmentCount, label: rtl ? 'تكليفات' : 'Assignments' },
    { icon: ClipboardCheck, value: item.submissionCount, label: rtl ? 'تسليمات قابلة للمراجعة' : 'Reviewable submissions' },
  ];

  return <article className="teacher-class-card">
    <header>
      <div>
        <p className="atlas-section-number">CLASS SIGNAL / {item.status.toUpperCase()}</p>
        <h2>{item.title}</h2>
        <p>{[item.subject, item.academicYear].filter(Boolean).join(' · ') || (rtl ? 'فصل تعلّم موثّق' : 'Verified learning class')}</p>
      </div>
      <span className="teacher-privacy-seal"><ShieldCheck className="h-4 w-4" />{rtl ? 'خصوصية مجمعة' : 'Aggregate privacy'}</span>
    </header>
    <div className="teacher-metric-grid">
      {metrics.map(({ icon: Icon, value, label }) => <div key={label}>
        <Icon className="h-4 w-4" /><strong>{value}</strong><span>{label}</span>
      </div>)}
    </div>
    <section className="teacher-signal-section">
      <div className="flex items-center justify-between gap-4">
        <div><p className="atlas-section-number">MISCONCEPTION ATLAS</p><h3>{rtl ? 'الأنماط التي تستحق تدخلًا صفّيًا' : 'Patterns that deserve a class intervention'}</h3></div>
        <BrainCircuit className="h-6 w-6 text-[#D95D39]" />
      </div>
      {item.misconceptions.length ? <div className="mt-5 space-y-3">
        {item.misconceptions.slice(0, 5).map((signal) => {
          const label = misconceptionLabels[signal.category]?.[language] || signal.category.replace(/_/g, ' ');
          const width = Math.min(100, Math.max(12, signal.learnerCount * 14));
          return <div key={`${signal.conceptKey}-${signal.category}`} className="teacher-signal-row">
            <div><strong>{signal.conceptKey}</strong><span>{label}</span></div>
            <div className="teacher-signal-meter" aria-label={`${signal.learnerCount} ${rtl ? 'طلاب' : 'learners'}`}><i style={{ width: `${width}%` }} /></div>
            <b><bdi>{signal.learnerCount}</bdi> {rtl ? 'طلاب' : 'learners'}</b>
          </div>;
        })}
      </div> : <div className="teacher-private-empty">
        <ShieldCheck className="h-5 w-5" />
        <p>{rtl ? 'لن يظهر أي نمط قبل تكراره لدى 3 طلاب على الأقل. هذه ليست بيانات ناقصة؛ إنها حماية مقصودة للخصوصية.' : 'No pattern appears until it is shared by at least three learners. This is an intentional privacy boundary, not missing data.'}</p>
      </div>}
    </section>
    {children ? <footer className="teacher-class-actions">{children}</footer> : null}
  </article>;
}
