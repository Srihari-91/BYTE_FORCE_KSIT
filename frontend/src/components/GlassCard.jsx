import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export default function GlassCard({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/[0.07] bg-os-panel/90 p-6 shadow-card backdrop-blur-2xl',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/[0.06] before:to-transparent before:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
