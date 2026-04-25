import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ResearchPaperCard from '../components/ResearchPaperCard';
import GlowButton from '../components/GlowButton';

function mergePaperRows(selection, topPapers) {
  const selected = selection?.selected_papers || [];
  const top = Array.isArray(topPapers) ? topPapers : [];
  if (!selected.length) return top;
  const byTitle = new Map(top.map((p) => [p.title, p]));
  return selected.map((p) => ({ ...(byTitle.get(p.title) || {}), ...p }));
}

export default function ResearchPaperGridSection({ selection, topPapers }) {
  const rows = useMemo(() => mergePaperRows(selection, topPapers), [selection, topPapers]);
  const [yearMin, setYearMin] = useState('');
  const [credMin, setCredMin] = useState('');
  const [domain, setDomain] = useState('');
  const [method, setMethod] = useState('');
  const [sort, setSort] = useState('relevance');

  const years = useMemo(() => {
    const ys = rows.map((p) => p.year).filter((y) => y != null && y !== '');
    return [...new Set(ys)].sort((a, b) => b - a);
  }, [rows]);

  const domains = useMemo(() => {
    const ds = rows.map((p) => p.source || p.source_type).filter(Boolean);
    return [...new Set(ds.map(String))];
  }, [rows]);

  const methods = useMemo(() => {
    const ms = rows.map((p) => p.source_type).filter(Boolean);
    return [...new Set(ms.map(String))];
  }, [rows]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (yearMin !== '') {
      const y = Number(yearMin);
      if (Number.isFinite(y)) list = list.filter((p) => (p.year || 0) >= y);
    }
    if (credMin !== '') {
      const c = Number(credMin);
      if (Number.isFinite(c)) {
        list = list.filter((p) => {
          const rs = p.relevance_score;
          if (rs == null) return false;
          const n = Number(rs);
          const scaled = n <= 1 ? n * 10 : n;
          return scaled >= c;
        });
      }
    }
    if (domain) list = list.filter((p) => String(p.source || p.source_type || '') === domain);
    if (method) list = list.filter((p) => String(p.source_type || '') === method);
    if (sort === 'citations') {
      list.sort((a, b) => (b.citations ?? b.citationCount ?? 0) - (a.citations ?? a.citationCount ?? 0));
    } else {
      list.sort((a, b) => {
        const ra = Number(a.relevance_score ?? 0) <= 1 ? Number(a.relevance_score ?? 0) * 10 : Number(a.relevance_score ?? 0);
        const rb = Number(b.relevance_score ?? 0) <= 1 ? Number(b.relevance_score ?? 0) * 10 : Number(b.relevance_score ?? 0);
        return rb - ra;
      });
    }
    return list;
  }, [rows, yearMin, credMin, domain, method, sort]);

  if (!rows.length) {
    return (
      <GlassCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Research corpus</h2>
            <p className="mt-1 text-sm text-slate-500">No papers in this response — run needs retrieved evidence.</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Evidence grid</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} of {rows.length} papers · selection metadata from your filter engine
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <select
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200"
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
          >
            <option value="">Year min</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}+
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200"
            value={credMin}
            onChange={(e) => setCredMin(e.target.value)}
          >
            <option value="">Relevance floor</option>
            {[3, 5, 7, 8].map((x) => (
              <option key={x} value={x}>
                {x}+
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          >
            <option value="">Domain / venue</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-slate-200"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="">Methodology</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <GlowButton variant="ghost" className="px-3 py-2 text-xs" type="button" onClick={() => setSort(sort === 'relevance' ? 'citations' : 'relevance')}>
            Sort: {sort === 'relevance' ? 'Relevance' : 'Citations'}
          </GlowButton>
        </div>
      </div>

      <motion.div layout className="mt-8 grid gap-5 md:grid-cols-2">
        {filtered.map((p, i) => (
          <ResearchPaperCard key={p.paper_id || p.title || i} paper={p} index={i} />
        ))}
      </motion.div>
    </GlassCard>
  );
}
