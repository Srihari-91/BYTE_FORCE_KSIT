/**
 * Builds readable report sections from real API fields only.
 * Does not invent facts — empty arrays when data is missing.
 */

function asLines(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stripJsonNoise(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/^\s*[\[{]/, '').replace(/[\]}]\s*$/, '').trim();
}

function normalizeList(items) {
  if (!items) return [];
  const arr = Array.isArray(items) ? items : [items];
  return arr
    .map((x) => {
      if (x == null) return '';
      if (typeof x === 'string') return stripJsonNoise(x).trim();
      if (typeof x === 'object' && x.gap) return String(x.gap).trim();
      if (typeof x === 'object' && x.trend) return String(x.trend).trim();
      try {
        return stripJsonNoise(JSON.stringify(x));
      } catch {
        return String(x);
      }
    })
    .filter(Boolean);
}

function quickSummaryFrom(finalAnswer, keyPoints) {
  const lines = asLines(finalAnswer);
  const kp = normalizeList(keyPoints);
  if (lines.length >= 2) return lines.slice(0, 3).join(' ');
  if (lines.length === 1 && lines[0].length > 320) return `${lines[0].slice(0, 320)}…`;
  if (lines.length === 1) return lines[0];
  if (kp.length) return kp.slice(0, 3).join(' ');
  return '';
}

/**
 * @param {object} data - research API payload
 */
export function buildStructuredReport(data) {
  const insight = data?.insight && typeof data.insight === 'object' ? data.insight : null;
  const finalAnswer = data?.final_answer || insight?.final_answer || '';
  const keyPoints = data?.key_points || [];
  const gaps = normalizeList(data?.gaps);
  const trends = normalizeList(data?.trends);
  const riskFlags = normalizeList(data?.risk_flags);

  const focusAreas =
    insight?.query_understanding?.key_focus_areas ||
    (insight?.query_understanding?.interpreted_intent
      ? [insight.query_understanding.interpreted_intent]
      : []);

  const keyInsightsFromStudies = [];
  if (insight?.themes?.length) {
    insight.themes.forEach((t) => {
      if (t?.theme) keyInsightsFromStudies.push(t.theme);
      normalizeList(t?.supporting_claims).forEach((c) => keyInsightsFromStudies.push(c));
    });
  }
  if (insight?.paper_analysis?.length) {
    insight.paper_analysis.forEach((pa) => {
      normalizeList(pa?.key_claims).forEach((c) => keyInsightsFromStudies.push(`${pa.title}: ${c}`));
    });
  }
  normalizeList(insight?.agreements).forEach((a) => keyInsightsFromStudies.push(a));
  normalizeList(keyPoints).forEach((k) => keyInsightsFromStudies.push(k));

  const challenges = [];
  normalizeList(insight?.research_gaps).forEach((g) => challenges.push(g));
  gaps.forEach((g) => challenges.push(g));
  if (insight?.confidence_reasoning?.limitations) {
    challenges.push(insight.confidence_reasoning.limitations);
  }

  const missingAreas = [...new Set([...normalizeList(insight?.research_gaps), ...gaps])];

  const recommendations = [];
  const critique = data?.critique;
  if (typeof critique === 'string' && critique.trim()) {
    asLines(critique)
      .slice(0, 8)
      .forEach((line) => recommendations.push(line));
  }

  const confJust = extractConfidenceJustification(data);
  const evidence = insight?.evidence_strength;

  return {
    quickSummary: quickSummaryFrom(finalAnswer, keyPoints),
    overview: typeof finalAnswer === 'string' ? finalAnswer.trim() : '',
    researchFocusAreas: normalizeList(focusAreas),
    keyInsightsFromStudies: [...new Set(keyInsightsFromStudies)].filter(Boolean).slice(0, 24),
    challengesAndLimitations: [...new Set(challenges)].filter(Boolean).slice(0, 20),
    risksAndConcerns: [...new Set(riskFlags)].filter(Boolean).slice(0, 16),
    missingResearchAreas: missingAreas.slice(0, 16),
    recommendedNextSteps: recommendations.slice(0, 12),
    trends,
    consensusNotes: normalizeList(keyPoints).slice(0, 10),
    evidenceStrength: evidence && typeof evidence === 'object' ? evidence : null,
    confidenceNotes: confJust,
  };
}

function extractConfidenceJustification(data) {
  const logs = data?.agent_logs;
  if (!Array.isArray(logs)) return '';
  const log = logs.find((l) => /confidence|risk assessor/i.test(l?.agent || ''));
  const out = log?.output?.confidence_assessment || log?.output;
  if (out && typeof out === 'object') {
    return (
      out.confidence_justification ||
      (Array.isArray(out.issues_detected) ? out.issues_detected.join('; ') : '') ||
      ''
    );
  }
  return '';
}
