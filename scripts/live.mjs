// "Live gehen": Vault -> Projekt synchronisieren, prüfen, committen, pushen.
// GitHub Actions baut und veröffentlicht danach automatisch.
import { execSync } from 'node:child_process';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

run('node scripts/sync-vault.mjs');
run('npx astro build'); // bricht ab, wenn eine Seite kaputt ist
run('git add -A');
if (!out('git status --porcelain')) {
  console.log('Keine Änderungen, nichts zu veröffentlichen.');
  process.exit(0);
}
const msg = process.argv[2] || 'Inhalte aktualisiert';
run(`git commit -m ${JSON.stringify(msg)}`);
run('git push');
console.log('Gepusht. Online in ca. 1-2 Minuten.');
