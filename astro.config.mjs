// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  site:"https://www.pizero.top",
  integrations: [sitemap(), solidJs()],
  markdown: {
    // 深浅两套代码高亮配色，由 global.css 决定何时使用哪套
    shikiConfig: {
      themes: { light: "vitesse-light", dark: "vitesse-dark" },
      defaultColor: false,
    },
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
