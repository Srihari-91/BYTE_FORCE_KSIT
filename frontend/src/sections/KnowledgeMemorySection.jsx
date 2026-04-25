import GlassCard from '../components/GlassCard';
import EvidenceCard from '../components/EvidenceCard';

export default function KnowledgeMemorySection({ insight }) {
  const obj = insight && typeof insight === 'object' ? insight : null;
  const claims = [];

  if (obj?.paper_analysis?.length) {
    obj.paper_analysis.forEach((pa) => {
      (pa.key_claims || []).forEach((c) => {
        claims.push({ claim: c, sourceTitle: pa.title, confidence: null, contradiction: false });
      });
    });
  }

  if (obj?.themes?.length) {
    obj.themes.forEach((t) => {
      (t.supporting_claims || []).forEach((c) => {
        claims.push({
          claim: c,
          sourceTitle: t.theme,
          confidence: null,
          contradiction: false,
        });
      });
    });
  }

  const ev = obj?.evidence_strength;

  if (!claims.length && !ev) {
    return (
      <GlassCard>
        <h2 className="text-xl font-bold text-white">Knowledge memory</h2>
        <p className="mt-2 text-sm text-slate-500">No structured claims were returned by the analyzer for this run.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Knowledge memory</h2>
          <p className="mt-1 text-sm text-slate-500">Structured claims from the analyzer JSON — not editorialized.</p>
        </div>
        {ev && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/90">Evidence strength</div>
            <div className="mt-1 text-2xl font-bold text-white">
              {typeof ev.score === 'number'
                ? `${Math.round(ev.score <= 1 ? ev.score * 100 : Math.min(100, ev.score))}`
                : '—'}
            </div>
            {ev.justification && <p className="mt-2 max-w-xs text-xs text-slate-400">{ev.justification}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {claims.slice(0, 24).map((c, i) => (
          <EvidenceCard
            key={i}
            claim={c.claim}
            sourceTitle={c.sourceTitle}
            confidence={null}
            contradiction={c.contradiction}
            index={i}
          />
        ))}
      </div>
    </GlassCard>
  );
}
