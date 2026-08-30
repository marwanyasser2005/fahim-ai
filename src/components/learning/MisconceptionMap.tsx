import { AlertTriangle, CheckCircle2, Compass, RotateCcw } from 'lucide-react';
import type { Language } from '@/App';
import type { LearningSession, MisconceptionCategory } from '@/lib/learningEvidence';

const labels: Record<MisconceptionCategory, Record<Language, string>> = {
  concept_confusion: { ar: 'خلط بين المفاهيم', en: 'Concept confusion' },
  formula_without_meaning: { ar: 'استخدام القانون دون فهم المعنى', en: 'Formula without meaning' },
  unit_reasoning: { ar: 'استدلال الوحدات', en: 'Unit reasoning' },
  causal_reversal: { ar: 'عكس العلاقة السببية', en: 'Causal reversal' },
  procedure_gap: { ar: 'فجوة في خطوات الحل', en: 'Procedure gap' },
  language_bridge: { ar: 'فجوة بين المصطلح العربي والإنجليزي', en: 'Language bridge' },
};

const copy = {
  ar: {
    title: 'خريطة الالتباسات',
    body: 'أنماط تحتاج تدخلًا أو مراجعة، مستخرجة من محاولاتك الفعلية.',
    active: 'نشط',
    resolved: 'تحت المتابعة',
    evidence: 'سجل دليل',
    empty: 'لا توجد أنماط مسجلة بعد. التقييم التشخيصي هو نقطة البداية.',
    intelligence: 'ذكاء التعلّم',
  },
  en: {
    title: 'Misconception map',
    body: 'Patterns that need intervention or review, based on your actual attempts.',
    active: 'Active',
    resolved: 'Monitoring',
    evidence: 'evidence record',
    empty: 'No patterns are recorded yet. A diagnostic assessment is the starting point.',
    intelligence: 'Learning intelligence',
  },
} as const;

export default function MisconceptionMap({ sessions, language }: { sessions: LearningSession[]; language: Language }) {
  const t = copy[language];
  const groups = new Map<MisconceptionCategory, LearningSession[]>();
  for (const session of sessions) {
    for (const event of session.events) {
      if (!event.misconception) continue;
      const group = groups.get(event.misconception) || [];
      if (!group.some((item) => item.id === session.id)) group.push(session);
      groups.set(event.misconception, group);
    }
  }
  const entries = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <section className="learning-panel" aria-labelledby="misconception-title">
      <header className="learning-panel-heading">
        <div>
          <p className="section-kicker"><Compass aria-hidden="true" />{t.intelligence}</p>
          <h2 id="misconception-title">{t.title}</h2>
          <p>{t.body}</p>
        </div>
      </header>
      {entries.length === 0 ? (
        <div className="misconception-empty"><CheckCircle2 aria-hidden="true" /><p>{t.empty}</p></div>
      ) : (
        <ul className="misconception-list">
          {entries.map(([category, related]) => {
            const active = related.some((session) => session.status === 'active' || session.status === 'review_due');
            return (
              <li key={category}>
                <span className={`misconception-state ${active ? 'is-active' : 'is-monitoring'}`}>
                  {active ? <AlertTriangle aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                </span>
                <div>
                  <strong>{labels[category][language]}</strong>
                  <p>{related.slice(0, 3).map((session) => session.conceptAr || session.conceptEn).join(' · ')}</p>
                </div>
                <span className="misconception-count">{related.length} {t.evidence}</span>
                <span className="sr-only">{active ? t.active : t.resolved}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
