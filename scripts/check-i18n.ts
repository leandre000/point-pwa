/**
 * KIRAKA i18n Key Check — CI Gate
 *
 * Compares keys across all locale files and fails if any key is missing.
 *
 * Run: npx tsx scripts/check-i18n.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const LOCALES = ['en', 'rw', 'fr'] as const;
const MESSAGES_DIR = resolve(import.meta.dirname ?? __dirname, '../apps/web/src/i18n/messages');

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

let failures = 0;

// Load all locale files
const localeKeys: Record<string, Set<string>> = {};

for (const locale of LOCALES) {
  const filePath = resolve(MESSAGES_DIR, `${locale}.json`);
  if (!existsSync(filePath)) {
    console.error(`✗ Missing locale file: ${locale}.json`);
    failures++;
    continue;
  }
  const content = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
  localeKeys[locale] = new Set(flattenKeys(content));
}

if (Object.keys(localeKeys).length < LOCALES.length) {
  console.error(`\n✗ ${failures} locale file(s) missing.`);
  process.exit(1);
}

// Compute the union of all keys
const allKeys = new Set<string>();
for (const keys of Object.values(localeKeys)) {
  for (const key of keys) allKeys.add(key);
}

console.log('KIRAKA i18n Key Check');
console.log('=====================');
console.log(`Total unique keys: ${allKeys.size}`);

for (const locale of LOCALES) {
  const missing = [...allKeys].filter((k) => !localeKeys[locale]?.has(k));
  if (missing.length > 0) {
    failures += missing.length;
    console.log(`\n✗ ${locale}.json is missing ${missing.length} key(s):`);
    for (const key of missing.slice(0, 20)) {
      console.log(`    - ${key}`);
    }
    if (missing.length > 20) {
      console.log(`    ... and ${missing.length - 20} more`);
    }
  } else {
    console.log(`✓ ${locale}.json — all keys present`);
  }
}

console.log(`\n${failures === 0 ? '✓ All locales complete!' : `✗ ${failures} missing key(s) found.`}`);
process.exit(failures > 0 ? 1 : 0);
