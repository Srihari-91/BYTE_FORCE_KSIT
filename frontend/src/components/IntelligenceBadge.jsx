import { cn } from '../utils/cn';

const tones = {
  default: 'border-white/10 bg-white/[0.04] text-slate-200',
  electric: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
  violet: 'border-violet-400/30 bg-violet-500/10 text-violet-100',
  emerald: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100',
  amber: 'border-amber-500/35 bg-amber-500/10 text-amber-100',
  rose: 'border-rose-500/35 bg-rose-500/10 text-rose-100',
};

export default function IntelligenceBadge({ children, tone = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        tones[tone] || tones.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
