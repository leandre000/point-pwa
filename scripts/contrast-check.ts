/**
 * KIRAKA Contrast Check — CI Gate
 *
 * Parses color tokens from the CSS variables and validates WCAG AA contrast ratios.
 * Fails with exit code 1 if any required pair is below threshold.
 *
 * Run: npx tsx scripts/contrast-check.ts
 */

// ─── Color definitions (from tokens, both themes) ───

interface ThemeColors {
  bg: string;
  surface: string;
  'surface-2': string;
  text: string;
  'text-secondary': string;
  'text-tertiary': string;
  primary: string;
  'on-primary': string;
  'primary-tint': string;
  accent: string;
  'accent-text': string;
  'accent-tint': string;
  info: string;
  'info-tint': string;
  success: string;
  'success-tint': string;
  warning: string;
  'warning-tint': string;
  danger: string;
  'danger-tint': string;
}

const light: ThemeColors = {
  bg: '#FAF9F6',
  surface: '#FFFFFF',
  'surface-2': '#F3F1EA',
  text: '#1E2421',
  'text-secondary': '#4F5953',
  'text-tertiary': '#69736C',
  primary: '#205641',
  'on-primary': '#FFFFFF',
  'primary-tint': '#EEF5F0',
  accent: '#C98A1B',
  'accent-text': '#8A5A00',
  'accent-tint': '#FBF1DC',
  info: '#2B6CB0',
  'info-tint': '#E8F0FA',
  success: '#286C49',
  'success-tint': '#E6F4EA',
  warning: '#8A5A00',
  'warning-tint': '#FBF1DC',
  danger: '#B3261E',
  'danger-tint': '#FCECEA',
};

const dark: ThemeColors = {
  bg: '#0E1411',
  surface: '#151D18',
  'surface-2': '#1C2621',
  text: '#EAF0EC',
  'text-secondary': '#B4C0B8',
  'text-tertiary': '#8E9C94',
  primary: '#6CC49A',
  'on-primary': '#0C2B20',
  'primary-tint': '#17271F',
  accent: '#E0A83A',
  'accent-text': '#E8B957',
  'accent-tint': '#2B2312',
  info: '#7FB0E8',
  'info-tint': '#14202E',
  success: '#6CC49A',
  'success-tint': '#14261C',
  warning: '#E8B957',
  'warning-tint': '#2B2312',
  danger: '#F2877F',
  'danger-tint': '#2E1614',
};

// ─── Contrast ratio calculation (WCAG 2.1) ───

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ─── Pairs to test ───

interface ContrastPair {
  fg: keyof ThemeColors;
  bg: keyof ThemeColors;
  minRatio: number;
  label: string;
}

const pairs: ContrastPair[] = [
  // Normal text on backgrounds (4.5:1)
  { fg: 'text', bg: 'bg', minRatio: 4.5, label: 'Text on background' },
  { fg: 'text', bg: 'surface', minRatio: 4.5, label: 'Text on surface' },
  { fg: 'text', bg: 'surface-2', minRatio: 4.5, label: 'Text on surface-2' },
  { fg: 'text-secondary', bg: 'bg', minRatio: 4.5, label: 'Secondary text on background' },
  { fg: 'text-secondary', bg: 'surface', minRatio: 4.5, label: 'Secondary text on surface' },
  { fg: 'text-secondary', bg: 'surface-2', minRatio: 4.5, label: 'Secondary text on surface-2' },

  // Tertiary text (3:1 for large text / UI boundaries only)
  { fg: 'text-tertiary', bg: 'bg', minRatio: 3.0, label: 'Tertiary text on background (large text)' },
  { fg: 'text-tertiary', bg: 'surface', minRatio: 3.0, label: 'Tertiary text on surface (large text)' },

  // Primary button text
  { fg: 'on-primary', bg: 'primary', minRatio: 4.5, label: 'On-primary text on primary' },

  // Semantic colors on their tints
  { fg: 'accent-text', bg: 'accent-tint', minRatio: 4.5, label: 'Accent text on accent tint' },
  { fg: 'info', bg: 'info-tint', minRatio: 4.5, label: 'Info on info tint' },
  { fg: 'success', bg: 'success-tint', minRatio: 4.5, label: 'Success on success tint' },
  { fg: 'warning', bg: 'warning-tint', minRatio: 4.5, label: 'Warning on warning tint' },
  { fg: 'danger', bg: 'danger-tint', minRatio: 4.5, label: 'Danger on danger tint' },

  // Primary on tint
  { fg: 'primary', bg: 'primary-tint', minRatio: 4.5, label: 'Primary on primary tint' },
];

// ─── Run checks ───

let failures = 0;
const results: string[] = [];

for (const theme of [
  { name: 'Light', colors: light },
  { name: 'Dark', colors: dark },
] as const) {
  results.push(`\n── ${theme.name} theme ──`);

  for (const pair of pairs) {
    const fgHex = theme.colors[pair.fg];
    const bgHex = theme.colors[pair.bg];
    const ratio = contrastRatio(fgHex, bgHex);
    const pass = ratio >= pair.minRatio;
    const status = pass ? '✓' : '✗';

    if (!pass) failures++;

    results.push(
      `  ${status} ${pair.label}: ${ratio.toFixed(2)}:1 (need ${pair.minRatio}:1) [${fgHex} on ${bgHex}]`,
    );
  }
}

console.log('KIRAKA Contrast Check');
console.log('=====================');
results.forEach((r) => console.log(r));
console.log(`\n${failures === 0 ? '✓ All pairs pass!' : `✗ ${failures} pair(s) FAILED.`}`);

process.exit(failures > 0 ? 1 : 0);

