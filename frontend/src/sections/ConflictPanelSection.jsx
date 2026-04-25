import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import IntelligenceBadge from '../components/IntelligenceBadge';
import { renderBoldText } from '../utils/renderBoldText';

function ListBlock({ title, items, tone }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-500">
        No {title.toLowerCase()} in analyzer output.
      </div>
    );
  }
  const shell =
    tone === 'warn'
      ? 'rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-5'
      : 'rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5';
  return (
    <div className={shell}>
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">{title}</h3>
      <ul className="mt-4 space-y-3">
        {list.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="border-l-2 border-white/10 pl-4 text-sm leading-relaxed text-slate-200"
          >
            {renderBoldText(typeof item === 'string' ? item : JSON.stringify(item))}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default function ConflictPanelSection({ insight, critique }) {
  const obj = insight && typeof insight === 'object' ? insight : null;
  const contradictions = obj?.contradictions || [];
  const agreements = obj?.agreements || [];

  const critiqueStr = typeof critique === 'string' ? critique : critique != null ? JSON.stringify(critique, null, 2) : '';

  if (!contradictions.length && !agreements.length && !critiqueStr) {
    return (
      <GlassCard>
        <h2 className="text-xl font-bold text-white">Conflict intelligence</h2>
        <p className="mt-2 text-sm text-slate-500">No contradiction objects or critique payload for this run.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-200">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Conflict & tension</h2>
          <p className="mt-1 text-sm text-slate-500">Side-by-side view of alignment vs friction in the analyzer.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ListBlock title="Conflicting signals" items={contradictions} tone="warn" />
        <ListBlock title="Stable agreements" items={agreements} tone="ok" />
      </div>

      {critiqueStr && (
        <div className="mt-8 rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <IntelligenceBadge tone="rose">Critic output</IntelligenceBadge>
          </div>
          <pre className="mt-4 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-rose-100/90">
            {critiqueStr}
          </pre>
        </div>
      )}
    </GlassCard>
  );
}
