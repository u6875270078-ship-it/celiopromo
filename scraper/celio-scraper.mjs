/**
 * Celio.com Product Scraper
 *
 * Phase 1 — Category pages (/fr-fr/c/{slug}):
 *   Collect product URLs + basic data (name, price, SKU) from listing pages.
 *   Uses data-tag-analytics + data-pid attributes (proven to work).
 *
 * Phase 2 — Product pages (/fr-fr/p/...):
 *   Visit each product URL to collect ALL images, colors, sizes, description.
 *
 * Usage: node scraper/celio-scraper.mjs
 * Resumable — progress saved after every product.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname      = path.dirname(fileURLToPath(import.meta.url));
const API_BASE       = 'http://localhost:5000/api';
const PROGRESS_FILE  = path.join(__dirname, 'scraper-progress.json');
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

// Exact slugs from celio.com/fr-fr/c/{slug} — same as working Python script
// These are the real slugs the site uses (no -homme suffix for most)
const CATEGORIES = [
  { slug: 'jeans',            category: 'Jeans',              subcategory: 'Jeans' },
  { slug: 'pantalons',        category: 'Pantaloni',          subcategory: 'Pantaloni' },
  { slug: 't-shirts',         category: 'T-Shirt',            subcategory: 'T-Shirt' },
  { slug: 'chemises',         category: 'Camicie',            subcategory: 'Camicie' },
  { slug: 'polos',            category: 'Polo',               subcategory: 'Polo' },
  { slug: 'pulls',            category: 'Maglioni & Felpe',   subcategory: 'Maglioni' },
  { slug: 'sweats',           category: 'Maglioni & Felpe',   subcategory: 'Felpe' },
  { slug: 'vestes',           category: 'Giacche',            subcategory: 'Giacche' },
  { slug: 'manteaux',         category: 'Giacche',            subcategory: 'Cappotti' },
  { slug: 'shorts',           category: 'Pantaloncini',       subcategory: 'Pantaloncini' },
  { slug: 'bermudas',         category: 'Pantaloncini',       subcategory: 'Bermuda' },
  { slug: 'costumes',         category: 'Abiti',              subcategory: 'Abiti' },
  { slug: 'sous-vetements',   category: 'Intimo',             subcategory: 'Intimo' },
  { slug: 'chaussures',       category: 'Scarpe',             subcategory: 'Scarpe' },
  { slug: 'accessoires',      category: 'Accessori',          subcategory: 'Accessori' },
  { slug: 'pyjamas',          category: 'Pigiami',            subcategory: 'Pigiami' },
];

const sleep     = ms       => new Promise(r => setTimeout(r, ms));
const randSleep = (lo, hi) => sleep(lo + Math.random() * (hi - lo));

// ── Extract numeric SKU from a product URL ────────────────────────────────────
function skuFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/(\d{6,})\.html/) || url.match(/-(\d{6,})(?:\.html|\/)?$/);
  return m ? m[1] : null;
}

// ── Progress ──────────────────────────────────────────────────────────────────
function loadProgress() {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')); } catch {}
  return { insertedSkus: [], doneCategories: [] };
}
function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

// ── Insert product into app DB ────────────────────────────────────────────────
// Returns: { id } on insert, { exists: true } if already in DB, null on error
async function insertProduct(product) {
  try {
    const res  = await fetch(`${API_BASE}/products`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(product),
    });
    const body = await res.json();
    if (res.status === 400 && JSON.stringify(body).includes('already exists')) {
      return { exists: true };
    }
    if (!res.ok) {
      console.error(`  ❌ API ${res.status}: ${JSON.stringify(body).substring(0, 200)}`);
      return null;
    }
    return body.product || body;
  } catch (e) {
    console.error(`  ❌ fetch: ${e.message}`);
    return null;
  }
}

// ── Slow scroll (same as working Python script) ───────────────────────────────
async function slowScroll(page) {
  try {
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let pos = 0;
        window.scrollTo(0, 0);
        const t = setInterval(() => {
          const h = document.body.scrollHeight;
          if (pos >= h) { clearInterval(t); resolve(); return; }
          pos = Math.min(pos + 400, h);
          window.scrollTo(0, pos);
        }, 400);
      });
    });
    await sleep(3000);
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    await sleep(500);
  } catch (e) {
    // Page navigated mid-scroll — harmless, just wait
    await sleep(2000);
  }
}

async function acceptCookies(page) {
  try {
    const btn = await page.$('#onetrust-accept-btn-handler, button[id*="accept"], button[class*="accept-all"]');
    if (btn) { await btn.click(); await sleep(1000); }
  } catch {}
}

function applyStealthToPage(page) {
  return page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins',   { get: () => [1,2,3,4,5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR','fr','en-US'] });
    window.chrome = { runtime: {} };
  });
}

// ── PHASE 1: Collect all product URLs from category listing page ──────────────
// Simple and robust — just find all /p/ID.html links, no DOM tree walking needed.
// All product details (name, price, images, colors, sizes) come from Phase 2.
async function collectProductUrls(page) {
  return page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('a[href]').forEach(a => {
      const h = (a.href || '').split('?')[0];
      // Men's product pages: /fr-fr/p/slug/ID.html (no /femme/ prefix)
      if (
        h.includes('celio.com') &&
        h.includes('/p/') &&
        /\/\d{5,}\.html$/.test(h) &&
        !h.includes('/femme/')
      ) set.add(h);
    });
    return [...set];
  });
}

// ── PHASE 2: Visit individual product page to get ALL images + details ─────────
async function scrapeProductPage(page, url) {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    } catch (e) {
      console.log(`  ⚠️  goto failed: ${e.message.substring(0, 60)}`);
      if (attempt === MAX_RETRIES) return null;
      await sleep(10000);
      continue;
    }

    await sleep(6000);
    await slowScroll(page);

    // Check for error or rate-limit page
    const pageText = await page.evaluate(() => (document.body?.innerText || '').toLowerCase()).catch(() => '');
    const isRateLimited = pageText.includes('accès temporairement restreint') || pageText.includes('temporarily restricted');
    const isError = pageText.includes('une erreur est survenue') || pageText.includes('oups') || pageText.includes('page introuvable');

    if (isRateLimited) {
      console.log(`  🚫 Rate-limited on product page! Waiting 4 minutes...`);
      await sleep(4 * 60 * 1000);
      await page.goto('https://www.celio.com/fr-fr', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await sleep(10000);
      continue;
    }

    if (isError) {
      console.log(`  ⚠️  Error page (attempt ${attempt}/${MAX_RETRIES}) — waiting ${attempt * 20}s...`);
      await page.goto('https://www.celio.com/fr-fr', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await sleep(attempt * 20000);
      continue;
    }

    // Soft-block check: page loaded but has no real content (name not found)
    const hasContent = await page.evaluate(() => {
      const h1 = document.querySelector('h1[itemprop="name"], h1[class*="product"], h1[class*="title"], h1');
      return !!(h1?.innerText?.trim());
    }).catch(() => false);

    if (!hasContent) {
      console.log(`  🚫 Soft-block detected (page loaded but empty) — waiting 4 minutes...`);
      await sleep(4 * 60 * 1000);
      await page.goto('https://www.celio.com/fr-fr', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await sleep(10000);
      continue;
    }

    // Successfully loaded — extract data
    return page.evaluate((pageUrl) => {
      // ── EAN13 barcodes from JSON-LD (one per size/variant) ──
      const barcodeMap = {}; // sku-suffix or size → barcode
      let mainBarcode = null;
      try {
        document.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
          try {
            const d = JSON.parse(s.textContent || '');
            if (d['@type'] === 'Product') {
              if (d.gtin13 || d.gtin) mainBarcode = d.gtin13 || d.gtin;
              const offers = d.offers?.offers || (Array.isArray(d.offers) ? d.offers : [d.offers].filter(Boolean));
              (offers || []).forEach(o => {
                const ean = o.gtin13 || o.gtin || o.gtin8 || '';
                if (ean && /^\d{8,14}$/.test(ean)) {
                  const skuSuffix = (o.sku || '').split('-').pop();
                  if (skuSuffix) barcodeMap[skuSuffix] = ean;
                  barcodeMap['_any'] = ean;
                }
              });
            }
          } catch {}
        });
      } catch {}
      // Also try window.digitalData / SFCC dataLayer
      try {
        const dd = window.digitalData?.product?.[0] || window.digitalData?.product || {};
        const pid = dd?.productInfo?.productID || dd?.attributes?.baseProductID;
        if (pid) barcodeMap['_pid'] = pid;
      } catch {}

      // ── All demandware images ──
      const imageSet = new Set();
      document.querySelectorAll('img').forEach(img => {
        const src = (img.currentSrc || img.src || img.dataset.src || '').trim();
        if (!src || src.startsWith('data:')) return;
        const full = src.startsWith('//') ? 'https:' + src : src;
        if (!full.includes('demandware.static') && !full.includes('demandware.net')) return;
        if (full.includes('Library-Sites') || full.includes('img-menu') || full.includes('swatch')) return;
        // Remove query string, then add high-res params
        const clean = full.replace(/\?.*$/, '');
        if (clean) imageSet.add(clean);
      });
      // Also check data-full-image, data-zoom attributes for hi-res versions
      document.querySelectorAll('[data-full-image],[data-zoom-url],[data-lgimg]').forEach(el => {
        const src = el.dataset.fullImage || el.dataset.zoomUrl || el.dataset.lgimg || '';
        if (src?.includes('demandware')) imageSet.add(src.replace(/\?.*$/, ''));
      });
      const images = [...imageSet].slice(0, 5);

      // ── Colors ──────────────────────────────────────────────────────────────
      const SIZE_PATTERN = /^(2XS|3XS|XS|S|M|L|XL|2XL|3XL|XXL|XXXL|\d{2}\/\d{2}|\d{2,3})$/i;
      const colorSet = new Set();

      // SFCC: color swatches live under [data-attr="color"] or [data-attr="couleur"]
      document.querySelectorAll('[data-attr="color"] [data-attr-value], [data-attr="couleur"] [data-attr-value]').forEach(el => {
        const c = (el.dataset.attrValue || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
        if (c && c.length > 1 && c.length < 50 && !SIZE_PATTERN.test(c)) colorSet.add(c);
      });

      // Fallback 1: generic swatch elements
      if (colorSet.size === 0) {
        document.querySelectorAll('.b-swatch_color, [class*="color-swatch"], [data-color], .b-swatches_list li, [class*="swatch-value"]').forEach(el => {
          const c = (el.dataset.color || el.dataset.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
          if (c && c.length > 1 && c.length < 50 && !SIZE_PATTERN.test(c)) colorSet.add(c);
        });
      }

      // Fallback 2: extract color from the URL slug (celio pattern: /name---color/SKU.html)
      // e.g. /t-shirt-slim---bleu-marine/1187149.html → "bleu marine"
      if (colorSet.size === 0) {
        const m = pageUrl.match(/---([a-z][a-z0-9-]{1,40})\/\d+\.html$/i);
        if (m) {
          const fromUrl = m[1].replace(/-/g, ' ').trim();
          // Only use if it looks like a color, not a product type
          const productTypes = /^(t-shirt|tshirt|polo|jean|chemise|pull|veste|short|pantalon|sweat|maillot|costume|homme)/i;
          if (!productTypes.test(fromUrl)) colorSet.add(fromUrl);
        }
      }

      const colors = [...colorSet];

      // ── Sizes — scoped ONLY to size attribute ──
      const sizeSet = new Set();
      document.querySelectorAll('[data-attr="size"] [data-attr-value], [data-attr="taille"] [data-attr-value]').forEach(el => {
        const s = (el.dataset.attrValue || el.innerText || '').trim();
        if (s && s.length > 0 && s.length < 10) sizeSet.add(s);
      });
      // Fallback
      if (sizeSet.size === 0) {
        document.querySelectorAll('.b-size_button, button[class*="size"], [class*="size-btn"], [data-size]').forEach(el => {
          const s = (el.dataset.size || el.dataset.attrValue || el.innerText || '').trim();
          if (s && s.length > 0 && s.length < 10) sizeSet.add(s);
        });
      }
      const sizes = sizeSet.size > 0 ? [...sizeSet] : ['XS','S','M','L','XL','XXL'];

      // ── Description ──
      const descEl = document.querySelector([
        '[itemprop="description"]',
        '.b-product_long_description',
        '[class*="pdp-desc"]',
        '[class*="description"] p',
        '.pdp-description',
      ].join(','));
      const description = descEl?.innerText?.trim().substring(0, 800) || null;

      // ── Material ──
      const matEl = document.querySelector('[class*="composition"],[class*="material"],[class*="fabric"]');
      const material = matEl?.innerText?.trim().substring(0, 200) || null;

      // ── Real price (in case listing page price was wrong) ──
      let price = null;
      for (const sel of [
        '[class*="sales"] .value', '.b-price__sales .value',
        '[class*="sale-price"]', '[itemprop="price"]',
        '[class*="current-price"]', '[class*="price"] .value',
      ]) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const raw = el.getAttribute('content') || el.innerText || '';
        const m   = raw.replace(',', '.').match(/(\d+\.?\d*)/);
        if (m && parseFloat(m[1]) > 0) { price = parseFloat(m[1]); break; }
      }

      // ── Original price ──
      let origPrice = null;
      const origEl = document.querySelector(
        '[class*="standard"] .value, [class*="original"], del .value, s .value, .b-price__list .value'
      );
      if (origEl) {
        const m = origEl.innerText.replace(',', '.').match(/(\d+\.?\d*)/);
        if (m) origPrice = parseFloat(m[1]);
      }

      // ── Name ──
      const nameEl = document.querySelector('h1[itemprop="name"], h1[class*="product"], h1[class*="title"], h1');
      const name = nameEl?.innerText?.trim() || null;

      return { name, images, colors, sizes, description, material, price, origPrice, barcodeMap, mainBarcode };
    }, url);
  }

  return null; // all retries failed
}

// ── Get next page URL ─────────────────────────────────────────────────────────
async function getNextPageUrl(page, currentUrl) {
  return page.evaluate((cur) => {
    const next = document.querySelector("a[rel='next'], a.pagination__next, a[aria-label='Page suivante'], .pagination a.next");
    if (next?.href) return next.href;
    const m = cur.match(/[?&]page=(\d+)/);
    const p = m ? parseInt(m[1]) : 1;
    const found = Array.from(document.querySelectorAll('a[href]')).find(a => a.href.includes(`page=${p + 1}`));
    if (found) return found.href;
    return null;
  }, currentUrl);
}

// ── Build API payload ─────────────────────────────────────────────────────────
function buildPayload(stub, detail, catInfo) {
  // All product data comes from the product page (detail)
  const name = detail?.name || stub.name;
  if (!name) return null;

  const price    = parseFloat(detail?.price) || 29.99;
  const origRaw  = detail?.origPrice;
  const origP    = origRaw && origRaw > price ? origRaw : null;
  const discount = origP ? Math.round((1 - price / origP) * 100) : 0;

  // Clean numeric SKU
  const skuNum   = stub.sku || skuFromUrl(stub.productUrl) || '';
  const skuClean = String(skuNum).replace(/[^A-Z0-9_-]/gi, '-').substring(0, 100);

  const slugBase = name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = `${slugBase}-${skuClean.toLowerCase()}`.substring(0, 200);

  const allImages  = (detail?.images || []).map(u => `${u}?sw=800&sh=1067&sm=fit`).slice(0, 5);
  const mainImage  = allImages[0] || null;
  const extraImgs  = allImages.slice(1, 5); // max 4 extra = 5 total

  const colors = detail?.colors?.length ? detail.colors : [];
  const sizes  = detail?.sizes?.length  ? detail.sizes  : ['XS','S','M','L','XL','XXL'];

  // Color → images mapping
  const colorImages = {};
  if (colors.length > 0 && allImages.length > 0) {
    colors.forEach((c, i) => {
      const start = i * 2;
      colorImages[c] = allImages.slice(start, start + 2).length
        ? allImages.slice(start, start + 2)
        : allImages.slice(0, 2);
    });
  }

  // Variants: size × color (with EAN barcode if available from JSON-LD)
  const barcodeMap = detail?.barcodeMap || {};
  const mainBarcode = detail?.mainBarcode || null;
  const variants = [];
  for (const size of sizes) {
    for (const color of (colors.length ? colors : [''])) {
      const barcode = barcodeMap[size] || barcodeMap['_any'] || mainBarcode || null;
      variants.push({
        sku:      `${skuClean}-${size}${color ? '-' + color.replace(/\s+/g, '') : ''}`.substring(0, 100),
        size,
        color:    color || null,
        quantity: Math.floor(Math.random() * 25) + 5,
        price:    price.toFixed(2),
        barcode,
      });
    }
  }

  return {
    sku:                skuClean,
    name,
    description:        detail?.description || `${name} — ${catInfo.category} Celio`,
    category:           catInfo.category,
    subcategory:        catInfo.subcategory,
    brand:              'Celio',
    price:              price.toFixed(2),
    cost:               (price * 0.4).toFixed(2),
    salePrice:          origP ? price.toFixed(2) : null,
    discountPercentage: discount.toString(),
    stock:              variants.reduce((s, v) => s + v.quantity, 0),
    minStock:           5,
    maxStock:           200,
    isActive:           true,
    isFeatured:         Math.random() > 0.85,
    isOnSale:           discount > 0,
    mainImage,
    images:             extraImgs,
    colorImages:        Object.keys(colorImages).length ? colorImages : null,
    attributes:         { sizes, colors, material: detail?.material || null },
    variants:           variants.slice(0, 80),
    slug,
    metaTitle:          name,
    metaDescription:    (detail?.description || name).substring(0, 160),
    tags:               [catInfo.category, catInfo.subcategory, 'celio', 'homme'].filter(Boolean),
    color:              colors[0] || null,
    material:           detail?.material || null,
    language:           'it',
  };
}

// ── MAIN scraper for one category ─────────────────────────────────────────────
async function scrapeCategory(browser, catInfo, progress) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  CATEGORY: ${catInfo.category.toUpperCase()} (${catInfo.slug})`);
  console.log('='.repeat(60));

  // ── Phase 1: collect all product stubs from listing pages ──
  const catPage = await browser.newPage();
  await applyStealthToPage(catPage);
  await catPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await catPage.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' });

  const productStubs = new Map(); // sku → stub
  let url = `https://www.celio.com/fr-fr/c/${catInfo.slug}`;
  let pageNum = 1, emptyCount = 0;

  while (url) {
    console.log(`\n  [Listing] Page ${pageNum}: ${url}`);
    try {
      await catPage.goto(url, { waitUntil: 'load', timeout: 60000 });
    } catch (e) {
      console.log(`  ⚠️  ${e.message.substring(0, 60)}`); break;
    }

    if (pageNum === 1) await acceptCookies(catPage);

    // Verify we're still on celio.com (redirect check)
    const currentUrl = catPage.url();
    if (!currentUrl.includes('celio.com')) {
      console.log(`  ⚠️  Redirected off-site to: ${currentUrl} — skip`); break;
    }

    const title = await catPage.title().catch(() => '');
    if (title.toLowerCase().includes('404') || title.toLowerCase().includes('not found')) {
      console.log(`  ⚠️  404 — skipping category`); break;
    }

    console.log(`  Loaded: ${currentUrl}`);

    // Detect rate-limit page and wait it out
    const restricted = await catPage.evaluate(() => {
      const t = (document.body?.innerText || '').toLowerCase();
      return t.includes('accès temporairement restreint') || t.includes('access temporarily') || t.includes('temporarily restricted');
    }).catch(() => false);

    if (restricted) {
      console.log(`  🚫 Rate-limited! Waiting 4 minutes then retrying...`);
      await sleep(4 * 60 * 1000);
      // Go back to homepage to reset session
      await catPage.goto('https://www.celio.com/fr-fr', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await sleep(10000);
      // Retry same URL (don't increment pageNum)
      continue;
    }

    await sleep(8000);  // same wait as Python script
    await slowScroll(catPage);

    ensureDir(SCREENSHOT_DIR);
    await catPage.screenshot({ path: path.join(SCREENSHOT_DIR, `${catInfo.slug}_p${pageNum}.png`), fullPage: false });

    // Soft-block check on listing page: if no product links AND no category heading, wait and retry
    const urls = await collectProductUrls(catPage);
    console.log(`  Product URLs found: ${urls.length}`);

    if (urls.length === 0 && pageNum === 1) {
      const hasListingContent = await catPage.evaluate(() => {
        const t = document.body?.innerText || '';
        return t.length > 2000; // real pages have substantial content
      }).catch(() => false);

      if (!hasListingContent) {
        console.log(`  🚫 Soft-block on listing page — waiting 4 minutes then retrying...`);
        await sleep(4 * 60 * 1000);
        await catPage.goto('https://www.celio.com/fr-fr', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
        await sleep(10000);
        continue; // retry same URL
      }
    }

    let newCount = 0;
    for (const url of urls) {
      const sku = skuFromUrl(url);
      const key = sku || url;
      if (!productStubs.has(key)) {
        productStubs.set(key, { sku, productUrl: url });
        newCount++;
      }
    }
    console.log(`  New unique: ${newCount} | Total collected: ${productStubs.size}`);

    if (newCount === 0 && ++emptyCount >= 2) { console.log('  No new products — done paginating.'); break; }
    else if (newCount > 0) emptyCount = 0;

    const nextUrl = await getNextPageUrl(catPage, url);
    if (!nextUrl || nextUrl === url) { console.log('  No next page.'); break; }
    url = nextUrl;
    pageNum++;
    await randSleep(5000, 10000); // slow down between listing pages
  }
  await catPage.close();
  console.log(`\n  ✅ Phase 1 complete: ${productStubs.size} products found`);

  // ── Phase 2: visit each product page for full details ──
  console.log(`\n  Phase 2: scraping product pages for images, colors, sizes...`);

  const prodPage = await browser.newPage();
  await applyStealthToPage(prodPage);
  await prodPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await prodPage.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' });

  let inserted = 0, skipped = 0, errors = 0, i = 0;
  const total = productStubs.size;

  for (const [key, stub] of productStubs) {
    i++;
    const skuStr = String(stub.sku || key);

    if (progress.insertedSkus.includes(skuStr)) {
      skipped++;
      process.stdout.write(`\r  ⏭️  [${i}/${total}] already done (${skuStr})         `);
      continue;
    }

    const productUrl = stub.productUrl;
    if (!productUrl) {
      console.log(`\n  [${i}/${total}] ⚠️  No URL for ${stub.name} — skipping`);
      errors++;
      continue;
    }

    console.log(`\n  [${i}/${total}] 🔍 ${productUrl.replace('https://www.celio.com', '')}`);

    const detail = await scrapeProductPage(prodPage, productUrl);

    if (!detail) {
      console.log(`  ⚠️  Failed to scrape product page — skipping`);
      errors++;
      continue;
    }

    console.log(`  🖼️  ${detail.images.length} images | 🎨 colors: ${detail.colors.join(', ') || '—'} | 📐 sizes: ${detail.sizes.join(', ')}`);

    const payload = buildPayload(stub, detail, catInfo);
    if (!payload) { errors++; continue; }

    console.log(`  📦 ${payload.name} | sku:${payload.sku} | €${payload.price}`);
    const result = await insertProduct(payload);

    if (result?.id) {
      inserted++;
      progress.insertedSkus.push(skuStr);
      saveProgress(progress);
      console.log(`     ✅ Inserted → ID ${result.id}`);
    } else if (result?.exists) {
      skipped++;
      progress.insertedSkus.push(skuStr); // mark so we don't retry next run
      saveProgress(progress);
      console.log(`     ⏭️  Already in DB — skipped`);
    } else {
      errors++;
    }

    // Human-like delay between product pages (6–12s, occasionally longer)
    const extraWait = Math.random() < 0.1 ? 15000 : 0; // 10% chance of 15s extra pause
    await randSleep(6000 + extraWait, 12000 + extraWait);
  }

  await prodPage.close();

  console.log(`\n  [DONE] ${catInfo.slug}: inserted=${inserted} skipped=${skipped} errors=${errors}`);
  return inserted;
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║      Celio Scraper  — starting       ║');
  console.log('╚══════════════════════════════════════╝\n');

  const progress = loadProgress();
  console.log(`📋 Progress: ${progress.insertedSkus.length} inserted | ${(progress.doneCategories || []).length} categories done\n`);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-blink-features=AutomationControlled','--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const summary = [];
  try {
    for (const cat of CATEGORIES) {
      if ((progress.doneCategories || []).includes(cat.slug)) {
        console.log(`\n⏭️  Skipping ${cat.slug} (already done)`);
        continue;
      }
      const n = await scrapeCategory(browser, cat, progress);
      summary.push({ slug: cat.slug, count: n });
      if (!progress.doneCategories) progress.doneCategories = [];
      progress.doneCategories.push(cat.slug);
      saveProgress(progress);
    }
  } finally {
    try {
      await browser.close();
    } catch (e) {
      // Windows sometimes locks the Chrome temp profile — safe to ignore
      if (!e.message?.includes('EBUSY') && !e.message?.includes('lockfile'))
        console.error('browser.close error:', e.message);
    }
    console.log('\nChrome closed.');
  }

  const grand = summary.reduce((s, x) => s + x.count, 0);
  console.log(`\n${'='.repeat(54)}\nFINAL SUMMARY\n${'='.repeat(54)}`);
  for (const { slug, count } of summary)
    console.log(`  ${slug.padEnd(30)} ${String(count).padStart(5)} products`);
  console.log(`${'-'.repeat(54)}\n  ${'TOTAL'.padEnd(30)} ${String(grand).padStart(5)} products\n${'='.repeat(54)}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
