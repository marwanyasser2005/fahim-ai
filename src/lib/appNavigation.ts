import {
  Bot,
  CalendarCheck,
  GraduationCap,
  Layers3,
  LibraryBig,
  Network,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  Compass,
  type LucideIcon,
} from 'lucide-react';

export type NavRole = 'all' | 'staff';

export interface NavEntry {
  to: string;
  ar: string;
  en: string;
  hintAr: string;
  hintEn: string;
  icon: LucideIcon;
  role: NavRole;
}

/**
 * Single source of truth for product navigation.
 * Navbar, ProductSidebar, MobileDock, and CommandPalette all render from this
 * manifest so a route keeps one name, one icon, and one meaning everywhere.
 */
export const productNav: NavEntry[] = [
  {
    to: '/dashboard',
    ar: 'اليوم',
    en: 'Today',
    hintAr: 'مهمتك التالية ومراجعات المستحقة',
    hintEn: 'Your next task and due reviews',
    icon: CalendarCheck,
    role: 'all',
  },
  {
    to: '/workspace',
    ar: 'تعلّمي',
    en: 'Learn',
    hintAr: 'درسك الحالي وحلقة الفهم كاملة',
    hintEn: 'Your current lesson and full understanding loop',
    icon: Compass,
    role: 'all',
  },
  {
    to: '/ask-fahim',
    ar: 'اسأل فَهيم',
    en: 'Ask Fahim',
    hintAr: 'اشرح درسًا أو حل سؤالًا معك خطوة بخطوة',
    hintEn: 'Explain a lesson or solve a question step by step',
    icon: Sparkles,
    role: 'all',
  },
  {
    to: '/agent',
    ar: 'الوكيل المعلّم',
    en: 'Tutor Agent',
    hintAr: 'وكيل مستقل يشخّص ويشرح ويجدول مراجعتك خطوة بخطوة',
    hintEn: 'An autonomous agent that diagnoses, teaches, and schedules your review',
    icon: Bot,
    role: 'all',
  },
  {
    to: '/review',
    ar: 'المراجعة',
    en: 'Review',
    hintAr: 'البطاقات المستحقة قبل موعد النسيان',
    hintEn: 'Due cards before the forgetting deadline',
    icon: Layers3,
    role: 'all',
  },
  {
    to: '/passport',
    ar: 'خريطة التقدّم',
    en: 'Progress',
    hintAr: 'دليل تعلّمك وإتقان كل مفهوم',
    hintEn: 'Your learning evidence and per-concept mastery',
    icon: Network,
    role: 'all',
  },
  {
    to: '/library',
    ar: 'البحث',
    en: 'Search',
    hintAr: 'ابحث في المصادر الموثقة',
    hintEn: 'Search verified sources',
    icon: Search,
    role: 'all',
  },
  {
    to: '/knowledge-vault',
    ar: 'ملفاتي',
    en: 'My files',
    hintAr: 'ملفاتك المحمية القابلة للسؤال',
    hintEn: 'Your protected files you can query',
    icon: LibraryBig,
    role: 'all',
  },
  {
    to: '/courses',
    ar: 'المسارات',
    en: 'Paths',
    hintAr: 'مناهج مرتبة من الأساس إلى الإتقان',
    hintEn: 'Curricula ordered from basics to mastery',
    icon: GraduationCap,
    role: 'all',
  },
  {
    to: '/teacher',
    ar: 'غرفة المعلم',
    en: 'Teacher room',
    hintAr: 'فصولك وبروتوكولات قياس الأثر',
    hintEn: 'Your classes and impact protocols',
    icon: Presentation,
    role: 'staff',
  },
];

export const publicNav: NavEntry[] = [
  {
    to: '/showcase',
    ar: 'العرض التفاعلي',
    en: 'Showcase',
    hintAr: 'شاهد حلقة تعلم كاملة في 90 ثانية',
    hintEn: 'Watch a full learning loop in 90 seconds',
    icon: Presentation,
    role: 'all',
  },
  {
    to: '/evidence',
    ar: 'غرفة الأدلة',
    en: 'Evidence',
    hintAr: 'ما يعمل وما لم يُقس بعد',
    hintEn: 'What works and what is not measured yet',
    icon: ShieldCheck,
    role: 'all',
  },
  {
    to: '/how-it-works',
    ar: 'كيف يعمل',
    en: 'How it works',
    hintAr: 'من المصدر إلى الدليل',
    hintEn: 'From source to evidence',
    icon: Compass,
    role: 'all',
  },
  {
    to: '/courses',
    ar: 'المسارات',
    en: 'Paths',
    hintAr: 'مناهج مرتبة من الأساس إلى الإتقان',
    hintEn: 'Curricula ordered from basics to mastery',
    icon: GraduationCap,
    role: 'all',
  },
];

export const label = (entry: NavEntry, language: 'ar' | 'en') => (language === 'ar' ? entry.ar : entry.en);
export const hint = (entry: NavEntry, language: 'ar' | 'en') => (language === 'ar' ? entry.hintAr : entry.hintEn);
