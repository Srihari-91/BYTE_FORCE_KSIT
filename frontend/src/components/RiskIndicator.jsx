import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '../utils/cn';

export default function RiskIndicator({ risk, confidence, critique }) {
  if (risk == null && confidence == null) return null;

  const riskText = String(risk || '').toLowerCase();
  let level = 'Low';
  let palette = {
    border: 'border-emerald-500/30',
    bg: 'from-emerald-500/10 to-transparent',
    icon: ShieldCheck,
    iconClass: 'text-emerald-300',
  };

  if (riskText.includes('high')) {
    level = 'High';
    palette = {
      border: 'border-rose-500/35',
      bg: 'from-rose-500/12 to-transparent',
      icon: ShieldAlert,
      iconClass: 'text-rose-300',
    };
  } else if (riskText.includes('medium')) {
    level = 'Medium';
    palette = {
      border: 'border-amber-500/35',
      bg: 'from-amber-500/12 to-transparent',
      icon: ShieldQuestion,
      iconClass: 'text-amber-200',
    };
  }

  const Icon = palette.icon;
  const critiquePreview =
    typeof critique === 'string' && critique.trim()
      ? critique.trim().slice(0, 320) + (critique.length > 320 ? '…' : '')
      : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 md:p-6',
        palette.border,
        'bg-gradient-to-br',
        palette.bg,
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-black/30', palette.iconClass)}>
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Risk & calibration</div>
            <div className="mt-1 text-xl font-bold tracking-tight text-white">
              {level} risk
              {confidence != null && (
                <span className="text-slate-400"> · Confidence {Math.round((Number(confidence) || 0) * 100)}%</span>
              )}
            </div>
            {critiquePreview && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">{critiquePreview}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
