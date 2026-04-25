import { useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';

/**
 * Runs a short force simulation then freezes node positions (no continuous motion).
 */
export function useStableGraphLayout(graph, width, height, options = {}) {
  const { iterations = 320, pad = 48 } = options;

  return useMemo(() => {
    const w = Math.max(320, width);
    const h = Math.max(280, height);
    if (!graph || !Array.isArray(graph.nodes) || !graph.nodes.length) {
      return { nodes: [], links: [], domainLabel: '' };
    }

    const rawNodes = graph.nodes.map((n) => ({
      ...n,
      id: String(n.id),
    }));
    const domainLabel = String(rawNodes[0]?.group || 'Research corpus');

    const simNodes = rawNodes.map((n) => ({
      ...n,
      x: w / 2 + (Math.random() - 0.5) * 40,
      y: h / 2 + (Math.random() - 0.5) * 40,
    }));

    const idSet = new Set(simNodes.map((n) => n.id));
    const rawLinks = (graph.edges || []).filter(
      (e) => idSet.has(String(e.source)) && idSet.has(String(e.target)),
    );

    const simLinks = rawLinks.map((e) => ({
      source: String(e.source),
      target: String(e.target),
      weight: e.weight || 1,
    }));

    const sim = forceSimulation(simNodes)
      .force(
        'link',
        forceLink(simLinks)
          .id((d) => d.id)
          .distance((l) => 52 + 120 / (Number(l.weight) || 1))
          .strength(0.55),
      )
      .force('charge', forceManyBody().strength(-220))
      .force('center', forceCenter(w / 2, h / 2))
      .force('collide', forceCollide().radius(28));

    sim.alpha(1);
    sim.alphaDecay(0.0228);
    for (let i = 0; i < iterations; i += 1) {
      sim.tick();
    }
    sim.stop();

    simNodes.forEach((n) => {
      n.x = Math.min(w - pad, Math.max(pad, n.x));
      n.y = Math.min(h - pad, Math.max(pad, n.y));
    });

    return {
      nodes: simNodes,
      links: simLinks,
      domainLabel,
      width: w,
      height: h,
    };
  }, [graph, width, height, iterations, pad]);
}
