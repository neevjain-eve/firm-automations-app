/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -2px rgb(0 0 0 / 0.05)',
        card: '0 1px 2px 0 rgb(0 0 0 / 0.03), 0 8px 24px -12px rgb(0 0 0 / 0.08)'
      },
      colors: {
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca'
        }
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        blob: 'blob 14s infinite ease-in-out',
        'fade-up': 'fade-up 0.5s ease-out both'
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgb(0 0 0 / 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgb(0 0 0 / 0.035) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
};
