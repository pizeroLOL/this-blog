// @ts-check
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/vite";

import solidJs from "@astrojs/solid-js";

/** 给 Markdown 表格包一层 div：圆角由外层裁切、窄屏可横向滚动 */
/** @param {any} node */
function wrapTables(node) {
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
    wrapTables(child);
    return child;
  });
}

function rehypeWrapTables() {
  return wrapTables;
}

/**
 * Shiki 单主题会把主题底色写进 <pre> 的内联样式，
 * 去掉它，让 prose.css 统一控制明暗两种模式下的代码块背景。
 * @param {any} node
 */
function stripCodeBackground(node) {
  const style = node.properties?.style;
  if (typeof style !== "string") return;
  node.properties.style = style
    .split(";")
    .filter((decl) => !decl.trim().startsWith("background-color:"))
    .join(";");
}

const shikiTransformers = [
  { name: "strip-code-background", pre: stripCodeBackground },
];

// https://astro.build/config
export default defineConfig({
  site: "https://www.pizero.top",
  integrations: [sitemap(), solidJs()],
  markdown: {
    // rehype 插件走新的 unified() processor（markdown.rehypePlugins 已废弃）
    processor: unified({ rehypePlugins: [rehypeWrapTables] }),
    // 代码块始终是暖色深底，所以只配一套深色高亮配色；
    // github-dark-default 的注释/标点在两种背景上都有足够对比度
    shikiConfig: {
      theme: "github-dark-default",
      transformers: shikiTransformers,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
