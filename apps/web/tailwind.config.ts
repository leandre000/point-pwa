import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          tint: 'var(--color-primary-tint)',
        },
        'on-primary': 'var(--color-on-primary)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          text: 'var(--color-accent-text)',
          tint: 'var(--color-accent-tint)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          tint: 'var(--color-info-tint)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          tint: 'var(--color-success-tint)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          tint: 'var(--color-warning-tint)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          tint: 'var(--color-danger-tint)',
        },
      },
      borderRadius: {
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        sheet: 'var(--radius-sheet)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        float: 'var(--shadow-float)',
      },
      fontFamily: {
        sans: ['var(--font-family)'],
      },
    },
  },
  plugins: [],
};

export default config;

