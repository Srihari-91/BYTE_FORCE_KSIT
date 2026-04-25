import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tooltipStyle = {
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 12,
  fontSize: 12,
};

export default function CredibilityAreaChart({ data }) {
  const total = data?.reduce((s, d) => s + d.count, 0) || 0;
  if (!data?.length || total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        No relevance or recency scores on papers in this run.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="range" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="stepAfter" dataKey="count" stroke="#34d399" fill="url(#credGrad)" strokeWidth={2} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
