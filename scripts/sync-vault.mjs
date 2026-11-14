// Holt die Texte aus dem Obsidian-Vault in das Astro-Projekt (nur Lesezugriff auf den Vault).
// - schneidet interne Abschnitte ("Anmerkungen zum Entwurf") ab
// - wandelt [[Wikilinks]] in echte Links um
// - kopiert Bilder nach public/images
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const VAULT =
  process.env.VAULT_DIR ??
  path.join(
    os.homedir(),
    'Library/Mobile Documents/iCloud~md~obsidian/Documents/Second Brain/Website/longevity-project.de'
  );
const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(root, 'src/content/site');
const IMG = path.join(root, 'public/images');

if (!fs.existsSync(VAULT)) {
  console.error(`Vault-Ordner nicht gefunden: ${VAULT}`);
  process.exit(1);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(IMG, { recursive: true });

const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.name.startsWith('.') ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]
  );
const files = walk(VAULT);
const mds = files.filter((f) => f.endsWith('.md'));

// Namen -> URL für Wikilinks
const urlByName = new Map();
for (const f of mds) {
  const m = fs.readFileSync(f, 'utf8').match(/^url:\s*"?([^"\n]+)"?/m);
  if (m) urlByName.set(path.basename(f, '.md'), m[1]);
}

let n = 0, cut = 0, skipped = 0;
for (const f of mds) {
  let t = fs.readFileSync(f, 'utf8');
  // Entwürfe (draft: true) bleiben im Vault und gelangen nicht ins öffentliche Repo
  if (/^draft:\s*true\s*$/m.test(t.split(/^---\s*$/m)[1] ?? '')) { skipped++; continue; }
  const before = t.length;
  t = t.replace(/^##\s+Anmerkungen zum Entwurf[\s\S]*?(?=^##\s|(?![\s\S]))/gm, '');
  if (t.length !== before) cut++;
  t = t.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, name, alias) => {
    const u = urlByName.get(name.trim());
    return u ? `[${alias ?? name}](${u})` : (alias ?? name);
  });
  fs.writeFileSync(path.join(OUT, path.basename(f)), t.trimEnd() + '\n');
  n++;
}
// Bilder: auf max. 1600 px Breite verkleinern und komprimieren (Originale bleiben im Vault)
const { default: sharp } = await import('sharp');
let imgs = 0;
for (const f of files.filter((f) => /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(f))) {
  const dest = path.join(IMG, path.basename(f));
  if (/\.jpe?g$/i.test(f)) {
    await sharp(f).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(dest);
  } else if (/\.png$/i.test(f)) {
    await sharp(f).resize({ width: 1600, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 85 }).toFile(dest);
  } else {
    fs.copyFileSync(f, dest);
  }
  imgs++;
}
console.log(`sync: ${n} Textdateien (${cut} mit internem Abschnitt gekürzt, ${skipped} Entwürfe übersprungen), ${imgs} Bilder`);
