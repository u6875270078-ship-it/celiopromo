/**
 * Generate App Store screenshots from celiopromo.it
 *
 * Output: app-store-screenshots/screenshot-N.png at 1290x2796 (iPhone 6.7")
 * which App Store Connect accepts in the "1284 × 2778px" slot.
 *
 * Run: node scripts/generate-app-store-screenshots.mjs
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SITE = 'https://celiopromo.it';
const OUT_DIR = path.resolve('app-store-screenshots');

// App Store 6.7" slot — output 1284x2778 (iPhone 12/13 Pro Max standard)
// 1284 / 3 = 428,  2778 / 3 = 926
const WIDTH = 428;
const HEIGHT = 926;
const DPR = 3;

const PAGES = [
  { url: '/',                       file: '1-home.png',          waitFor: 1500 },
  { url: '/catalog',                file: '2-catalog.png',       waitFor: 2500 },
  { url: '/category/jeans',         file: '3-category-jeans.png',waitFor: 2500 },
  { url: '/negozi',                 file: '4-stores.png',        waitFor: 2000 },
  { url: '/account',                file: '5-account.png',       waitFor: 1500 },
  { url: '/privacy',                file: '6-privacy.png',       waitFor: 1000 },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: DPR,
    isMobile: true,
    hasTouch: true,
  });
  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  );

  // Get the FIRST product so we can take a real product detail screenshot
  let productId = null;
  try {
    const res = await fetch(`${SITE}/api/products?limit=1`);
    const arr = await res.json();
    productId = arr?.[0]?.id ?? arr?.[0]?.products?.[0]?.id ?? null;
    if (productId) {
      PAGES.splice(3, 0, {
        url: `/products/${productId}`,
        file: '4-product-detail.png',
        waitFor: 2500,
      });
      // renumber subsequent files
      PAGES.forEach((p, i) => {
        p.file = p.file.replace(/^\d+-/, `${i + 1}-`);
      });
    }
  } catch (e) {
    console.warn('Could not pre-fetch product id:', e.message);
  }

  for (const { url, file, waitFor } of PAGES) {
    const full = SITE + url;
    console.log(`→ ${file}: ${full}`);
    try {
      await page.goto(full, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      console.warn(`  navigation timeout, continuing: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, waitFor));
    // Hide any cookie banner by removing it if present (best effort)
    await page.evaluate(() => {
      const sels = ['#cookie', '.cookie-banner', '[class*="cookie"]', '[id*="cookie"]'];
      for (const s of sels) {
        document.querySelectorAll(s).forEach(el => el.remove());
      }
    });
    const out = path.join(OUT_DIR, file);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  saved: ${out}`);
  }

  await browser.close();
  console.log(`\nDone. ${PAGES.length} screenshots in ${OUT_DIR}`);
  console.log('Upload the ones you like into App Store Connect.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
