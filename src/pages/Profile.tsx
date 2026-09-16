import { useState, type FormEvent } from 'react';
import { Award, Bookmark, Camera, Edit3, Flame, GraduationCap, Loader2, LogOut, Save, ShieldCheck, BrainCircuit, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import BadgeTrail from '@/components/badges/BadgeTrail';
import { useAuth } from '@/contexts/AuthContext';
import { useBadgeProgress } from '@/hooks/useBadgeProgress';
import { getStudyEvents, getStudyStats } from '@/lib/studyProgress';
import { loadConversations } from '@/lib/conversations';
import { getFreshSession, supabase } from '@/lib/supabase/client';
import Dialog from '@/components/Dialog';
import type { Language } from '@/App';

const banners = ['from-[#173F5F] via-[#14213D] to-[#0F766E]', 'from-[#14213D] via-[#173F5F] to-[#D95D39]', 'from-[#D95D39] via-[#B9472D] to-[#F2B84B]', 'from-[#0F766E] via-[#115E59] to-[#173F5F]'];

export default function Profile({ language }: { language: Language }) {
  const { user, signOut } = useAuth();
  const stats = getStudyStats();
  const events = getStudyEvents();
  const conversations = loadConversations();
  const { progress: badgeProgress, loading: badgesLoading, error: badgesError } = useBadgeProgress();
  const metadata = user?.user_metadata || {};
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(String(metadata.full_name || ''));
  const [avatar, setAvatar] = useState(String(metadata.avatar_url || ''));
  const [bio, setBio] = useState(String(metadata.bio || ''));
  const [banner, setBanner] = useState(Number(metadata.banner_index || 0));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const displayName = name || user?.email?.split('@')[0] || (language === 'ar' ? 'متعلم فَهيم' : 'Fahim learner');
  const xp = stats.total * 35 + events.filter((event) => event.action === 'quiz').length * 50 + badgeProgress.badgeXp;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !user || name.trim().length < 2) return;
    setSaving(true); setMessage('');
    const fresh = await getFreshSession();
    if (!fresh.session) {
      setMessage(language === 'ar' ? 'انتهت الجلسة. سجّل الدخول مرة أخرى لحفظ التعديلات.' : 'Your session expired. Sign in again to save changes.');
      setSaving(false);
      return;
    }
    const payload = { full_name: name.trim(), avatar_url: avatar.trim(), bio: bio.trim().slice(0, 240), banner_index: banner };
    const { error } = await supabase.auth.updateUser({ data: payload });
    if (!error) {
      await supabase.from('users').update({ full_name: payload.full_name, avatar_url: payload.avatar_url || null }).eq('id', user.id);
      setMessage(language === 'ar' ? 'تم حفظ الملف.' : 'Profile saved.');
      setEditing(false);
    } else setMessage(error.message);
    setSaving(false);
  };

  return <main className="min-h-[78vh] bg-[var(--surface)] py-10 sm:py-14"><div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <section className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${banners[banner] || banners[0]} text-white shadow-[var(--shadow-xl)]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,.22),transparent_32%),linear-gradient(to_top,rgba(2,6,23,.55),transparent)]" />
      <div className="relative h-36 sm:h-48" />
      <div className="relative flex flex-col gap-5 px-6 pb-7 sm:flex-row sm:items-end sm:px-9">
        <div className="-mt-16 grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-[2rem] border-4 border-white/20 bg-slate-950/30 text-3xl font-black shadow-xl backdrop-blur">
          {avatar ? <img src={avatar} className="h-full w-full object-cover" alt="" referrerPolicy="no-referrer" /> : displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black sm:text-3xl">{displayName}</h1><span className="inline-flex items-center gap-1 rounded-full bg-teal-300/15 px-2.5 py-1 text-[10px] font-black text-teal-100"><ShieldCheck className="h-3 w-3" />{language === 'ar' ? 'حساب آمن' : 'Secure account'}</span></div><p className="mt-2 text-sm text-white/75">{bio || user?.email}</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-slate-950"><Edit3 className="h-4 w-4" />{language === 'ar' ? 'تعديل الملف' : 'Edit profile'}</button><button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs font-black hover:bg-white/10"><LogOut className="h-4 w-4" />{language === 'ar' ? 'خروج' : 'Sign out'}</button></div>
      </div>
    </section>
    {message && <p className="mt-4 rounded-xl border border-[var(--success-border)] bg-[var(--success-surface)] px-4 py-3 text-sm font-bold text-[var(--success-text)]">{message}</p>}
    {badgesError && <p role="status" className="mt-4 text-xs font-bold text-[var(--muted)]">{language === 'ar' ? 'تعذر تحديث سجل الشارات الآن؛ يظهر المسار من دون منح إنجازات غير موثقة.' : 'The badge registry could not refresh; the trail is shown without granting unverified achievements.'}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{[
      [Flame, language === 'ar' ? 'أنشطة اليوم' : 'Today', String(stats.today)],
      [BrainCircuit, language === 'ar' ? 'الخبرة' : 'Experience', `${xp} XP`],
      [GraduationCap, language === 'ar' ? 'الموضوعات' : 'Topics', String(stats.topics)],
      [Bookmark, language === 'ar' ? 'المحادثات' : 'Conversations', String(conversations.length)],
      [Award, language === 'ar' ? 'الشارات' : 'Badges', badgesLoading ? '—' : `${badgeProgress.earnedCount}/${badgeProgress.totalCount}`],
      [ShieldCheck, language === 'ar' ? 'الشهادات' : 'Credentials', badgesLoading ? '—' : String(badgeProgress.certificateCount)],
    ].map(([IconValue, label, value]) => { const Icon = IconValue as typeof Flame; return <article key={String(label)} className="premium-card p-5"><Icon className="h-5 w-5 text-[var(--brand-primary)]" /><p className="mt-5 text-xs font-bold text-[var(--muted)]">{String(label)}</p><p className="mt-1 text-2xl font-black text-[var(--text)]">{String(value)}</p></article>; })}</div>
    <div className="mt-6"><BadgeTrail progress={badgeProgress} language={language} loading={badgesLoading} /></div>
    <aside className="profile-level-card mt-6"><div><p>{language === 'ar' ? 'مستوى التعلّم' : 'LEARNING LEVEL'}</p><strong>{Math.floor(xp / 500) + 1}</strong><span>{xp % 500} / 500 XP</span></div><div className="profile-level-progress"><i style={{ width: `${((xp % 500) / 500) * 100}%` }} /></div><div className="profile-level-actions"><Link to="/dashboard">{language === 'ar' ? 'لوحة التقدم' : 'Progress dashboard'}</Link><Link to="/certificates">{language === 'ar' ? 'سجل الشهادات' : 'Credential registry'}</Link></div></aside>
  </div>
  <Dialog open={editing} onClose={() => setEditing(false)} label={language === 'ar' ? 'تعديل الملف' : 'Edit profile'} className="w-full max-w-lg"><form onSubmit={saveProfile} className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-xl)] sm:p-8"><div className="flex items-center justify-between"><div><Camera className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden="true" /><h2 className="mt-2 text-2xl font-black text-[var(--text)]">{language === 'ar' ? 'تعديل الملف' : 'Edit profile'}</h2></div><button type="button" onClick={() => setEditing(false)} className="icon-button" aria-label={language === 'ar' ? 'إغلاق' : 'Close'}><X className="h-4 w-4" aria-hidden="true" /></button></div><div className="mt-6 space-y-4"><ProfileField label={language === 'ar' ? 'الاسم' : 'Name'} value={name} onChange={setName} /><ProfileField label={language === 'ar' ? 'رابط الصورة' : 'Avatar URL'} value={avatar} onChange={setAvatar} type="url" /><label className="block"><span className="mb-2 block text-xs font-black text-[var(--muted)]">{language === 'ar' ? 'نبذة قصيرة' : 'Short bio'}</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={240} rows={3} className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-sm text-[var(--text)] outline-none focus:border-[var(--brand-primary)]" /></label><div><p className="mb-2 text-xs font-black text-[var(--muted)]">{language === 'ar' ? 'لون الغلاف' : 'Banner'}</p><div className="grid grid-cols-4 gap-2">{banners.map((value, index) => <button type="button" key={value} onClick={() => setBanner(index)} aria-label={`Banner ${index + 1}`} className={`h-12 rounded-xl bg-gradient-to-br ${value} ${banner === index ? 'ring-3 ring-[var(--brand-primary)] ring-offset-2' : ''}`} />)}</div></div></div><button disabled={saving || name.trim().length < 2} className="premium-button mt-6 w-full justify-center">{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}{language === 'ar' ? 'حفظ التغييرات' : 'Save changes'}</button></form></Dialog>
  </main>;
}

function ProfileField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block"><span className="mb-2 block text-xs font-black text-[var(--muted)]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="auth-input" /></label>;
}
