import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ScrollText, ChevronDown } from 'lucide-react';
import Loader from './components/Loader';
import AgentChat from './components/AgentChat';
import RiskIndicator from './components/RiskIndicator';
import GlowButton from './components/GlowButton';
import GlassCard from './components/GlassCard';
import { conductResearch, exportReport } from './services/api';
import HeroCommandCenter from './sections/HeroCommandCenter';
import AgentPipelineSection from './sections/AgentPipelineSection';
import ResearchPaperGridSection from './sections/ResearchPaperGridSection';
import AnalyticsDashboardSection from './sections/AnalyticsDashboardSection';
import GraphPanelSection from './sections/GraphPanelSection';
import KnowledgeMemorySection from './sections/KnowledgeMemorySection';
import ConflictPanelSection from './sections/ConflictPanelSection';
import ExecutiveReportSection from './sections/ExecutiveReportSection';
import ReflectionSection from './sections/ReflectionSection';
import ExportActionsBar from './sections/ExportActionsBar';
import './index.css';

const nav = [
  { id: 'command', label: 'Command' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'report', label: 'Report' },
  { id: 'corpus', label: 'Corpus' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'graph', label: 'Graph' },
  { id: 'memory', label: 'Memory' },
  { id: 'conflicts', label: 'Conflicts' },
  { id: 'reflection', label: 'Reflection' },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSearch = useCallback(async (query, _fileName, options = {}) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await conductResearch(query, options);
      setData(result);
    } catch (err) {
      setError('Failed to conduct research. Please check backend connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = async () => {
    if (!data?.run_id) return;
    setExporting(true);
    try {
      const blob = await exportReport(data.run_id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-report-${data.run_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError('Export failed. Please retry.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-os-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/30 to-violet-600/30 ring-1 ring-white/10">
              <Terminal className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white">Research War Room</div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">AI operating shell</div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-white/[0.05] hover:text-sky-200"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-10 px-4 py-10 md:space-y-14 md:px-6">
        <div id="command">
          <HeroCommandCenter onSearch={handleSearch} isLoading={loading} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
            >
              <GlassCard className="border-rose-500/30 bg-rose-500/[0.08]">
                <p className="text-sm font-medium text-rose-100">{error}</p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div id="pipeline">
            <AgentPipelineSection agentLogs={[]} loading />
            <Loader />
          </div>
        )}

        {data && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-12 md:space-y-16"
          >
            <div id="pipeline">
              <AgentPipelineSection agentLogs={data.agent_logs} loading={false} />
            </div>

            <div id="report" className="space-y-6">
              <RiskIndicator risk={data.risk} confidence={data.confidence} critique={data.critique} />
              <ExecutiveReportSection data={data} />
            </div>

            <div id="corpus">
              <ResearchPaperGridSection selection={data.selection} topPapers={data.top_papers} />
            </div>

            <div id="analytics">
              <AnalyticsDashboardSection data={data} />
            </div>

            <div id="graph">
              <GraphPanelSection graph={data.graph} />
            </div>

            <div id="memory">
              <KnowledgeMemorySection insight={data.insight} />
            </div>

            <div id="conflicts">
              <ConflictPanelSection insight={data.insight} critique={data.critique} />
            </div>

            <div id="reflection">
              <ReflectionSection data={data} />
            </div>

            <ExportActionsBar data={data} onExportPdf={handleExport} exporting={exporting} />

            <GlassCard>
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <ScrollText className="h-5 w-5 text-slate-500" />
                  <div>
                    <div className="text-sm font-bold text-white">Raw collaboration stream</div>
                    <div className="font-mono text-xs text-slate-500">Run ID · {data.run_id || '—'}</div>
                  </div>
                </div>
                <GlowButton variant="ghost" type="button" onClick={() => setShowFullLogs(!showFullLogs)}>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFullLogs ? 'rotate-180' : ''}`} />
                  {showFullLogs ? 'Hide logs' : 'View raw agent logs'}
                </GlowButton>
              </div>
              <AnimatePresence>
                {showFullLogs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 border-t border-white/[0.06] pt-6">
                      <AgentChat logs={data.agent_logs} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )}
      </main>
    </div>
  );
}
