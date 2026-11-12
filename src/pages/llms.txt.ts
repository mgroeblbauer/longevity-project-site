import { getCollection } from 'astro:content';

export async function GET() {
  const all = (await getCollection('site')).filter((e) => !e.data.draft);
  const line = (e: (typeof all)[number]) => `- [${e.data.title}](https://longevity-project.de${e.data.url}): ${e.data.description}`;
  const body = [
    '# Longevity Project',
    '',
    '> Deutschsprachiger Blog zu Nahrungsergänzung, Ernährung und Longevity: verständlich erklärt, ohne Heilsversprechen, mit Quellen.',
    '',
    '## Seiten',
    ...all.filter((e) => e.data.type === 'seite').map(line),
    '',
    '## Artikel',
    ...all.filter((e) => e.data.type === 'artikel').map(line),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
