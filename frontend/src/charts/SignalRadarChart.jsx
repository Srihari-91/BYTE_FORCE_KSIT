import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

const tooltipStyle = {
  background: 'rgba(15,23,42,0.92)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 12,
  fontSize: 12,
};

export default function SignalRadarChart({ data }) {
  const hasSignal = data?.some((d) => d.value > 0);
  if (!data?.length || !hasSignal) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        Not enough structured signals for a radar snapshot.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart cx="50%" cy="52%" outerRadius="72%" data={data}>
        <PolarGrid stroke="rgba(148,163,184,0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Radar
          name="Signal"
          dataKey="value"
          stroke="#38bdf8"
          fill="rgba(56,189,248,0.35)"
          strokeWidth={2}
          animationDuration={900}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
