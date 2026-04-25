import GlassCard from '../components/GlassCard';
import ConfidenceRing from '../components/ConfidenceRing';
import IntelligenceBadge from '../components/IntelligenceBadge';
import { buildStructuredReport } from '../utils/formatResearchReport';
import { renderBoldText } from '../utils/renderBoldText';

function Block({ title, children }) {
  return (
    <div className="border-t border-white/[0.06] pt-8 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400/90">{title}</h3>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  if (!items?.length) return <p className="text-slate-500">—</p>;
  return (
    <ul className="list-none space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400/80" />
          <span>{renderBoldText(t)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ExecutiveReportSection({ data }) {
  const report = buildStructuredReport(data);
  const consensus = data?.risk || '—';
  const conf = data?.confidence;

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-col gap-6 border-b border-white/[0.06] bg-gradient-to-r from-sky-500/10 via-transparent to-violet-500/10 px-8 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <IntelligenceBadge tone="violet">Institutional synthesis</IntelligenceBadge>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Executive intelligence report</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Readable briefing generated only from fields present in this API response — no synthetic citations or
            metrics.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <ConfidenceRing value={conf} label="Model confidence" />
          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk posture</div>
            <div className="mt-1 text-lg font-bold text-white">{consensus}</div>
          </div>
        </div>
      </div>

      <div className="space-y-10 px-8 py-10">
        <Block title="Quick summary">
          <p className="text-base text-slate-200">
            {report.quickSummary ? renderBoldText(report.quickSummary) : 'No short summary could be derived from this response.'}
          </p>
        </Block>

        <Block title="Overview">
          {report.overview ? (
            <div className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-black/25 p-5 font-normal text-slate-300">
              {renderBoldText(report.overview)}
            </div>
          ) : (
            <p className="text-slate-500">—</p>
          )}
        </Block>

        <Block title="Research focus areas">
          <BulletList items={report.researchFocusAreas} />
        </Block>

        <Block title="Key insights from existing studies">
          <BulletList items={report.keyInsightsFromStudies} />
        </Block>

        <Block title="Challenges & limitations">
          <BulletList items={report.challengesAndLimitations} />
        </Block>

        <Block title="Risks & concerns">
          <BulletList items={report.risksAndConcerns} />
        </Block>

        <Block title="Missing research areas">
          <BulletList items={report.missingResearchAreas} />
        </Block>

        <Block title="Recommended next steps">
          <BulletList items={report.recommendedNextSteps} />
        </Block>

        {report.trends?.length > 0 && (
          <Block title="Forward-looking trends (agent output)">
            <BulletList items={report.trends} />
          </Block>
        )}

        {report.evidenceStrength && (
          <Block title="Evidence quality (analyzer)">
            <p>
              {renderBoldText(
                `Score: ${report.evidenceStrength.score}. ${report.evidenceStrength.justification || ''}`.trim(),
              )}
            </p>
          </Block>
        )}

        {report.confidenceNotes && (
          <Block title="Confidence rationale (assessor)">
            <p>{renderBoldText(report.confidenceNotes)}</p>
          </Block>
        )}
      </div>
    </GlassCard>
  );
}
