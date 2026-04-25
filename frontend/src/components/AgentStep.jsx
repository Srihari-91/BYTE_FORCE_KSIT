import { motion } from 'framer-motion';
import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '../utils/cn';

export default function AgentStep({ label, subtitle, status, outputPreview }) {
  const active = status === 'active';
  const done = status === 'complete';

  return (
    <motion.div
      layout
      className={cn(
        'relative min-w-[140px] flex-1 rounded-2xl border p-4 transition-colors',
        active && 'border-sky-500/50 bg-sky-500/[0.07] shadow-[0_0_24px_rgba(56,189,248,0.12)]',
        done && 'border-emerald-500/25 bg-emerald-500/[0.04]',
        status === 'pending' && 'border-white/[0.05] bg-white/[0.02] opacity-60',
      )}
    >
      {active && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl border border-sky-400/20"
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-white">{label}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">{subtitle}</div>
        </div>
        <div className="shrink-0 pt-0.5 text-sky-300">
          {done && <Check className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />}
          {active && <Loader2 className="h-5 w-5 animate-spin" />}
          {status === 'pending' && <Circle className="h-4 w-4 text-slate-600" />}
        </div>
      </div>
      {outputPreview ? (
        <p className="mt-3 line-clamp-3 border-t border-white/[0.06] pt-3 font-mono text-[10px] leading-relaxed text-slate-400">
          {outputPreview}
        </p>
      ) : (
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10px] italic text-slate-600">Awaiting trace…</p>
      )}
    </motion.div>
  );
}
