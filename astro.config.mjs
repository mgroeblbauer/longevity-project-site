import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://longevity-project.de',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !/\/(danke|fehler)\/$/.test(page) })],
  markdown: { smartypants: false },
});
