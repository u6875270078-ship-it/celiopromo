/**
 * Fixes three issues for all products:
 *  1. Corrupted/missing `color` field — extracts from product name
 *  2. `variants` with color=null — fills in the product color
 *  3. Missing `colorImages` — builds {color: [img1, img2]} from existing images
 *
 * Run: node scripts/fix-product-colors.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const COLOR_WORDS = new Set([
  'noir', 'blanc', 'bleu', 'rouge', 'gris', 'marine', 'beige', 'vert', 'marron',
  'kaki', 'ecru', 'anthracite', 'bordeaux', 'camel', 'rose', 'jaune', 'orange',
  'violet', 'taupe', 'ivoire', 'naturel', 'clair', 'fonce', 'chine', 'raye',
  'multicolore', 'denim', 'stone', 'safran', 'moka', 'corail', 'sable',
  'cyan', 'turquoise', 'lilas', 'print', 'imprime', 'uni',
]);

const PRODUCT_TYPES = new Set([
  't-shirt', 'tshirt', 'polo', 'jean', 'chemise', 'pull', 'veste', 'short',
  'pantalon', 'sweat', 'maillot', 'costume', 'homme', 'regular', 'slim',
  'oversize', 'boxy', 'relaxed', 'col', 'manches', 'debardeur', 'boxer',
  'chaussette', 'pyjama', 'bermuda', 'casquette', 'ceinture', 'echarpe',
]);

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function hasColorWord(str) {
  return norm(str).split(/\s+/).some(w => COLOR_WORDS.has(w));
}
function startsWithProductType(str) {
  return PRODUCT_TYPES.has(norm(str).split(/\s+/)[0]);
}

function extractColorFromName(name) {
  const idx = name.lastIndexOf(' - ');
  if (idx !== -1) {
    const candidate = name.slice(idx + 3).trim();
    const words = candidate.split(/\s+/);
    if (words.length <= 4 && !startsWithProductType(candidate) && hasColorWord(candidate)) {
      return candidate;
    }
    if (words.length <= 2 && !startsWithProductType(candidate) && words[0].length > 2) {
      return candidate;
    }
  }
  // Collab product fallback: last 1–2 words containing a color word
  const allWords = name.split(/\s+/);
  for (let len = 2; len >= 1; len--) {
    const tail = allWords.slice(-len).join(' ');
    if (hasColorWord(tail)) return tail;
  }
  return null;
}

function isValidColor(color) {
  if (!color) return false;
  // Corrupted: >40 chars or contains " - " (it's a product name, not a color)
  if (color.length > 40 || color.includes(' - ')) return false;
  return true;
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to database');

  const { rows } = await client.query(
    `SELECT id, name, main_image, images, color, color_images, variants FROM products`
  );
  console.log(`📦 Total products: ${rows.length}`);

  let updated = 0, noColor = 0;

  for (const row of rows) {
    // ── Determine the correct color ─────────────────────────────────────────
    let color = isValidColor(row.color) ? row.color : extractColorFromName(row.name);
    if (!color) { noColor++; continue; }

    // ── Fix colorImages if missing or empty ─────────────────────────────────
    let colorImages = row.color_images;
    const needsCi = !colorImages || typeof colorImages !== 'object' || Object.keys(colorImages).length === 0;
    if (needsCi) {
      const imgs = [row.main_image, ...(Array.isArray(row.images) ? row.images : [])]
        .filter(Boolean).slice(0, 2);
      colorImages = imgs.length > 0 ? { [color]: imgs } : null;
    }

    // ── Fix variants: fill color=null entries with the product color ────────
    let variants = row.variants;
    let variantsChanged = false;
    if (variants) {
      try {
        const parsed = typeof variants === 'string' ? JSON.parse(variants) : variants;
        if (Array.isArray(parsed)) {
          const fixed = parsed.map(v => {
            if (v.color === null || v.color === '' || v.color === undefined) {
              variantsChanged = true;
              return { ...v, color };
            }
            return v;
          });
          if (variantsChanged) variants = JSON.stringify(fixed);
        }
      } catch {}
    }

    // ── Only write if something actually changed ─────────────────────────────
    const colorChanged   = color !== row.color;
    const ciChanged      = JSON.stringify(colorImages) !== JSON.stringify(row.color_images);

    if (!colorChanged && !ciChanged && !variantsChanged) continue;

    await client.query(
      `UPDATE products
          SET color        = $1,
              color_images = $2,
              variants     = $3,
              updated_at   = NOW()
        WHERE id = $4`,
      [
        color,
        colorImages ? JSON.stringify(colorImages) : null,
        variants,
        row.id,
      ]
    );
    updated++;
    if (updated % 200 === 0) console.log(`  … updated ${updated}`);
  }

  await client.end();
  console.log(`\n✅ Done!`);
  console.log(`   Updated  : ${updated}`);
  console.log(`   No color : ${noColor} (name had no detectable color)`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
