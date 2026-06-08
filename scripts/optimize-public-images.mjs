/**
 * Generates WebP copies of public JPEG backgrounds for faster CSS loading.
 * Run: node scripts/optimize-public-images.mjs
 */
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const OUT_DIR = path.join(PUBLIC_DIR, 'webp');
const MAX_WIDTH = 1920;
const QUALITY = 82;

const files = (await readdir(PUBLIC_DIR)).filter((f) => /\.jpe?g$/i.test(f));

await mkdir(OUT_DIR, { recursive: true });

let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const input = path.join(PUBLIC_DIR, file);
  const output = path.join(OUT_DIR, file.replace(/\.jpe?g$/i, '.webp'));
  const meta = await sharp(input).metadata();
  const pipeline = sharp(input).rotate();
  if ((meta.width ?? 0) > MAX_WIDTH) {
    pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  await pipeline.webp({ quality: QUALITY, effort: 4 }).toFile(output);
  const { size: inSize } = await import('node:fs/promises').then((fs) => fs.stat(input));
  const { size: outSize } = await import('node:fs/promises').then((fs) => fs.stat(output));
  totalBefore += inSize;
  totalAfter += outSize;
  console.log(`${file}: ${Math.round(inSize / 1024)}KB → ${Math.round(outSize / 1024)}KB webp`);
}

console.log(
  `\nDone — ${files.length} files, ${Math.round(totalBefore / 1024)}KB JPEG → ${Math.round(totalAfter / 1024)}KB WebP (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`,
);
