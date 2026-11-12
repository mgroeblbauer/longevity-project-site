import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://longevity-project.de',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { smartypants: false },
});
