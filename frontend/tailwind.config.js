import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  // `prose` was already used on every result panel but rendered as a no-op
  // without this plugin, so markdown answers came out unstyled.
  plugins: [typography],
}
