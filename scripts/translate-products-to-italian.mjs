/**
 * Translates all French product data to Italian in the database.
 * Handles: name, category, subcategory, color, description, tags, metaTitle, metaDescription
 *
 * Run: node scripts/translate-products-to-italian.mjs
 */
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

// ── French → Italian: Category/Subcategory translations ──────────────────────
const CATEGORY_MAP = {
  'jeans':            'Jeans',
  'pantalons':        'Pantaloni',
  't-shirts':         'T-Shirt',
  'chemises':         'Camicie',
  'polos':            'Polo',
  'pulls & sweat':    'Maglioni & Felpe',
  'pulls':            'Maglioni',
  'sweatshirts':      'Felpe',
  'sweats':           'Felpe',
  'vestes':           'Giacche',
  'manteaux':         'Cappotti',
  'shorts':           'Pantaloncini',
  'bermudas':         'Bermuda',
  'costumes':         'Abiti',
  'sous-vêtements':   'Intimo',
  'sous-vetements':   'Intimo',
  'chaussures':       'Scarpe',
  'accessoires':      'Accessori',
  'pyjamas':          'Pigiami',
};

// ── French → Italian: Color translations ─────────────────────────────────────
const COLOR_MAP = {
  'noir':           'nero',
  'blanc':          'bianco',
  'bleu':           'blu',
  'bleu marine':    'blu marino',
  'bleu clair':     'azzurro',
  'bleu fonce':     'blu scuro',
  'bleu foncé':     'blu scuro',
  'rouge':          'rosso',
  'gris':           'grigio',
  'gris clair':     'grigio chiaro',
  'gris fonce':     'grigio scuro',
  'gris foncé':     'grigio scuro',
  'gris chine':     'grigio melange',
  'gris chiné':     'grigio melange',
  'marine':         'marino',
  'beige':          'beige',
  'vert':           'verde',
  'vert fonce':     'verde scuro',
  'vert foncé':     'verde scuro',
  'vert clair':     'verde chiaro',
  'vert kaki':      'verde kaki',
  'marron':         'marrone',
  'kaki':           'kaki',
  'ecru':           'ecru',
  'écru':           'ecru',
  'anthracite':     'antracite',
  'bordeaux':       'bordeaux',
  'camel':          'cammello',
  'rose':           'rosa',
  'jaune':          'giallo',
  'orange':         'arancione',
  'violet':         'viola',
  'taupe':          'talpa',
  'ivoire':         'avorio',
  'naturel':        'naturale',
  'clair':          'chiaro',
  'fonce':          'scuro',
  'foncé':          'scuro',
  'chine':          'melange',
  'chiné':          'melange',
  'raye':           'rigato',
  'rayé':           'rigato',
  'multicolore':    'multicolore',
  'denim':          'denim',
  'stone':          'stone',
  'safran':         'zafferano',
  'moka':           'moka',
  'corail':         'corallo',
  'sable':          'sabbia',
  'cyan':           'ciano',
  'turquoise':      'turchese',
  'lilas':          'lilla',
  'imprime':        'stampato',
  'imprimé':        'stampato',
  'uni':            'tinta unita',
  'prune':          'prugna',
  'ciel':           'celeste',
  'chocolat':       'cioccolato',
  'argent':         'argento',
  'or':             'oro',
  'cuivre':         'rame',
  'lavande':        'lavanda',
  'menthe':         'menta',
  'peche':          'pesca',
  'pêche':          'pesca',
  'rouille':        'ruggine',
  'brique':         'mattone',
  'olive':          'oliva',
  'sauge':          'salvia',
  'moutarde':       'senape',
  'cognac':         'cognac',
  'charbon':        'carbone',
  'perle':          'perla',
  'acier':          'acciaio',
  'indigo':         'indaco',
  'cobalt':         'cobalto',
  'saumon':         'salmone',
  'chair':          'carne',
  'terre':          'terra',
  'ocre':           'ocra',
  'abricot':        'albicocca',
  'cerise':         'ciliegia',
  'framboise':      'lampone',
  'aubergine':      'melanzana',
  'petrole':        'petrolio',
  'pétrole':        'petrolio',
  'azur':           'azzurro',
};

// ── French → Italian: Common product name words ──────────────────────────────
const NAME_WORDS = {
  // Clothing types
  'chemise':        'camicia',
  'chemises':       'camicie',
  'pantalon':       'pantalone',
  'pantalons':      'pantaloni',
  'veste':          'giacca',
  'vestes':         'giacche',
  'manteau':        'cappotto',
  'manteaux':       'cappotti',
  'pull':           'maglione',
  'pulls':          'maglioni',
  'sweat':          'felpa',
  'sweats':         'felpe',
  'sweatshirt':     'felpa',
  'bermuda':        'bermuda',
  'bermudas':       'bermuda',
  'costume':        'abito',
  'costumes':       'abiti',
  'gilet':          'gilet',
  'blouson':        'giubbotto',
  'blousons':       'giubbotti',
  'cardigan':       'cardigan',
  'debardeur':      'canottiera',
  'débardeur':      'canottiera',
  'boxer':          'boxer',
  'boxers':         'boxer',
  'calecon':        'boxer lungo',
  'caleçon':        'boxer lungo',
  'chaussette':     'calzino',
  'chaussettes':    'calzini',
  'chaussure':      'scarpa',
  'chaussures':     'scarpe',
  'casquette':      'cappellino',
  'ceinture':       'cintura',
  'echarpe':        'sciarpa',
  'écharpe':        'sciarpa',
  'bonnet':         'berretto',
  'gants':          'guanti',
  'cravate':        'cravatta',
  'pyjama':         'pigiama',
  'pyjamas':        'pigiami',
  'maillot':        'costume da bagno',
  'slip':           'slip',
  'parka':          'parka',
  'doudoune':       'piumino',
  'surchemise':     'sovracamicia',
  'sous-vetement':  'intimo',
  // Fits & styles
  'slim':           'slim',
  'regular':        'regular',
  'droit':          'dritto',
  'oversize':       'oversize',
  'boxy':           'boxy',
  'relaxed':        'relaxed',
  'ajuste':         'aderente',
  'ajusté':         'aderente',
  'ample':          'ampio',
  'court':          'corto',
  'long':           'lungo',
  'longue':         'lunga',
  // Parts & details
  'col':            'collo',
  'col rond':       'girocollo',
  'col v':          'scollo a V',
  'col roule':      'collo alto',
  'col roulé':      'collo alto',
  'capuche':        'cappuccio',
  'à capuche':      'con cappuccio',
  'manches':        'maniche',
  'manches courtes':'maniche corte',
  'manches longues':'maniche lunghe',
  'sans manches':   'senza maniche',
  'zip':            'zip',
  'zippe':          'con zip',
  'zippé':          'con zip',
  'boutons':        'bottoni',
  'boutonné':       'abbottonato',
  'poche':          'tasca',
  'poches':         'tasche',
  // Materials
  'coton':          'cotone',
  'lin':            'lino',
  'laine':          'lana',
  'soie':           'seta',
  'polyester':      'poliestere',
  'cuir':           'pelle',
  'velours':        'velluto',
  'flanelle':       'flanella',
  'twill':          'twill',
  'molleton':       'felpato',
  'jersey':         'jersey',
  'maille':         'maglia',
  'toile':          'tela',
  // Patterns
  'uni':            'tinta unita',
  'raye':           'rigato',
  'rayé':           'rigato',
  'rayures':        'righe',
  'carreaux':       'quadri',
  'à carreaux':     'a quadri',
  'imprime':        'stampato',
  'imprimé':        'stampato',
  'floral':         'floreale',
  'tropical':       'tropicale',
  // Qualifiers
  'essentiel':      'essenziale',
  'classique':      'classico',
  'basique':        'basico',
  'leger':          'leggero',
  'léger':          'leggero',
  'chaud':          'caldo',
  'stretch':        'stretch',
  'fluide':         'fluido',
  'technique':      'tecnico',
  'elegant':        'elegante',
  'élégant':        'elegante',
  'decontracte':    'casual',
  'décontracté':    'casual',
  'confort':        'comfort',
  'confortable':    'comodo',
  'nouveau':        'nuovo',
  'nouvelle':       'nuova',
  'petit':          'piccolo',
  'petite':         'piccola',
  'grand':          'grande',
  'homme':          'uomo',
  'femme':          'donna',
  // Colors in names (same as COLOR_MAP but for compound names)
  'noir':           'nero',
  'blanc':          'bianco',
  'bleu':           'blu',
  'bleu marine':    'blu marino',
  'rouge':          'rosso',
  'gris':           'grigio',
  'marine':         'marino',
  'beige':          'beige',
  'vert':           'verde',
  'marron':         'marrone',
  'kaki':           'kaki',
  'bordeaux':       'bordeaux',
  'rose':           'rosa',
  'jaune':          'giallo',
  'orange':         'arancione',
  // Prepositions
  'en':             'in',
  'à':              'a',
  'avec':           'con',
  'sans':           'senza',
  'et':             'e',
  'de':             'di',
  'du':             'del',
  'des':            'dei',
  'le':             'il',
  'la':             'la',
  'les':            'i',
  'un':             'un',
  'une':            'una',
};

// ── Normalize for matching ───────────────────────────────────────────────────
function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// ── Translate a color string ─────────────────────────────────────────────────
function translateColor(frColor) {
  if (!frColor) return frColor;
  const key = norm(frColor);

  // Exact match first
  for (const [fr, it] of Object.entries(COLOR_MAP)) {
    if (norm(fr) === key) return it;
  }

  // Try compound colors like "bleu marine" or "gris clair"
  const parts = key.split(/[\s-]+/);
  const translated = parts.map(p => {
    for (const [fr, it] of Object.entries(COLOR_MAP)) {
      if (norm(fr) === p) return it;
    }
    return p;
  });

  const result = translated.join(' ');
  return result !== key ? result : frColor;
}

// ── Translate a category/subcategory ─────────────────────────────────────────
function translateCategory(frCat) {
  if (!frCat) return frCat;
  const key = norm(frCat);
  for (const [fr, it] of Object.entries(CATEGORY_MAP)) {
    if (norm(fr) === key) return it;
  }
  return frCat; // keep as-is if no match
}

// ── Translate a product name ─────────────────────────────────────────────────
function translateName(frName) {
  if (!frName) return frName;

  // Try multi-word replacements first (longer phrases first)
  let result = frName;
  const sortedPhrases = Object.entries(NAME_WORDS)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [fr, it] of sortedPhrases) {
    // Case-insensitive word boundary replacement
    const escaped = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[\\s-])${escaped}(?=$|[\\s-])`, 'gi');
    result = result.replace(regex, it);
  }

  // Capitalize first letter
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

// ── Translate description (key French words) ─────────────────────────────────
const DESC_PHRASES = {
  // Common description phrases
  'composition':        'composizione',
  'entretien':          'manutenzione',
  'lavage':             'lavaggio',
  'laver':              'lavare',
  'séchage':            'asciugatura',
  'repassage':          'stiratura',
  'ne pas':             'non',
  'machine':            'lavatrice',
  'à la main':          'a mano',
  'température':        'temperatura',
  'degrés':             'gradi',
  'matière':            'materiale',
  'tissu':              'tessuto',
  'doublure':           'fodera',
  'fermeture':          'chiusura',
  'fermeture éclair':   'cerniera',
  'taille':             'taglia',
  'coupe':              'taglio',
  'longueur':           'lunghezza',
  'largeur':            'larghezza',
  'hauteur':            'altezza',
  'poids':              'peso',
  'fabriqué':           'fabbricato',
  'fabrique':           'fabbricato',
  'conçu':              'progettato',
  'idéal':              'ideale',
  'ideal':              'ideale',
  'parfait':            'perfetto',
  'disponible':         'disponibile',
  'couleur':            'colore',
  'couleurs':           'colori',
  'tailles':            'taglie',
  'ce produit':         'questo prodotto',
  'notre':              'nostro',
  'nos':                'nostri',
  'votre':              'vostro',
  'vos':                'vostri',
  'pour homme':         'da uomo',
  'pour femme':         'da donna',
  'collection':         'collezione',
  'saison':             'stagione',
  'printemps':          'primavera',
  'été':                'estate',
  'ete':                'estate',
  'automne':            'autunno',
  'hiver':              'inverno',
  'confortable':        'comodo',
  'élégant':            'elegante',
  'elegant':            'elegante',
  'moderne':            'moderno',
  'tendance':           'tendenza',
  'intemporel':         'intramontabile',
  'polyvalent':         'versatile',
  'facile':             'facile',
  'pratique':           'pratico',
  'doux':               'morbido',
  'résistant':          'resistente',
  'resistant':          'resistente',
  'léger':              'leggero',
  'leger':              'leggero',
  'chaud':              'caldo',
  'respirant':          'traspirante',
  'imperméable':        'impermeabile',
  'impermeable':        'impermeabile',
  'associer':           'abbinare',
  'porter':             'indossare',
  'look':               'look',
  'style':              'stile',
  'détail':             'dettaglio',
  'detail':             'dettaglio',
  'détails':            'dettagli',
  'details':            'dettagli',
  'finition':           'finitura',
  'finitions':          'finiture',
  'qualité':            'qualità',
  'qualite':            'qualità',
};

function translateDescription(frDesc) {
  if (!frDesc) return frDesc;
  let result = frDesc;

  // Sort by length descending for longer matches first
  const sorted = Object.entries({...DESC_PHRASES, ...NAME_WORDS})
    .sort((a, b) => b[0].length - a[0].length);

  for (const [fr, it] of sorted) {
    const escaped = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=^|[\\s.,;:!?()-])${escaped}(?=$|[\\s.,;:!?()-])`, 'gi');
    result = result.replace(regex, it);
  }

  return result;
}

// ── Translate tags array ─────────────────────────────────────────────────────
function translateTags(tags) {
  if (!tags || !Array.isArray(tags)) return tags;
  return tags.map(tag => {
    const catTranslation = translateCategory(tag);
    if (catTranslation !== tag) return catTranslation;
    const colorTranslation = translateColor(tag);
    if (colorTranslation !== tag) return colorTranslation;
    // Common tag translations
    const tagMap = { 'homme': 'uomo', 'femme': 'donna', 'celio': 'celio' };
    return tagMap[norm(tag)] || tag;
  });
}

// ── Translate variants (color field) ─────────────────────────────────────────
function translateVariants(variants) {
  if (!variants || !Array.isArray(variants)) return variants;
  return variants.map(v => ({
    ...v,
    color: v.color ? translateColor(v.color) : v.color,
  }));
}

// ── Translate colorImages keys ───────────────────────────────────────────────
function translateColorImages(colorImages) {
  if (!colorImages || typeof colorImages !== 'object') return colorImages;
  const result = {};
  for (const [color, urls] of Object.entries(colorImages)) {
    const itColor = translateColor(color);
    result[itColor] = urls;
  }
  return result;
}

// ── Translate attributes (colors array) ──────────────────────────────────────
function translateAttributes(attributes) {
  if (!attributes || typeof attributes !== 'object') return attributes;
  const result = { ...attributes };
  if (Array.isArray(result.colors)) {
    result.colors = result.colors.map(c => translateColor(c));
  }
  if (result.material) {
    result.material = translateDescription(result.material);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════════
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to database.\n');

  // Fetch all products
  const { rows: products } = await client.query(
    'SELECT id, name, category, subcategory, color, description, tags, meta_title, meta_description, variants, color_images, attributes, language FROM products ORDER BY id'
  );

  console.log(`Found ${products.length} products to translate.\n`);

  let updated = 0;
  let skipped = 0;

  for (const p of products) {
    const newName        = translateName(p.name);
    const newCategory    = translateCategory(p.category);
    const newSubcategory = translateCategory(p.subcategory);
    const newColor       = translateColor(p.color);
    const newDescription = translateDescription(p.description);
    const newTags        = translateTags(typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags);
    const newMetaTitle   = translateName(p.meta_title);
    const newMetaDesc    = translateDescription(p.meta_description);
    const newVariants    = translateVariants(typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants);
    const newColorImages = translateColorImages(typeof p.color_images === 'string' ? JSON.parse(p.color_images) : p.color_images);
    const newAttributes  = translateAttributes(typeof p.attributes === 'string' ? JSON.parse(p.attributes) : p.attributes);

    // Check if anything changed
    const changed = newName !== p.name ||
                    newCategory !== p.category ||
                    newSubcategory !== p.subcategory ||
                    newColor !== p.color ||
                    newDescription !== p.description;

    if (!changed && p.language === 'it') {
      skipped++;
      continue;
    }

    await client.query(`
      UPDATE products SET
        name = $1,
        category = $2,
        subcategory = $3,
        color = $4,
        description = $5,
        tags = $6,
        meta_title = $7,
        meta_description = $8,
        variants = $9,
        color_images = $10,
        attributes = $11,
        language = 'it',
        updated_at = NOW()
      WHERE id = $12
    `, [
      newName,
      newCategory,
      newSubcategory,
      newColor,
      newDescription,
      JSON.stringify(newTags),
      newMetaTitle,
      newMetaDesc,
      JSON.stringify(newVariants),
      JSON.stringify(newColorImages),
      JSON.stringify(newAttributes),
      p.id,
    ]);

    if (newName !== p.name || newCategory !== p.category || newColor !== p.color) {
      console.log(`  #${p.id}: "${p.name}" → "${newName}" | ${p.category} → ${newCategory} | ${p.color || '-'} → ${newColor || '-'}`);
    }
    updated++;
  }

  // Also translate categories table
  const { rows: cats } = await client.query('SELECT id, name, description FROM categories');
  let catUpdated = 0;
  for (const cat of cats) {
    const newName = translateCategory(cat.name);
    const newDesc = cat.description ? translateDescription(cat.description) : cat.description;
    if (newName !== cat.name || newDesc !== cat.description) {
      await client.query('UPDATE categories SET name = $1, description = $2 WHERE id = $3', [newName, newDesc, cat.id]);
      console.log(`  Category #${cat.id}: "${cat.name}" → "${newName}"`);
      catUpdated++;
    }
  }

  console.log(`\nDone! Products: ${updated} updated, ${skipped} skipped. Categories: ${catUpdated} updated.`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
