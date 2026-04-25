import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AgentStep from '../components/AgentStep';
import IntelligenceBadge from '../components/IntelligenceBadge';
import { buildPipelineStages, auxiliaryAgentLogs } from '../utils/agentPipeline';
import { ShimmerBlock } from '../components/ShimmerSkeleton';

export default function AgentPipelineSection({ agentLogs, loading }) {
  const stages = buildPipelineStages(agentLogs, { finished: !loading });
  const aux = auxiliaryAgentLogs(agentLogs);

  return (
    <GlassCard className="p-6 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-300">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Live mesh</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Agent pipeline</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Trace how each specialist contributed — sourced from your run's agent logs.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ShimmerBlock key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-3">
            {stages.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="min-w-[200px] flex-1"
              >
                <AgentStep
                  label={s.label}
                  subtitle={s.subtitle}
                  status={s.status}
                  outputPreview={s.outputPreview}
                />
              </motion.div>
            ))}
          </div>

          {aux.length > 0 && (
            <div className="mt-6 border-t border-white/[0.06] pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Supporting agents</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {aux.map((log, idx) => (
                  <IntelligenceBadge key={idx} tone="violet">
                    {log.agent}
                  </IntelligenceBadge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}
