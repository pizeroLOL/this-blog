// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import solidJs from '@astrojs/solid-js';

/** 给 Markdown 表格包一层 div：圆角由外层裁切、窄屏可横向滚动 */
function rehypeWrapTables() {
  /** @param {any} node */
  const walk = (node) => {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.map((child) => {
      if (child.type === "element" && child.tagName === "table") {
        return {
          type: "element",
          tagName: "div",
          properties: { className: ["md-table-wrap"] },
          children: [child],
        };
      }
      walk(child);
      return child;
    });
  };
  /** @param {any} tree */
  return (tree) => walk(tree);
}

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
    rehypePlugins: [rehypeWrapTables],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
