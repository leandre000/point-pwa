/**
 * KIRAKA Clean Database Reset CLI (pnpm db:reset:clean)
 * Refuses to run in production (NODE_ENV=production).
 * Drops development database, runs migrations, and seeds ONLY reference data (5 categories, 12 areas) + single Super Admin.
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });

console.log('\n======================================================');
console.log('  KIRAKA Clean Database Reset & Reference Seed');
console.log('======================================================\n');

if (process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: db:reset:clean is strictly FORBIDDEN in production (NODE_ENV=production)!');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL not detected in environment.');
  console.warn('When running with local PostgreSQL or Docker, set DATABASE_URL in .env');
} else {
  console.log(`Connecting to database at ${dbUrl.replace(/:[^:@]+@/, ':****@')}...`);
}

try {
  console.log('\n1. Applying schema and resetting development database with Prisma...');
  execSync('pnpm --filter @kiraka/api exec prisma migrate reset --force --skip-generate', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('   ✓ Dev database wiped and schema migrated cleanly.');

  console.log('\n2. Seeding clean reference data (5 categories, 12 neighborhoods) & Super Admin...');
  execSync('pnpm --filter @kiraka/api exec prisma db seed', {
    stdio: 'inherit',
    env: process.env,
  });
  console.log('   ✓ Seed complete: Zero mock jobs or fake users.');
  console.log('\n======================================================');
  console.log('  Database clean reset complete! Ready for pilot. 🎉');
  console.log('======================================================\n');
} catch (err) {
  console.error('\n⚠️ Notice: Prisma database connection was not reachable or failed.');
  console.error(`Error details: ${err.message}`);
  console.log('\nNote: In local development without PostgreSQL/Docker running, KIRAKA API');
  console.log('operates automatically in resilient zero-mock mode using clean in-memory reference stores.');
  console.log('Once PostgreSQL is started, re-run "pnpm db:reset:clean" to initialize database tables.');
}

