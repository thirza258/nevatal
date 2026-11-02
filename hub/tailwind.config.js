import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Taken from the logo: Nevatal yellow, the wordmark blue and the plum
      // dots. Sections are only ever white (`paper`) or yellow (`sun`); ink is
      // for type and small UI. `blue` is deliberately not overridden, so
      // Tailwind's own blue scale keeps working.
      colors: {
        ink: '#0B0B0D',
        'ink-2': '#1B1B20',
        paper: '#FFFFFF',
        'paper-2': '#F6F5F1',
        sun: '#FFC700',
        'sun-soft': '#FFF3C2',
        cobalt: '#0069D6',
        plum: '#600061',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [typography],
}
