/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agivant: {
          blue: {
            DEFAULT: '#2563eb',
            light: '#60a5fa',
            dark: '#1d4ed8',
            soft: '#eff6ff',
          },
          red: {
            DEFAULT: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
            soft: '#fef2f2',
          },
          sky: {
            DEFAULT: '#0ea5e9',
            light: '#38bdf8',
            soft: '#f0f9ff',
          },
          lavender: '#f5f3ff',
          bg: '#f8fafc',
          text: {
            main: '#0f172a',
            muted: '#64748b',
            subtle: '#94a3b8',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 12px 40px 0 rgba(37, 99, 235, 0.12)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.25)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
