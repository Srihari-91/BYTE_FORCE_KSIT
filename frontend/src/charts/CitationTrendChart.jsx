import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tooltipStyle = {
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 12,
  fontSize: 12,
};

const COLORS = ['#38bdf8', '#22d3ee', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'];

export default function CitationTrendChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        No citation counts available.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
        <defs>
          <linearGradient id="citBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.35} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-22} textAnchor="end" height={64} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(167,139,250,0.06)' }} />
        <Bar dataKey="citations" radius={[6, 6, 0, 0]} animationDuration={900}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
