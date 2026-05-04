import { readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const sqlFile = path.join(__dirname, '../drizzle/0000_quick_mother_askani.sql');
const sql = readFileSync(sqlFile, 'utf-8');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('✅ Connected to Neon DB');

  // Split on --> statement-breakpoint and run each statement
  const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  console.log(`📋 Running ${statements.length} SQL statements...`);

  let ok = 0, skip = 0;
  for (const stmt of statements) {
    try {
      await client.query(stmt);
      ok++;
    } catch (e) {
      if (e.message.includes('already exists')) { skip++; }
      else console.error('  ⚠️ ', e.message.substring(0, 120));
    }
  }

  console.log(`\n✅ Done: ${ok} executed, ${skip} already existed`);

  // Seed categories from database_setup.sql
  const seedFile = path.join(__dirname, '../database_setup.sql');
  const seedSql = readFileSync(seedFile, 'utf-8');
  try {
    await client.query(seedSql);
    console.log('🌱 Seed data inserted');
  } catch (e) {
    console.log('🌱 Seed data (some may already exist):', e.message.substring(0, 100));
  }

  await client.end();
  console.log('\n🎉 Database setup complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
