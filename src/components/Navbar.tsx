import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Archive,
  BadgeCheck,
  BookOpenCheck,
  ChevronDown,
  CircleUserRound,
  Globe2,
  Headphones,
  LogIn,
  LogOut,
  Menu,
  Laptop,
  Moon,
  Sun,
  Tag,
  X,
  Wifi,
  WifiOff,
  ClipboardCheck,
} from "lucide-react";
import type { Language, Theme } from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import { useProductAccess } from "@/contexts/ProductAccessContext";
import { useProfileRole } from "@/hooks/useProfileRole";
import CommandPalette from "@/components/CommandPalette";
import FahimBrand from "@/components/brand/FahimBrand";
import { hint, label, productNav, publicNav } from "@/lib/appNavigation";
import type { NavEntry } from "@/lib/appNavigation";
import { OPEN_JUDGE_MODE } from "@/config/productMode";

const extraAppNav: NavEntry[] = [
  {
    to: "/quiz-lab",
    ar: "قيّم فهمك",
    en: "Assess",
    hintAr: "خمسة أسئلة تكشف نقطة البداية",
    hintEn: "Five questions that reveal your starting point",
    icon: ClipboardCheck,
    role: "all",
  },
];
const extraPublicNav: NavEntry[] = [
  {
    to: "/pricing",
    ar: "الأسعار",
    en: "Pricing",
    hintAr: "30 يومًا مجانًا دون بطاقة",
    hintEn: "30 free days, no card",
    icon: Tag,
    role: "all",
  },
  {
    to: "/about",
    ar: "عن فَهيم",
    en: "About",
    hintAr: "القصة والمؤسس",
    hintEn: "The story and the founder",
    icon: BookOpenCheck,
    role: "all",
  },
];

interface NavbarProps {
  language: Language;
  setLanguage: (language: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  lowBandwidth: boolean;
  setLowBandwidth: (value: boolean) => void;
}

const copy = {
  ar: {
    how: "كيف يعمل",
    courses: "المسارات",
    pricing: "الأسعار",
    about: "عن فَهيم",
    showcase: "العرض التفاعلي",
    evidence: "غرفة الأدلة",
    passport: "جواز التعلّم",
    certificates: "شهاداتي",
    dashboard: "اليوم",
    workspace: "تعلّمي",
    search: "البحث",
    vault: "ملفاتي",
    review: "المراجعة",
    tutor: "اسأل فَهيم",
    assessment: "ابدأ تقييمًا",
    teacher: "المعلم",
    login: "دخول",
    start: "ابدأ 30 يومًا",
    setup: "أكمل الإعداد",
    profile: "الحساب",
    signOut: "خروج",
    menu: "فتح القائمة",
    theme: "تغيير المظهر",
    bandwidth: "وضع البيانات الخفيفة",
  },
  en: {
    how: "How it works",
    courses: "Paths",
    pricing: "Pricing",
    about: "About",
    showcase: "Showcase",
    evidence: "Evidence",
    passport: "Passport",
    certificates: "Certificates",
    dashboard: "Today",
    workspace: "Learn",
    search: "Search",
    vault: "My files",
    review: "Review",
    tutor: "Ask Fahim",
    assessment: "Start assessment",
    teacher: "Teacher",
    login: "Sign in",
    start: "Start 30 days",
    setup: "Complete setup",
    profile: "Account",
    signOut: "Sign out",
    menu: "Open menu",
    theme: "Change theme",
    bandwidth: "Low-bandwidth mode",
  },
} as const;

export default function Navbar({
  language,
  setLanguage,
  theme,
  setTheme,
  lowBandwidth,
  setLowBandwidth,
}: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const access = useProductAccess();
  const { isStaff } = useProfileRole();
  const t = copy[language];
  const appReady = Boolean(user && (OPEN_JUDGE_MODE || access.onboardingComplete));
  const manifestItems = (appReady ? [...productNav, ...extraAppNav] : [...publicNav, ...extraPublicNav])
    .filter((entry) => entry.role === 'all' || isStaff);
  const items = manifestItems.map((entry) => ({
    to: entry.to,
    label: label(entry, language),
    icon: entry.icon,
    hint: hint(entry, language),
  }));
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-[var(--origin-inline-start)] after:rounded-full after:bg-[var(--vermilion)] after:transition-transform ${isActive ? "bg-[var(--soft)] text-[var(--text)] after:scale-x-100" : "text-[var(--muted)] after:scale-x-0 hover:bg-[var(--soft)] hover:text-[var(--text)] hover:after:scale-x-100"}`;
  const cycleTheme = () => {
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "light" : "dark");
      return;
    }
    setTheme(theme === "light" ? "dark" : "system");
  };

  return (
    <>
      <header className="fahim-navigation sticky top-0 z-50">
        <nav
          className="mx-auto flex h-[4.75rem] min-w-0 max-w-[100rem] items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8"
          aria-label={language === "ar" ? "التنقل الرئيسي" : "Main navigation"}
        >
          <Link
            to={appReady ? "/dashboard" : "/"}
            className="fahim-brand-lockup shrink-0"
            onClick={() => setOpen(false)}
          >
            <FahimBrand language={language} />
          </Link>
          <div className="ms-6 hidden items-center lg:flex">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
          {appReady && (
            <div className="ms-auto hidden xl:block">
              <CommandPalette
                language={language}
                theme={theme}
                setTheme={setTheme}
              />
            </div>
          )}
          <div className="ms-auto flex items-center gap-1.5 xl:ms-0">
            <button type="button" onClick={() => setLowBandwidth(!lowBandwidth)} className="icon-button hidden sm:grid" aria-pressed={lowBandwidth} aria-label={t.bandwidth} title={t.bandwidth}>
              {lowBandwidth ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={cycleTheme}
              className="icon-button"
              aria-label={`${t.theme}: ${theme}`}
              title={`${t.theme}: ${theme}`}
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Laptop className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              aria-label={
                language === "ar"
                  ? "Switch language to English"
                  : "تغيير اللغة إلى العربية"
              }
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm font-black text-[var(--text)] transition hover:bg-[var(--soft)]"
            >
              <Globe2 className="h-4 w-4" />
              {language === "ar" ? "EN" : "ع"}
            </button>
            {OPEN_JUDGE_MODE && (
              <Link
                to="/agent"
                className="hidden h-11 items-center gap-2 rounded-xl border border-teal-400/40 bg-teal-400/10 px-3 text-xs font-black text-[var(--nile)] sm:flex"
                title={language === "ar" ? "استكشاف كامل بجلسة خاصة على هذا الجهاز" : "Full exploration with a private device session"}
              >
                <BadgeCheck className="h-4 w-4" />
                {language === "ar" ? "دخول مفتوح" : "Open access"}
              </Link>
            )}
            {appReady ? (
              <Link
                to="/quiz-lab"
                className="hidden h-11 items-center gap-2 rounded-xl border border-[#14213D] bg-[#14213D] px-4 text-sm font-black text-white shadow-[3px_3px_0_#F2B84B] transition hover:bg-[#0F766E] sm:flex"
              >
                <ClipboardCheck className="h-4 w-4" />
                {t.assessment}
              </Link>
            ) : user && !OPEN_JUDGE_MODE ? (
              <Link
                to="/onboarding"
                className="hidden h-11 items-center gap-2 rounded-xl border border-[#14213D] bg-[#F2B84B] px-4 text-sm font-black text-[#14213D] sm:flex"
              >
                {t.setup}
              </Link>
            ) : !OPEN_JUDGE_MODE ? (
              <>
                <Link
                  to="/login"
                  className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-[var(--text)] transition hover:bg-[var(--soft)] md:flex"
                >
                  <LogIn className="h-4 w-4" />
                  {t.login}
                </Link>
                <Link
                  to="/register"
                  className="nav-primary-cta hidden h-11 items-center rounded-xl px-4 text-sm font-black sm:flex"
                >
                  {t.start}
                </Link>
              </>
            ) : null}
            {user && !OPEN_JUDGE_MODE && (
              <div className="group relative hidden md:block">
                <button
                  type="button"
                  className="nav-profile-trigger flex h-10 items-center gap-2 px-3 text-xs font-black text-[var(--text)]"
                  aria-label={t.profile}
                >
                  <CircleUserRound className="h-4 w-4" />
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="nav-profile-menu invisible absolute end-0 top-11 w-52 translate-y-1 p-1.5 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <Link
                    to="/profile"
                    className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-xs font-black text-[var(--text)] hover:bg-[var(--soft)]"
                  >
                    <CircleUserRound className="h-4 w-4" />
                    {t.profile}
                  </Link>
                  {appReady && (
                    <Link
                      to="/certificates"
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black text-[var(--text)] hover:bg-[var(--soft)]"
                    >
                      <BadgeCheck className="h-4 w-4" />
                      {t.certificates}
                    </Link>
                  )}
                  {appReady && (
                    <Link
                      to="/knowledge-vault"
                      className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-xs font-black text-[var(--text)] hover:bg-[var(--soft)]"
                    >
                      <Archive className="h-4 w-4" />
                      {t.vault}
                    </Link>
                  )}
                  <Link
                    to="/support"
                    className="flex min-h-11 items-center gap-2 px-3 py-2.5 text-xs font-black text-[var(--text)] hover:bg-[var(--soft)]"
                  >
                    <Headphones className="h-4 w-4" />
                    {language === "ar" ? "الدعم" : "Support"}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-start text-xs font-black text-[var(--danger)] hover:bg-[var(--danger-surface)]"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.signOut}
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              className="icon-button lg:hidden"
              aria-expanded={open}
              aria-label={t.menu}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
        {open && (
          <div className="border-t border-[var(--border)] bg-[var(--paper)] px-4 py-4 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-sm font-black text-[var(--text)]"
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-4 w-4 text-[var(--nile)]" />
                  {item.label}
                </NavLink>
              ))}
              {appReady && (
                <NavLink
                  to="/certificates"
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-black text-[var(--text)]"
                  onClick={() => setOpen(false)}
                >
                  <BadgeCheck className="h-4 w-4 text-[var(--nile)]" />
                  {t.certificates}
                </NavLink>
              )}
              {appReady && (
                <NavLink
                  to="/knowledge-vault"
                  className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-3 text-sm font-black text-[var(--text)]"
                  onClick={() => setOpen(false)}
                >
                  <Archive className="h-4 w-4 text-[var(--nile)]" />
                  {t.vault}
                </NavLink>
              )}
              {!user && !OPEN_JUDGE_MODE && (
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center bg-[#14213D] px-4 py-3 text-sm font-black text-white sm:col-span-2"
                >
                  {t.start}
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
