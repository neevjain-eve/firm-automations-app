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
        glow: '0 0 0 1px rgb(248 160 6 / 0.15), 0 8px 30px -8px rgb(248 160 6 / 0.35)',
        'glow-lg': '0 0 0 1px rgb(248 160 6 / 0.2), 0 20px 60px -12px rgb(248 160 6 / 0.45)'
      },
      colors: {
        // Brand orange (#F8A006) — primary actions and active states only.
        accent: {
          50: '#fef6e7',
          100: '#fdecc9',
          200: '#fbdb93',
          300: '#fbc670',
          400: '#fab43d',
          500: '#f8a006',
          600: '#d98a02',
          700: '#b06e02',
          800: '#855302',
          900: '#5c3a02'
        },
        // Neutral scale built from brand blue-grey (#1F5880) — replaces zinc.
        ink: {
          50: '#f3f7fa',
          100: '#e4ecf2',
          200: '#c9d8e3',
          300: '#a6bdce',
          400: '#7d9ab0',
          500: '#5c7c93',
          600: '#45627a',
          700: '#344c5d',
          800: '#24384a',
          900: '#182634',
          950: '#0f1922'
        },
        warning: '#c99a2e'
      },
      fontSize: {
        display: ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.02em' }],
        'title-lg': ['1.375rem', { lineHeight: '1.875rem', letterSpacing: '-0.01em' }],
        title: ['1.0625rem', { lineHeight: '1.5rem' }],
        'title-sm': ['0.9375rem', { lineHeight: '1.375rem' }],
        body: ['0.875rem', { lineHeight: '1.3125rem' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.1875rem' }],
        label: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        caption: ['0.6875rem', { lineHeight: '0.875rem' }],
        'numeric-lg': ['1.25rem', { lineHeight: '1.625rem' }],
        numeric: ['0.875rem', { lineHeight: '1.25rem' }]
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
        'radial-spotlight': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgb(248 160 6 / 0.18), transparent)',
        'radial-fade': 'radial-gradient(circle at center, black 0%, transparent 70%)'
      }
    }
  },
  plugins: []
};
