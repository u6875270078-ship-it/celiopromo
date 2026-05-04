/**
 * CELIO ITALIA - Video Generator v3
 *
 * Approccio pulito come i veri brand su Instagram:
 * - Solo immagini prodotto fullscreen, niente intro/outro finti
 * - Crossfade fluido tra immagini
 * - Prezzo piccolo e pulito in basso
 * - Logo CELIO watermark discreto
 * - Ritmo veloce da Reel
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

// FFmpeg path
const wingetFFmpeg = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
if (fs.existsSync(wingetFFmpeg)) {
  const pkg = fs.readdirSync(wingetFFmpeg).find(d => d.startsWith('Gyan.FFmpeg'));
  if (pkg) {
    const bin = fs.readdirSync(path.join(wingetFFmpeg, pkg)).find(d => d.startsWith('ffmpeg-'));
    if (bin) process.env.PATH = path.join(wingetFFmpeg, pkg, bin, 'bin') + path.delimiter + process.env.PATH;
  }
}

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: config.database.url });

const OUTPUT_DIR = path.join(__dirname, 'output');
const TEMP_DIR = path.join(__dirname, 'temp');
const MUSIC_DIR = path.join(__dirname, 'music');
const YEAR = new Date().getFullYear();

const args = process.argv.slice(2);
const styleArg = args.find((_, i) => args[i - 1] === '--style') || '';
const countArg = parseInt(args.find((_, i) => args[i - 1] === '--count') || '8');

[OUTPUT_DIR, TEMP_DIR, MUSIC_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ============ UTILS ============

function dl(url, fp) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(fp);
    const r = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) { f.close(); if (fs.existsSync(fp)) fs.unlinkSync(fp); return dl(res.headers.location, fp).then(resolve).catch(reject); }
      if (res.statusCode !== 200) { f.close(); if (fs.existsSync(fp)) fs.unlinkSync(fp); return reject(new Error(`HTTP ${res.statusCode}`)); }
      res.pipe(f); f.on('finish', () => { f.close(); resolve(fp); });
    });
    r.on('error', (e) => { f.close(); if (fs.existsSync(fp)) fs.unlinkSync(fp); reject(e); });
    r.setTimeout(15000, () => { r.destroy(); reject(new Error('Timeout')); });
  });
}

function clean() {
  if (fs.existsSync(TEMP_DIR)) fs.readdirSync(TEMP_DIR).forEach(f => { try { fs.unlinkSync(path.join(TEMP_DIR, f)); } catch {} });
}

function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

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

// ============ PREPARE IMAGES WITH OVERLAY ============

async function prepareSlide(product, index, total, W, H) {
  const rawPath = path.join(TEMP_DIR, `raw_${index}.jpg`);
  const finalPath = path.join(TEMP_DIR, `slide_${index}.png`);

  await dl(product.main_image, rawPath);

  // Prepara immagine base: resize + boost colori
  const base = await sharp(rawPath)
    .resize(W, H, { fit: 'cover', position: 'top' })
    .modulate({ brightness: 1.03, saturation: 1.1 })
    .sharpen({ sigma: 0.7 })
    .toBuffer();

  // Crea overlay SVG minimale
  let name = product.name.replace(/ - [a-zA-Zéèêàùûôîç\s]+$/i, '').substring(0, 40);
  name = esc(name);
  const price = esc(product.price + ' EUR');

  const overlay = Buffer.from(`
  <svg width="${W}" height="${H}">
    <defs>
      <linearGradient id="g${index}" x1="0%" y1="75%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
      </linearGradient>
    </defs>
    <!-- Gradient basso sottile -->
    <rect y="75%" width="100%" height="25%" fill="url(#g${index})"/>

    <!-- Logo CELIO in alto a sinistra, piccolo -->
    <text x="40" y="55" font-family="Georgia, serif" font-weight="bold" font-size="20" fill="rgba(255,255,255,0.85)" letter-spacing="4">CELIO</text>

    <!-- Nome prodotto -->
    <text x="40" y="${H - 110}" font-family="Helvetica, Arial" font-weight="600" font-size="26" fill="white">${name}</text>

    <!-- Prezzo -->
    <text x="40" y="${H - 65}" font-family="Helvetica, Arial" font-weight="700" font-size="36" fill="white">${price}</text>

    <!-- Contatore discreto -->
    <text x="${W - 40}" y="${H - 70}" text-anchor="end" font-family="Helvetica, Arial" font-size="16" fill="rgba(255,255,255,0.4)">${index + 1}/${total}</text>
  </svg>`);

  await sharp(base)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(finalPath);

  return finalPath;
}

// ============ BUILD VIDEO ============

async function buildVideo(slides, selection) {
  const W = config.video.width, H = config.video.height, fps = config.video.fps;
  const SLIDE_DUR = 1.8;   // veloce come un vero Reel
  const FADE_DUR = 0.4;    // crossfade corto e pulito
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputFile = path.join(OUTPUT_DIR, `celio_${selection.style.toLowerCase()}_${timestamp}.mp4`);

  // Crea ogni slide come segmento video con zoom
  const segFiles = [];
  const zoomMoves = [
    // [zStart, zEnd, xExpr, yExpr] - movimenti cinematici
    [1.0, 1.18, "'iw/2-(iw/zoom/2)'", "'ih/2-(ih/zoom/2)'"],   // zoom in center
    [1.18, 1.0, "'iw/2-(iw/zoom/2)'", "'ih/2-(ih/zoom/2)'"],   // zoom out center
    [1.12, 1.12, "T*W", "'ih/5'"],                               // pan right
    [1.0, 1.15, "'iw/2-(iw/zoom/2)'", "'0'"],                   // zoom in top (face)
    [1.12, 1.12, "T_REV", "'ih/5'"],                             // pan left
    [1.15, 1.0, "'iw/2-(iw/zoom/2)'", "'ih/3'"],                // zoom out mid
  ];

  for (let i = 0; i < slides.length; i++) {
    const segFile = path.join(TEMP_DIR, `v_${i}.mp4`);
    segFiles.push(segFile);
    const frames = Math.ceil(SLIDE_DUR * fps);
    const [zS, zE, xE, yE] = zoomMoves[i % zoomMoves.length];

    // Gestione pan
    let xExpr = xE, yExpr = yE;
    if (xE === "T*W") xExpr = `'(iw-iw/zoom)*on/${frames}'`;
    if (xE === "T_REV") xExpr = `'(iw-iw/zoom)*(1-on/${frames})'`;

    const zExpr = `'${zS}+(${zE}-${zS})*on/${frames}'`;
    const filter = `scale=${W * 2}:${H * 2},zoompan=z=${zExpr}:x=${xExpr}:y=${yExpr}:d=${frames}:s=${W}x${H}:fps=${fps}`;

    try {
      execSync(`ffmpeg -y -loop 1 -i "${slides[i]}" -vf "${filter}" -t ${SLIDE_DUR} -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r ${fps} "${segFile}"`, { stdio: 'pipe', timeout: 45000 });
    } catch {
      execSync(`ffmpeg -y -loop 1 -i "${slides[i]}" -vf "scale=${W}:${H}" -t ${SLIDE_DUR} -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r ${fps} "${segFile}"`, { stdio: 'pipe', timeout: 45000 });
    }
    process.stdout.write(`  Slide ${i + 1}/${slides.length}\r`);
  }
  console.log('');

  // Unisci con crossfade
  console.log('  Montaggio...');
  const N = segFiles.length;
  const inputs = segFiles.map(f => `-i "${f}"`).join(' ');

  const xfadeTypes = ['fade', 'slideleft', 'fadeblack', 'slideright', 'fade'];
  let filterParts = [];
  let lastLabel = '[0:v]';

  for (let i = 1; i < N; i++) {
    const outLabel = i < N - 1 ? `[v${i}]` : '[vx]';
    const offset = (i * SLIDE_DUR - i * FADE_DUR).toFixed(2);
    const tr = xfadeTypes[i % xfadeTypes.length];
    filterParts.push(`${lastLabel}[${i}:v]xfade=transition=${tr}:duration=${FADE_DUR}:offset=${offset}${outLabel}`);
    lastLabel = outLabel;
  }

  // Fade in/out globale
  const totalDur = N * SLIDE_DUR - (N - 1) * FADE_DUR;
  filterParts.push(`[vx]fade=t=in:d=0.5,fade=t=out:st=${(totalDur - 0.8).toFixed(2)}:d=0.8[vout]`);

  const rawVideo = path.join(TEMP_DIR, 'raw.mp4');

  try {
    execSync(`ffmpeg -y ${inputs} -filter_complex "${filterParts.join(';')}" -map "[vout]" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r ${fps} "${rawVideo}"`, { stdio: 'pipe', timeout: 180000 });
  } catch {
    // Fallback: concat semplice
    console.log('  Fallback concat...');
    const cf = path.join(TEMP_DIR, 'list.txt');
    fs.writeFileSync(cf, segFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
    execSync(`ffmpeg -y -f concat -safe 0 -i "${cf}" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r ${fps} "${rawVideo}"`, { stdio: 'pipe', timeout: 120000 });
  }

  // Aggiungi musica se disponibile
  const music = fs.existsSync(MUSIC_DIR) ? fs.readdirSync(MUSIC_DIR).filter(f => /\.(mp3|m4a|aac|wav)$/i.test(f)) : [];

  if (music.length > 0) {
    const track = path.join(MUSIC_DIR, music[Math.floor(Math.random() * music.length)]);
    console.log(`  Musica: ${path.basename(track)}`);
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${rawVideo}"`, { stdio: 'pipe' }).toString().trim()) || 15;
    execSync(`ffmpeg -y -i "${rawVideo}" -i "${track}" -map 0:v -map 1:a -shortest -c:v copy -af "afade=t=in:d=1,afade=t=out:st=${(dur - 2).toFixed(1)}:d=2,volume=0.3" "${outputFile}"`, { stdio: 'pipe', timeout: 60000 });
  } else {
    fs.copyFileSync(rawVideo, outputFile);
    console.log('  Aggiungi .mp3 in music/ per musica di sottofondo');
  }

  return outputFile;
}

// ============ CAPTION ============

function makeCaption(sel) {
  const tpl = config.captions.templates;
  const t = tpl[Math.floor(Math.random() * tpl.length)];
  const list = sel.products.map(p => `${p.name.replace(/ - [a-zA-Zéèêàùûôîç\s]+$/i, '')} | ${p.price} EUR`).join('\n');
  return t.replace('{style}', sel.style).replace('{season}', sel.season).replace('{products}', list).replace('{price}', sel.totalPrice).replace('{link}', config.captions.siteUrl).replace('{hashtags}', config.captions.hashtags);
}

// ============ MAIN ============

async function main() {
  console.log('\n  CELIO ITALIA - Video Generator v3\n');

  try { execSync('ffmpeg -version', { stdio: 'pipe' }); }
  catch { console.log('  FFmpeg non trovato! winget install Gyan.FFmpeg'); process.exit(1); }

  console.log('[1/4] Selezione prodotti...');
  const sel = await selectProducts(countArg, styleArg);
  console.log(`  ${sel.style} | ${sel.season} | ${sel.products.length} prodotti | ${sel.totalPrice} EUR\n`);

  console.log('[2/4] Download e preparazione slides...');
  clean();
  const W = config.video.width, H = config.video.height;
  const slides = [];
  for (let i = 0; i < sel.products.length; i++) {
    try {
      const s = await prepareSlide(sel.products[i], i, sel.products.length, W, H);
      slides.push(s);
      console.log(`  [${i + 1}/${sel.products.length}] ${sel.products[i].name.substring(0, 45)}`);
    } catch (e) {
      console.log(`  [${i + 1}/${sel.products.length}] SKIP`);
    }
  }

  if (slides.length < 3) { console.log('  Immagini insufficienti'); clean(); await pool.end(); process.exit(1); }

  console.log(`\n[3/4] Rendering...`);
  const video = await buildVideo(slides, sel);

  console.log('\n[4/4] Caption...');
  const caption = makeCaption(sel);
  fs.writeFileSync(video.replace('.mp4', '_caption.txt'), caption, 'utf-8');
  fs.writeFileSync(video.replace('.mp4', '_meta.json'), JSON.stringify({
    videoFile: path.basename(video), style: sel.style, season: sel.season,
    totalPrice: sel.totalPrice, caption, createdAt: new Date().toISOString(), posted: false,
    products: sel.products.map(p => ({ id: p.id, name: p.name, price: p.price, category: p.category })),
  }, null, 2), 'utf-8');

  clean();
  const size = (fs.statSync(video).size / (1024 * 1024)).toFixed(1);

  console.log(`\n  PRONTO: ${path.basename(video)} (${size} MB)`);
  console.log(`  ${slides.length} prodotti | ${sel.style} | ${sel.season}\n`);

  await pool.end();
}

main().catch(async (e) => { console.error('Errore:', e.message); clean(); await pool.end(); process.exit(1); });
