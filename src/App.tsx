import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import TrialBanner from '@/components/TrialBanner';
import MobileDock from '@/components/MobileDock';
import Home from '@/pages/Home';
import ProductSidebar from '@/components/ProductSidebar';
import { useAuth } from '@/contexts/AuthContext';

export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark' | 'system';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Courses = lazy(() => import('@/pages/Courses'));
const CourseDetail = lazy(() => import('@/pages/CourseDetail'));
const Auth = lazy(() => import('@/pages/Auth'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Admin = lazy(() => import('@/pages/Admin'));
const Resources = lazy(() => import('@/pages/Resources'));
const AiTutor = lazy(() => import('@/pages/AiTutor'));
const Learning = lazy(() => import('@/pages/Learning'));
const Videos = lazy(() => import('@/pages/Videos'));
const Library = lazy(() => import('@/pages/Library'));
const Workspace = lazy(() => import('@/pages/Workspace'));
const QuizLab = lazy(() => import('@/pages/QuizLab'));
const KnowledgeVault = lazy(() => import('@/pages/KnowledgeVault'));
const SpacedReview = lazy(() => import('@/pages/SpacedReview'));
const CreatorStudio = lazy(() => import('@/pages/CreatorStudio'));
const About = lazy(() => import('@/pages/About'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const HowItWorks = lazy(() => import('@/pages/HowItWorks'));
const Onboarding = lazy(() => import('@/pages/Onboarding'));
const CertificateVerify = lazy(() => import('@/pages/CertificateVerify'));
const GenerationDetail = lazy(() => import('@/pages/GenerationDetail'));
const Support = lazy(() => import('@/pages/Support'));
const MobileApp = lazy(() => import('@/pages/MobileApp'));
const Showcase = lazy(() => import('@/pages/Showcase'));
const EvidenceRoom = lazy(() => import('@/pages/EvidenceRoom'));
const LearningPassport = lazy(() => import('@/pages/LearningPassport'));
const CertificateCenter = lazy(() => import('@/pages/CertificateCenter'));
const TeacherCockpit = lazy(() => import('@/pages/TeacherCockpit'));
const TrustCenter = lazy(() => import('@/pages/TrustCenter'));

export default function App() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('fahim-language') === 'en' ? 'en' : 'ar');
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('fahim-theme');
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });
  const [lowBandwidth, setLowBandwidth] = useState(() => localStorage.getItem('fahim-low-bandwidth') === 'true');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('fahim-language', language);
  }, [language]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const effective = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.classList.toggle('dark', effective === 'dark');
      document.documentElement.style.colorScheme = effective;
      document.documentElement.dataset.theme = effective;
    };
    apply();
    localStorage.setItem('fahim-theme', theme);
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.lowBandwidth = String(lowBandwidth);
    localStorage.setItem('fahim-low-bandwidth', String(lowBandwidth));
  }, [lowBandwidth]);

  return <BrowserRouter><AppShell language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} lowBandwidth={lowBandwidth} setLowBandwidth={setLowBandwidth} /></BrowserRouter>;
}

function AppShell({ language, setLanguage, theme, setTheme, lowBandwidth, setLowBandwidth }: { language: Language; setLanguage: (language: Language) => void; theme: Theme; setTheme: (theme: Theme) => void; lowBandwidth: boolean; setLowBandwidth: (value: boolean) => void }) {
  const location = useLocation();
  const { user } = useAuth();
  const product = Boolean(user && /^\/(dashboard|workspace|ask-fahim|review|passport|knowledge-vault|library|teacher|admin|profile|support|quiz-lab|learning|course\/|certificates|videos|studio|generation\/)/.test(location.pathname));
  const immersive = location.pathname === '/ask-fahim';
  useEffect(() => { if (!immersive) window.scrollTo({ top: 0, behavior: 'auto' }); }, [immersive, location.pathname]);

  return <div className={`fahim-os flex min-h-screen flex-col bg-[var(--surface)] text-[var(--text)] transition-colors ${product ? 'has-product-sidebar' : ''}`}>
    <RouteMetadata language={language} pathname={location.pathname} />
    <a href="#main-content" className="skip-link">{language === 'ar' ? 'انتقل إلى المحتوى' : 'Skip to content'}</a>
    {product && <ProductSidebar language={language} />}
    <Navbar language={language} setLanguage={setLanguage} theme={theme} setTheme={setTheme} lowBandwidth={lowBandwidth} setLowBandwidth={setLowBandwidth} />
    <TrialBanner language={language} />
    <div id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none">
        <div key={location.pathname} className="page-enter">
          <Suspense fallback={<PageSkeleton />}>
            <Routes location={location}>
              <Route path="/" element={<Home language={language} />} />
              <Route path="/how-it-works" element={<HowItWorks language={language} />} />
              <Route path="/pricing" element={<Pricing language={language} />} />
              <Route path="/about" element={<About language={language} />} />
              <Route path="/showcase" element={<Showcase language={language} />} />
              <Route path="/evidence" element={<EvidenceRoom language={language} />} />
              <Route path="/demo" element={<Navigate to="/showcase" replace />} />
              <Route path="/verify/:certificateId" element={<CertificateVerify language={language} />} />
              <Route path="/certificates" element={<ProtectedRoute><CertificateCenter language={language} /></ProtectedRoute>} />
              <Route path="/learning" element={<ProtectedRoute><Learning language={language} /></ProtectedRoute>} />
              <Route path="/workspace" element={<ProtectedRoute><Workspace language={language} /></ProtectedRoute>} />
              <Route path="/videos" element={<ProtectedRoute><Videos language={language} /></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><Library language={language} /></ProtectedRoute>} />
              <Route path="/resources" element={<Resources language={language} />} />
              <Route path="/ask-fahim" element={<ProtectedRoute><AiTutor language={language} /></ProtectedRoute>} />
              <Route path="/generation/:generationId" element={<ProtectedRoute><GenerationDetail language={language} /></ProtectedRoute>} />
              <Route path="/quiz-lab" element={<ProtectedRoute><QuizLab language={language} /></ProtectedRoute>} />
              <Route path="/knowledge-vault" element={<ProtectedRoute><KnowledgeVault language={language} /></ProtectedRoute>} />
              <Route path="/review" element={<ProtectedRoute><SpacedReview language={language} /></ProtectedRoute>} />
              <Route path="/passport" element={<ProtectedRoute><LearningPassport language={language} /></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><CreatorStudio language={language} /></ProtectedRoute>} />
              <Route path="/teacher" element={<ProtectedRoute><TeacherCockpit language={language} /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard language={language} /></ProtectedRoute>} />
              <Route path="/student-dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/profile" element={<ProtectedRoute><Profile language={language} /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin language={language} /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support language={language} /></ProtectedRoute>} />
              <Route path="/courses" element={<Courses language={language} />} />
              <Route path="/course/:id" element={<ProtectedRoute><CourseDetail language={language} /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding language={language} /></ProtectedRoute>} />
              <Route path="/login" element={<Auth language={language} mode="login" />} />
              <Route path="/register" element={<Auth language={language} mode="register" />} />
              <Route path="/forgot-password" element={<Auth language={language} mode="forgot" />} />
              <Route path="/reset-password" element={<Auth language={language} mode="reset" />} />
              <Route path="/contact" element={<Navigate to="/resources" replace />} />
              <Route path="/gamification" element={<Navigate to="/dashboard" replace />} />
              <Route path="/community-forum" element={<Navigate to="/workspace" replace />} />
              <Route path="/mobile-app" element={<MobileApp language={language} />} />
              <Route path="/trust" element={<TrustCenter language={language} />} />
              <Route path="/privacy" element={<TrustCenter language={language} focus="privacy" />} />
              <Route path="/terms" element={<TrustCenter language={language} focus="terms" />} />
              <Route path="/ai-policy" element={<TrustCenter language={language} focus="ai" />} />
              <Route path="/credentials-policy" element={<TrustCenter language={language} focus="credentials" />} />
              <Route path="*" element={<NotFound language={language} />} />
            </Routes>
          </Suspense>
        </div>
    </div>
    <MobileDock language={language} immersive={immersive} />
    {!immersive && <Footer language={language} />}
  </div>;
}

const routeTitles: Record<string, { ar: string; en: string }> = {
  '/': { ar: 'فَهيم | نظام تشغيل للفهم الموثق', en: 'Fahim | Verified Learning OS' },
  '/how-it-works': { ar: 'كيف يعمل فَهيم | من المصدر إلى الدليل', en: 'How Fahim works | From source to evidence' },
  '/courses': { ar: 'مسارات فَهيم التعليمية', en: 'Fahim learning paths' },
  '/pricing': { ar: 'أسعار فَهيم | 30 يومًا دون بطاقة', en: 'Fahim pricing | 30 days, no card' },
  '/about': { ar: 'عن فَهيم والمؤسس مروان عبد الغفار', en: 'About Fahim and founder Marwan Abdelghaffar' },
  '/showcase': { ar: 'عرض فَهيم | افهمها، اثبتها، افتكرها', en: 'Fahim Showcase | Learn it. Prove it. Remember it.' },
  '/evidence': { ar: 'غرفة أدلة فَهيم | ما يعمل وما لم يُقَس بعد', en: 'Fahim Evidence Room | What works and what is not measured yet' },
  '/passport': { ar: 'جواز التعلّم | فَهيم', en: 'Learning Passport | Fahim' },
  '/certificates': { ar: 'شهاداتي القابلة للتحقق | فَهيم', en: 'My verifiable credentials | Fahim' },
  '/dashboard': { ar: 'مهمة اليوم | فَهيم', en: 'Today | Fahim' },
  '/teacher': { ar: 'غرفة قيادة المعلم | فَهيم', en: 'Teacher command room | Fahim' },
  '/trust': { ar: 'مركز الثقة | فَهيم', en: 'Trust Center | Fahim' },
  '/privacy': { ar: 'الخصوصية والبيانات | فَهيم', en: 'Privacy and data | Fahim' },
  '/terms': { ar: 'شروط الاستخدام | فَهيم', en: 'Terms of use | Fahim' },
  '/ai-policy': { ar: 'سياسة الذكاء الاصطناعي | فَهيم', en: 'AI policy | Fahim' },
  '/credentials-policy': { ar: 'سياسة الشارات والشهادات | فَهيم', en: 'Badge and credential policy | Fahim' },
  '/onboarding': { ar: 'إعداد مسارك | فَهيم', en: 'Set up your path | Fahim' },
  '/login': { ar: 'تسجيل الدخول | فَهيم', en: 'Sign in | Fahim' },
  '/register': { ar: 'إنشاء حساب | فَهيم', en: 'Create your account | Fahim' },
  '/forgot-password': { ar: 'استعادة كلمة المرور | فَهيم', en: 'Recover your password | Fahim' },
  '/reset-password': { ar: 'كلمة مرور جديدة | فَهيم', en: 'Set a new password | Fahim' },
  '/resources': { ar: 'مصادر مصر التعليمية | فَهيم', en: 'Egypt learning sources | Fahim' },
  '/library': { ar: 'البحث والمكتبة | فَهيم', en: 'Search & library | Fahim' },
  '/mobile-app': { ar: 'تطبيق الجوال | فَهيم', en: 'Mobile app | Fahim' },
  '/support': { ar: 'الدعم | فَهيم', en: 'Support | Fahim' },
  '/workspace': { ar: 'مساحة تعلّمي | فَهيم', en: 'My learning workspace | Fahim' },
  '/ask-fahim': { ar: 'اسأل فَهيم', en: 'Ask Fahim' },
  '/review': { ar: 'المراجعة المتباعدة | فَهيم', en: 'Spaced review | Fahim' },
  '/knowledge-vault': { ar: 'خزانة المعرفة | فَهيم', en: 'Knowledge vault | Fahim' },
  '/quiz-lab': { ar: 'مختبر التقييم | فَهيم', en: 'Assessment lab | Fahim' },
  '/learning': { ar: 'الدرس | فَهيم', en: 'Lesson | Fahim' },
  '/videos': { ar: 'فيديوهات التعلّم | فَهيم', en: 'Learning videos | Fahim' },
  '/studio': { ar: 'استوديو المحتوى | فَهيم', en: 'Creator studio | Fahim' },
  '/profile': { ar: 'حسابي | فَهيم', en: 'My account | Fahim' },
  '/admin': { ar: 'لوحة الإدارة | فَهيم', en: 'Admin console | Fahim' },
};

const prefixTitles: Array<[string, { ar: string; en: string }]> = [
  ['/course/', { ar: 'المسار التعليمي | فَهيم', en: 'Learning path | Fahim' }],
  ['/verify/', { ar: 'تحقق من شهادة | فَهيم', en: 'Verify a credential | Fahim' }],
  ['/generation/', { ar: 'تفاصيل التوليد | فَهيم', en: 'Generation detail | Fahim' }],
];

function RouteMetadata({ language, pathname }: { language: Language; pathname: string }) {
  useEffect(() => {
    const exact = routeTitles[pathname] ?? prefixTitles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? null;
    document.title = exact?.[language] || (language === 'ar' ? 'فَهيم | نظام تشغيل للفهم الموثق' : 'Fahim | Verified Learning OS');
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `https://fahim-ai-egypt.vercel.app${pathname === '/' ? '/' : pathname}`;
  }, [language, pathname]);
  return null;
}

function PageSkeleton() {
  return <main className="mx-auto min-h-[70vh] max-w-7xl animate-pulse px-4 py-16 sm:px-6 lg:px-8" aria-label="Loading">
    <div className="skeleton h-5 w-32 rounded-full" /><div className="skeleton mt-5 h-12 max-w-xl rounded-2xl" /><div className="skeleton mt-4 h-5 max-w-2xl rounded-full" />
    <div className="mt-10 grid gap-5 md:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-52 rounded-3xl" />)}</div>
  </main>;
}
