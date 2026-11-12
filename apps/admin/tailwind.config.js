/** @type {any} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          tint: 'var(--primary-tint)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          text: 'var(--accent-text)',
          tint: 'var(--accent-tint)',
        },
      },
    },
  },
  plugins: [],
};

