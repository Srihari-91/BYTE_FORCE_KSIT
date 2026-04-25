import GlassCard from '../components/GlassCard';
import PublicationTimelineChart from '../charts/PublicationTimelineChart';
import CitationTrendChart from '../charts/CitationTrendChart';
import SignalRadarChart from '../charts/SignalRadarChart';
import MethodologyBarsChart from '../charts/MethodologyBarsChart';
import CredibilityAreaChart from '../charts/CredibilityAreaChart';
import {
  publicationsByYear,
  citationBars,
  signalRadarCounts,
  methodologyMix,
  credibilityDistribution,
} from '../utils/chartDataFromRun';

export default function AnalyticsDashboardSection({ data }) {
  const papers = [
    ...(data?.selection?.selected_papers || []),
    ...(data?.top_papers || []),
  ];
  const unique = [];
  const seen = new Set();
  papers.forEach((p) => {
    const k = p.title || p.paper_id;
    if (!k || seen.has(k)) return;
    seen.add(k);
    unique.push(p);
  });

  const pubData = publicationsByYear(unique);
  const citeData = citationBars(unique);
  const radarData = signalRadarCounts(data);
  const methodData = methodologyMix(unique);
  const credData = credibilityDistribution(unique);

  return (
    <GlassCard>
      <h2 className="text-2xl font-bold tracking-tight text-white">Signal analytics</h2>
      <p className="mt-1 text-sm text-slate-500">Derived strictly from this run's papers and analyzer output.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Publication timeline</h3>
          <PublicationTimelineChart data={pubData} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Citation weighting</h3>
          <CitationTrendChart data={citeData} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Corpus signal radar</h3>
          <SignalRadarChart data={radarData} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4">
          <h3 className="text-sm font-semibold text-slate-200">Score distribution</h3>
          <CredibilityAreaChart data={credData} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-200">Source-type mix</h3>
          <MethodologyBarsChart data={methodData} />
        </div>
      </div>
    </GlassCard>
  );
}
