import GlassCard from '../components/GlassCard';
import IntelligenceBadge from '../components/IntelligenceBadge';

function findConfidenceAssessment(agentLogs) {
  if (!Array.isArray(agentLogs)) return null;
  const log = agentLogs.find((l) => /confidence|risk assessor/i.test(l?.agent || ''));
  const out = log?.output;
  if (out?.confidence_assessment) return out.confidence_assessment;
  if (out && typeof out === 'object' && 'confidence_score' in out) return out;
  return null;
}

export default function ReflectionSection({ data }) {
  const assessment = findConfidenceAssessment(data?.agent_logs);
  const issues = Array.isArray(assessment?.issues_detected) ? assessment.issues_detected : [];
  const revised = assessment?.revised_conclusion;

  if (!assessment && !revised) {
    return (
      <GlassCard>
        <h2 className="text-xl font-bold text-white">Reflection & memory update</h2>
        <p className="mt-2 text-sm text-slate-500">
          Confidence agent output not present in logs — nothing to reflect for this run.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h2 className="text-2xl font-bold tracking-tight text-white">Reflection & memory update</h2>
      <p className="mt-1 text-sm text-slate-500">Post-run reassessment from the confidence agent (log-sourced).</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {assessment?.confidence_level && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confidence level</div>
            <div className="mt-2 text-lg font-semibold text-white">{assessment.confidence_level}</div>
          </div>
        )}
        {assessment?.confidence_score != null && (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Score (0–100)</div>
            <div className="mt-2 text-lg font-semibold text-white">{assessment.confidence_score}</div>
          </div>
        )}
      </div>

      {issues.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300/90">Issues detected</h3>
          <ul className="mt-3 space-y-2">
            {issues.map((x, i) => (
              <li key={i} className="flex flex-wrap gap-2 text-sm text-slate-300">
                <IntelligenceBadge tone="amber">{String(x)}</IntelligenceBadge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {revised && (
        <div className="mt-6 rounded-xl border border-sky-500/25 bg-sky-500/5 p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sky-300">Revised conclusion</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{revised}</p>
        </div>
      )}

      {assessment?.confidence_justification && (
        <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Justification</h3>
          <p className="mt-3 text-sm text-slate-300">{assessment.confidence_justification}</p>
        </div>
      )}
    </GlassCard>
  );
}
