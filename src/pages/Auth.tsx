import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Eye, EyeOff, Github, KeyRound, Loader2, LockKeyhole, Mail, RefreshCw, ShieldCheck, BrainCircuit, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AUTH_SESSION_EXPIRED, authenticatedFetch, getAuthProviders, supabase, type AuthProviders } from '@/lib/supabase/client';
import type { Language } from '@/App';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type Props = { language: Language; mode: AuthMode };

const text = {
  ar: {
    login: 'تسجيل الدخول', register: 'إنشاء حساب', forgot: 'استعادة الحساب', reset: 'كلمة مرور جديدة',
    loginSub: 'ارجع إلى مساحتك وتابع من حيث توقفت.', registerSub: 'أنشئ ملف تعلم آمن واحفظ تقدّمك عبر أجهزتك.',
    forgotSub: 'سنرسل رابطًا آمنًا صالحًا لمدة عشر دقائق.', resetSub: 'اختر كلمة مرور قوية قبل انتهاء مهلة الاسترداد.',
    name: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور', confirm: 'تأكيد كلمة المرور',
    submitLogin: 'دخول آمن', submitRegister: 'ابدأ التعلم', submitForgot: 'أرسل رابط الاستعادة', submitReset: 'حفظ كلمة المرور',
    magic: 'أرسل رابط دخول سحري', or: 'أو تابع باستخدام', noAccount: 'ليس لديك حساب؟', hasAccount: 'لديك حساب بالفعل؟',
    forgotLink: 'نسيت كلمة المرور؟', verify: 'تم إنشاء الحساب. راجع بريدك لتأكيده.', magicSent: 'تم إرسال رابط الدخول إلى بريدك.',
    resetSent: 'تم إرسال رابط الاستعادة. صلاحيته عشر دقائق؛ بعد ذلك اطلب رابطًا جديدًا.', updated: 'تم تحديث كلمة المرور بنجاح.', mismatch: 'كلمتا المرور غير متطابقتين.',
    minPassword: 'استخدم 10 أحرف على الأقل، وتأكد من وجود حروف وأرقام.', required: 'أكمل الحقول المطلوبة.', notConfigured: 'المصادقة غير مهيأة على هذا النطاق.',
    recoveryChecking: 'نتحقق من صلاحية رابط الاسترداد…', recoveryExpired: 'انتهت مهلة الاسترداد. اطلب رابطًا جديدًا لحماية حسابك.', recoveryInvalid: 'رابط الاسترداد غير صالح أو تم استخدامه من قبل.', recoveryRemaining: 'الوقت المتبقي', requestAgain: 'اطلب رابطًا جديدًا',
    expiredEmailLink: 'انتهت صلاحية رابط البريد. اكتب بريدك ثم أرسل رابط تحقق جديدًا.', resendVerification: 'إرسال رابط تحقق جديد', verificationResent: 'أرسلنا رابط تحقق جديدًا بتصميم فَهيم إلى بريدك.',
    privacy: 'تتم المصادقة عبر Supabase باستخدام جلسات PKCE مشفّرة. لا نخزن كلمة المرور داخل التطبيق.',
    sessionExpired: 'انتهت جلستك بأمان. سجّل الدخول مرة أخرى وسنعيدك إلى نفس الخطوة دون فقد بيانات الحساب.',
    valueA: 'محادثات محفوظة', valueB: 'تقدّم متزامن', valueC: 'خصوصية وتحكم',
  },
  en: {
    login: 'Sign in', register: 'Create account', forgot: 'Recover account', reset: 'New password',
    loginSub: 'Return to your workspace and continue where you stopped.', registerSub: 'Create a secure learning profile and sync progress across devices.',
    forgotSub: 'We will send a secure link that remains valid for ten minutes.', resetSub: 'Choose a strong password before the recovery window closes.',
    name: 'Full name', email: 'Email address', password: 'Password', confirm: 'Confirm password',
    submitLogin: 'Secure sign in', submitRegister: 'Start learning', submitForgot: 'Send recovery link', submitReset: 'Save password',
    magic: 'Email me a magic link', or: 'or continue with', noAccount: 'New to Fahim?', hasAccount: 'Already have an account?',
    forgotLink: 'Forgot password?', verify: 'Account created. Check your email to verify it.', magicSent: 'A sign-in link was sent to your email.',
    resetSent: 'A recovery link was sent. It is valid for ten minutes; request a new one after that.', updated: 'Your password was updated.', mismatch: 'Passwords do not match.',
    minPassword: 'Use at least 10 characters with both letters and numbers.', required: 'Complete the required fields.', notConfigured: 'Authentication is not configured on this domain.',
    recoveryChecking: 'Checking the recovery link…', recoveryExpired: 'The recovery window has expired. Request a new link to protect your account.', recoveryInvalid: 'This recovery link is invalid or has already been used.', recoveryRemaining: 'Time remaining', requestAgain: 'Request a new link',
    expiredEmailLink: 'This email link expired. Enter your email and send a fresh verification link.', resendVerification: 'Send a new verification link', verificationResent: 'A new Fahim-branded verification link was sent to your email.',
    privacy: 'Authentication is handled by Supabase with encrypted PKCE sessions. The app never stores your password.',
    sessionExpired: 'Your session ended safely. Sign in again and we will return you to the same step without losing account data.',
    valueA: 'Saved conversations', valueB: 'Synced progress', valueC: 'Privacy and control',
  },
} as const;

export default function Auth({ language, mode }: Props) {
  const t = text[language];
  const rtl = language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, loading: authLoading, configured, signIn, signUp, resendVerification, sendMagicLink, resetPassword, updatePassword, signInWithOAuth } = useAuth();
  const [providers, setProviders] = useState<AuthProviders>({ email: true, google: false, github: false, azure: false });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [recoveryState, setRecoveryState] = useState<'idle' | 'checking' | 'ready' | 'expired' | 'invalid'>(mode === 'reset' ? 'checking' : 'idle');
  const [recoveryExpiresAt, setRecoveryExpiresAt] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const expiredEmailLink = mode === 'login' && (() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return fragment.get('error_code') === 'otp_expired' || fragment.get('error') === 'access_denied';
  })();
  const sessionExpired = mode === 'login' && (location.state as { reason?: string } | null)?.reason === AUTH_SESSION_EXPIRED;

  useEffect(() => { void getAuthProviders().then(setProviders); }, []);
  useEffect(() => {
    if (expiredEmailLink) setError(t.expiredEmailLink);
  }, [expiredEmailLink, t.expiredEmailLink]);

  useEffect(() => {
    if (mode !== 'reset' || authLoading) return;
    let active = true;
    const prepare = async () => {
      setRecoveryState('checking');
      const params = new URLSearchParams(location.search);
      const tokenHash = params.get('token_hash');
      if (tokenHash) {
        if (!supabase) { if (active) setRecoveryState('invalid'); return; }
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (verifyError) { if (active) setRecoveryState('invalid'); return; }
        window.history.replaceState({}, '', '/reset-password');
      } else if (!session) {
        if (active) setRecoveryState('invalid');
        return;
      }

      try {
        const response = await authenticatedFetch('/api/auth-recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status' }),
        });
        const payload = await response.json() as { expiresAt?: string; code?: string };
        if (!active) return;
        if (!response.ok) { setRecoveryState(response.status === 410 || payload.code === 'RECOVERY_WINDOW_EXPIRED' ? 'expired' : 'invalid'); return; }
        setRecoveryExpiresAt(payload.expiresAt || '');
        setRecoveryState('ready');
      } catch {
        if (active) setRecoveryState('invalid');
      }
    };
    void prepare();
    return () => { active = false; };
  }, [authLoading, location.search, mode, session]);

  useEffect(() => {
    if (recoveryState !== 'ready' || !recoveryExpiresAt) return;
    const update = () => {
      const seconds = Math.max(0, Math.floor((new Date(recoveryExpiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) setRecoveryState('expired');
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [recoveryExpiresAt, recoveryState]);
  useEffect(() => {
    if (user && (mode === 'login' || mode === 'register')) {
      navigate('/onboarding', { replace: true, state: location.state });
    }
  }, [location.state, mode, navigate, user]);

  const heading = t[mode];
  const subtitle = mode === 'login' ? t.loginSub : mode === 'register' ? t.registerSub : mode === 'forgot' ? t.forgotSub : t.resetSub;
  const submitLabel = mode === 'login' ? t.submitLogin : mode === 'register' ? t.submitRegister : mode === 'forgot' ? t.submitForgot : t.submitReset;
  const oauthProviders = useMemo(() => ([
    providers.google && { id: 'google' as const, label: 'Google', icon: <span className="text-base font-black">G</span> },
    providers.github && { id: 'github' as const, label: 'GitHub', icon: <Github className="h-4 w-4" /> },
    providers.azure && { id: 'azure' as const, label: 'Microsoft', icon: <span className="text-base font-black">M</span> },
  ].filter(Boolean) as { id: 'google' | 'github' | 'azure'; label: string; icon: React.ReactNode }[]), [providers]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setNotice('');
    if (!configured) { setError(t.notConfigured); return; }
    if (!email && mode !== 'reset') { setError(t.required); return; }
    if (mode === 'reset' && recoveryState !== 'ready') { setError(recoveryState === 'expired' ? t.recoveryExpired : t.recoveryInvalid); return; }
    if (mode === 'login' && !password) { setError(t.required); return; }
    if ((mode === 'register' || mode === 'reset') && (password.length < 10 || !/\p{L}/u.test(password) || !/\d/.test(password))) { setError(t.minPassword); return; }
    if ((mode === 'register' || mode === 'reset') && password !== confirm) { setError(t.mismatch); return; }
    if (mode === 'register' && name.trim().length < 2) { setError(t.required); return; }

    setLoading(true);
    const result = mode === 'login' ? await signIn(email, password)
      : mode === 'register' ? await signUp(name.trim(), email, password)
        : mode === 'forgot' ? await resetPassword(email)
          : await updatePassword(password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (mode === 'register' && result.needsVerification) setNotice(t.verify);
    else if (mode === 'forgot') setNotice(t.resetSent);
    else if (mode === 'reset') { setNotice(t.updated); window.setTimeout(() => navigate('/dashboard'), 900); }
    else navigate('/onboarding', { state: location.state });
  };

  const magicLink = async () => {
    setError(''); setNotice('');
    if (!email) { setError(t.required); return; }
    setLoading(true);
    const result = await sendMagicLink(email);
    setLoading(false);
    if (result.error) setError(result.error); else setNotice(t.magicSent);
  };

  const resendEmailVerification = async () => {
    setError(''); setNotice('');
    if (!email) { setError(t.required); return; }
    setLoading(true);
    const result = await resendVerification(email);
    setLoading(false);
    if (result.error) setError(result.error); else setNotice(t.verificationResent);
  };

  const Arrow = rtl ? ArrowLeft : ArrowRight;
  return <main className="relative min-h-[calc(100vh-4.75rem)] overflow-hidden bg-[var(--paper)] px-4 py-10 sm:px-6 lg:py-16">
    <div className="atlas-grid absolute inset-0 opacity-45" />
    <div className="fahim-auth-shell relative mx-auto grid max-w-6xl overflow-hidden bg-[var(--panel)] lg:grid-cols-[.88fr_1.12fr]">
      <section className="fahim-auth-aside hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-[var(--saffron)]"><BrainCircuit className="h-4 w-4" />{language === 'ar' ? 'فَهيم · نظام الفهم الموثّق' : 'Fahim · Verified learning system'}</div><h1 className="mt-9 text-4xl font-black leading-[1.3]">{language === 'ar' ? 'مساحة واحدة لكل رحلة التعلّم.' : 'One workspace for your entire learning journey.'}</h1><p className="mt-5 max-w-md text-base leading-8 text-slate-300">{language === 'ar' ? 'شرح بالذكاء الاصطناعي، فيديوهات، ملاحظات، اختبارات وتقدّم محفوظ في تجربة هادئة ومترابطة.' : 'AI explanations, videos, notes, quizzes, and saved progress in one calm, connected experience.'}</p></div>
        <div className="grid gap-3">{[t.valueA, t.valueB, t.valueC].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-4 text-sm font-bold"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--saffron)]/10"><CheckCircle2 className="h-5 w-5 text-[var(--saffron)]" /></span>{item}</div>)}</div>
      </section>
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }} className="fahim-auth-form p-6 sm:p-10 lg:p-14">
        <span className="fahim-icon-tile"><LockKeyhole className="h-5 w-5" /></span>
        <h2 className="mt-7 text-3xl font-black leading-[1.3] text-[var(--text)] sm:text-4xl">{heading}</h2>
        <p className="mt-3 text-base leading-8 text-[var(--muted)]">{subtitle}</p>
        {!configured && <div role="alert" className="fahim-status mt-6 border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">{t.notConfigured}</div>}
        {sessionExpired && <div role="status" className="fahim-status mt-6 border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">{t.sessionExpired}</div>}
        {mode === 'reset' && <RecoveryStatus state={recoveryState} remainingSeconds={remainingSeconds} language={language} />}
        {notice && <div role="status" className="fahim-status mt-6 border-teal-500/50 bg-teal-50 text-teal-950 dark:bg-teal-500/10 dark:text-teal-100">{notice}</div>}
        {error && <div role="alert" className="fahim-status mt-6 border-rose-500/50 bg-rose-50 text-rose-950 dark:bg-rose-500/10 dark:text-rose-100">{error}</div>}
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'register' && <Field icon={<UserRound />} label={t.name}><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="auth-input" /></Field>}
          {mode !== 'reset' && <Field icon={<Mail />} label={t.email}><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input" /></Field>}
          {(mode === 'login' || mode === 'register' || mode === 'reset') && <Field icon={<KeyRound />} label={t.password}><div className="relative"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input pe-14" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute end-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--soft)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></Field>}
          {(mode === 'register' || mode === 'reset') && <Field icon={<ShieldCheck />} label={t.confirm}><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="auth-input" /></Field>}
          {mode === 'login' && <div className="flex justify-end"><Link to="/forgot-password" className="inline-flex min-h-11 items-center text-xs font-black text-[var(--nile)] hover:text-[var(--vermilion)]">{t.forgotLink}</Link></div>}
          <button disabled={loading || !configured || (mode === 'reset' && recoveryState !== 'ready')} className="premium-button w-full justify-center">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{submitLabel}<Arrow className="h-4 w-4" /></>}</button>
        </form>
        {mode === 'reset' && (recoveryState === 'expired' || recoveryState === 'invalid') && <Link to="/forgot-password" className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--panel)] text-sm font-black text-[var(--nile)]"><RefreshCw className="h-4 w-4" />{t.requestAgain}</Link>}
        {expiredEmailLink && mode === 'login' && <button type="button" disabled={loading} onClick={() => void resendEmailVerification()} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--panel)] text-sm font-black text-[var(--nile)]"><RefreshCw className="h-4 w-4" />{t.resendVerification}</button>}
        {mode === 'login' && providers.email && <button type="button" disabled={loading} onClick={magicLink} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--panel)] text-sm font-black text-[var(--text)] transition hover:border-[var(--nile)] hover:bg-[var(--soft)]"><Mail className="h-4 w-4" />{t.magic}</button>}
        {(mode === 'login' || mode === 'register') && oauthProviders.length > 0 && <><div className="my-6 flex items-center gap-3 text-xs font-bold text-[var(--muted)]"><span className="h-px flex-1 bg-[var(--border)]" />{t.or}<span className="h-px flex-1 bg-[var(--border)]" /></div><div className="grid gap-2 sm:grid-cols-3">{oauthProviders.map((provider) => <button type="button" key={provider.id} onClick={() => void signInWithOAuth(provider.id)} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-xs font-black hover:bg-[var(--soft)]">{provider.icon}{provider.label}</button>)}</div></>}
        {(mode === 'login' || mode === 'register') && <p className="mt-7 flex min-h-11 flex-wrap items-center justify-center gap-x-1 text-center text-sm text-[var(--muted)]">{mode === 'login' ? t.noAccount : t.hasAccount} <Link to={mode === 'login' ? '/register' : '/login'} className="inline-flex min-h-11 items-center font-black text-[var(--nile)]">{mode === 'login' ? t.register : t.login}</Link></p>}
        <p className="mt-7 flex items-start gap-2 text-xs leading-6 text-[var(--muted)]"><ShieldCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-teal-600" />{t.privacy}</p>
      </motion.section>
    </div>
  </main>;
}

function RecoveryStatus({ state, remainingSeconds, language }: { state: 'idle' | 'checking' | 'ready' | 'expired' | 'invalid'; remainingSeconds: number; language: Language }) {
  if (state === 'idle') return null;
  const rtl = language === 'ar';
  const copy = state === 'checking'
    ? (rtl ? 'نتحقق من صلاحية رابط الاسترداد…' : 'Checking the recovery link…')
    : state === 'ready'
      ? `${rtl ? 'الوقت المتبقي' : 'Time remaining'} · ${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`
      : state === 'expired'
        ? (rtl ? 'انتهت مهلة العشر دقائق. اطلب رابطًا جديدًا.' : 'The ten-minute window expired. Request a new link.')
        : (rtl ? 'الرابط غير صالح أو تم استخدامه.' : 'The link is invalid or has already been used.');
  const tone = state === 'ready' ? 'border-teal-500/40 bg-teal-50 text-teal-950 dark:bg-teal-500/10 dark:text-teal-100' : state === 'checking' ? 'border-[var(--border)] bg-[var(--soft)] text-[var(--muted)]' : 'border-amber-500/40 bg-amber-50 text-amber-950 dark:bg-amber-500/10 dark:text-amber-100';
  return <div role="status" className={`fahim-status mt-6 flex items-center gap-3 ${tone}`}>{state === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}<bdi className="font-black tabular-nums">{copy}</bdi></div>;
}

function Field({ icon, label, children }: { icon: React.ReactElement; label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--muted)]">{<span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>}{label}</span>{children}</label>;
}
