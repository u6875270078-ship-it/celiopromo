/**
 * One-shot script: trim all products to max 5 images.
 * Run: node scripts/trim-images.mjs
 * Requires the app server to be running on localhost:5000.
 */

const API = 'http://localhost:5000/api';
const MAX_IMAGES = 5; // 1 mainImage + 4 extra

async function run() {
  // Fetch all products (paginate if needed)
  let page = 1, total = 0, updated = 0, skipped = 0;

  console.log('Fetching all products...');
  let allProducts = [];

  while (true) {
    const res  = await fetch(`${API}/products?limit=100&page=${page}`);
    const data = await res.json();
    const products = data.products || data;
    if (!Array.isArray(products) || products.length === 0) break;
    allProducts = allProducts.concat(products);
    total += products.length;
    if (products.length < 100) break;
    page++;
  }

  console.log(`Found ${total} products. Trimming to ${MAX_IMAGES} images each...\n`);

  for (const p of allProducts) {
    const currentImages = Array.isArray(p.images) ? p.images : [];
    const totalImgs = 1 + currentImages.length; // mainImage + extras

    if (totalImgs <= MAX_IMAGES) {
      skipped++;
      continue;
    }

    // Keep mainImage as is, trim extras to MAX_IMAGES - 1
    const trimmedImages = currentImages.slice(0, MAX_IMAGES - 1);

    const res = await fetch(`${API}/products/${p.id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ images: trimmedImages }),
    });

    if (res.ok) {
      updated++;
      console.log(`  ✅ [${p.id}] ${p.name?.substring(0, 50)} → ${trimmedImages.length + 1} images`);
    } else {
      const err = await res.json().catch(() => ({}));
      console.log(`  ❌ [${p.id}] ${p.name?.substring(0, 50)} — ${JSON.stringify(err).substring(0, 100)}`);
    }
  }

  console.log(`\nDone. Updated: ${updated} | Already OK: ${skipped} | Total: ${total}`);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
