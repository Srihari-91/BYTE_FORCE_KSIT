import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, ChevronDown } from 'lucide-react';
import IntelligenceBadge from './IntelligenceBadge';
import GlowButton from './GlowButton';
import { cn } from '../utils/cn';

export default function ResearchPaperCard({ paper, index = 0 }) {
  const [open, setOpen] = useState(false);
  const title = paper.title || 'Untitled';
  const abstract = paper.abstract || '';
  const year = paper.year ?? '—';
  const cites = paper.citations ?? paper.citationCount ?? '—';
  const venue = paper.source || paper.source_type || paper.venue || null;
  const rel = paper.relevance_score;
  const relPct =
    rel != null && Number.isFinite(Number(rel))
      ? Math.round(Number(rel) <= 1 ? Number(rel) * 100 : Number(rel))
      : null;
  const verdict = paper.verdict;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-5 transition-colors',
        'hover:border-sky-500/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]',
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-0" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h4 className="max-w-[85%] text-base font-semibold leading-snug tracking-tight text-white">{title}</h4>
        {paper.url && (
          <GlowButton
            variant="ghost"
            className="h-9 shrink-0 px-3 py-1.5 text-xs"
            onClick={() => window.open(paper.url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Source
          </GlowButton>
        )}
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-400">{abstract || 'No abstract in corpus.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <IntelligenceBadge tone="electric">{year === '—' ? 'Year —' : `Year ${year}`}</IntelligenceBadge>
        <IntelligenceBadge tone="violet">Citations {cites}</IntelligenceBadge>
        {venue && <IntelligenceBadge>{String(venue)}</IntelligenceBadge>}
        {relPct != null && <IntelligenceBadge tone="emerald">Relevance {relPct}%</IntelligenceBadge>}
        {verdict && <IntelligenceBadge tone="amber">{verdict}</IntelligenceBadge>}
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-400 transition hover:border-sky-500/30 hover:text-sky-200"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        {open ? 'Collapse' : 'Expand details'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-sm text-slate-300">
              {paper.selection_reason && (
                <p>
                  <span className="font-semibold text-slate-200">Selection rationale: </span>
                  {paper.selection_reason}
                </p>
              )}
              {paper.paper_id && (
                <p className="font-mono text-xs text-slate-500">ID: {paper.paper_id}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
