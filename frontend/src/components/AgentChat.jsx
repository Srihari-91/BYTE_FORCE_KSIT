import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

function formatOutput(output) {
  if (output == null) return '';
  if (typeof output === 'string') return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}

export default function AgentChat({ logs }) {
  if (!Array.isArray(logs) || !logs.length) {
    return <p className="text-center text-sm text-slate-500">No agent logs for this run.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {logs.map((log, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.04, 0.4) }}
          className="rounded-2xl border border-white/[0.07] bg-black/35 p-5 shadow-inner backdrop-blur-md"
        >
          <div className="flex items-center gap-2 text-sky-300">
            <Cpu className="h-4 w-4" />
            <span className="text-sm font-bold tracking-tight text-white">{log.agent}</span>
          </div>
          {log.thought && <p className="mt-2 text-xs text-slate-500">{log.thought}</p>}
          <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
            {formatOutput(log.output)}
          </pre>
        </motion.div>
      ))}
    </div>
  );
}
