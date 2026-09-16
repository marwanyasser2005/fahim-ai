import { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import type { Language } from '@/App';
import { loadCourseAssessment, submitCourseAssessment, type AssessmentQuestion, type AssessmentResult } from '@/lib/supabase/progressSync';

const copy = {
  ar: {
    title: 'تقييم المسار',
    body: 'أسئلة تُصحَّح على الخادم. النجاح من 70% ويفتح باب شهادة الإتمام الموثّقة.',
    submit: 'أرسل الإجابات',
    submitting: 'جارٍ التصحيح على الخادم…',
    result: 'نتيجتك',
    passed: 'اجتزت التقييم.',
    failed: 'لم تجتز بعد — راجع الشرح ثم أعد المحاولة.',
    retry: 'أعد المحاولة',
    attempt: 'المحاولة',
    unavailable: 'لا يوجد تقييم منشور لهذا المسار بعد.',
    needsSignIn: 'سجّل الدخول لتقديم التقييم. التصحيح والحفظ يتمّان على الخادم.',
    feedback: 'الشرح',
  },
  en: {
    title: 'Path assessment',
    body: 'Questions are graded on the server. A score of 70% or more opens the verified completion credential.',
    submit: 'Submit answers',
    submitting: 'Grading on the server…',
    result: 'Your result',
    passed: 'You passed the assessment.',
    failed: 'Not passed yet — read the explanations and try again.',
    retry: 'Try again',
    attempt: 'Attempt',
    unavailable: 'This path has no published assessment yet.',
    needsSignIn: 'Sign in to submit. Grading and recording both happen on the server.',
    feedback: 'Explanation',
  },
} as const;

export default function CourseAssessment({ courseId, language }: { courseId: string; language: Language }) {
  const t = copy[language];
  const [questions, setQuestions] = useState<AssessmentQuestion[] | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void loadCourseAssessment(courseId).then((loaded) => {
      if (!active) return;
      setQuestions(loaded.questions);
      setQuizId(loaded.quizId);
    });
    return () => { active = false; };
  }, [courseId]);

  if (questions === null) {
    return <section className="mt-10 grid min-h-32 place-items-center rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)]" aria-busy="true"><Loader2 className="h-6 w-6 animate-spin text-[var(--nile)]" /></section>;
  }
  if (!questions.length || !quizId) {
    return <section className="mt-10 rounded-[var(--radius-card)] border border-dashed border-[var(--border)] bg-[var(--panel)] p-6 text-sm font-bold text-[var(--muted)]">{t.unavailable}</section>;
  }

  const complete = questions.every((question) => typeof answers[question.questionId] === 'number');

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const outcome = await submitCourseAssessment(quizId, questions.map((question) => ({
        questionId: question.questionId,
        selectedIndex: answers[question.questionId],
      })));
      setResult(outcome);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setResult(null); setAnswers({}); };

  return <section className="mt-10 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
      <div>
        <p className="atlas-section-number">{t.attempt}</p>
        <h2 className="mt-2 text-2xl font-black text-[var(--text)]">{t.title}</h2>
        <p className="mt-2 max-w-2xl text-xs font-bold leading-6 text-[var(--muted)]">{t.body}</p>
      </div>
      {result && <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${result.passed ? 'bg-[var(--success-surface)] text-[var(--success-text)]' : 'bg-[var(--warning-surface)] text-[var(--warning-text)]'}`}>
        {result.passed ? <BadgeCheck className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        <bdi>{result.correctCount}/{result.questionCount} · {result.percentage}%</bdi>
      </span>}
    </header>

    {error && <p role="alert" className="mt-4 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-surface)] p-3 text-xs font-bold text-[var(--danger-text)]">{error}</p>}
    {!result && <p className="mt-4 text-xs font-bold text-[var(--muted)]">{t.needsSignIn}</p>}

    <ol className="mt-6 space-y-6">
      {questions.map((question, index) => {
        const chosen = answers[question.questionId];
        const feedback = result?.feedback.find((item) => item.questionId === question.questionId);
        return <li key={question.questionId} className="border-b border-[var(--border)] pb-5 last:border-0">
          <div className="flex items-start gap-3">
            <span className="atlas-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black leading-7 text-[var(--text)]">{question.prompt}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {question.choices.map((choice, choiceIndex) => {
                  const isChosen = chosen === choiceIndex;
                  const isAnswer = feedback?.correctIndex === choiceIndex;
                  const wrongChoice = Boolean(result && isChosen && feedback && !feedback.correct);
                  return <button
                    key={choice}
                    type="button"
                    disabled={Boolean(result)}
                    aria-pressed={isChosen}
                    onClick={() => setAnswers((state) => ({ ...state, [question.questionId]: choiceIndex }))}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-start text-xs font-bold transition disabled:cursor-default ${isAnswer && result ? 'border-[var(--success-border)] bg-[var(--success-surface)] text-[var(--success-text)]' : wrongChoice ? 'border-[var(--danger-border)] bg-[var(--danger-surface)] text-[var(--danger-text)]' : isChosen ? 'border-[var(--brand-solid)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--panel))] text-[var(--text)]' : 'border-[var(--border)] bg-[var(--soft)] text-[var(--muted)] hover:border-[var(--brand-primary)]'}`}
                  >
                    {isAnswer && result ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-current text-[8px]">{choiceIndex + 1}</span>}
                    <span className="min-w-0">{choice}</span>
                  </button>;
                })}
              </div>
              {feedback && <p className="mt-3 border-s-2 border-[var(--evidence-solid)] ps-3 text-xs leading-6 text-[var(--muted)]"><b className="text-[var(--text)]">{t.feedback}: </b>{feedback.explanation}</p>}
            </div>
          </div>
        </li>;
      })}
    </ol>

    <div className="mt-6 flex flex-wrap items-center gap-3">
      {result
        ? <button type="button" onClick={reset} className="atlas-secondary"><RefreshCw className="h-4 w-4" />{t.retry}</button>
        : <button type="button" disabled={!complete || submitting} onClick={() => void submit()} className="atlas-primary disabled:opacity-40">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}{submitting ? t.submitting : t.submit}</button>}
      {result && <p className={`text-xs font-black ${result.passed ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'}`}>{result.passed ? t.passed : t.failed}</p>}
    </div>
  </section>;
}
