/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#17243B',
          50: '#F3F5F9', 100: '#E4E9F1', 200: '#C8D1E0', 300: '#9CABC3', 400: '#6C7E9C',
          500: '#4A5D7E', 600: '#334566', 700: '#26365A', 800: '#1D2C49', 900: '#17243B', 950: '#0F1828',
        },
        brand: { red: '#D71920', 'red-dark': '#B3141A', 'red-soft': '#FDEDED' },
        chart: { DEFAULT: '#2C5E9E', track: '#E7EBF1' },
        paper: '#F4F5F7',
        line: '#E2E6EC',
        ink: '#141C2B',
        muted: '#5B6577',
        good: { DEFAULT: '#1E7A4C', soft: '#E6F4EC' },
        warn: { DEFAULT: '#9A5B00', soft: '#FDF3E1' },
        bad: { DEFAULT: '#B42318', soft: '#FDECEA' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: { card: '0 1px 2px rgba(20,28,43,.04), 0 1px 3px rgba(20,28,43,.06)' },
    },
  },
  plugins: [],
};
