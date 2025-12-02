import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f1419',
        'dark-surface': '#151d26',
        'dark-surface-light': '#1a2535',
        'accent-green': '#22c55e',
        'accent-earth': '#8b7355',
        'accent-leaf': '#10b981',
        'accent-moss': '#6d9773',
        'accent-clay': '#a89968',
        'accent-sky': '#06b6d4',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'organic-overlay': 'linear-gradient(135deg, transparent, rgba(16, 185, 129, 0.02))',
      },
      spacing: {
        '13': '3.25rem',
      },
    },
  },
  plugins: [],
}
export default config
