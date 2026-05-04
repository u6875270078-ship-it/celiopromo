/**
 * CELIO ITALIA - 5 Template Video Diversi
 *
 * Ogni template e un source JSON per Creatomate.
 * Lo script sceglie uno random ogni volta.
 */

const LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Celio%27s_logo.svg';
const SITE = 'celiopromo.it';

// ===== TEMPLATE 1: Product Slideshow (verticale, 1 prodotto alla volta) =====
function slideshow(products, season) {
  const slides = products.map((p, i) => ({
    id: `slide_${i}`,
    type: 'composition',
    track: 1,
    time: i * 3,
    duration: 3.5,
    animations: [
      { time: 0, type: 'fade', duration: 0.5, fade: true },
      { time: 'end', type: 'fade', duration: 0.5, fade: true }
    ],
    elements: [
      {
        type: 'image',
        track: 1,
        source: p.image,
        fit: 'cover',
        animations: [{ time: 0, type: 'scale', duration: 3.5, start_scale: '100%', end_scale: '110%' }]
      },
      // Gradient bottom
      {
        type: 'shape',
        track: 2,
        path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
        y: '60%',
        height: '40%',
        fill_color: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
      },
      // Product name
      {
        type: 'text',
        track: 3,
        text: p.name,
        y: '80%',
        x: '5%',
        width: '70%',
        height: '10%',
        x_anchor: '0%',
        fill_color: 'rgba(255,255,255,1)',
        font_family: 'Inter',
        font_weight: '600',
        font_size_maximum: '4.5 vmin',
        y_alignment: '100%',
        x_alignment: '0%',
      },
      // Price
      {
        type: 'text',
        track: 4,
        text: p.price + ' EUR',
        y: '90%',
        x: '5%',
        width: '40%',
        height: '7%',
        x_anchor: '0%',
        fill_color: 'rgba(255,200,0,1)',
        font_family: 'Inter',
        font_weight: '800',
        font_size_maximum: '5 vmin',
        y_alignment: '50%',
        x_alignment: '0%',
      },
      // Logo top right
      {
        type: 'image',
        track: 5,
        source: LOGO_URL,
        x: '85%',
        y: '5%',
        width: '25%',
        height: '6%',
      }
    ]
  }));

  // Ending slide
  const endTime = products.length * 3;
  slides.push({
    type: 'composition',
    track: 1,
    time: endTime,
    duration: 3,
    animations: [{ time: 0, type: 'fade', duration: 0.5, fade: true }],
    fill_color: 'rgba(10,10,10,1)',
    elements: [
      { type: 'image', track: 1, source: LOGO_URL, y: '40%', width: '50%', height: '12%' },
      { type: 'text', track: 2, text: `Scopri tutto su\n${SITE}`, y: '62%', width: '80%', height: '15%', fill_color: 'rgba(255,255,255,0.8)', font_family: 'Inter', font_weight: '500', font_size_maximum: '4.5 vmin', x_alignment: '50%', y_alignment: '50%' },
      { type: 'text', track: 3, text: season, y: '78%', width: '60%', height: '8%', fill_color: 'rgba(255,200,0,0.8)', font_family: 'Inter', font_weight: '300', font_size_maximum: '3 vmin', x_alignment: '50%', y_alignment: '50%' },
    ]
  });

  return {
    width: 1080, height: 1920,
    duration: endTime + 3,
    fill_color: 'rgba(0,0,0,1)',
    elements: slides,
    output_format: 'mp4',
  };
}

// ===== TEMPLATE 2: Split Screen (prodotto sopra, info sotto) =====
function splitScreen(products, season) {
  const slides = products.map((p, i) => ({
    type: 'composition',
    track: 1,
    time: i * 2.8,
    duration: 3.3,
    animations: [
      { time: 0, type: 'slide', duration: 0.5, direction: 'right' },
      { time: 'end', type: 'slide', duration: 0.5, direction: 'left' }
    ],
    elements: [
      // Product image top 65%
      {
        type: 'image', track: 1, source: p.image,
        y: '0%', height: '65%', y_anchor: '0%',
        fit: 'cover',
        animations: [{ time: 0, type: 'scale', duration: 3.3, start_scale: '105%', end_scale: '100%' }]
      },
      // Info area bottom 35%
      {
        type: 'shape', track: 2,
        path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
        y: '65%', height: '35%', y_anchor: '0%',
        fill_color: 'rgba(250,250,250,1)',
      },
      // Logo small
      {
        type: 'image', track: 3, source: LOGO_URL,
        x: '15%', y: '70%', width: '20%', height: '5%',
      },
      // Product name
      {
        type: 'text', track: 4,
        text: p.name,
        x: '10%', y: '78%', width: '80%', height: '8%',
        x_anchor: '0%',
        fill_color: 'rgba(30,30,30,1)',
        font_family: 'Inter', font_weight: '600',
        font_size_maximum: '4 vmin',
        x_alignment: '0%', y_alignment: '50%',
      },
      // Price
      {
        type: 'text', track: 5,
        text: p.price + ' EUR',
        x: '10%', y: '87%', width: '40%', height: '7%',
        x_anchor: '0%',
        fill_color: 'rgba(220,38,38,1)',
        font_family: 'Inter', font_weight: '800',
        font_size_maximum: '5.5 vmin',
        x_alignment: '0%', y_alignment: '50%',
      },
      // Slide counter
      {
        type: 'text', track: 6,
        text: `${i + 1}/${products.length}`,
        x: '90%', y: '87%', width: '15%', height: '5%',
        fill_color: 'rgba(150,150,150,1)',
        font_family: 'Inter', font_weight: '300',
        font_size_maximum: '3 vmin',
        x_alignment: '100%', y_alignment: '50%',
      },
    ]
  }));

  // CTA slide
  const endTime = products.length * 2.8;
  slides.push({
    type: 'composition', track: 1, time: endTime, duration: 3,
    fill_color: 'rgba(10,10,10,1)',
    animations: [{ time: 0, type: 'fade', duration: 0.6, fade: true }],
    elements: [
      { type: 'image', track: 1, source: LOGO_URL, y: '38%', width: '45%', height: '10%' },
      { type: 'text', track: 2, text: `${SITE}`, y: '55%', width: '70%', height: '8%', fill_color: 'rgba(255,255,255,1)', font_family: 'Inter', font_weight: '700', font_size_maximum: '5 vmin', x_alignment: '50%', y_alignment: '50%' },
      { type: 'text', track: 3, text: season, y: '65%', width: '60%', height: '6%', fill_color: 'rgba(255,255,255,0.5)', font_family: 'Inter', font_weight: '300', font_size_maximum: '3 vmin', x_alignment: '50%', y_alignment: '50%' },
    ]
  });

  return { width: 1080, height: 1920, duration: endTime + 3, fill_color: 'rgba(255,255,255,1)', elements: slides, output_format: 'mp4' };
}

// ===== TEMPLATE 3: Minimal White (prodotto centrato, sfondo bianco pulito) =====
function minimalWhite(products, season) {
  const slides = products.map((p, i) => ({
    type: 'composition', track: 1, time: i * 2.5, duration: 3,
    fill_color: 'rgba(255,255,255,1)',
    animations: [
      { time: 0, type: 'fade', duration: 0.4, fade: true },
      { time: 'end', type: 'fade', duration: 0.4, fade: true }
    ],
    elements: [
      // Product image centered
      {
        type: 'image', track: 1, source: p.image,
        y: '35%', width: '85%', height: '60%',
        fit: 'contain',
        animations: [{ time: 0, type: 'scale', duration: 3, start_scale: '95%', end_scale: '100%' }]
      },
      // Logo top center
      { type: 'image', track: 2, source: LOGO_URL, y: '4%', width: '25%', height: '5%' },
      // Thin line
      { type: 'shape', track: 3, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', y: '72%', width: '30%', height: '0.15%', fill_color: 'rgba(200,200,200,1)' },
      // Product name
      {
        type: 'text', track: 4, text: p.name,
        y: '77%', width: '80%', height: '6%',
        fill_color: 'rgba(50,50,50,1)',
        font_family: 'Inter', font_weight: '500',
        font_size_maximum: '3.5 vmin',
        x_alignment: '50%', y_alignment: '50%',
      },
      // Price
      {
        type: 'text', track: 5, text: p.price + ' EUR',
        y: '84%', width: '40%', height: '6%',
        fill_color: 'rgba(20,20,20,1)',
        font_family: 'Inter', font_weight: '800',
        font_size_maximum: '5 vmin',
        x_alignment: '50%', y_alignment: '50%',
      },
    ]
  }));

  const endTime = products.length * 2.5;
  slides.push({
    type: 'composition', track: 1, time: endTime, duration: 3,
    fill_color: 'rgba(255,255,255,1)',
    animations: [{ time: 0, type: 'fade', duration: 0.5, fade: true }],
    elements: [
      { type: 'image', track: 1, source: LOGO_URL, y: '42%', width: '40%', height: '8%' },
      { type: 'shape', track: 2, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', y: '52%', width: '20%', height: '0.15%', fill_color: 'rgba(200,200,200,1)' },
      { type: 'text', track: 3, text: SITE, y: '58%', width: '60%', height: '6%', fill_color: 'rgba(30,30,30,1)', font_family: 'Inter', font_weight: '600', font_size_maximum: '4 vmin', x_alignment: '50%', y_alignment: '50%' },
      { type: 'text', track: 4, text: season, y: '65%', width: '50%', height: '5%', fill_color: 'rgba(150,150,150,1)', font_family: 'Inter', font_weight: '300', font_size_maximum: '3 vmin', x_alignment: '50%', y_alignment: '50%' },
    ]
  });

  return { width: 1080, height: 1920, duration: endTime + 3, fill_color: 'rgba(255,255,255,1)', elements: slides, output_format: 'mp4' };
}

// ===== TEMPLATE 4: Bold Dark (sfondo nero, testo grande) =====
function boldDark(products, season) {
  const slides = products.map((p, i) => ({
    type: 'composition', track: 1, time: i * 2.5, duration: 3,
    fill_color: 'rgba(10,10,10,1)',
    animations: [
      { time: 0, type: 'scale', duration: 0.5, start_scale: '110%', transition: true },
      { time: 'end', type: 'fade', duration: 0.3, fade: true }
    ],
    elements: [
      // Product image
      {
        type: 'image', track: 1, source: p.image,
        y: '30%', width: '75%', height: '55%', fit: 'contain',
        animations: [{ time: 0, type: 'scale', duration: 3, start_scale: '100%', end_scale: '105%' }]
      },
      // Price big at bottom
      {
        type: 'text', track: 2, text: p.price + ' EUR',
        y: '70%', width: '80%', height: '10%',
        fill_color: 'rgba(255,255,255,1)',
        font_family: 'Inter', font_weight: '900',
        font_size_maximum: '7 vmin',
        x_alignment: '50%', y_alignment: '50%',
      },
      // Name smaller
      {
        type: 'text', track: 3, text: p.name,
        y: '80%', width: '80%', height: '6%',
        fill_color: 'rgba(255,255,255,0.6)',
        font_family: 'Inter', font_weight: '400',
        font_size_maximum: '3 vmin',
        x_alignment: '50%', y_alignment: '50%',
      },
      // Logo
      { type: 'image', track: 4, source: LOGO_URL, y: '5%', width: '22%', height: '5%' },
    ]
  }));

  const endTime = products.length * 2.5;
  slides.push({
    type: 'composition', track: 1, time: endTime, duration: 3,
    fill_color: 'rgba(10,10,10,1)',
    animations: [{ time: 0, type: 'fade', duration: 0.6, fade: true }],
    elements: [
      { type: 'image', track: 1, source: LOGO_URL, y: '40%', width: '45%', height: '10%' },
      { type: 'text', track: 2, text: SITE, y: '56%', width: '70%', height: '7%', fill_color: 'rgba(255,255,255,1)', font_family: 'Inter', font_weight: '700', font_size_maximum: '5 vmin', x_alignment: '50%', y_alignment: '50%' },
      { type: 'text', track: 3, text: season, y: '65%', width: '50%', height: '5%', fill_color: 'rgba(255,255,255,0.4)', font_family: 'Inter', font_weight: '300', font_size_maximum: '3 vmin', x_alignment: '50%', y_alignment: '50%' },
    ]
  });

  return { width: 1080, height: 1920, duration: endTime + 3, fill_color: 'rgba(10,10,10,1)', elements: slides, output_format: 'mp4' };
}

// ===== TEMPLATE 5: Side by Side (2 colonne, confronto prodotti) =====
function sideBySide(products, season) {
  const pairs = [];
  for (let i = 0; i < products.length; i += 2) {
    pairs.push(products.slice(i, i + 2));
  }

  const slides = pairs.map((pair, i) => ({
    type: 'composition', track: 1, time: i * 3, duration: 3.5,
    fill_color: 'rgba(245,245,245,1)',
    animations: [
      { time: 0, type: 'fade', duration: 0.4, fade: true },
      { time: 'end', type: 'fade', duration: 0.4, fade: true }
    ],
    elements: [
      // Logo top
      { type: 'image', track: 1, source: LOGO_URL, y: '4%', width: '22%', height: '4%' },
      // Left product
      { type: 'image', track: 2, source: pair[0].image, x: '25%', y: '35%', width: '45%', height: '50%', fit: 'contain' },
      { type: 'text', track: 3, text: pair[0].name, x: '25%', y: '65%', width: '45%', height: '5%', fill_color: 'rgba(50,50,50,1)', font_family: 'Inter', font_weight: '500', font_size_maximum: '2.8 vmin', x_alignment: '50%', y_alignment: '50%' },
      { type: 'text', track: 4, text: pair[0].price + ' EUR', x: '25%', y: '71%', width: '45%', height: '5%', fill_color: 'rgba(220,38,38,1)', font_family: 'Inter', font_weight: '800', font_size_maximum: '4 vmin', x_alignment: '50%', y_alignment: '50%' },
      // Right product (if exists)
      ...(pair[1] ? [
        { type: 'image', track: 5, source: pair[1].image, x: '75%', y: '35%', width: '45%', height: '50%', fit: 'contain' },
        { type: 'text', track: 6, text: pair[1].name, x: '75%', y: '65%', width: '45%', height: '5%', fill_color: 'rgba(50,50,50,1)', font_family: 'Inter', font_weight: '500', font_size_maximum: '2.8 vmin', x_alignment: '50%', y_alignment: '50%' },
        { type: 'text', track: 7, text: pair[1].price + ' EUR', x: '75%', y: '71%', width: '45%', height: '5%', fill_color: 'rgba(220,38,38,1)', font_family: 'Inter', font_weight: '800', font_size_maximum: '4 vmin', x_alignment: '50%', y_alignment: '50%' },
      ] : []),
      // Divider
      { type: 'shape', track: 8, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z', x: '50%', y: '40%', width: '0.1%', height: '35%', fill_color: 'rgba(200,200,200,1)' },
    ]
  }));

  const endTime = pairs.length * 3;
  slides.push({
    type: 'composition', track: 1, time: endTime, duration: 3,
    fill_color: 'rgba(10,10,10,1)',
    animations: [{ time: 0, type: 'fade', duration: 0.5, fade: true }],
    elements: [
      { type: 'image', track: 1, source: LOGO_URL, y: '42%', width: '40%', height: '8%' },
      { type: 'text', track: 2, text: SITE, y: '56%', width: '60%', height: '6%', fill_color: 'rgba(255,255,255,1)', font_family: 'Inter', font_weight: '600', font_size_maximum: '4.5 vmin', x_alignment: '50%', y_alignment: '50%' },
      { type: 'text', track: 3, text: season, y: '64%', width: '50%', height: '5%', fill_color: 'rgba(255,255,255,0.5)', font_family: 'Inter', font_weight: '300', font_size_maximum: '3 vmin', x_alignment: '50%', y_alignment: '50%' },
    ]
  });

  return { width: 1080, height: 1920, duration: endTime + 3, fill_color: 'rgba(245,245,245,1)', elements: slides, output_format: 'mp4' };
}

// ===== EXPORT =====
export const TEMPLATES = {
  slideshow:    { name: 'Slideshow',     fn: slideshow },
  splitScreen:  { name: 'Split Screen',  fn: splitScreen },
  minimalWhite: { name: 'Minimal White', fn: minimalWhite },
  boldDark:     { name: 'Bold Dark',     fn: boldDark },
  sideBySide:   { name: 'Side by Side',  fn: sideBySide },
};

export function getRandomTemplate() {
  const keys = Object.keys(TEMPLATES);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { key, ...TEMPLATES[key] };
}

export function buildSource(templateKey, products, season) {
  const prods = products.map(p => ({
    name: p.name.replace(/ - [a-zA-Zéèêàùûôîç\s]+$/i, '').substring(0, 40),
    price: p.price,
    image: p.main_image,
  }));
  return TEMPLATES[templateKey].fn(prods, season);
}
