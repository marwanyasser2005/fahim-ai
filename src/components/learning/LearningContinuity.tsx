import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Brain, Route, TimerReset } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { listPersonalizedPaths, type PersonalizedPath } from '@/lib/personalizedPaths';

export default function LearningContinuity({ language }: { language: 'ar' | 'en' }) {
  const { user } = useAuth();
  const [paths, setPaths] = useState<PersonalizedPath[]>([]);
  const [session, setSession] = useState<{ id: string; goal: string } | null>(null);
  const [weak, setWeak] = useState<{ concept_key: string; mastery: number; attempts: number }[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const ar = language === 'ar';
  useEffect(() => {
    if (!user || !supabase) return;
    let active = true;
    void Promise.all([
      listPersonalizedPaths(),
      supabase.from('agent_sessions').select('id,goal').eq('user_id', user.id).in('status', ['active', 'awaiting']).order('updated_at', { ascending: false }).limit(1),
      supabase.rpc('my_concept_mastery_v1'),
    ]).then(([items, sessions, concepts]) => {
      if (!active) return;
      setPaths(items.slice(0, 3)); setSession(sessions.data?.[0] || null);
      setWeak((concepts.data || []).filter((entry: { mastery: number; attempts: number }) => Number(entry.attempts) > 0 && Number(entry.mastery) < .6).slice(0, 3));
      setUnavailable(Boolean(sessions.error || concepts.error));
    }).catch(() => { if (active) setUnavailable(true); });
    return () => { active = false; };
  }, [user]);
  return <section className="premium-card my-6 p-5 sm:p-7"><h2 className="text-xl font-black">{ar ? 'كمّل من آخر خطوة' : 'Pick up where you left off'}</h2>
    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{ar ? 'المسارات والجلسات دي من سجلك المحفوظ، مش بيانات العرض التجريبي.' : 'These paths and sessions come from your saved record, not the demo journey.'}</p>
    {session && <Link to={`/agent?sessionId=${session.id}&goal=${encodeURIComponent(session.goal)}`} className="atlas-primary mt-4 min-h-12"><TimerReset className="h-4 w-4" />{ar ? 'كمّل جلسة الفهم' : 'Resume your learning session'}<ArrowUpRight className="h-4 w-4" /></Link>}
    <div className="mt-4 grid gap-3 sm:grid-cols-3">{paths.map((path) => <Link key={path.id} to={`/personal-path/${path.id}`} className="rounded-xl border border-[var(--border)] p-4 text-sm font-bold transition hover:border-[var(--nile)]"><Route className="mb-3 h-5 w-5 text-[var(--nile)]" />{path.title[language] || path.title.ar}</Link>)}</div>
    {weak.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{weak.map((entry) => <Link key={entry.concept_key} to={`/agent?goal=${encodeURIComponent(entry.concept_key.replace(/-/g, ' '))}`} className="atlas-secondary min-h-11 text-sm"><Brain className="h-4 w-4" />{entry.concept_key.replace(/-/g, ' ')} · {ar ? 'محتاج مراجعة' : 'Worth revisiting'}</Link>)}</div>}
    {!session && !paths.length && !weak.length && <Link to="/personal-paths" className="atlas-secondary mt-4 min-h-11">{ar ? 'ابدأ مسار لهدفك' : 'Start a path for your goal'}</Link>}
    {unavailable && <p role="status" className="mt-3 text-xs text-[var(--muted)]">{ar ? 'جزء من السجل مش متاح دلوقتي. جرّب تفتح الصفحة تاني.' : 'Part of your saved record is unavailable. Try reloading.'}</p>}
  </section>;
}
