import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#050505', // Darker, almost black
        'dark-surface': '#0a0a0a',
        'glass-surface': 'rgba(255, 255, 255, 0.07)',
        'glass-border': 'rgba(255, 255, 255, 0.12)',
        'accent-green': '#22c55e',
        'accent-neon-green': '#00ff9d',
        'accent-neon-blue': '#00f0ff',
        'accent-neon-purple': '#bd00ff',
        'accent-earth': '#8b7355',
        'accent-leaf': '#10b981',
        'accent-moss': '#6d9773',
        'accent-clay': '#a89968',
        'accent-sky': '#06b6d4',
      },
      boxShadow: {
        'card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'neon-green': '0 0 10px rgba(0, 255, 157, 0.3)',
        'neon-blue': '0 0 10px rgba(0, 240, 255, 0.3)',
      },
      backgroundImage: {
        'organic-overlay': 'linear-gradient(135deg, transparent, rgba(16, 185, 129, 0.02))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      spacing: {
        '13': '3.25rem',
      },
    },
  },
  plugins: [],
}
export default config
