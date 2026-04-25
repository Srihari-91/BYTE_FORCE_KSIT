/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        os: {
          bg: '#070b14',
          surface: '#0c1222',
          panel: 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(148, 163, 184, 0.12)',
          muted: '#94a3b8',
          fg: '#f1f5f9',
        },
        electric: {
          DEFAULT: '#38bdf8',
          dim: 'rgba(56, 189, 248, 0.15)',
        },
        violet: {
          glow: '#a78bfa',
          dim: 'rgba(167, 139, 250, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.12)',
        card: '0 24px 48px -12px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'grid-fine':
          'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
        'radial-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56,189,248,0.18), transparent 55%)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
