/**
 * CELIO ITALIA - Video Generator PRO (Creatomate + Multi-Template)
 *
 * 5 stili diversi di video, scelti automaticamente ogni volta:
 * 1. Slideshow - un prodotto alla volta, fullscreen
 * 2. Split Screen - prodotto sopra, info sotto
 * 3. Minimal White - sfondo bianco pulito
 * 4. Bold Dark - sfondo nero, testo grande
 * 5. Side by Side - 2 prodotti affiancati
 *
 * Uso:
 *   node create-video-pro.mjs                    (template random)
 *   node create-video-pro.mjs --template boldDark
 *   node create-video-pro.mjs --style estivo --count 6
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRandomTemplate, buildSource, TEMPLATES } from './video-templates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: config.database.url });

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const API_KEY = '5bdb248c317a4baf891427c9cb48fca0a8da490ecf2a235befa353a77d1c6e3268990e02bf76a13258ed2fe25edad148';
const YEAR = new Date().getFullYear();

const args = process.argv.slice(2);
const styleArg = args.find((_, i) => args[i - 1] === '--style') || '';
const countArg = parseInt(args.find((_, i) => args[i - 1] === '--count') || '6');
const templateArg = args.find((_, i) => args[i - 1] === '--template') || '';

// ============ CREATOMATE API ============

function api(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.creatomate.com', path: `/v1${endpoint}`, method,
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const dl = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) return dl(res.headers.location);
        const f = fs.createWriteStream(filepath);
        res.pipe(f);
        f.on('finish', () => { f.close(); resolve(); });
      }).on('error', reject);
    };
    dl(url);
  });
}

// ============ SELECT PRODUCTS ============

async function selectProducts(count, style) {
  const cats = {
    'casual':    { top: ['Chemises', 'Polos', 'T-Shirts'], bottom: ['Jeans', 'Pantalons'] },
    'estivo':    { top: ['Polos', 'T-Shirts', 'Chemises'], bottom: ['Shorts'] },
    'elegante':  { top: ['Chemises'], bottom: ['Pantalons', 'Costumes'] },
    'invernale': { top: ['Pulls & Sweat', 'Chemises'], bottom: ['Jeans', 'Pantalons'] },
  };
  const styles = Object.keys(cats);
  const chosen = style || styles[Math.floor(Math.random() * styles.length)];
  const c = cats[chosen.toLowerCase()] || cats.casual;

  const { rows } = await pool.query(`
    SELECT id, name, main_image, category, price
    FROM products WHERE main_image LIKE '%WEB3%' AND main_image IS NOT NULL
    ORDER BY RANDOM() LIMIT 500
  `);

  const tops = rows.filter(p => c.top.some(x => p.category.includes(x)));
  const bottoms = rows.filter(p => c.bottom.some(x => p.category.includes(x)));
  const sel = [];
  const half = Math.ceil(count / 2);
  for (let i = 0; i < half && i < tops.length; i++) {
    sel.push(tops[i]);
    if (i < bottoms.length) sel.push(bottoms[i]);
  }

  const final = sel.slice(0, count);
  const month = new Date().getMonth();
  const season = chosen === 'estivo' ? `Estate ${YEAR}` : chosen === 'invernale' ? `Inverno ${YEAR}` : month <= 4 ? `Primavera ${YEAR}` : `Autunno ${YEAR}`;

  return {
    products: final,
    style: chosen.charAt(0).toUpperCase() + chosen.slice(1),
    season,
    totalPrice: final.reduce((s, p) => s + parseFloat(p.price), 0).toFixed(2),
  };
}

// ============ CAPTION ============

function makeCaption(products, style, season, templateName) {
  const names = products.map(p => `${p.name.replace(/ - [a-zA-Zéèêàùûôîç\s]+$/i, '')} | ${p.price} EUR`).join('\n');
  const total = products.reduce((s, p) => s + parseFloat(p.price), 0).toFixed(2);
  const tpls = config.captions.templates;
  const t = tpls[Math.floor(Math.random() * tpls.length)];
  return t.replace('{style}', style).replace('{season}', season)
    .replace('{products}', names).replace('{price}', total)
    .replace('{link}', config.captions.siteUrl).replace('{hashtags}', config.captions.hashtags);
}

// ============ MAIN ============

async function main() {
  console.log('\n  CELIO ITALIA - Video PRO (Multi-Template)\n');
  console.log('  Template disponibili:');
  Object.entries(TEMPLATES).forEach(([k, v]) => console.log(`    - ${k}: ${v.name}`));
  console.log('');

  // 1. Seleziona prodotti
  console.log('[1/4] Selezione prodotti...');
  const sel = await selectProducts(countArg, styleArg);
  console.log(`  ${sel.style} | ${sel.season} | ${sel.products.length} prodotti | ${sel.totalPrice} EUR`);

  // 2. Seleziona template
  let templateKey, templateName;
  if (templateArg && TEMPLATES[templateArg]) {
    templateKey = templateArg;
    templateName = TEMPLATES[templateArg].name;
  } else {
    const t = getRandomTemplate();
    templateKey = t.key;
    templateName = t.name;
  }
  console.log(`\n[2/4] Template: ${templateName} (${templateKey})`);

  // 3. Genera video
  console.log('\n[3/4] Rendering su Creatomate...');
  const source = buildSource(templateKey, sel.products, sel.season);

  const result = await api('POST', '/renders', { source });
  const render = Array.isArray(result) ? result[0] : result;

  if (!render?.id) {
    console.log('Errore API:', JSON.stringify(result).substring(0, 300));
    await pool.end();
    process.exit(1);
  }

  console.log(`  Render ID: ${render.id}`);

  // Poll fino a completamento
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const check = await api('GET', `/renders/${render.id}`);
    process.stdout.write(`  ${check.status}...\r`);

    if (check.status === 'succeeded') {
      console.log(`  Completato!        `);

      // Download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const videoFile = path.join(OUTPUT_DIR, `celio_${templateKey}_${sel.style.toLowerCase()}_${timestamp}.mp4`);
      await downloadFile(check.url, videoFile);
      const size = (fs.statSync(videoFile).size / (1024 * 1024)).toFixed(1);

      // 4. Caption
      console.log('\n[4/4] Caption...');
      const caption = makeCaption(sel.products, sel.style, sel.season, templateName);
      fs.writeFileSync(videoFile.replace('.mp4', '_caption.txt'), caption, 'utf-8');

      fs.writeFileSync(videoFile.replace('.mp4', '_meta.json'), JSON.stringify({
        videoFile: path.basename(videoFile),
        template: templateKey, templateName,
        style: sel.style, season: sel.season, totalPrice: sel.totalPrice,
        caption, createdAt: new Date().toISOString(), posted: false,
        products: sel.products.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })),
      }, null, 2), 'utf-8');

      console.log(`\n  PRONTO!`);
      console.log(`  File:     ${path.basename(videoFile)} (${size} MB)`);
      console.log(`  Template: ${templateName}`);
      console.log(`  Stile:    ${sel.style} | ${sel.season}`);
      console.log(`  Prodotti: ${sel.products.length}`);
      console.log('');

      await pool.end();
      return;
    }

    if (check.status === 'failed') {
      console.log(`\n  ERRORE: ${check.error_message}`);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('\n  Timeout - il render sta impiegando troppo.');
  await pool.end();
}

main().catch(async (e) => {
  console.error('Errore:', e.message);
  await pool.end();
  process.exit(1);
});
