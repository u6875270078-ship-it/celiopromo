/**
 * CELIO ITALIA - Autopilota Giornaliero
 *
 * Esegue automaticamente ogni giorno:
 *  1. Genera un nuovo video con outfit random
 *  2. Pubblica su Facebook
 *  3. Logga tutto
 *
 * Uso:
 *   node autopilot.mjs              (avvia autopilota - resta attivo)
 *   node autopilot.mjs --once       (esegui una volta sola e esci)
 *   node autopilot.mjs --status     (mostra stato e storico)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import cron from 'node-cron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const LOG_DIR = path.join(__dirname, 'logs');
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const isStatus = args.includes('--status');

// ============ LOG ============

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line);

  const logFile = path.join(LOG_DIR, `autopilot_${new Date().toISOString().substring(0, 10)}.log`);
  fs.appendFileSync(logFile, line + '\n', 'utf-8');
}

// ============ STORICO ============

function getHistory() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];

  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('_meta.json'))
    .map(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, f), 'utf-8'));
        return meta;
      } catch { return null; }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function showStatus() {
  console.log('========================================');
  console.log('  CELIO ITALIA - Stato Autopilota');
  console.log('========================================\n');

  console.log(`Autopilota: ${config.autopilot.enabled ? 'ATTIVO' : 'DISATTIVO'}`);
  console.log(`Orario post: ${config.autopilot.postTime} (${config.autopilot.timezone})`);
  console.log(`Piattaforme: ${config.autopilot.platforms.join(', ')}`);
  console.log(`Facebook configurato: ${config.facebook.pageId ? 'SI' : 'NO'}\n`);

  const history = getHistory();
  console.log(`Video generati: ${history.length}`);
  console.log(`Video pubblicati: ${history.filter(h => h.posted).length}\n`);

  if (history.length > 0) {
    console.log('Ultimi 10 video:');
    console.log('-'.repeat(80));
    history.slice(0, 10).forEach(h => {
      const date = new Date(h.createdAt).toLocaleDateString('it-IT');
      const status = h.posted ? 'Pubblicato' : 'Non pubblicato';
      const products = h.products?.length || '?';
      console.log(`  ${date} | ${h.style || '?'} | ${products} prodotti | ${h.totalPrice || '?'} EUR | ${status}`);
    });
  }

  console.log('\n========================================');
}

// ============ CICLO GIORNALIERO ============

async function dailyCycle() {
  const styles = config.autopilot.styles;
  const style = styles[Math.floor(Math.random() * styles.length)];

  log(`=== INIZIO CICLO GIORNALIERO (Stile: ${style}) ===`);

  try {
    // Step 1: Genera video
    log('Step 1: Generazione video...');
    const videoResult = execSync(
      `node "${path.join(__dirname, 'create-video.mjs')}" --style ${style} --count 6`,
      { cwd: __dirname, stdio: 'pipe', timeout: 300000 }
    ).toString();
    log('Video generato con successo');

    // Step 2: Pubblica se Facebook e configurato
    if (config.facebook.pageId && config.facebook.pageAccessToken) {
      if (config.autopilot.platforms.includes('facebook')) {
        log('Step 2: Pubblicazione su Facebook...');
        try {
          const postResult = execSync(
            `node "${path.join(__dirname, 'post-facebook.mjs')}"`,
            { cwd: __dirname, stdio: 'pipe', timeout: 300000 }
          ).toString();
          log('Pubblicato su Facebook con successo');
        } catch (postErr) {
          log(`Errore pubblicazione Facebook: ${postErr.message}`, 'ERROR');
        }
      }
    } else {
      log('Facebook non configurato - video salvato in output/ ma non pubblicato', 'WARN');
    }

    log('=== CICLO COMPLETATO CON SUCCESSO ===');
    return true;

  } catch (err) {
    log(`ERRORE nel ciclo: ${err.message}`, 'ERROR');
    return false;
  }
}

// ============ MAIN ============

async function main() {
  if (isStatus) {
    showStatus();
    return;
  }

  if (isOnce) {
    console.log('========================================');
    console.log('  CELIO ITALIA - Esecuzione Singola');
    console.log('========================================\n');
    await dailyCycle();
    return;
  }

  // Modalita autopilota continuo
  console.log('========================================');
  console.log('  CELIO ITALIA - Autopilota Attivo');
  console.log('========================================\n');

  const [hour, minute] = config.autopilot.postTime.split(':');
  const cronExpression = `${minute} ${hour} * * *`; // Ogni giorno all'ora configurata

  log(`Autopilota avviato - Pubblicazione ogni giorno alle ${config.autopilot.postTime}`);
  log(`Stili: ${config.autopilot.styles.join(', ')}`);
  log(`Piattaforme: ${config.autopilot.platforms.join(', ')}`);
  log('Premi Ctrl+C per fermare\n');

  // Esegui subito se richiesto
  const now = new Date();
  const scheduledHour = parseInt(hour);
  const scheduledMinute = parseInt(minute);

  if (now.getHours() > scheduledHour || (now.getHours() === scheduledHour && now.getMinutes() > scheduledMinute)) {
    // L'orario di oggi e gia passato, controlla se abbiamo gia pubblicato oggi
    const history = getHistory();
    const todayPosts = history.filter(h => {
      const postDate = new Date(h.createdAt).toDateString();
      return postDate === now.toDateString();
    });

    if (todayPosts.length === 0) {
      log('Orario di oggi gia passato, nessun post oggi - esecuzione immediata...');
      await dailyCycle();
    } else {
      log(`Gia pubblicato oggi (${todayPosts.length} post). Prossimo post domani.`);
    }
  }

  // Schedula per ogni giorno
  cron.schedule(cronExpression, async () => {
    log('--- Trigger cron ---');
    await dailyCycle();
  }, {
    timezone: config.autopilot.timezone,
  });

  // Keepalive
  log('In attesa del prossimo orario schedulato...');

  // Mostra countdown
  setInterval(() => {
    const now = new Date();
    const next = new Date();
    next.setHours(scheduledHour, scheduledMinute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const diff = next - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    process.stdout.write(`\r  Prossimo post tra: ${hours}h ${minutes}m    `);
  }, 60000);
}

main().catch(err => {
  log(`Errore fatale: ${err.message}`, 'ERROR');
  process.exit(1);
});
