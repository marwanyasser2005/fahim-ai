import { ArrowLeft, ArrowRight, Award, Check, Download, LockKeyhole, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Language } from '@/App';
import { badgeDownloadPath } from '@/lib/badgeArtwork';
import type { BadgeProgress } from '@/lib/badges';
import BadgeEmblem from './BadgeEmblem';

export default function BadgeTrail({ progress, language, compact = false, loading = false }: { progress: BadgeProgress; language: Language; compact?: boolean; loading?: boolean }) {
  const rtl = language === 'ar';
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const percent = progress.totalCount ? Math.round(progress.earnedCount / progress.totalCount * 100) : 0;
  const shown = compact ? progress.badges.slice(0, 5) : progress.badges;
  const next = progress.badges.find((badge) => !badge.earnedAt);
  return <section className={`badge-trail ${compact ? 'is-compact' : ''}`} aria-labelledby={compact ? 'dashboard-badges-title' : 'profile-badges-title'}>
    <header className="badge-trail-heading">
      <div><p className="atlas-section-number"><BrainCircuit aria-hidden="true" />{rtl ? 'سلسلة الدوافع' : 'MOTIVATION TRAIL'}</p><h2 id={compact ? 'dashboard-badges-title' : 'profile-badges-title'}>{rtl ? 'كل خطوة فهم لها علامة.' : 'Every learning step leaves a mark.'}</h2><p>{rtl ? 'شارات تُمنح من دليل التعلّم المسجل، وتوصلك تدريجيًا إلى شهادة الإتمام.' : 'Evidence-backed badges turn each learning action into visible progress toward a completion credential.'}</p></div>
      <div className="badge-trail-summary" aria-live="polite"><strong>{loading ? '—' : `${progress.earnedCount}/${progress.totalCount}`}</strong><span>{rtl ? 'شارة مكتملة' : 'badges completed'}</span><div role="progressbar" aria-label={rtl ? 'تقدم الشارات' : 'Badge progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div></div>
    </header>
    <ol className="badge-trail-grid">
      {shown.map((badge) => { const earned = Boolean(badge.earnedAt); const title = rtl ? badge.titleAr : badge.titleEn; return <li key={badge.key} className={earned ? 'is-earned' : 'is-locked'}>
        <span className="badge-stage"><bdi>{String(badge.stageOrder).padStart(2, '0')}</bdi></span>
        <BadgeEmblem stageOrder={badge.stageOrder} earned={earned} label={`${title}، ${earned ? (rtl ? 'مكتملة' : 'completed') : (rtl ? 'لم تكتمل بعد' : 'not completed yet')}`} size={compact ? 'small' : 'large'} />
        <div className="badge-card-copy"><h3>{title}</h3><p>{earned ? (rtl ? badge.descriptionAr : badge.descriptionEn) : (rtl ? badge.requirementAr : badge.requirementEn)}</p></div>
        <span className="badge-state">{earned ? <><Check aria-hidden="true" />{rtl ? 'مكتملة' : 'Completed'}</> : <><LockKeyhole aria-hidden="true" />{rtl ? 'المطلوب التالي' : 'Next requirement'}</>}</span>
        {earned && <small className="badge-earned-date">+{badge.xpReward} XP · {new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-US', { dateStyle: 'medium' }).format(new Date(badge.earnedAt!))}</small>}
        {earned && !compact && <a className="badge-download" href={badgeDownloadPath(badge.stageOrder)} download={`Fahim-${badge.key}.png`} aria-label={rtl ? `تحميل شارة ${title} بدون خلفية` : `Download ${title} badge without a background`}><Download aria-hidden="true" />{rtl ? 'تحميل الشارة PNG' : 'Download badge PNG'}</a>}
      </li>; })}
      {compact && <li className="badge-certificate-gate"><span><Award aria-hidden="true" /></span><div><strong>{rtl ? 'ثم شهادة موثقة' : 'Then a verifiable credential'}</strong><small>{rtl ? `${progress.certificateCount} شهادة صدرت من سجل الإنجاز` : `${progress.certificateCount} credentials issued from the achievement record`}</small></div><Link to="/certificates" aria-label={rtl ? 'افتح الشهادات' : 'Open credentials'}><Arrow aria-hidden="true" /></Link></li>}
    </ol>
    {!compact && next && <footer className="badge-next-step"><div><span>{rtl ? 'الشارة التالية' : 'NEXT BADGE'}</span><strong>{rtl ? next.titleAr : next.titleEn}</strong><p>{rtl ? next.requirementAr : next.requirementEn}</p></div><Link to="/dashboard">{rtl ? 'واصل رحلة الفهم' : 'Continue the learning loop'}<Arrow aria-hidden="true" /></Link></footer>}
  </section>;
}
