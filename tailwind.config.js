/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        fun: ['Fredoka', 'Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        neon: {
          pink: '#f43f5e',
          fuchsia: '#d946ef',
          purple: '#a855f7',
          flame: '#ff5e3a',
          amber: '#f59e0b'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 25px rgba(244, 63, 94, 0.6), 0 0 50px rgba(168, 85, 247, 0.3)'
          },
          '50%': {
            opacity: '.8',
            boxShadow: '0 0 15px rgba(244, 63, 94, 0.3), 0 0 30px rgba(168, 85, 247, 0.15)'
          },
        }
      }
    },
  },
  plugins: [],
}
