import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const TOPICS = ['agents', 'evidence', 'rag', 'memory', 'retrieval', 'security'] as const;

const permalink = z.string().regex(/^\/[a-z]+\/[^/]+$/, 'permalink must look like /<section>/<slug>');

const publications = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/publications' }),
  schema: z.looseObject({
    title: z.string(),
    date: z.coerce.date(),
    permalink,
    venue: z.string().default(''),
    page_type: z.string().optional(),
    paperurl: z.string().optional(),
    citation: z.string().optional(),
    authors: z.array(z.string()).optional(),
    topic: z.enum(TOPICS).default('retrieval'),
    image: z.string().optional(),
    arxiv: z.string().optional(),
    doi: z.string().optional(),
    openalex: z.string().optional(),
    code: z.string().optional(),
    demo: z.string().optional(),
    project: z.string().optional(),
    bibtex: z.string().optional(),
    featured: z.boolean().default(false),
    auto: z.boolean().default(false),
  }),
});

const entry = z.looseObject({
  title: z.string(),
  date: z.coerce.date(),
  permalink,
  venue: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  excerpt: z.string().nullish(),
});

const teaching = defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/teaching' }), schema: entry });
const talks = defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/talks' }), schema: entry });
const awards = defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/awards' }), schema: entry });

export const collections = { publications, teaching, talks, awards };
