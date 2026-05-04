// Generates app icon + splash source files for @capacitor/assets from a wide wordmark logo.
// Pads the logo onto a square white canvas at sane scales so launcher icons stay readable.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_LOGO = 'C:/Users/amine/Desktop/logo-celio.jpg';
const OUT_DIR = resolve(ROOT, 'assets');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function padToSquare(srcPath, outPath, size, scale) {
  const target = Math.round(size * scale);
  // Trim the source's built-in white margin first so 'scale' refers to the actual logo footprint.
  const trimmed = await sharp(srcPath)
    .trim({ background: WHITE, threshold: 10 })
    .png()
    .toBuffer();
  const resized = await sharp(trimmed)
    .resize({ width: target, height: target, fit: 'inside', background: WHITE })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.round((size - (meta.width ?? target)) / 2);
  const top = Math.round((size - (meta.height ?? target)) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toFile(outPath);
  console.log(`wrote ${outPath} (${size}x${size}, logo at ${Math.round(scale * 100)}%)`);
}

async function solidColor(outPath, size, color) {
  await sharp({
    create: { width: size, height: size, channels: 4, background: color },
  })
    .png()
    .toFile(outPath);
  console.log(`wrote ${outPath} (${size}x${size}, solid)`);
}

await mkdir(OUT_DIR, { recursive: true });

await padToSquare(SRC_LOGO, resolve(OUT_DIR, 'icon-only.png'), 1024, 0.78);
await padToSquare(SRC_LOGO, resolve(OUT_DIR, 'icon-foreground.png'), 1024, 0.55);
await solidColor(resolve(OUT_DIR, 'icon-background.png'), 1024, WHITE);
await padToSquare(SRC_LOGO, resolve(OUT_DIR, 'splash.png'), 2732, 0.30);
await padToSquare(SRC_LOGO, resolve(OUT_DIR, 'splash-dark.png'), 2732, 0.30);

console.log('Done.');
