/**
 * Script per scaricare le migliori immagini prodotto per ogni categoria
 * Uso: node scripts/download-best-images.mjs
 *
 * Scarica automaticamente le immagini con modello (WEB3) raggruppate per categoria
 * in una cartella "reels-images/" pronta per essere usata in CapCut o altro editor video.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gQUx9mM5rGko@ep-curly-silence-anjx1ujn.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({ connectionString: DATABASE_URL });

const OUTPUT_DIR = path.join(__dirname, '..', 'reels-images');
const IMAGES_PER_CATEGORY = 6;

// Categorie in italiano
const CATEGORY_NAMES = {
  'Chemises': 'Camicie',
  'Polos': 'Polo',
  'T-Shirts': 'T-Shirt',
  'Jeans': 'Jeans',
  'Pantalons': 'Pantaloni',
  'Vestes': 'Giacche',
  'Pulls & Sweat': 'Maglioni_Felpe',
  'Shorts': 'Shorts',
  'Costumes': 'Abiti',
  'Accessoires': 'Accessori',
  'Sous-vêtements': 'Intimo',
  'Chaussures': 'Scarpe',
};

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        return reject(new Error(`HTTP ${response.statusCode} per ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(filepath); });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      reject(err);
    });
  });
}

function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9àèéìòùÀÈÉÌÒÙ\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

async function main() {
  console.log('=== Celio Italia - Download Immagini per Reels ===\n');

  // Crea cartella principale
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Recupera le migliori immagini per categoria (con foto modello WEB3)
  const { rows: products } = await pool.query(`
    SELECT id, name, main_image, images, category, price, color
    FROM products
    WHERE main_image LIKE '%WEB3%'
      AND main_image IS NOT NULL
      AND main_image != ''
    ORDER BY category, id
  `);

  console.log(`Trovati ${products.length} prodotti con foto modello\n`);

  // Raggruppa per categoria
  const byCategory = {};
  for (const p of products) {
    const cat = p.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  }

  let totalDownloaded = 0;
  const manifest = {};

  for (const [dbCategory, catProducts] of Object.entries(byCategory)) {
    const itName = CATEGORY_NAMES[dbCategory] || dbCategory;
    const catDir = path.join(OUTPUT_DIR, itName);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });

    // Seleziona i migliori prodotti (quelli con piu immagini)
    const sorted = catProducts.sort((a, b) => {
      const aCount = 1 + (Array.isArray(a.images) ? a.images.length : 0);
      const bCount = 1 + (Array.isArray(b.images) ? b.images.length : 0);
      return bCount - aCount;
    });

    const selected = sorted.slice(0, IMAGES_PER_CATEGORY);
    manifest[itName] = [];

    console.log(`\n--- ${itName} (${selected.length} prodotti) ---`);

    for (const product of selected) {
      const safeName = sanitizeFilename(product.name);
      const ext = product.main_image.includes('.png') ? '.png' : '.jpg';
      const filename = `${safeName}_${product.id}${ext}`;
      const filepath = path.join(catDir, filename);

      try {
        await downloadImage(product.main_image, filepath);
        console.log(`  OK: ${product.name} (${product.price} EUR)`);
        totalDownloaded++;

        manifest[itName].push({
          id: product.id,
          nome: product.name,
          prezzo: product.price + ' EUR',
          file: filename,
          immagine_originale: product.main_image,
        });

        // Scarica anche le immagini aggiuntive (per varieta nel reel)
        const extraImages = Array.isArray(product.images) ? product.images.slice(0, 2) : [];
        for (let i = 0; i < extraImages.length; i++) {
          const extraFilename = `${safeName}_${product.id}_${i + 2}${ext}`;
          const extraPath = path.join(catDir, extraFilename);
          try {
            await downloadImage(extraImages[i], extraPath);
            totalDownloaded++;
          } catch (e) {
            // Immagine extra non disponibile, continua
          }
        }
      } catch (err) {
        console.log(`  ERRORE: ${product.name} - ${err.message}`);
      }
    }
  }

  // Salva il manifesto JSON
  const manifestPath = path.join(OUTPUT_DIR, 'manifesto-immagini.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  // Crea un file README con istruzioni
  const readmePath = path.join(OUTPUT_DIR, 'ISTRUZIONI.txt');
  fs.writeFileSync(readmePath, `
CELIO ITALIA - IMMAGINI PER REELS INSTAGRAM
============================================

Immagini scaricate: ${totalDownloaded}
Data: ${new Date().toLocaleDateString('it-IT')}

STRUTTURA CARTELLE:
${Object.keys(manifest).map(cat => `  /${cat}/ - ${manifest[cat].length} prodotti`).join('\n')}

COME USARE IN CAPCUT:
1. Apri CapCut e crea un nuovo progetto (9:16)
2. Importa le immagini dalla cartella della categoria desiderata
3. Imposta durata per immagine: 0.5-0.8 secondi
4. Aggiungi animazione Ken Burns (Zoom In/Out)
5. Aggiungi transizioni Flash o Pull (0.2s)
6. Aggiungi musica trending da Instagram
7. Aggiungi testi con nome prodotto e prezzo
8. Esporta in 1080p 30fps

SUGGERIMENTI PER OUTFIT COMPLETI:
- Camicie + Pantaloni = Look ufficio
- Polo + Shorts = Look estivo
- Giacche + Jeans = Look casual chic
- Maglioni + Pantaloni = Look invernale
`, 'utf-8');

  console.log(`\n=== COMPLETATO ===`);
  console.log(`Immagini scaricate: ${totalDownloaded}`);
  console.log(`Cartella: ${OUTPUT_DIR}`);
  console.log(`Manifesto: ${manifestPath}`);

  await pool.end();
}

main().catch(err => {
  console.error('Errore:', err);
  pool.end();
  process.exit(1);
});
