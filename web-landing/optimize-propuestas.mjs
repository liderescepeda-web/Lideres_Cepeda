import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('./public/propuestas/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const pngs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'));
let before = 0;
let after = 0;

for (const f of pngs) {
  const src = join(dir, f);
  const out = join(dir, f.replace(/\.png$/i, '.webp'));
  before += statSync(src).size;
  await sharp(src)
    .resize({ width: 760, height: 760, fit: 'cover', position: 'attention' })
    .webp({ quality: 82 })
    .toFile(out);
  after += statSync(out).size;
  unlinkSync(src); // borra el PNG pesado
  console.log(`${f} -> ${f.replace(/\.png$/i, '.webp')}  ${(statSync(out).size / 1024).toFixed(0)} KB`);
}

console.log(`\nTOTAL  ${(before / 1024 / 1024).toFixed(1)} MB  ->  ${(after / 1024 / 1024).toFixed(2)} MB`);
