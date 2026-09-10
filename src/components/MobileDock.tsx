import { Link, useLocation } from 'react-router-dom';
import { ClipboardCheck, Sparkles, Home, Search, UserRound } from 'lucide-react';
import type { Language } from '@/App';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileDock({ language, immersive }: { language: Language; immersive: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || immersive) return null;
  const items = [
    { to: '/dashboard', ar: 'اليوم', en: 'Today', icon: Home },
    { to: '/ask-fahim', ar: 'اسأل فَهيم', en: 'Ask Fahim', icon: Sparkles },
    { to: '/quiz-lab', ar: 'قيّم فهمك', en: 'Assess', icon: ClipboardCheck, primary: true },
    { to: '/resources', ar: 'ابحث', en: 'Search', icon: Search },
    { to: '/profile', ar: 'حسابي', en: 'Account', icon: UserRound },
  ];
  return <nav className="mobile-dock" aria-label={language === 'ar' ? 'التنقل الرئيسي للموبايل' : 'Primary mobile navigation'}>{items.map((item) => {
    const active = location.pathname === item.to;
    return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} className={`${item.primary ? 'mobile-dock-primary' : ''} ${active ? 'mobile-dock-active' : ''}`}><item.icon className="h-5 w-5" /><span>{item[language]}</span></Link>;
  })}</nav>;
}
