import { useId } from 'react';

export default function ConfidenceRing({ value, size = 80, label }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `ringGrad-${uid}`;
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  const pct = Math.round(v * 100);
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 80 80"
          className="rotate-[-90deg]"
          aria-hidden
        >
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth="7" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold tracking-tight text-white">
          {pct}%
        </div>
      </div>
      {label && (
        <span className="max-w-[140px] text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
      )}
    </div>
  );
}
