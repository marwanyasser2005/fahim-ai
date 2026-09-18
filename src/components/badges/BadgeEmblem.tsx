import type { BadgeColorKey, BadgeIconKey } from '@/lib/badges';

const colors: Record<BadgeColorKey, { main: string; dark: string; pale: string }> = {
  lapis: { main: '#29466F', dark: '#14213D', pale: '#E8EDF4' },
  nile: { main: '#0F8B83', dark: '#086A65', pale: '#E3F5F2' },
  saffron: { main: '#F2B84B', dark: '#A56508', pale: '#FFF3D2' },
  vermilion: { main: '#42658E', dark: '#14213D', pale: '#EDF2F7' },
};

function BadgeGlyph({ iconKey, earned }: { iconKey: BadgeIconKey; earned: boolean }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (!earned) return <><rect x="20" y="22" width="24" height="19" rx="5" {...common} /><path d="M25 22v-4a7 7 0 0 1 14 0v4" {...common} /><circle cx="32" cy="32" r="2" fill="currentColor" /></>;
  switch (iconKey) {
    case 'compass': return <><circle cx="32" cy="32" r="14" {...common} /><path d="m38 26-4 8-8 4 4-8 8-4Z" {...common} /></>;
    case 'attempt': return <><path d="M18 39c7-1 9-11 14-16 4-4 9-5 14-2-1 7-6 12-13 13" {...common} /><path d="m23 43 9-9M19 27l-3-3m17-7v-4m13 16 4 1" {...common} /></>;
    case 'lens': return <><circle cx="29" cy="29" r="11" {...common} /><path d="m37 37 9 9M25 29h8m-4-4v8" {...common} /></>;
    case 'bridge': return <><path d="M16 41h32M20 41V30m24 11V30M20 34c6-12 18-12 24 0" {...common} /><path d="M28 36v5m8-5v5" {...common} /></>;
    case 'return': return <><path d="M21 24h18a10 10 0 0 1 0 20h-6" {...common} /><path d="m26 17-7 7 7 7" {...common} /><path d="m31 38 5 5-5 5" {...common} /></>;
    case 'proof': return <><path d="M22 15h16l7 7v26H22z" {...common} /><path d="M38 15v8h7M27 32l4 4 8-9M27 42h12" {...common} /></>;
    case 'memory': return <><path d="M24 20a8 8 0 0 0-5 14 8 8 0 0 0 8 12h5V19a7 7 0 0 0-8 1Z" {...common} /><path d="M40 20a8 8 0 0 1 5 14 8 8 0 0 1-8 12h-5M23 31h5m8 0h5m-14 8h5m0-14h5" {...common} /></>;
    case 'transfer': return <><circle cx="19" cy="32" r="5" {...common} /><circle cx="45" cy="20" r="5" {...common} /><circle cx="45" cy="44" r="5" {...common} /><path d="M24 30 40 22M24 34l16 8" {...common} /></>;
    case 'finish': return <><path d="M19 47V17m1 2h24l-5 7 5 7H20" {...common} /><path d="m25 41 5 5 10-12" {...common} /></>;
  }
}

export default function BadgeEmblem({ iconKey, colorKey, earned, label, size = 'large' }: { iconKey: BadgeIconKey; colorKey: BadgeColorKey; earned: boolean; label: string; size?: 'small' | 'large' }) {
  const palette = colors[colorKey];
  return <svg className={`fahim-badge-emblem is-${size}`} viewBox="0 0 96 112" role="img" aria-label={label}>
    <path d="m27 76-9 30 19-8 11 12V76Z" fill={earned ? '#14213D' : '#94A3B8'} />
    <path d="m69 76 9 30-19-8-11 12V76Z" fill={earned ? '#0F8B83' : '#CBD5E1'} />
    <path d="M48 5 61 9l12 1 6 11 9 9-3 12 3 12-9 9-4 12-12 3-10 8-12-4-12 4-10-8-12-3-4-12-9-9 3-12-3-12 9-9 6-11 12-1Z" fill={earned ? '#14213D' : '#CBD5E1'} stroke={earned ? palette.main : '#64748B'} strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="48" cy="47" r="31" fill={earned ? '#F6F4EE' : '#F1F5F9'} stroke={earned ? '#F2B84B' : '#94A3B8'} strokeWidth="2.5" />
    <circle cx="48" cy="47" r="25.5" fill={earned ? palette.pale : '#F8FAFC'} stroke={earned ? palette.main : '#94A3B8'} strokeWidth="1.2" strokeDasharray="2 4" />
    {earned && <><path d="M24 58c11 2 21-1 29-7 8-6 13-14 14-23 5 2 8 4 11 7-2 11-8 20-18 27-10 7-22 10-33 7Z" fill="#0F8B83" opacity=".95" /><circle cx="53" cy="18" r="4" fill="#F2B84B" /></>}
    <g transform="translate(16 15)" color={earned ? palette.dark : '#64748B'}><BadgeGlyph iconKey={iconKey} earned={earned} /></g>
    {earned && <text x="48" y="86" textAnchor="middle" fill="#F6F4EE" fontFamily="Cairo,Arial,sans-serif" fontSize="6" fontWeight="800" letterSpacing="1">FAHIM</text>}
  </svg>;
}
