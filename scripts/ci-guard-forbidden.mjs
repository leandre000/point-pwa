/**
 * CI Guard: Forbidden Markers Scanner (Rules 2.1, 3.1 & D-014, D-022)
 * Fails the build if forbidden markers appear in app source:
 * - Faker, mock data, lorem ipsum, demo ribbons
 * - Test/demo OTPs, devCode, OTP bypass flags
 */

import fs from 'fs';
import path from 'path';

const FORBIDDEN_PATTERNS = [
  { pattern: /\bfrom\s+['"]@faker-js/i, reason: 'Faker library import forbidden in app source' },
  { pattern: /\bfaker\./i, reason: 'Faker usage forbidden in app source' },
  { pattern: /\blorem\s+ipsum/i, reason: 'Lorem ipsum placeholder text forbidden' },
  { pattern: /Demo\s+Environment/i, reason: 'Demo Environment ribbon or badge forbidden' },
  { pattern: /Demo\s+Ribbon/i, reason: 'Demo Ribbon forbidden' },
  { pattern: /\bdevCode\b/, reason: 'devCode leak forbidden (Rule D-022: no endpoint may return OTP code)' },
  { pattern: /\bOTP_BYPASS\b/i, reason: 'OTP bypass flags forbidden in app source' },
  { pattern: /['"]123456['"]/, reason: 'Hard-coded magic OTP code 123456 forbidden' },
  { pattern: /\bSEED_JOBS\b/, reason: 'Hard-coded seed jobs forbidden in app source' },
  { pattern: /\bSEED_PROVIDERS\b\s*=\s*\[\s*\{/, reason: 'Hard-coded seed providers forbidden in app source' },
  { pattern: /\bSEED_MESSAGES\b\s*=\s*\[\s*\{/, reason: 'Hard-coded seed messages forbidden in app source' },
];

const SCAN_DIRS = [
  'apps/web/src',
  'apps/api/src',
  'apps/admin/src',
  'packages/contracts/src',
  'packages/ui/src',
];

const IGNORE_PATTERNS = [
  /\.test\.(ts|tsx|js|jsx)$/,
  /\.spec\.(ts|tsx|js|jsx)$/,
  /__tests__/,
  /node_modules/,
  /\.next/,
  /dist/,
];

let violationsCount = 0;

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (IGNORE_PATTERNS.some((p) => p.test(fullPath))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
          if (pattern.test(line)) {
            console.error(
              `❌ [FORBIDDEN MARKER] ${fullPath}:${index + 1} - ${reason}\n   Line: ${line.trim()}`
            );
            violationsCount++;
          }
        }
      });
    }
  }
}

console.log('🔍 Running CI Guard: Scanning app source for forbidden demo/mock markers & OTP leaks...');
for (const dir of SCAN_DIRS) {
  const targetDir = path.resolve(process.cwd(), dir);
  scanDirectory(targetDir);
}

if (violationsCount > 0) {
  console.error(`\n❌ CI GUARD FAILED: Found ${violationsCount} forbidden markers in app source!`);
  console.error('Remove all mock data, faker, lorem ipsum, and demo markers before committing.\n');
  process.exit(1);
} else {
  console.log('✓ CI Guard passed: Zero forbidden mock/demo/OTP markers found in app source.\n');
}
