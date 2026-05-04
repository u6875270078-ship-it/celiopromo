/**
 * One-time DB cleanup: remove the French flag SVG that was accidentally
 * scraped as the first image for all recently-inserted products.
 *
 * Run: node scripts/remove-flag-images.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const isJunk = (url) =>
  !url ||
  url.includes('flag_FR') ||
  url.includes('/header/') ||
  /\.svg(\?|$)/.test(url);

const clean = (arr) => (Array.isArray(arr) ? arr.filter(u => !isJunk(u)) : []);

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to database');

  // Fetch all products that have image fields
  const { rows } = await client.query(
    `SELECT id, main_image, images, color_images FROM products`
  );
  console.log(`📦 Total products: ${rows.length}`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    // ── Collect all raw images ──────────────────────────────────────────────
    const rawMain  = row.main_image;
    const rawImgs  = Array.isArray(row.images) ? row.images : [];
    const rawCI    = row.color_images; // already parsed by pg as JS object

    // ── Clean mainImage + images ────────────────────────────────────────────
    const allUrls   = [rawMain, ...rawImgs].filter(Boolean);
    const validUrls = allUrls.filter(u => !isJunk(u));
    const newMain   = validUrls[0] ?? null;
    const newImgs   = validUrls.slice(1);

    // ── Clean colorImages map ───────────────────────────────────────────────
    let newCI = rawCI;
    if (rawCI && typeof rawCI === 'object') {
      const cleaned = {};
      for (const [color, urls] of Object.entries(rawCI)) {
        cleaned[color] = clean(urls);
      }
      newCI = cleaned;
    }

    // ── Decide if update is needed ──────────────────────────────────────────
    const mainChanged = newMain !== rawMain;
    const imgsChanged = JSON.stringify(newImgs) !== JSON.stringify(rawImgs);
    const ciChanged   = JSON.stringify(newCI)   !== JSON.stringify(rawCI);

    if (!mainChanged && !imgsChanged && !ciChanged) {
      skipped++;
      continue;
    }

    await client.query(
      `UPDATE products
          SET main_image   = $1,
              images       = $2,
              color_images = $3,
              updated_at   = NOW()
        WHERE id = $4`,
      [newMain, JSON.stringify(newImgs), newCI ? JSON.stringify(newCI) : null, row.id]
    );
    updated++;

    if (updated % 50 === 0) {
      console.log(`  … updated ${updated} products so far`);
    }
  }

  await client.end();
  console.log(`\n✅ Done!`);
  console.log(`   Updated : ${updated}`);
  console.log(`   Skipped : ${skipped} (already clean)`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
