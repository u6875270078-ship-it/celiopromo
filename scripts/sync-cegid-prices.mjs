/**
 * Sync Italian retail prices (and stock) from CEGID Y2 API into the DB.
 *
 * Requirements:
 *   • Products must have EAN13 barcodes in their variants (field: variant.barcode)
 *   • CEGID_USER and CEGID_PASS must be set in .env
 *
 * Run:  node scripts/sync-cegid-prices.mjs
 * Dry:  DRY_RUN=1 node scripts/sync-cegid-prices.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const CEGID_BASE  = process.env.CEGID_BASE  || 'https://90554163-retail-ondemand.cegid.cloud/Y2/90554163_001_PROD/api/stores/6312';
const CEGID_USER  = process.env.CEGID_USER  || '90554163_001_PROD\\ECOMMERCE';
const CEGID_PASS  = process.env.CEGID_PASS  || 'cegid';
const DRY_RUN     = process.env.DRY_RUN === '1';
const BATCH       = 50; // barcodes per API call

const authHeader = 'Basic ' + Buffer.from(`${CEGID_USER}:${CEGID_PASS}`).toString('base64');
const today      = new Date().toISOString().split('T')[0];

// ── Call CEGID Prices API for a batch of barcodes ─────────────────────────────
async function fetchPrices(barcodes) {
  const params = barcodes.map(b => `barcodes=${encodeURIComponent(b)}`).join('&');
  const url    = `${CEGID_BASE}/selling-prices/v1?date=${today}&taxExcluded=false&${params}`;
  const res    = await fetch(url, { headers: { Authorization: authHeader } });
  if (!res.ok) throw new Error(`CEGID prices API ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
  return res.json(); // { currencyId, prices: [{ barcode, unitPrice: { base, current } }] }
}

// ── Call CEGID Inventory API for a batch of barcodes ─────────────────────────
async function fetchStock(barcodes) {
  const params = barcodes.map(b => `barcodes=${encodeURIComponent(b)}`).join('&');
  const url    = `${CEGID_BASE}/available-quantities/v1?${params}`;
  const res    = await fetch(url, { headers: { Authorization: authHeader } });
  if (!res.ok) throw new Error(`CEGID inventory API ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
  return res.json(); // [{ barcode, physicalQty, availableQty }]
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to DB');
  if (DRY_RUN) console.log('🧪 DRY RUN — no DB writes');

  // Load all products that have at least one variant with a barcode
  const { rows } = await client.query(`
    SELECT id, sku, price, variants
    FROM products
    WHERE variants IS NOT NULL
  `);
  console.log(`📦 ${rows.length} products loaded`);

  // Build barcode → product mapping
  // barcode → { productId, variantIdx, basePrice }
  const barcodeIndex = new Map(); // barcode → [productId, ...]
  const productVariants = new Map(); // productId → parsed variants array

  let totalBarcodes = 0;

  for (const row of rows) {
    let variants = row.variants;
    if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
    if (!Array.isArray(variants)) continue;
    productVariants.set(row.id, variants);

    for (const v of variants) {
      if (v.barcode && /^\d{8,14}$/.test(v.barcode)) {
        if (!barcodeIndex.has(v.barcode)) barcodeIndex.set(v.barcode, []);
        barcodeIndex.get(v.barcode).push(row.id);
        totalBarcodes++;
      }
    }
  }

  const uniqueBarcodes = [...barcodeIndex.keys()];
  console.log(`🔍 ${uniqueBarcodes.length} unique EAN barcodes found (${totalBarcodes} total variant barcodes)`);

  if (uniqueBarcodes.length === 0) {
    console.log('\n⚠️  No barcodes found in DB variants!');
    console.log('   → Re-run the scraper to populate barcodes, then run this script again.');
    await client.end();
    return;
  }

  // Fetch prices from CEGID in batches
  const priceMap  = new Map(); // barcode → { base, current }
  const stockMap  = new Map(); // barcode → availableQty

  console.log(`\n📡 Calling CEGID API in batches of ${BATCH}...`);
  for (let i = 0; i < uniqueBarcodes.length; i += BATCH) {
    const batch = uniqueBarcodes.slice(i, i + BATCH);
    process.stdout.write(`  Prices batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(uniqueBarcodes.length / BATCH)}...`);

    try {
      const priceData = await fetchPrices(batch);
      for (const item of priceData.prices || []) {
        if (item.barcode && item.unitPrice) {
          priceMap.set(item.barcode, {
            base:    parseFloat(item.unitPrice.base)    || 0,
            current: parseFloat(item.unitPrice.current) || 0,
          });
        }
      }
      process.stdout.write(' ✅\n');
    } catch (e) {
      process.stdout.write(` ❌ ${e.message}\n`);
    }

    // Small delay between batches
    if (i + BATCH < uniqueBarcodes.length) await new Promise(r => setTimeout(r, 300));
  }

  for (let i = 0; i < uniqueBarcodes.length; i += BATCH) {
    const batch = uniqueBarcodes.slice(i, i + BATCH);
    process.stdout.write(`  Stock batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(uniqueBarcodes.length / BATCH)}...`);

    try {
      const stockData = await fetchStock(batch);
      for (const item of (Array.isArray(stockData) ? stockData : stockData.items || [])) {
        if (item.barcode) stockMap.set(item.barcode, Math.max(0, Math.floor(item.availableQty || 0)));
      }
      process.stdout.write(' ✅\n');
    } catch (e) {
      process.stdout.write(` ❌ ${e.message}\n`);
    }

    if (i + BATCH < uniqueBarcodes.length) await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n💰 Price data: ${priceMap.size} barcodes matched`);
  console.log(`📊 Stock data: ${stockMap.size} barcodes matched`);

  // Update products: use ANY barcode from their variants to get the price
  let updated = 0, skipped = 0;

  for (const [productId, variants] of productVariants) {
    // Find first variant with a price from CEGID
    let bestPrice = null;
    let totalStock = 0;
    const updatedVariants = variants.map(v => {
      const p = v.barcode ? priceMap.get(v.barcode) : null;
      const q = v.barcode ? stockMap.get(v.barcode) : null;
      if (p && !bestPrice) bestPrice = p;
      const newQty = q !== undefined ? q : (v.quantity || 0);
      totalStock += newQty;
      return { ...v, quantity: newQty, price: p ? p.current.toFixed(2) : v.price };
    });

    if (!bestPrice) { skipped++; continue; }

    const newPrice    = bestPrice.current.toFixed(2);
    const newBase     = bestPrice.base.toFixed(2);
    const isOnSale    = bestPrice.current < bestPrice.base;
    const salePrice   = isOnSale ? newPrice : null;

    if (!DRY_RUN) {
      await client.query(
        `UPDATE products
            SET price               = $1,
                sale_price          = $2,
                is_on_sale          = $3,
                stock               = $4,
                variants            = $5,
                updated_at          = NOW()
          WHERE id = $6`,
        [newBase, salePrice, isOnSale, totalStock, JSON.stringify(updatedVariants), productId]
      );
    } else {
      console.log(`  [DRY] id=${productId} price ${newBase} → ${newPrice} sale=${isOnSale} stock=${totalStock}`);
    }

    updated++;
    if (updated % 100 === 0) console.log(`  … ${updated} products updated`);
  }

  await client.end();
  console.log('\n✅ Done!');
  console.log(`   Updated : ${updated}`);
  console.log(`   Skipped : ${skipped} (no matching barcode in CEGID response)`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
