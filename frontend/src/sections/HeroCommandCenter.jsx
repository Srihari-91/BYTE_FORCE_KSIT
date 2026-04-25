import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Shield, Zap, Radio, ChevronDown, ChevronUp } from 'lucide-react';
import GlowButton from '../components/GlowButton';
import IntelligenceBadge from '../components/IntelligenceBadge';
import { cn } from '../utils/cn';

export default function HeroCommandCenter({ onSearch, isLoading }) {
  const [query, setQuery] = useState('');
  const [fileName, setFileName] = useState('');
  const [liveMode, setLiveMode] = useState(true);
  const [agentMode, setAgentMode] = useState('standard');
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() && !projectTitle.trim() && !projectDescription.trim() && !fileName) return;
    onSearch(query, fileName, {
      project_title: projectTitle.trim() || undefined,
      project_description: projectDescription.trim() || undefined,
      client_mode: liveMode ? 'live' : 'safe',
      client_agent_profile: agentMode,
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) setFileName(e.target.files[0].name);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-os-surface/80 p-8 shadow-card backdrop-blur-2xl md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-grid-fine bg-[length:24px_24px] opacity-40" />
      <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-sky-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-purple-500/15 blur-[90px]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <IntelligenceBadge tone="electric">
            <Radio className="mr-1 inline h-3 w-3" />
            System operational
          </IntelligenceBadge>
          <IntelligenceBadge tone="violet">Multi-agent mesh</IntelligenceBadge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mt-6 text-balance bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl lg:text-6xl"
        >
          AI Research Operating System
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base"
        >
          Orchestrated retrieval, verification, synthesis, and critique — with full traceability over your evidence
          corpus.
        </motion.p>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-3xl space-y-5 text-left">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-black/30 p-2 shadow-inner backdrop-blur-md sm:flex-row sm:p-2">
            <input
              type="text"
              placeholder="Command a research objective, hypothesis, or decision question…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              className="min-h-[52px] flex-1 rounded-xl border border-transparent bg-transparent px-4 text-base text-white outline-none ring-0 placeholder:text-slate-600 focus:border-sky-500/40"
            />
            <GlowButton type="submit" disabled={isLoading} className="min-h-[52px] shrink-0 px-8 sm:rounded-xl">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 animate-pulse" />
                  Running…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Execute research
                </span>
              )}
            </GlowButton>
          </div>

          <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Run profile</span>
              <button
                type="button"
                onClick={() => setLiveMode(true)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  liveMode ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/40' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                Live mode
              </button>
              <button
                type="button"
                onClick={() => setLiveMode(false)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  !liveMode ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/35' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                <Shield className="h-3.5 w-3.5" />
                Safe mode
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Agents</span>
              <select
                value={agentMode}
                onChange={(e) => setAgentMode(e.target.value)}
                className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-medium text-slate-200 outline-none focus:border-sky-500/50"
              >
                <option value="standard">Standard mesh</option>
                <option value="deep">Deep synthesis</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProjectOpen(!projectOpen)}
            className="flex w-full items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-300"
          >
            Optional project context (API fields)
            {projectOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {projectOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-black/25 p-4"
            >
              <input
                type="text"
                placeholder="Project title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
              />
              <textarea
                placeholder="Project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-sky-500/40"
              />
            </motion.div>
          )}

          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
            <label className="cursor-pointer hover:text-sky-300">
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              Attach PDF
            </label>
            <label className="cursor-pointer hover:text-sky-300">
              <input type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
              Attach TXT
            </label>
            {fileName && <span className="text-emerald-400/90">{fileName}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}
