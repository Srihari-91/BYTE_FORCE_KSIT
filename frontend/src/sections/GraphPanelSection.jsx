import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minus, Plus, MousePointer2, BookOpen } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowButton from '../components/GlowButton';
import IntelligenceBadge from '../components/IntelligenceBadge';
import { useStableGraphLayout } from '../hooks/useStableGraphLayout';

export default function GraphPanelSection({ graph }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 960, h: 420 });
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setDims({ w: Math.max(320, cr.width), h: Math.max(360, Math.min(520, cr.width * 0.48)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useStableGraphLayout(graph, dims.w, dims.h);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(2.4, Math.max(0.45, s + delta)));
  }, []);

  const legend = useMemo(
    () => [
      { label: 'Paper / evidence', color: '#38bdf8' },
      { label: 'Similarity edge', color: 'rgba(148,163,184,0.35)' },
    ],
    [],
  );

  if (!graph?.nodes?.length) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <BookOpen className="h-12 w-12 text-slate-600" />
          <div>
            <h2 className="text-xl font-bold text-white">Knowledge graph</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              No graph edges were emitted for this query — the backend needs overlapping token signals between papers.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex flex-col border-b border-white/[0.06] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Knowledge graph</h2>
          <p className="mt-1 text-sm text-slate-500">
            Frozen force layout · {layout.nodes.length} nodes · {layout.links.length} similarity links
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
          {legend.map((l) => (
            <IntelligenceBadge key={l.label} tone="default" className="inline-flex items-center gap-2 normal-case">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              {l.label}
            </IntelligenceBadge>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative bg-gradient-to-b from-black/40 to-os-bg"
        style={{ height: dims.h }}
        onWheel={onWheel}
      >
        <svg
          width="100%"
          height="100%"
          className="cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            if (e.target.closest('circle[data-node]')) return;
            setDrag({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          }}
          onMouseMove={(e) => {
            if (!drag) return;
            setPan({ x: e.clientX - drag.x, y: e.clientY - drag.y });
          }}
          onMouseUp={() => setDrag(null)}
          onMouseLeave={() => setDrag(null)}
        >
          <defs>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
            <rect x={0} y={0} width={layout.width} height={layout.height} fill="transparent" />
            {layout.links.map((l, i) => {
              const resolve = (end) => {
                if (end && typeof end === 'object' && 'x' in end) return end;
                const id = typeof end === 'object' && end?.id != null ? end.id : end;
                return layout.nodes.find((n) => n.id === id);
              };
              const s = resolve(l.source);
              const t = resolve(l.target);
              if (!s || !t) return null;
              return (
                <motion.line
                  key={i}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="rgba(148,163,184,0.28)"
                  strokeWidth={Math.max(1, (l.weight || 1) * 0.35)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                />
              );
            })}
            {layout.nodes.map((n, i) => {
              const isSel = selected?.id === n.id;
              const r = isSel ? 14 : 10;
              return (
                <g key={n.id}>
                  <motion.circle
                    data-node
                    cx={n.x}
                    cy={n.y}
                    r={r + 6}
                    fill="rgba(56,189,248,0.12)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: isSel ? 1 : 0, scale: isSel ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  />
                  <motion.circle
                    data-node
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={isSel ? '#7dd3fc' : '#38bdf8'}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1.5}
                    filter="url(#nodeGlow)"
                    style={{ cursor: n.url ? 'pointer' : 'default' }}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.08 + i * 0.02, type: 'spring', stiffness: 220, damping: 16 }}
                    onClick={() => {
                      setSelected(n);
                      if (n.url) window.open(n.url, '_blank', 'noopener,noreferrer');
                    }}
                  />
                  <text
                    x={n.x}
                    y={n.y + r + 14}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={10}
                    style={{ pointerEvents: 'none' }}
                  >
                    {(n.name || 'Paper').slice(0, 28)}
                    {(n.name || '').length > 28 ? '…' : ''}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="absolute bottom-4 right-4 z-10 flex gap-2 rounded-xl border border-white/10 bg-black/60 p-2 text-white shadow-lg backdrop-blur-md">
          <GlowButton type="button" variant="ghost" className="h-9 w-9 p-0" onClick={() => setScale((s) => Math.min(2.4, s + 0.12))}>
            <Plus className="h-4 w-4" />
          </GlowButton>
          <GlowButton type="button" variant="ghost" className="h-9 w-9 p-0" onClick={() => setScale((s) => Math.max(0.45, s - 0.12))}>
            <Minus className="h-4 w-4" />
          </GlowButton>
          <GlowButton
            type="button"
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <Maximize2 className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/[0.06] bg-black/35 px-6 py-4"
          >
            <div className="flex items-start gap-3">
              <MousePointer2 className="mt-0.5 h-4 w-4 text-sky-400" />
              <div>
                <p className="text-sm font-semibold text-white">{selected.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.year ? `Year ${selected.year}` : ''}{' '}
                  {selected.citations != null ? `· Citations ${selected.citations}` : ''}{' '}
                  {selected.group ? `· ${selected.group}` : ''}
                </p>
                {selected.url && (
                  <p className="mt-2 text-xs text-sky-300">Opened source in new tab. Click node again to refocus.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
