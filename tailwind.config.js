/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.2), 0 1px 6px -2px rgb(0 0 0 / 0.3)',
        card: '0 1px 2px 0 rgb(0 0 0 / 0.2), 0 12px 32px -12px rgb(0 0 0 / 0.5)',
        glow: '0 0 0 1px rgb(99 102 241 / 0.15), 0 8px 30px -8px rgb(99 102 241 / 0.35)',
        'glow-lg': '0 0 0 1px rgb(99 102 241 / 0.2), 0 20px 60px -12px rgb(99 102 241 / 0.45)'
      },
      colors: {
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
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
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        blob: 'blob 16s infinite ease-in-out',
        'fade-up': 'fade-up 0.5s ease-out both',
        shimmer: 'shimmer 3s linear infinite'
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.045) 1px, transparent 1px)',
        'radial-spotlight': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgb(99 102 241 / 0.25), transparent)',
        'radial-fade': 'radial-gradient(circle at center, black 0%, transparent 70%)'
      }
    }
  },
  plugins: []
};
