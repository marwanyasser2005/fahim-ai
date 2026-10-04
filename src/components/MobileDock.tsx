import { Link, useLocation } from 'react-router-dom';
import { BadgeCheck, ClipboardCheck } from 'lucide-react';
import type { Language } from '@/App';
import { useAuth } from '@/contexts/AuthContext';
import { label, productNav } from '@/lib/appNavigation';

export default function MobileDock({ language, immersive }: { language: Language; immersive: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || immersive) return null;
  const today = productNav.find((entry) => entry.to === '/dashboard')!;
  const askFahim = productNav.find((entry) => entry.to === '/ask-fahim')!;
  const review = productNav.find((entry) => entry.to === '/review')!;
  const items = [
    { to: today.to, text: label(today, language), icon: today.icon },
    { to: askFahim.to, text: label(askFahim, language), icon: askFahim.icon },
    { to: '/quiz-lab', text: language === 'ar' ? 'قيّم فهمك' : 'Assess', icon: ClipboardCheck, primary: true },
    { to: review.to, text: label(review, language), icon: review.icon },
    { to: '/certificates', text: language === 'ar' ? 'شهاداتي' : 'Credentials', icon: BadgeCheck },
  ];
  return <nav className="mobile-dock" aria-label={language === 'ar' ? 'التنقل الرئيسي للموبايل' : 'Primary mobile navigation'}>{items.map((item) => {
    const active = location.pathname === item.to;
    return <Link key={item.to} to={item.to} aria-current={active ? 'page' : undefined} className={`${item.primary ? 'mobile-dock-primary' : ''} ${active ? 'mobile-dock-active' : ''}`}><item.icon className="h-5 w-5" aria-hidden="true" focusable="false" /><span>{item.text}</span></Link>;
  })}</nav>;
}
