import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/** client:interaction — hydrate an island on first use (see src/directives/interaction.ts). */
const interactionDirective = {
  name: 'client-interaction',
  hooks: {
    'astro:config:setup': ({ addClientDirective }) => {
      addClientDirective({ name: 'interaction', entrypoint: './src/directives/interaction.ts' });
    },
  },
};

export default defineConfig({
  site: 'https://shuaiwang.io',
  trailingSlash: 'ignore',
  build: { format: 'preserve', inlineStylesheets: 'always' },
  integrations: [
    react(),
    interactionDirective,
    sitemap({
      // hreflang alternates between English (/) and Chinese (/zh/) pages.
      i18n: { defaultLocale: 'en', locales: { en: 'en', zh: 'zh-CN' } },
      filter: (page) => !/\/404(\.html)?$/.test(page),
      // build.format 'preserve' serves directory pages at /x/ (and /x 301-redirects), so list
      // the same canonical URLs as the pages' <link rel="canonical">.
      serialize(item) {
        const canonical = (href) => {
          const url = new URL(href);
          if (!url.pathname.endsWith('/') && existsSync(`dist${url.pathname}/index.html`)) url.pathname += '/';
          return url.href;
        };
        item.url = canonical(item.url);
        item.links = item.links?.map((link) => ({ ...link, url: canonical(link.url) }));
        return item;
      },
    }),
  ],
  vite: { plugins: [tailwindcss()], ssr: { external: ['onnxruntime-web'] } },
  devToolbar: { enabled: false },
});
