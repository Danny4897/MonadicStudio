/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d1117',
        surface: '#161b22',
        border: '#30363d',
        accent: '#00ff88',
        warning: '#f97316',
        error: '#ef4444',
        text: '#e6edf3',
        muted: '#8b949e',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
