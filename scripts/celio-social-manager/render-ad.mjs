import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = '5bdb248c317a4baf891427c9cb48fca0a8da490ecf2a235befa353a77d1c6e3268990e02bf76a13258ed2fe25edad148';
const LOGO = 'https://files.catbox.moe/hskwin.jpg';
const OUTPUT_DIR = path.join(__dirname, 'output');

function api(method, ep, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: 'api.creatomate.com', path: '/v1' + ep, method,
      headers: { 'Authorization': 'Bearer ' + API_KEY, 'Content-Type': 'application/json' } };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Product data - Italian
const P = {
  name: 'Camicia oversize a righe',
  sub: '100% Cotone Oxford',
  mat: '100% Cotone',
  price: '35,99',
  color: 'Grigio Taupe',
  img: [
    'https://www.celio.com/dw/image/v2/BGBR_PRD/on/demandware.static/-/Sites-celio-master/default/dw74ec218f/hi-res/183722-2616-NACASTRI_GREYTAUPE-WEB3-1.jpg?sw=800&sh=1067&sm=fit',
    'https://www.celio.com/dw/image/v2/BGBR_PRD/on/demandware.static/-/Sites-celio-master/default/dw3d9907de/hi-res/183722-2616-NACASTRI_GREYTAUPE-WEB3-2.jpg?sw=800&sh=1067&sm=fit',
    'https://www.celio.com/dw/image/v2/BGBR_PRD/on/demandware.static/-/Sites-celio-master/default/dw4816e037/hi-res/183722-2616-NACASTRI_GREYTAUPE-WEB3-3.jpg?sw=800&sh=1067&sm=fit',
    'https://www.celio.com/dw/image/v2/BGBR_PRD/on/demandware.static/-/Sites-celio-master/default/dw7b284dbe/hi-res/183722-2616-NACASTRI_GREYTAUPE-WEB3-4.jpg?sw=800&sh=1067&sm=fit',
  ],
};

const source = {
  width: 1080, height: 1920, duration: 18,
  fill_color: '#f5f5f0',
  output_format: 'mp4',
  elements: [
    // SCENE 1: Hero (0-4s)
    {
      type: 'composition', track: 1, time: 0, duration: 4.5,
      animations: [{ time: 'end', type: 'fade', duration: 0.4, fade: true }],
      elements: [
        { type: 'image', track: 1, source: P.img[0], fit: 'cover',
          animations: [{ time: 0, type: 'scale', duration: 4.5, start_scale: '100%', end_scale: '108%' }] },
        { type: 'image', track: 2, source: LOGO, x: '50%', y: '5%', width: '30%', height: '6%', fit: 'contain' },
        { type: 'shape', track: 3, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
          y: '70%', height: '30%', y_anchor: '0%',
          fill_color: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)' },
        { type: 'text', track: 4, text: P.name, time: 0.8,
          x: '50%', y: '85%', width: '85%', height: '6%',
          fill_color: '#ffffff', font_family: 'Inter', font_weight: '700',
          font_size_maximum: '5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.6, direction: 'up', easing: 'quadratic-out' }] },
        { type: 'text', track: 5, text: P.sub, time: 1.2,
          x: '50%', y: '91%', width: '70%', height: '4%',
          fill_color: 'rgba(255,255,255,0.7)', font_family: 'Inter', font_weight: '300',
          font_size_maximum: '3.5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.5, direction: 'up' }] },
      ]
    },

    // SCENE 2: Details (4-7.5s)
    {
      type: 'composition', track: 1, time: 4, duration: 3.8,
      fill_color: '#f5f5f0',
      animations: [
        { time: 0, type: 'slide', duration: 0.5, direction: 'left', easing: 'quadratic-out' },
        { time: 'end', type: 'fade', duration: 0.3, fade: true }
      ],
      elements: [
        { type: 'image', track: 1, source: P.img[1], fit: 'cover',
          y: '0%', height: '60%', y_anchor: '0%',
          animations: [{ time: 0, type: 'scale', duration: 3.8, start_scale: '105%', end_scale: '100%' }] },
        { type: 'shape', track: 2, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
          y: '60%', height: '40%', y_anchor: '0%', fill_color: '#ffffff' },
        { type: 'image', track: 3, source: LOGO, x: '50%', y: '64%', width: '18%', height: '4%', fit: 'contain' },
        { type: 'text', track: 4, text: 'MATERIALE', time: 0.3,
          x: '50%', y: '72%', width: '60%', height: '3%',
          fill_color: '#999999', font_family: 'Inter', font_weight: '300',
          font_size_maximum: '2.5 vmin', x_alignment: '50%', y_alignment: '50%', letter_spacing: '30%',
          animations: [{ time: 0, type: 'text-appear', duration: 0.4 }] },
        { type: 'text', track: 5, text: P.mat, time: 0.6,
          x: '50%', y: '78%', width: '70%', height: '5%',
          fill_color: '#1a1a1a', font_family: 'Inter', font_weight: '700',
          font_size_maximum: '5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.5, direction: 'up' }] },
        { type: 'text', track: 6, text: 'Colore: ' + P.color, time: 0.9,
          x: '50%', y: '85%', width: '60%', height: '4%',
          fill_color: '#666666', font_family: 'Inter', font_weight: '400',
          font_size_maximum: '3.5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.4, direction: 'up' }] },
        { type: 'text', track: 7, text: 'Fit Oversize  |  A Righe  |  Oxford', time: 1.2,
          x: '50%', y: '92%', width: '80%', height: '3.5%',
          fill_color: '#999999', font_family: 'Inter', font_weight: '400',
          font_size_maximum: '2.8 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-appear', duration: 0.5 }] },
      ]
    },

    // SCENE 3: Lifestyle (7.5-11s)
    {
      type: 'composition', track: 1, time: 7.5, duration: 3.5,
      animations: [
        { time: 0, type: 'slide', duration: 0.5, direction: 'right', easing: 'quadratic-out' },
        { time: 'end', type: 'fade', duration: 0.3, fade: true }
      ],
      elements: [
        { type: 'image', track: 1, source: P.img[2], fit: 'cover',
          animations: [{ time: 0, type: 'scale', duration: 3.5, start_scale: '100%', end_scale: '107%' }] },
        { type: 'shape', track: 2, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
          y: '75%', height: '25%', y_anchor: '0%',
          fill_color: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)' },
        { type: 'image', track: 3, source: LOGO, x: '50%', y: '4%', width: '22%', height: '4.5%', fit: 'contain' },
        { type: 'text', track: 4, text: 'Lo stile che ti definisce', time: 0.5,
          x: '50%', y: '88%', width: '80%', height: '5%',
          fill_color: '#ffffff', font_family: 'Inter', font_weight: '300', font_style: 'italic',
          font_size_maximum: '4 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.6, direction: 'up' }] },
      ]
    },

    // SCENE 4: Price reveal (11-14.5s)
    {
      type: 'composition', track: 1, time: 11, duration: 3.5,
      fill_color: '#f5f5f0',
      animations: [
        { time: 0, type: 'scale', duration: 0.5, start_scale: '120%', easing: 'quadratic-out', transition: true },
        { time: 'end', type: 'fade', duration: 0.3, fade: true }
      ],
      elements: [
        { type: 'image', track: 1, source: P.img[3], fit: 'cover',
          animations: [{ time: 0, type: 'scale', duration: 3.5, start_scale: '105%', end_scale: '100%' }] },
        { type: 'shape', track: 2, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
          y: '78%', height: '15%', y_anchor: '0%', fill_color: 'rgba(0,0,0,0.85)' },
        { type: 'text', track: 3, text: P.price + ' EUR', time: 0.4,
          x: '50%', y: '83%', width: '60%', height: '7%',
          fill_color: '#ffffff', font_family: 'Inter', font_weight: '800',
          font_size_maximum: '7 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-scale', duration: 0.5, easing: 'back-out' }] },
        { type: 'text', track: 4, text: 'Disponibile in negozio e online', time: 0.8,
          x: '50%', y: '90%', width: '70%', height: '4%',
          fill_color: 'rgba(255,255,255,0.6)', font_family: 'Inter', font_weight: '300',
          font_size_maximum: '3 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-appear', duration: 0.4 }] },
      ]
    },

    // SCENE 5: CTA (14.5-18s)
    {
      type: 'composition', track: 1, time: 14.5, duration: 3.5,
      fill_color: '#0a0a0a',
      animations: [{ time: 0, type: 'fade', duration: 0.6, fade: true }],
      elements: [
        { type: 'image', track: 1, source: LOGO, x: '50%', y: '35%', width: '50%', height: '12%', fit: 'contain',
          animations: [{ time: 0, type: 'scale', duration: 0.8, start_scale: '80%', easing: 'quadratic-out' }] },
        { type: 'shape', track: 2, path: 'M 0 0 L 100 0 L 100 100 L 0 100 Z',
          x: '50%', y: '48%', width: '15%', height: '0.2%', fill_color: '#333',
          time: 0.5, animations: [{ time: 0, type: 'wipe', duration: 0.4, direction: 'right' }] },
        { type: 'text', track: 3, text: P.name, time: 0.6,
          x: '50%', y: '55%', width: '80%', height: '5%',
          fill_color: '#ffffff', font_family: 'Inter', font_weight: '600',
          font_size_maximum: '4 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.5, direction: 'up' }] },
        { type: 'text', track: 4, text: P.price + ' EUR', time: 0.9,
          x: '50%', y: '62%', width: '40%', height: '5%',
          fill_color: '#ffd700', font_family: 'Inter', font_weight: '800',
          font_size_maximum: '5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-scale', duration: 0.4 }] },
        { type: 'text', track: 5, text: 'Acquista su celiopromo.it', time: 1.3,
          x: '50%', y: '75%', width: '70%', height: '5%',
          fill_color: 'rgba(255,255,255,0.8)', font_family: 'Inter', font_weight: '500',
          font_size_maximum: '3.5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-slide', duration: 0.5, direction: 'up' }] },
        { type: 'text', track: 6, text: 'Milano | Verona | Padova | Vicenza | Biella', time: 1.6,
          x: '50%', y: '82%', width: '80%', height: '3.5%',
          fill_color: 'rgba(255,255,255,0.3)', font_family: 'Inter', font_weight: '300',
          font_size_maximum: '2.5 vmin', x_alignment: '50%', y_alignment: '50%',
          animations: [{ time: 0, type: 'text-appear', duration: 0.5 }] },
      ]
    },
  ]
};

async function main() {
  console.log('');
  console.log('  CELIO - Video Pubblicitario');
  console.log('  Prodotto:', P.name);
  console.log('  Prezzo:', P.price, 'EUR');
  console.log('  Materiale:', P.mat);
  console.log('  Colore:', P.color);
  console.log('  5 scene: Hero > Dettagli > Lifestyle > Prezzo > CTA');
  console.log('  Logo celio*: SI (immagine)');
  console.log('');

  const result = await api('POST', '/renders', { source });
  const render = Array.isArray(result) ? result[0] : result;
  if (!render?.id) { console.log('Errore:', JSON.stringify(result).substring(0, 500)); return; }
  console.log('  Render:', render.id);

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const check = await api('GET', '/renders/' + render.id);
    process.stdout.write('  ' + check.status + '...\r');
    if (check.status === 'succeeded') {
      const out = path.join(OUTPUT_DIR, 'celio_AD_camicia.mp4');
      await new Promise((resolve) => {
        const dl = (url) => https.get(url, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) return dl(res.headers.location);
          res.pipe(fs.createWriteStream(out));
          res.on('end', resolve);
        });
        dl(check.url);
      });
      const sz = (fs.statSync(out).size / 1048576).toFixed(1);
      console.log('\n');
      console.log('  VIDEO PRONTO: ' + out);
      console.log('  Dimensione: ' + sz + ' MB');
      return;
    }
    if (check.status === 'failed') { console.log('\n  ERRORE:', check.error_message); return; }
  }
}

main().catch(e => console.error(e));
