/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@royal-spirits/ui/tailwind.preset.cjs')],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
