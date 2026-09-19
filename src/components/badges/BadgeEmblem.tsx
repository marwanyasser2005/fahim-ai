import { badgeArtworkPath } from '@/lib/badgeArtwork';

export default function BadgeEmblem({
  stageOrder,
  earned,
  label,
  size = 'large',
}: {
  stageOrder: number;
  earned: boolean;
  label: string;
  size?: 'small' | 'large';
}) {
  const src = badgeArtworkPath(stageOrder, earned);

  return <span className={`fahim-badge-emblem is-${size} ${earned ? 'is-completed-art' : 'is-progress-art'}`}>
    <img
      src={src}
      alt={label}
      role="img"
      width={760}
      height={760}
      loading="lazy"
      decoding="async"
    />
  </span>;
}
