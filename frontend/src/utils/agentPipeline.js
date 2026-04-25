/**
 * Maps backend agent `role` strings (from AgentStep) to premium pipeline stages.
 * Uses only real agent_logs — no fabricated steps.
 */

const STAGES = [
  {
    id: 'planner',
    label: 'Planner',
    subtitle: 'Strategy & decomposition',
    match: (agent) => /research strategist/i.test(agent || ''),
  },
  {
    id: 'retriever',
    label: 'Retriever',
    subtitle: 'Evidence acquisition',
    match: (agent) => /information scout/i.test(agent || ''),
  },
  {
    id: 'verifier',
    label: 'Verifier',
    subtitle: 'Source integrity',
    match: (agent) => /^verifier$/i.test((agent || '').trim()),
  },
  {
    id: 'analyst',
    label: 'Analyst',
    subtitle: 'Deep synthesis',
    match: (agent) => /insight analyzer/i.test(agent || ''),
  },
  {
    id: 'critic',
    label: 'Critic',
    subtitle: 'Adversarial review',
    match: (agent) => /devil|advocate|critic/i.test(agent || ''),
  },
  {
    id: 'synthesizer',
    label: 'Synthesizer',
    subtitle: 'Consensus narrative',
    match: (agent) => /consensus voter/i.test(agent || ''),
  },
  {
    id: 'reflection',
    label: 'Reflection',
    subtitle: 'Confidence & risk',
    match: (agent) => /confidence|risk assessor/i.test(agent || ''),
  },
];

function pickLog(logs, matcher) {
  if (!Array.isArray(logs)) return null;
  return logs.find((l) => matcher(l?.agent || '')) || null;
}

function previewOutput(output, maxLen = 220) {
  if (output == null) return '';
  let text = '';
  if (typeof output === 'string') text = output;
  else {
    try {
      text = JSON.stringify(output);
    } catch {
      text = String(output);
    }
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

export function buildPipelineStages(agentLogs, { finished = true } = {}) {
  const logs = Array.isArray(agentLogs) ? agentLogs : [];
  return STAGES.map((stage, index) => {
    const log = pickLog(logs, stage.match);
    const laterHasActivity = STAGES.slice(index + 1).some((s) => pickLog(logs, s.match));
    let status = 'pending';
    if (log) {
      if (finished) status = 'complete';
      else status = laterHasActivity ? 'complete' : 'active';
    }
    return {
      ...stage,
      status,
      thought: log?.thought || '',
      outputPreview: log ? previewOutput(log.output) : '',
      rawLog: log,
    };
  });
}

function isPrimaryStageAgent(agent) {
  return STAGES.some((s) => s.match(agent || ''));
}

/** Supplementary agents shown as chips (real logs only). */
export function auxiliaryAgentLogs(agentLogs) {
  const logs = Array.isArray(agentLogs) ? agentLogs : [];
  const extraRoles = [
    /filtering.*ranking/i,
    /domain specialist/i,
    /recency.*relevance/i,
    /gap detector/i,
    /trend analyst/i,
  ];
  return logs.filter((l) => {
    const a = l?.agent || '';
    if (!a || isPrimaryStageAgent(a)) return false;
    return extraRoles.some((re) => re.test(a));
  });
}
