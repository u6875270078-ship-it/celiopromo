/**
 * Visits each celio.com product page and extracts EAN13 barcodes from JSON-LD.
 * Stores barcodes inside the variants[] JSON in the DB (variant.barcode field).
 *
 * Run:  node scripts/get-barcodes.mjs
 * Dry:  DRY_RUN=1 node scripts/get-barcodes.mjs
 *
 * Progress is saved to scripts/barcode-progress.json so you can resume if interrupted.
 */
import 'dotenv/config';
import puppeteer from 'puppeteer';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const DRY_RUN       = process.env.DRY_RUN === '1';
const PROGRESS_FILE = path.join(import.meta.dirname || '.', 'barcode-progress.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); }
  catch { return { doneSKUs: [] }; }
}
function saveProgress(p) { fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2)); }

// Reconstruct celio.com product URL from slug + sku
function productUrl(slug, sku) {
  // slug = "product-name-color-1234567", strip trailing -sku to get path
  const base = slug.replace(/-\d+$/, '');
  return `https://www.celio.com/fr-fr/p/${base}/${sku}.html`;
}

// Extract barcodes from the page via JSON-LD
async function extractBarcodes(page, url) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  } catch (e) {
    return null;
  }
  await sleep(4000);

  const text = await page.evaluate(() => (document.body?.innerText || '').toLowerCase()).catch(() => '');
  if (
    text.includes('accès temporairement restreint') ||
    text.includes('temporarily restricted')
  ) {
    console.log('\n  🚫 Rate-limited — waiting 4 min...');
    await sleep(4 * 60 * 1000);
    return null;
  }

  try {
    return await page.evaluate(() => {
      const result = { mainBarcode: null, bySize: {} };
      document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        try {
          const d = JSON.parse(s.textContent || '');
          if (d['@type'] !== 'Product') return;
          if (d.gtin13 || d.gtin) result.mainBarcode = d.gtin13 || d.gtin;
          const offers = d.offers?.offers || (Array.isArray(d.offers) ? d.offers : [d.offers].filter(Boolean));
          (offers || []).forEach(o => {
            const ean = o.gtin13 || o.gtin || '';
            if (ean && /^\d{8,14}$/.test(ean)) {
              const parts = (o.sku || '').split('-');
              const size = parts[parts.length - 1] || '';
              if (size) result.bySize[size] = ean;
              result.mainBarcode = result.mainBarcode || ean;
            }
          });
        } catch {}
      });
      return result;
    });
  } catch (e) {
    // Detached frame or context destroyed — skip this product
    return null;
  }
}

async function main() {
  // Pool automatically reconnects when Neon closes idle connections
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    idleTimeoutMillis: 0,      // don't close idle clients on our side
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', () => {}); // suppress unhandled error events on idle clients
  console.log('✅ Connected to DB (pool)');

  const progress = loadProgress();

  // Load all products with numeric SKU that don't yet have barcodes in variants
  const { rows } = await pool.query(`
    SELECT id, sku, slug, variants
    FROM products
    WHERE sku SIMILAR TO '[0-9]+'
    ORDER BY id
  `);
  console.log(`📦 ${rows.length} products to check`);

  // Filter out already done SKUs
  const todo = rows.filter(r => !progress.doneSKUs.includes(r.sku));
  console.log(`🔄 ${todo.length} remaining (${rows.length - todo.length} already done)\n`);

  if (todo.length === 0) {
    console.log('✅ All products already have barcode data. Run sync-cegid-prices.mjs next.');
    await pool.end();
    return;
  }

  let browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  async function newPage() {
    const p = await browser.newPage();
    await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    await p.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' });
    return p;
  }

  let page = await newPage();

  let updated = 0, failed = 0;

  for (let i = 0; i < todo.length; i++) {
    const row = todo[i];
    const url  = productUrl(row.slug, row.sku);
    process.stdout.write(`\r  [${i + 1}/${todo.length}] SKU ${row.sku} ...           `);

    let data;
    try {
      data = await extractBarcodes(page, url);
    } catch (e) {
      // Page/browser crashed — recreate and skip this product
      console.log(`\n  ⚠️  Browser error (${e.message.slice(0, 60)}) — recreating page...`);
      try { await page.close(); } catch {}
      try { page = await newPage(); } catch {
        await browser.close();
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        page = await newPage();
      }
      failed++;
      progress.doneSKUs.push(row.sku);
      saveProgress(progress);
      continue;
    }

    if (!data || (!data.mainBarcode && Object.keys(data.bySize).length === 0)) {
      failed++;
      progress.doneSKUs.push(row.sku);
      saveProgress(progress);
      await sleep(3000);
      continue;
    }

    // Parse existing variants and inject barcodes
    let variants = row.variants;
    if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
    if (!Array.isArray(variants)) variants = [];

    const updated_variants = variants.map(v => ({
      ...v,
      barcode: data.bySize[v.size] || data.mainBarcode || v.barcode || null,
    }));

    if (!DRY_RUN) {
      await pool.query(
        'UPDATE products SET variants = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updated_variants), row.id]
      );
    } else {
      const sample = updated_variants[0];
      console.log(`\n  [DRY] id=${row.id} SKU ${row.sku} → barcode: ${sample?.barcode}`);
    }

    updated++;
    progress.doneSKUs.push(row.sku);
    if (i % 10 === 0) saveProgress(progress);

    // Polite delay between pages
    await sleep(4000 + Math.random() * 2000);
  }

  saveProgress(progress);
  await browser.close();
  await pool.end();

  console.log('\n\n✅ Done!');
  console.log(`   Updated : ${updated} products`);
  console.log(`   Failed  : ${failed} (no barcode found)`);
  console.log('\n→ Now run: node scripts/sync-cegid-prices.mjs');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
