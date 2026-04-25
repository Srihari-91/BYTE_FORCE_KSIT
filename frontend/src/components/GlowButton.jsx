import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export default function GlowButton({
  children,
  className,
  variant = 'primary',
  disabled,
  type = 'button',
  ...rest
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-[0_0_24px_rgba(56,189,248,0.35)] hover:shadow-[0_0_32px_rgba(167,139,250,0.45)]',
    ghost:
      'border border-white/10 bg-white/[0.03] text-os-fg hover:border-sky-500/40 hover:bg-white/[0.06]',
    danger: 'border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/15',
  };

  return (
    <motion.button
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-os-bg',
        variants[variant] || variants.primary,
        disabled && 'pointer-events-none opacity-45',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
