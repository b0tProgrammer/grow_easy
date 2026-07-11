import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F1720',
        surface: '#161F2B',
        surface2: '#1C2733',
        line: '#28374A',
        signal: '#5EEAD4',
        warn: '#F5A94E',
        danger: '#F87171',
        ink: '#E7EDF2',
        muted: '#8FA1B3',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        grid: 'linear-gradient(#1C2733 1px, transparent 1px), linear-gradient(90deg, #1C2733 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
    },
  },
  plugins: [],
};

export default config;
