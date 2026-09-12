import { Check, Circle, BrainCircuit } from 'lucide-react';
import { buildEvidenceGraph, type LearningSession } from '@/lib/learningEvidence';

type Props = {
  session: LearningSession;
  language: 'ar' | 'en';
  visibleSteps?: number;
  compact?: boolean;
};

const labels = {
  ar: ['تشخيص', 'محاولة', 'نمط الخطأ', 'تدخل', 'إعادة', 'دليل', 'جدولة', 'استرجاع', 'تطبيق'],
  en: ['Diagnostic', 'Attempt', 'Misconception', 'Intervention', 'Retry', 'Evidence', 'Schedule', 'Recall', 'Transfer'],
};

export default function EvidenceGraph({ session, language, visibleSteps, compact = false }: Props) {
  const graph = buildEvidenceGraph(session).map((node, index) => ({
    ...node,
    label: labels[language][index],
    state: visibleSteps === undefined ? node.state : index < visibleSteps ? 'complete' as const : index === visibleSteps ? 'current' as const : 'pending' as const,
  }));
  return (
    <ol className={`evidence-graph ${compact ? 'evidence-graph-compact' : ''}`} aria-label={language === 'ar' ? 'تسلسل دليل التعلم' : 'Learning evidence sequence'}>
      {graph.map((node, index) => (
        <li key={node.id} className="evidence-node" data-state={node.state} aria-current={node.state === 'current' ? 'step' : undefined}>
          <span className="evidence-node-marker" aria-hidden="true">
            {node.state === 'complete' ? <Check /> : node.state === 'current' ? <BrainCircuit /> : <Circle />}
          </span>
          <span className="evidence-node-index"><bdi>{String(index + 1).padStart(2, '0')}</bdi></span>
          <span className="evidence-node-label">{node.label}</span>
        </li>
      ))}
    </ol>
  );
}
