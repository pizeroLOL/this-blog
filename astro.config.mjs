// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site:"https://www.pizero.top",
  integrations: [sitemap(), solidJs()],
  vite: {
    plugins: [tailwindcss()]
  }
});