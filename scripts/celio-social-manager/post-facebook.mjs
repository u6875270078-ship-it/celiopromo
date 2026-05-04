/**
 * CELIO ITALIA - Pubblicazione Automatica su Facebook
 *
 * Pubblica video + caption sulla Pagina Facebook via Graph API.
 *
 * Uso:
 *   node post-facebook.mjs              (pubblica l'ultimo video)
 *   node post-facebook.mjs --test       (solo anteprima, non pubblica)
 *   node post-facebook.mjs --file video.mp4  (pubblica un file specifico)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const OUTPUT_DIR = path.join(__dirname, 'output');
const args = process.argv.slice(2);
const isTest = args.includes('--test');
const specificFile = args.find((_, i) => args[i - 1] === '--file');

// ============ FACEBOOK GRAPH API ============

function fbApiRequest(endpoint, method, data, isMultipart = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://graph.facebook.com/v19.0${endpoint}`);

    if (method === 'GET' && data) {
      Object.entries(data).forEach(([k, v]) => url.searchParams.append(k, v));
    }

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {},
    };

    let body = null;
    if (method === 'POST' && data && !isMultipart) {
      body = JSON.stringify(data);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });

    if (body) req.write(body);
    req.end();
  });
}

async function uploadVideoToFacebook(videoPath, caption) {
  const { pageId, pageAccessToken } = config.facebook;

  console.log('  Fase 1: Inizio upload video...');

  // Step 1: Start upload session
  const startRes = await fbApiRequest(`/${pageId}/videos`, 'POST', {
    access_token: pageAccessToken,
    upload_phase: 'start',
    file_size: fs.statSync(videoPath).size,
  });

  if (startRes.error) {
    throw new Error(`Facebook API errore: ${startRes.error.message}`);
  }

  const uploadSessionId = startRes.upload_session_id;
  const videoId = startRes.video_id;
  console.log(`  Session ID: ${uploadSessionId}`);

  // Step 2: Upload the video chunk
  console.log('  Fase 2: Caricamento video...');
  const videoData = fs.readFileSync(videoPath);

  const boundary = '----FormBoundary' + Date.now();
  const parts = [];

  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="access_token"\r\n\r\n${pageAccessToken}`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="upload_phase"\r\n\r\ntransfer`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="upload_session_id"\r\n\r\n${uploadSessionId}`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="start_offset"\r\n\r\n0`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="video_file_chunk"; filename="${path.basename(videoPath)}"\r\nContent-Type: video/mp4\r\n\r\n`);

  const headerBuffer = Buffer.from(parts.join('\r\n') + '\r\n', 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fullBody = Buffer.concat([headerBuffer, videoData, footerBuffer]);

  const uploadRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph-video.facebook.com',
      path: `/v19.0/${pageId}/videos`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.setTimeout(300000, () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(fullBody);
    req.end();
  });

  if (uploadRes.error) {
    throw new Error(`Upload errore: ${JSON.stringify(uploadRes.error)}`);
  }

  // Step 3: Finish upload
  console.log('  Fase 3: Finalizzazione...');
  const finishRes = await fbApiRequest(`/${pageId}/videos`, 'POST', {
    access_token: pageAccessToken,
    upload_phase: 'finish',
    upload_session_id: uploadSessionId,
    title: `Celio Italia - Nuova Collezione`,
    description: caption,
  });

  if (finishRes.error) {
    throw new Error(`Finish errore: ${finishRes.error.message}`);
  }

  return { videoId, postResult: finishRes };
}

async function postPhotoToFacebook(imagePath, caption) {
  const { pageId, pageAccessToken } = config.facebook;

  const imageData = fs.readFileSync(imagePath);
  const boundary = '----FormBoundary' + Date.now();

  const parts = [];
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="access_token"\r\n\r\n${pageAccessToken}`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="message"\r\n\r\n${caption}`);
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="source"; filename="${path.basename(imagePath)}"\r\nContent-Type: image/jpeg\r\n\r\n`);

  const headerBuffer = Buffer.from(parts.join('\r\n') + '\r\n', 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const fullBody = Buffer.concat([headerBuffer, imageData, footerBuffer]);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v19.0/${pageId}/photos`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(fullBody);
    req.end();
  });
}

async function postTextToFacebook(caption) {
  const { pageId, pageAccessToken } = config.facebook;

  return fbApiRequest(`/${pageId}/feed`, 'POST', {
    access_token: pageAccessToken,
    message: caption,
    link: config.captions.siteUrl,
  });
}

// ============ TROVA ULTIMO VIDEO ============

function findLatestVideo() {
  if (specificFile) {
    const fullPath = path.isAbsolute(specificFile) ? specificFile : path.join(OUTPUT_DIR, specificFile);
    if (!fs.existsSync(fullPath)) {
      console.log(`ERRORE: File non trovato: ${fullPath}`);
      process.exit(1);
    }
    return fullPath;
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('ERRORE: Cartella output non trovata. Esegui prima: node create-video.mjs');
    process.exit(1);
  }

  const videos = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.mp4'))
    .map(f => ({ name: f, path: path.join(OUTPUT_DIR, f), mtime: fs.statSync(path.join(OUTPUT_DIR, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  if (videos.length === 0) {
    console.log('ERRORE: Nessun video trovato. Esegui prima: node create-video.mjs');
    process.exit(1);
  }

  return videos[0].path;
}

function findCaption(videoPath) {
  const captionPath = videoPath.replace('.mp4', '_caption.txt');
  if (fs.existsSync(captionPath)) {
    return fs.readFileSync(captionPath, 'utf-8');
  }

  // Caption di default
  return `Nuova collezione Celio Italia!\n\nScopri i nostri look su ${config.captions.siteUrl}\n\n${config.captions.hashtags}`;
}

function findMeta(videoPath) {
  const metaPath = videoPath.replace('.mp4', '_meta.json');
  if (fs.existsSync(metaPath)) {
    return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
  return null;
}

// ============ MAIN ============

async function main() {
  console.log('========================================');
  console.log('  CELIO ITALIA - Pubblicazione Facebook');
  console.log('========================================\n');

  // Verifica configurazione
  if (!config.facebook.pageId || !config.facebook.pageAccessToken) {
    console.log('ERRORE: Facebook non configurato!\n');
    console.log('Apri config.json e compila:');
    console.log('  "facebook": {');
    console.log('    "pageId": "IL_TUO_PAGE_ID",');
    console.log('    "pageAccessToken": "IL_TUO_TOKEN"');
    console.log('  }\n');
    console.log('Come ottenere il token:');
    console.log('  1. Vai su https://developers.facebook.com/');
    console.log('  2. Crea un\'app (tipo: Business)');
    console.log('  3. Aggiungi il prodotto "Facebook Login for Business"');
    console.log('  4. Vai in Strumenti > Graph API Explorer');
    console.log('  5. Seleziona la tua app e la tua pagina');
    console.log('  6. Aggiungi permessi: pages_manage_posts, pages_read_engagement');
    console.log('  7. Clicca "Genera Token di Accesso"');
    console.log('  8. IMPORTANTE: Converti in token a lunga durata:');
    console.log('     https://graph.facebook.com/v19.0/oauth/access_token?');
    console.log('     grant_type=fb_exchange_token&');
    console.log('     client_id=APP_ID&');
    console.log('     client_secret=APP_SECRET&');
    console.log('     fb_exchange_token=SHORT_TOKEN');
    console.log('  9. Poi ottieni il Page Token:');
    console.log('     https://graph.facebook.com/v19.0/me/accounts?access_token=LONG_TOKEN');
    console.log(' 10. Copia il "access_token" della pagina in config.json');
    console.log('');
    console.log('Per il Page ID:');
    console.log('  - Vai sulla tua pagina Facebook');
    console.log('  - Clicca "Informazioni sulla Pagina"');
    console.log('  - Il Page ID e in fondo alla pagina');
    console.log('');
    console.log('Oppure esegui: node setup.mjs (guida interattiva)');
    process.exit(1);
  }

  // Trova l'ultimo video
  const videoPath = findLatestVideo();
  const caption = findCaption(videoPath);
  const meta = findMeta(videoPath);
  const fileSize = (fs.statSync(videoPath).size / (1024 * 1024)).toFixed(1);

  console.log(`Video: ${path.basename(videoPath)}`);
  console.log(`Dimensione: ${fileSize} MB`);
  if (meta) {
    console.log(`Stile: ${meta.style} | Prodotti: ${meta.products?.length || '?'}`);
  }
  console.log(`\nCaption:\n${caption.substring(0, 200)}...\n`);

  if (isTest) {
    console.log('========================================');
    console.log('  MODALITA TEST - Non pubblicato');
    console.log('========================================');
    console.log('  Tutto pronto! Esegui senza --test per pubblicare.');
    return;
  }

  // Verifica token
  console.log('Verifica token Facebook...');
  const verifyRes = await fbApiRequest('/me', 'GET', {
    access_token: config.facebook.pageAccessToken,
    fields: 'name,id',
  });

  if (verifyRes.error) {
    console.log(`ERRORE TOKEN: ${verifyRes.error.message}`);
    console.log('Il token potrebbe essere scaduto. Rigenera un nuovo token.');
    process.exit(1);
  }
  console.log(`  Pagina: ${verifyRes.name} (ID: ${verifyRes.id})\n`);

  // Pubblica
  console.log('Pubblicazione in corso...');
  try {
    const result = await uploadVideoToFacebook(videoPath, caption);
    console.log('\n========================================');
    console.log('  PUBBLICATO CON SUCCESSO!');
    console.log('========================================');
    console.log(`  Video ID: ${result.videoId}`);
    console.log(`  Pagina: https://facebook.com/${config.facebook.pageId}`);

    // Segna come pubblicato nei metadati
    if (meta) {
      meta.posted = true;
      meta.postedAt = new Date().toISOString();
      meta.facebookVideoId = result.videoId;
      const metaPath = videoPath.replace('.mp4', '_meta.json');
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
    }

    console.log('========================================');
  } catch (err) {
    console.error('ERRORE PUBBLICAZIONE:', err.message);
    console.log('\nSuggerimenti:');
    console.log('  - Verifica che il token abbia i permessi pages_manage_posts');
    console.log('  - Verifica che il video sia < 10 GB');
    console.log('  - Prova con: node post-facebook.mjs --test');
    process.exit(1);
  }
}

// Export per autopilota
export { uploadVideoToFacebook, postTextToFacebook, findLatestVideo, findCaption, findMeta };

main().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
