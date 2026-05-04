/**
 * CELIO ITALIA - Setup Guidato
 *
 * Guida passo per passo per configurare tutto il sistema.
 * Uso: node setup.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'config.json');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

async function main() {
  console.log('');
  console.log('================================================');
  console.log('  CELIO ITALIA - Setup Social Media Manager');
  console.log('================================================');
  console.log('');
  console.log('  Questa guida ti aiutera a configurare:');
  console.log('  1. FFmpeg (per creare video)');
  console.log('  2. Facebook Page API (per pubblicare)');
  console.log('  3. Autopilota giornaliero');
  console.log('');

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // ============ STEP 1: FFMPEG ============
  console.log('--- STEP 1: FFmpeg ---\n');

  let hasFFmpeg = false;
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    hasFFmpeg = true;
    console.log('  FFmpeg TROVATO! Gia installato.\n');
  } catch {
    console.log('  FFmpeg NON trovato.\n');
    console.log('  Per installare FFmpeg:');
    console.log('');
    console.log('  METODO 1 (piu facile - winget):');
    console.log('    Apri un nuovo terminale come Amministratore e scrivi:');
    console.log('    winget install Gyan.FFmpeg');
    console.log('');
    console.log('  METODO 2 (manuale):');
    console.log('    1. Vai su: https://www.gyan.dev/ffmpeg/builds/');
    console.log('    2. Scarica "ffmpeg-release-essentials.zip"');
    console.log('    3. Estrai il contenuto in C:\\ffmpeg');
    console.log('    4. Aggiungi C:\\ffmpeg\\bin al PATH:');
    console.log('       - Premi Win+S e cerca "Variabili di ambiente"');
    console.log('       - Clicca "Variabili d\'ambiente"');
    console.log('       - Sotto "Variabili di sistema", seleziona "Path"');
    console.log('       - Clicca "Modifica" > "Nuovo"');
    console.log('       - Scrivi: C:\\ffmpeg\\bin');
    console.log('       - Clicca OK su tutto');
    console.log('    5. CHIUDI e RIAPRI il terminale');
    console.log('    6. Verifica con: ffmpeg -version');
    console.log('');

    const cont = await ask('  Hai installato FFmpeg? (s/n): ');
    if (cont.toLowerCase() === 's') {
      try {
        execSync('ffmpeg -version', { stdio: 'pipe' });
        hasFFmpeg = true;
        console.log('  FFmpeg trovato!\n');
      } catch {
        console.log('  FFmpeg ancora non trovato. Riavvia il terminale dopo l\'installazione.\n');
      }
    }
  }

  // ============ STEP 2: DIPENDENZE NPM ============
  console.log('--- STEP 2: Installazione dipendenze ---\n');

  const nodeModules = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    console.log('  Installazione pacchetti npm...');
    try {
      execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
      console.log('  Dipendenze installate!\n');
    } catch (err) {
      console.log('  ERRORE installazione. Esegui manualmente: cd scripts/celio-social-manager && npm install\n');
    }
  } else {
    console.log('  Dipendenze gia installate.\n');
  }

  // ============ STEP 3: MUSICA ============
  console.log('--- STEP 3: Musica di sottofondo (opzionale) ---\n');

  const musicDir = path.join(__dirname, 'music');
  if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

  const musicFiles = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a'));
  if (musicFiles.length === 0) {
    console.log('  Nessuna musica trovata nella cartella music/');
    console.log('');
    console.log('  Per aggiungere musica di sottofondo:');
    console.log(`  1. Metti file .mp3 in: ${musicDir}`);
    console.log('  2. Usa musica ROYALTY FREE (per evitare problemi):');
    console.log('     - https://pixabay.com/music/ (gratis)');
    console.log('     - https://www.bensound.com/ (gratis con crediti)');
    console.log('     - https://artlist.io/ (abbonamento)');
    console.log('  3. Cerca: "fashion background music" o "modern lounge"');
    console.log('  4. Scarica e metti il file .mp3 nella cartella music/');
    console.log('');
    console.log('  Il video funziona anche senza musica!\n');
  } else {
    console.log(`  ${musicFiles.length} file musicali trovati.\n`);
  }

  // ============ STEP 4: FACEBOOK ============
  console.log('--- STEP 4: Configurazione Facebook ---\n');

  if (config.facebook.pageId && config.facebook.pageAccessToken) {
    console.log(`  Facebook GIA configurato!`);
    console.log(`  Page ID: ${config.facebook.pageId}`);
    console.log(`  Token: ${config.facebook.pageAccessToken.substring(0, 20)}...\n`);

    const change = await ask('  Vuoi riconfigurare? (s/n): ');
    if (change.toLowerCase() !== 's') {
      console.log('');
    } else {
      await setupFacebook(config);
    }
  } else {
    console.log('  Facebook NON configurato.\n');
    const setupFb = await ask('  Vuoi configurare Facebook ora? (s/n): ');
    if (setupFb.toLowerCase() === 's') {
      await setupFacebook(config);
    } else {
      console.log('  Puoi configurarlo dopo modificando config.json\n');
    }
  }

  // ============ STEP 5: URL SITO ============
  console.log('--- STEP 5: URL del tuo sito ---\n');
  console.log(`  URL attuale: ${config.captions.siteUrl}`);
  const newUrl = await ask('  Nuovo URL (premi Invio per mantenere): ');
  if (newUrl.trim()) {
    config.captions.siteUrl = newUrl.trim();
  }
  console.log('');

  // ============ STEP 6: ORARIO AUTOPILOTA ============
  console.log('--- STEP 6: Orario Autopilota ---\n');
  console.log(`  Orario attuale: ${config.autopilot.postTime}`);
  console.log('  Consiglio: 10:00-12:00 o 18:00-20:00 per massimo engagement');
  const newTime = await ask('  Nuovo orario HH:MM (premi Invio per mantenere): ');
  if (newTime.trim() && /^\d{2}:\d{2}$/.test(newTime.trim())) {
    config.autopilot.postTime = newTime.trim();
  }
  console.log('');

  // Salva config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log('  Configurazione salvata!\n');

  // ============ RIEPILOGO ============
  console.log('================================================');
  console.log('  SETUP COMPLETATO!');
  console.log('================================================');
  console.log('');
  console.log(`  FFmpeg:     ${hasFFmpeg ? 'OK' : 'DA INSTALLARE'}`);
  console.log(`  Facebook:   ${config.facebook.pageId ? 'OK' : 'DA CONFIGURARE'}`);
  console.log(`  Musica:     ${musicFiles.length > 0 ? `${musicFiles.length} file` : 'OPZIONALE'}`);
  console.log(`  URL sito:   ${config.captions.siteUrl}`);
  console.log(`  Orario:     ${config.autopilot.postTime}`);
  console.log('');
  console.log('  COMANDI DISPONIBILI:');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │ npm run video      Genera un video           │');
  console.log('  │ npm run preview    Anteprima (non pubblica)  │');
  console.log('  │ npm run post       Pubblica su Facebook      │');
  console.log('  │ npm run test-post  Test post (non pubblica)  │');
  console.log('  │ npm run autopilot  Avvia autopilota          │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log('');
  console.log('  Per iniziare subito:');
  console.log('    1. npm run video    (genera il primo video)');
  console.log('    2. npm run post     (pubblica su Facebook)');
  console.log('');
  console.log('  Per automatizzare tutto:');
  console.log('    npm run autopilot   (pubblica ogni giorno)');
  console.log('');
  console.log('================================================');

  rl.close();
}

async function setupFacebook(config) {
  console.log('');
  console.log('  GUIDA CREAZIONE TOKEN FACEBOOK:');
  console.log('  ─────────────────────────────────');
  console.log('');
  console.log('  PASSO 1: Crea un\'App Facebook');
  console.log('    a. Vai su https://developers.facebook.com/');
  console.log('    b. Clicca "I miei app" > "Crea app"');
  console.log('    c. Tipo: "Business" (o "Altro")');
  console.log('    d. Nome: "Celio Social Manager"');
  console.log('    e. Dopo la creazione, vai in Impostazioni > Base');
  console.log('    f. Copia App ID e App Secret');
  console.log('');

  const appId = await ask('  App ID: ');
  const appSecret = await ask('  App Secret: ');

  if (appId.trim()) config.facebook.appId = appId.trim();
  if (appSecret.trim()) config.facebook.appSecret = appSecret.trim();

  console.log('');
  console.log('  PASSO 2: Ottieni il Page Access Token');
  console.log('    a. Vai su https://developers.facebook.com/tools/explorer/');
  console.log('    b. In alto a destra, seleziona la tua app');
  console.log('    c. Clicca "Genera Token di Accesso"');
  console.log('    d. Seleziona la tua PAGINA (non il profilo)');
  console.log('    e. Aggiungi questi permessi:');
  console.log('       - pages_manage_posts');
  console.log('       - pages_read_engagement');
  console.log('       - pages_show_list');
  console.log('    f. Clicca "Genera Token di Accesso"');
  console.log('    g. Copia il token');
  console.log('');

  const pageToken = await ask('  Page Access Token: ');
  if (pageToken.trim()) config.facebook.pageAccessToken = pageToken.trim();

  console.log('');
  console.log('  PASSO 3: Trova il Page ID');
  console.log('    a. Vai sulla tua Pagina Facebook');
  console.log('    b. Clicca "Informazioni sulla Pagina" (o "About")');
  console.log('    c. Scorri in fondo - troverai "ID Pagina"');
  console.log('    d. Oppure guardalo dall\'URL della pagina');
  console.log('');

  const pageId = await ask('  Page ID: ');
  if (pageId.trim()) config.facebook.pageId = pageId.trim();

  console.log('');
  console.log('  Facebook configurato! I dati saranno salvati in config.json\n');
}

main().catch(err => {
  console.error('Errore:', err);
  rl.close();
});
