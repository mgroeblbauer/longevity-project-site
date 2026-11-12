// Einmalige Migration: WordPress-REST-Export -> Markdown im Obsidian-Vault.
// Aufruf: npm run migrate   (VAULT_DIR optional per Umgebungsvariable)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { parse } from 'node-html-parser';

const VAULT =
  process.env.VAULT_DIR ??
  path.join(
    os.homedir(),
    'Library/Mobile Documents/iCloud~md~obsidian/Documents/Second Brain/Website/longevity-project.de'
  );
const RAW = fileURLToPath(new URL('../migration/raw/', import.meta.url));
const SITE = 'https://longevity-project.de';

const read = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
const posts = read('posts.json');
const pages = read('pages.json');
const media = read('media.json');
const cats = read('categories.json');

const mediaById = new Map(media.map((m) => [m.id, m]));
const catById = new Map(cats.map((c) => [c.id, c.name]));
const decode = (s) => parse(`<p>${s ?? ''}</p>`).text.replace(/\s+/g, ' ').trim();

// ---- Bilder --------------------------------------------------------------
const imgDir = path.join(VAULT, 'Bilder');
fs.mkdirSync(imgDir, { recursive: true });
const wanted = new Map(); // dateiname -> url
function imageName(url) {
  return decodeURIComponent(new URL(url, SITE).pathname.split('/').pop()).replace(/\s+/g, '-');
}
function wantImage(url) {
  const name = imageName(url);
  wanted.set(name, new URL(url, SITE).href);
  return `/images/${name}`;
}

// ---- Turndown ------------------------------------------------------------
const td = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});
td.use(gfm);
// Affiliate-/Werbelinks: rel-Attribut muss erhalten bleiben -> als HTML-Link belassen
td.addRule('sponsoredLink', {
  filter: (n) => n.nodeName === 'A' && /sponsored/.test(n.getAttribute('rel') || ''),
  replacement: (content, n) =>
    `<a href="${n.getAttribute('href')}" rel="sponsored noopener" target="_blank">${content}</a>`,
});
// Hervorgehobene Boxen (inline-Style mit border-left) -> Zitatblock
td.addRule('callout', {
  filter: (n) => n.nodeName === 'DIV' && /border-left/.test(n.getAttribute('style') || ''),
  replacement: (content) =>
    '\n\n' +
    content
      .trim()
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n') +
    '\n\n',
});
// Karten-Links (Link um Überschrift + Text) -> einfache Listeneinträge
td.addRule('cardLink', {
  filter: (n) => n.nodeName === 'A' && n.querySelector && n.querySelector('h2,h3,h4'),
  replacement: (content, n) => {
    const h = n.querySelector('h2,h3,h4').textContent.replace(/\s+/g, ' ').trim();
    return `\n- [${h}](${n.getAttribute('href')})\n`;
  },
});
td.remove(['style', 'script', 'svg', 'button', 'noscript']);

function prepare(html, { isPage }) {
  const root = parse(html);
  root.querySelectorAll('style,script,svg,button,noscript').forEach((n) => n.remove());
  // Formulare ersetzen
  root.querySelectorAll('form').forEach((f) => f.replaceWith(parse('<p><em>[Formular: wird in der neuen Seite ersetzt]</em></p>')));
  // Bilder: lokal ablegen
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('data-src') || img.getAttribute('src');
    if (!src || src.startsWith('data:')) return img.remove();
    const abs = new URL(src, SITE);
    // Fremde Bilder (z. B. Awin-Banner) bleiben extern, nur eigene werden lokal abgelegt
    if (abs.hostname.replace(/^www\./, '') !== 'longevity-project.de') {
      img.setAttribute('src', abs.href);
      ['srcset', 'sizes', 'class', 'width', 'height', 'border', 'decoding', 'data-src'].forEach((a) => img.removeAttribute(a));
      return;
    }
    img.setAttribute('src', wantImage(src));
    ['srcset', 'sizes', 'class', 'width', 'height', 'data-src'].forEach((a) => img.removeAttribute(a));
  });
  // Layout-Reste der Elementor-Seiten entfernen (Eyebrow-Zeilen, Zähler 01/02/03)
  if (isPage) {
    root.querySelectorAll('p').forEach((n) => {
      const cls = n.getAttribute('class') || '';
      if (/eyebrow/.test(cls) || /^\d{1,2}$/.test(n.text.trim())) n.remove();
    });
  }
  // Interne Links relativ machen
  root.querySelectorAll('a').forEach((a) => {
    const h = a.getAttribute('href') || '';
    if (h.startsWith(SITE)) a.setAttribute('href', h.slice(SITE.length) || '/');
  });
  return root.toString();
}

function toMarkdown(html, opts) {
  let md = td.turndown(prepare(html, opts));
  // Mehrzeilige Karten-Links ohne Überschrift -> Listeneinträge
  md = md.replace(/\[\s*([^\[\]]*?\n[^\[\]]*?)\s*\]\((\/[^)\s]+)\)/g, (_, t, u) => {
    const title = t.split('\n').map((s) => s.trim()).filter(Boolean).pop();
    return `\n- [${title}](${u})\n`;
  });
  md = md.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
  return md;
}

// ---- Frontmatter ---------------------------------------------------------
const q = (v) => JSON.stringify(v);
function frontmatter(o) {
  return (
    '---\n' +
    Object.entries(o)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? q(v) : v}`)
      .join('\n') +
    '\n---\n\n'
  );
}

function describe(item) {
  let d = decode(item.excerpt?.rendered);
  d = d.replace(/\s*\[…\]$/, '').replace(/\s*…$/, '');
  return d.length > 190 ? d.slice(0, 187).replace(/\s+\S*$/, '') + '…' : d;
}

function write(dir, slug, fm, body) {
  fs.mkdirSync(path.join(VAULT, dir), { recursive: true });
  fs.writeFileSync(path.join(VAULT, dir, `${slug}.md`), frontmatter(fm) + body + '\n');
}

const report = { posts: [], pages: [], skipped: [] };

// Beiträge
const SKIP_POSTS = {
  2522: 'Interaktive Seite (Fortschrittsring, Checkliste): API liefert HTML ohne Skript, manuell neu bauen',
};
for (const p of posts) {
  if (SKIP_POSTS[p.id]) {
    report.skipped.push([p.slug, SKIP_POSTS[p.id]]);
    continue;
  }
  const fm = {
    title: decode(p.title.rendered),
    description: describe(p),
    url: `/${p.slug}/`,
    date: p.date,
    modified: p.modified,
    author: 'Michael Gröblbauer',
    lang: 'de',
    type: 'artikel',
    category: p.categories.map((c) => catById.get(c)).filter(Boolean)[0],
    wpId: p.id,
  };
  const fmedia = mediaById.get(p.featured_media);
  if (fmedia) {
    fm.image = wantImage(fmedia.source_url);
    fm.imageAlt = fmedia.alt_text || '';
  }
  write('Artikel', p.slug, fm, toMarkdown(p.content.rendered, { isPage: false }));
  report.posts.push(p.slug);
}

// Seiten (Startseite und Blog-Übersicht baut Astro selbst)
const SKIP_PAGES = {
  2575: 'Startseite: wird in Astro als eigene Komponente gebaut',
  2237: 'Blog-Übersicht: wird in Astro automatisch erzeugt',
};
for (const p of pages) {
  if (SKIP_PAGES[p.id]) {
    report.skipped.push([p.slug, SKIP_PAGES[p.id]]);
    continue;
  }
  const slug = p.slug === 'contact' ? 'kontakt' : p.slug;
  const fm = {
    title: decode(p.title.rendered),
    description: describe(p),
    url: `/${p.slug}/`,
    date: p.date,
    modified: p.modified,
    author: 'Michael Gröblbauer',
    lang: 'de',
    type: 'seite',
    wpId: p.id,
  };
  write('Seiten', slug, fm, toMarkdown(p.content.rendered, { isPage: true }));
  report.pages.push(slug);
}

// ---- Bilder laden --------------------------------------------------------
let ok = 0;
for (const [name, url] of wanted) {
  const dest = path.join(imgDir, name);
  if (fs.existsSync(dest)) { ok++; continue; }
  const res = await fetch(url);
  if (!res.ok) { report.skipped.push([name, `Bild nicht ladbar (${res.status})`]); continue; }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  ok++;
}

console.log(`Artikel: ${report.posts.length}, Seiten: ${report.pages.length}, Bilder: ${ok}/${wanted.size}`);
for (const [s, why] of report.skipped) console.log('übersprungen:', s, '-', why);
