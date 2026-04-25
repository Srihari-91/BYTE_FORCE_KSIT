/**
 * Derive chart series from real run payload only.
 */

export function publicationsByYear(papers) {
  if (!Array.isArray(papers) || !papers.length) return [];
  const map = new Map();
  papers.forEach((p) => {
    const y = p?.year;
    if (y == null || y === '') return;
    const n = Number(y);
    if (!Number.isFinite(n)) return;
    map.set(n, (map.get(n) || 0) + 1);
  });
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year: String(year), count }));
}

export function citationBars(papers, limit = 8) {
  if (!Array.isArray(papers) || !papers.length) return [];
  return [...papers]
    .map((p, i) => ({
      name: (p.title || p.paper_id || `Paper ${i + 1}`).slice(0, 42),
      citations: Number(p.citations ?? p.citationCount ?? 0) || 0,
    }))
    .sort((a, b) => b.citations - a.citations)
    .slice(0, limit);
}

function normalizeScore01to10(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n > 0 && n <= 1) return n * 10;
  return n;
}

export function credibilityDistribution(papers) {
  if (!Array.isArray(papers) || !papers.length) return [];
  const buckets = [
    { range: '0–3', min: 0, max: 3, count: 0 },
    { range: '4–6', min: 4, max: 6, count: 0 },
    { range: '7–8', min: 7, max: 8, count: 0 },
    { range: '9–10', min: 9, max: 10, count: 0 },
  ];
  papers.forEach((p) => {
    const rs = normalizeScore01to10(p.relevance_score ?? p.recency_score);
    if (rs == null) return;
    const b = buckets.find((x) => rs >= x.min && rs <= x.max);
    if (b) b.count += 1;
  });
  return buckets.map(({ range, count }) => ({ range, count }));
}

export function signalRadarCounts(data) {
  const insight = data?.insight && typeof data.insight === 'object' ? data.insight : {};
  const agreements = Array.isArray(insight.agreements) ? insight.agreements.length : 0;
  const contradictions = Array.isArray(insight.contradictions) ? insight.contradictions.length : 0;
  const gaps = Array.isArray(data?.gaps) ? data.gaps.length : 0;
  const trends = Array.isArray(data?.trends) ? data.trends.length : 0;
  const papers = Number(data?.papers_analyzed || 0);
  const scale = (n) => Math.min(100, n * 12);
  return [
    { subject: 'Papers', value: scale(papers), fullMark: 100 },
    { subject: 'Agreements', value: scale(agreements), fullMark: 100 },
    { subject: 'Tensions', value: scale(contradictions), fullMark: 100 },
    { subject: 'Gaps', value: scale(gaps), fullMark: 100 },
    { subject: 'Trends', value: scale(trends), fullMark: 100 },
  ];
}

export function methodologyMix(papers) {
  if (!Array.isArray(papers) || !papers.length) return [];
  const map = new Map();
  papers.forEach((p) => {
    const m = p.source_type || p.sourceType || p.venue || 'unspecified';
    const key = String(m);
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([name, value]) => ({ name, value }));
}
