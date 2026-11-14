import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    url: z.string(),
    date: z.coerce.date(),
    modified: z.coerce.date().optional(),
    author: z.string().default('Michael Gröblbauer'),
    lang: z.string().default('de'),
    type: z.enum(['artikel', 'seite']),
    category: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().default(''),
    wpId: z.number().optional(),
    widget: z.enum(['kontakt', '100-dinge']).optional(),
    noindex: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { site };
