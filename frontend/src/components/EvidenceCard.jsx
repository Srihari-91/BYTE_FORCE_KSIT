import { motion } from 'framer-motion';
import IntelligenceBadge from './IntelligenceBadge';

export default function EvidenceCard({ claim, sourceTitle, confidence, contradiction, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-white/[0.06] bg-black/30 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {confidence != null && Number.isFinite(Number(confidence)) && (
          <IntelligenceBadge tone="electric">Confidence {Math.round(Number(confidence) * 100)}%</IntelligenceBadge>
        )}
        {contradiction && <IntelligenceBadge tone="rose">Contradiction</IntelligenceBadge>}
      </div>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-100">{claim}</p>
      {sourceTitle && <p className="mt-2 text-xs text-slate-500">Source: {sourceTitle}</p>}
    </motion.div>
  );
}
