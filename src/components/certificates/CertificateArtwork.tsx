import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Download, ExternalLink, Printer, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import type { Language } from '@/App';
import { credentialLevelFromScore, credentialLevelLabel } from '@/lib/credentials';

export type PublicCredential = {
  id: string;
  certificate_number: string;
  credential_type: 'completion';
  issuer_name: string;
  issuer_title?: string;
  issued_at: string;
  course_title: string | { ar?: string; en?: string };
  learner_name: string;
  status: 'issued' | 'revoked';
  evidence?: {
    completionPercent?: number;
    completedLessons?: number;
    totalLessons?: number;
    finalAssessmentScore?: number;
    achievementTier?: 'completion' | 'proficiency' | 'mastery';
    reviewMode?: string;
    policy?: string;
  };
  registry_fingerprint?: string;
  fingerprint_algorithm?: string;
  /** Recomputed at verification time: does the stored signature match the record? */
  signature_valid?: boolean;
  verification_path?: string;
  non_accredited?: boolean;
};

function xml(value: unknown) {
  return String(value ?? '').replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character] || character);
}

function wrapCertificateText(value: string, maxCharacters: number, maxLines = 2) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if (!current || (current.length + word.length + 1 > maxCharacters && lines.length < maxLines)) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  if (lines.length > maxLines) lines.splice(maxLines - 1, lines.length - maxLines + 1, lines.slice(maxLines - 1).join(' '));
  return lines.slice(0, maxLines);
}

function svgLines(lines: string[], x: number, startY: number, lineHeight: number) {
  return lines.map((line, index) => `<tspan x="${x}" y="${startY + index * lineHeight}">${xml(line)}</tspan>`).join('');
}

function courseName(credential: PublicCredential, language: Language) {
  return typeof credential.course_title === 'string'
    ? credential.course_title
    : credential.course_title?.[language] || credential.course_title?.en || credential.course_title?.ar || 'Fahim learning path';
}

async function imageAssetDataUrl(path: string) {
  const response = await fetch(path, { cache: 'force-cache' });
  if (!response.ok) throw new Error('Certificate brand asset is unavailable.');
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Certificate brand asset could not be read.'));
    reader.readAsDataURL(blob);
  });
}

export default function CertificateArtwork({ credential, language, compact = false }: { credential: PublicCredential; language: Language; compact?: boolean }) {
  const rtl = language === 'ar';
  const title = courseName(credential, language);
  const verificationUrl = useMemo(() => `${window.location.origin}/verify/${encodeURIComponent(credential.certificate_number)}`, [credential.certificate_number]);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const issuedDate = new Intl.DateTimeFormat(rtl ? 'ar-EG' : 'en-US', { dateStyle: 'long' }).format(new Date(credential.issued_at));
  const level = credential.evidence?.achievementTier ?? credentialLevelFromScore(credential.evidence?.finalAssessmentScore);
  const levelLabel = credentialLevelLabel(level, language);
  const completedLessons = credential.evidence?.completedLessons;
  const totalLessons = credential.evidence?.totalLessons;

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H', margin: 1, width: 420, color: { dark: '#14213D', light: '#F6F4EE' } })
      .then((value) => { if (active) setQrDataUrl(value); });
    return () => { active = false; };
  }, [verificationUrl]);

  const download = async () => {
    setDownloading(true);
    try {
      const width = 2400;
      const height = 1697;
      const completion = credential.evidence?.completionPercent ?? 100;
      const score = credential.evidence?.finalAssessmentScore;
      const brandMarkDataUrl = await imageAssetDataUrl('/brand/fahim-symbol-v32.png');
      const learnerLines = wrapCertificateText(credential.learner_name, 30);
      const courseLines = wrapCertificateText(title, 46);
      const evidenceLine = score == null
        ? `${completion}% course completion verified in the Fahim registry`
        : `${completion}% course completion · Final assessment ${score}% · ${credentialLevelLabel(level, 'en')} level`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <pattern id="grid" width="58" height="58" patternUnits="userSpaceOnUse"><path d="M58 0H0V58" fill="none" stroke="#14213D" stroke-opacity=".045" stroke-width="2"/></pattern>
          <linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#071B38"/><stop offset="1" stop-color="#14213D"/></linearGradient>
        </defs>
        <rect width="2400" height="1697" rx="42" fill="#F6F4EE"/>
        <rect width="2400" height="1697" rx="42" fill="url(#grid)"/>
        <path d="M0 0H520L250 1697H0Z" fill="url(#ink)"/>
        <path d="M2140 0H2400V1697H1880Z" fill="#F2B84B" opacity=".82"/>
        <rect x="58" y="58" width="2284" height="1581" rx="30" fill="none" stroke="#14213D" stroke-width="4"/>
        <rect x="82" y="82" width="2236" height="1533" rx="22" fill="none" stroke="#0F8B83" stroke-width="2" stroke-dasharray="8 14"/>
        <g transform="translate(150 125)"><rect width="180" height="180" rx="36" fill="#F6F4EE"/><image href="${brandMarkDataUrl}" x="15" y="15" width="150" height="150" preserveAspectRatio="xMidYMid meet"/></g>
        <text x="420" y="205" font-family="'Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="36" font-weight="800" fill="#14213D">FAHIM AI · VERIFIED LEARNING</text>
        <text x="420" y="258" font-family="'Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="22" font-weight="700" letter-spacing="5" fill="#0F8B83">COMPLETION CREDENTIAL · ${xml(credentialLevelLabel(level, 'en').toUpperCase())}</text>
        <line x1="420" y1="302" x2="2050" y2="302" stroke="#14213D" stroke-opacity=".22" stroke-width="3"/>
        <text x="420" y="455" font-family="'Noto Kufi Arabic','Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="35" fill="#596577">This completion credential is awarded to</text>
        <text font-family="'Noto Kufi Arabic','Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="78" font-weight="900" fill="#14213D">${svgLines(learnerLines, 420, 560, 82)}</text>
        <line x1="420" y1="730" x2="1980" y2="730" stroke="#F2B84B" stroke-width="9"/>
        <text x="420" y="802" font-family="'Noto Kufi Arabic','Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="30" fill="#596577">for successfully completing the verified learning requirements of</text>
        <text font-family="'Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="56" font-weight="850" fill="#0F8B83">${svgLines(courseLines, 420, 885, 66)}</text>
        <text x="420" y="1035" font-family="'Noto Kufi Arabic','Cairo','Segoe UI',Arial,Tahoma,sans-serif" font-size="27" font-weight="700" fill="#14213D">${xml(evidenceLine)}</text>
        <g transform="translate(420 1115)">
          <text x="0" y="80" font-family="'Segoe Script','Brush Script MT',cursive" font-size="58" font-style="italic" fill="#14213D">Marwan Abdelghaffar</text>
          <line x1="0" y1="105" x2="550" y2="105" stroke="#14213D" stroke-width="3"/>
          <text x="0" y="150" font-family="Arial,Tahoma,sans-serif" font-size="25" font-weight="800" fill="#596577">Founder of Fahim AI</text>
        </g>
        <g transform="translate(420 1390)">
          <text font-family="Arial,Tahoma,sans-serif" font-size="22" font-weight="800" fill="#596577">ISSUED</text><text x="112" font-family="Arial,Tahoma,sans-serif" font-size="22" font-weight="800" fill="#14213D">${xml(issuedDate)}</text>
          <text y="48" font-family="Arial,Tahoma,sans-serif" font-size="22" font-weight="800" fill="#596577">ID</text><text x="112" y="48" font-family="monospace" font-size="22" font-weight="800" fill="#14213D">${xml(credential.certificate_number)}</text>
        </g>
        <g transform="translate(1740 1130)">
          <rect width="360" height="410" rx="28" fill="#F6F4EE" stroke="#14213D" stroke-width="3"/>
          ${qrDataUrl ? `<image href="${qrDataUrl}" x="50" y="32" width="260" height="260"/>` : ''}
          <text x="180" y="330" text-anchor="middle" font-family="Arial,Tahoma,sans-serif" font-size="20" font-weight="900" fill="#0F8B83">VERIFY THIS CREDENTIAL</text>
          <text x="180" y="365" text-anchor="middle" font-family="monospace" font-size="15" fill="#596577">fahim-ai-egypt.vercel.app/verify/</text>
          <text x="180" y="390" text-anchor="middle" font-family="monospace" font-size="14" fill="#14213D">${xml(credential.certificate_number)}</text>
        </g>
        <text x="1200" y="1620" text-anchor="middle" font-family="Arial,Tahoma,sans-serif" font-size="18" fill="#596577">Evidence-backed completion credential · Not academic or government accreditation · Public registry record</text>
      </svg>`;
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Certificate render failed.')); image.src = svgUrl; });
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Certificate canvas is unavailable.');
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Certificate export failed.')), 'image/png', 1));
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `Fahim-${credential.certificate_number}.png`;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } finally {
      setDownloading(false);
    }
  };

  return <div className={compact ? '' : 'certificate-print-shell'}>
    <article className="fahim-certificate" aria-label={rtl ? `شهادة إتمام ${title}` : `${title} completion certificate`}>
      <div className="fahim-certificate-rail" aria-hidden="true" />
      <div className="fahim-certificate-content">
        <header className="fahim-certificate-header"><div className="flex items-center gap-3"><span className="fahim-certificate-seal"><img src="/brand/fahim-symbol-v32.png" width="64" height="64" alt="" /></span><div><p>FAHIM AI</p><span>{rtl ? 'الفهم الذي يمكنك إثباته' : 'VERIFIED LEARNING'}</span></div></div><div className="fahim-certificate-badges"><span className="fahim-certificate-kind">{rtl ? 'شهادة إتمام قابلة للتحقق' : 'VERIFIABLE COMPLETION CREDENTIAL'}</span><span className="fahim-certificate-level" data-level={level}><BadgeCheck />{levelLabel}</span></div></header>
        <div className="fahim-certificate-award"><p>{rtl ? 'تُمنح شهادة الإتمام إلى' : 'This completion credential is awarded to'}</p><h2>{credential.learner_name}</h2><span>{rtl ? 'بعد استكمال متطلبات مسار' : 'after completing the verified requirements of'}</span><h3>{title}</h3></div>
        <div className="fahim-certificate-proof" aria-label={rtl ? 'سلسلة إثبات الشهادة' : 'Credential evidence chain'}>
          <div><span>{rtl ? 'المسار' : 'Path'}</span><strong>{rtl ? 'مكتمل' : 'Complete'}</strong><small><bdi>{credential.evidence?.completionPercent ?? 100}%</bdi></small></div>
          <div><span>{rtl ? 'الدروس' : 'Lessons'}</span><strong>{completedLessons != null && totalLessons != null ? <bdi>{completedLessons}/{totalLessons}</bdi> : (rtl ? 'متحقق' : 'Verified')}</strong><small>{rtl ? 'من سجل التقدم' : 'From progress ledger'}</small></div>
          <div><span>{rtl ? 'التقييم' : 'Assessment'}</span><strong>{credential.evidence?.finalAssessmentScore != null ? <bdi>{credential.evidence.finalAssessmentScore}%</bdi> : (rtl ? 'مجتاز' : 'Passed')}</strong><small>{rtl ? 'أفضل محاولة نهائية' : 'Best submitted result'}</small></div>
        </div>
        <div className="fahim-certificate-evidence"><ShieldCheck className="h-5 w-5" /><p>{rtl ? `أصدر تلقائيًا من دليل الإنجاز · مستوى ${levelLabel}` : `Automatically issued from completion evidence · ${levelLabel} level`}</p></div>
        <footer className="fahim-certificate-footer">
          <div className="fahim-founder-signature"><strong>Marwan Abdelghaffar</strong><span>Founder of Fahim AI</span></div>
          <dl className="fahim-certificate-meta"><div><dt>{rtl ? 'تاريخ الإصدار' : 'Issued'}</dt><dd>{issuedDate}</dd></div><div><dt>{rtl ? 'رقم التحقق' : 'Verification ID'}</dt><dd><bdi>{credential.certificate_number}</bdi></dd></div></dl>
          <div className="fahim-certificate-qr">{qrDataUrl ? <img src={qrDataUrl} width="104" height="104" alt={rtl ? 'رمز QR للتحقق من الشهادة' : 'QR code to verify this credential'} /> : <QrCode className="h-12 w-12" />}<span>{rtl ? 'امسح للتحقق' : 'Scan to verify'}</span></div>
        </footer>
        <a className="fahim-certificate-url" href={verificationUrl}>{verificationUrl.replace(/^https?:\/\//, '')}</a>
        <p className="fahim-certificate-disclaimer">{rtl ? 'شهادة إتمام قائمة على سجل فَهيم العام؛ تثبت متطلبات المسار الموضحة أعلاه ولا تمثل اعتمادًا أكاديميًا أو حكوميًا.' : 'A Fahim public-registry completion credential proving the requirements shown above; not academic or government accreditation.'}</p>
      </div>
    </article>
    {!compact && <div className="certificate-actions no-print"><button type="button" className="atlas-primary" onClick={() => void download()} disabled={downloading || !qrDataUrl}>{downloading ? <span className="spinner" /> : <Download className="h-4 w-4" />}{rtl ? 'تحميل PNG عالي الدقة' : 'Download high-resolution PNG'}</button><button type="button" className="atlas-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />{rtl ? 'طباعة أو حفظ PDF' : 'Print or save PDF'}</button><a href={verificationUrl} className="atlas-secondary"><ExternalLink className="h-4 w-4" />{rtl ? 'فتح سجل التحقق' : 'Open verification record'}</a></div>}
  </div>;
}
