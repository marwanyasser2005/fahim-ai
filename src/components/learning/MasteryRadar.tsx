import type { MasteryDimensions } from '@/lib/learningEvidence';

type Props = { dimensions: MasteryDimensions; language: 'ar' | 'en' };

export default function MasteryRadar({ dimensions, language }: Props) {
  const items = [
    { key: 'concept', ar: 'الفهم', en: 'Concept', value: dimensions.concept },
    { key: 'explanation', ar: 'الشرح', en: 'Explain', value: dimensions.explanation },
    { key: 'application', ar: 'التطبيق', en: 'Apply', value: dimensions.application },
    { key: 'recall', ar: 'الاسترجاع', en: 'Recall', value: dimensions.recall },
    { key: 'sourceUse', ar: 'المصدر', en: 'Source', value: dimensions.sourceUse },
  ];
  const size = 220;
  const center = size / 2;
  const radius = 78;
  const point = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / items.length;
    const distance = radius * (value / 100);
    return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
  };
  const outer = items.map((_, index) => point(index, 100)).join(' ');
  const result = items.map((item, index) => point(index, item.value)).join(' ');
  return (
    <div className="mastery-radar">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={language === 'ar' ? 'أبعاد دليل الإتقان' : 'Mastery evidence dimensions'}>
        <polygon points={outer} className="mastery-radar-grid" />
        <polygon points={items.map((_, index) => point(index, 66)).join(' ')} className="mastery-radar-grid" />
        {items.map((_, index) => <line key={index} x1={center} y1={center} x2={point(index, 100).split(',')[0]} y2={point(index, 100).split(',')[1]} className="mastery-radar-grid" />)}
        <polygon points={result} className="mastery-radar-result" />
        {items.map((item, index) => {
          const [x, y] = point(index, item.value).split(',');
          return <circle key={item.key} cx={x} cy={y} r="4" className="mastery-radar-point" />;
        })}
      </svg>
      <div className="mastery-radar-legend">
        {items.map((item) => <span key={item.key}><i style={{ '--mastery': `${item.value}%` } as React.CSSProperties} />{item[language]} <bdi>{item.value}%</bdi></span>)}
      </div>
    </div>
  );
}
