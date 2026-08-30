import type { BadgeColorKey, BadgeIconKey } from '@/lib/badges';

const colors: Record<BadgeColorKey, { main: string; dark: string; pale: string }> = {
  lapis: { main: '#173F5F', dark: '#14213D', pale: '#E7EEF4' },
  nile: { main: '#0F766E', dark: '#0B514C', pale: '#E4F2F0' },
  saffron: { main: '#F2B84B', dark: '#8C5708', pale: '#FFF3D2' },
  vermilion: { main: '#D95D39', dark: '#87321D', pale: '#FCE9E3' },
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
    <path d="m24 75-8 30 17-8 11 13 5-32Z" fill={earned ? palette.dark : '#64748B'} />
    <path d="m72 75 8 30-17-8-11 13-5-32Z" fill={earned ? palette.main : '#94A3B8'} />
    <path d="M48 4 61 9l13 1 5 12 10 8-3 13 4 12-9 9-3 13-13 3-10 9-12-5-12 5-10-9-13-3-3-13-9-9 4-12-3-13 10-8 5-12 13-1Z" fill={earned ? palette.main : '#CBD5E1'} stroke={earned ? palette.dark : '#64748B'} strokeWidth="2.5" strokeLinejoin="round" />
    <circle cx="48" cy="47" r="31" fill={earned ? palette.pale : '#F1F5F9'} stroke={earned ? '#FFFDF8' : '#94A3B8'} strokeWidth="3" />
    <circle cx="48" cy="47" r="26.5" fill="#FFFDF8" stroke={earned ? palette.dark : '#64748B'} strokeWidth="1.5" strokeDasharray={earned ? '2 4' : '4 4'} />
    <g transform="translate(16 15)" color={earned ? palette.dark : '#64748B'}><BadgeGlyph iconKey={iconKey} earned={earned} /></g>
    {earned && <g aria-hidden="true"><circle cx="39" cy="75" r="2.4" fill="#D95D39" /><circle cx="48" cy="77" r="2.4" fill="#F2B84B" /><circle cx="57" cy="75" r="2.4" fill="#0F766E" /></g>}
  </svg>;
}
