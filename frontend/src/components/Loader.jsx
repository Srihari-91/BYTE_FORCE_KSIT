import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full border border-sky-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border border-t-sky-400 border-r-transparent border-b-violet-500/50 border-l-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: [0.85, 1, 0.85], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 opacity-90 blur-[2px]" />
        </motion.div>
      </div>
      <motion.p
        className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        Orchestrating agents
      </motion.p>
    </div>
  );
}
