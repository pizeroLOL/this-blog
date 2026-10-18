import eslintConfigPrettier from "eslint-config-prettier";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
// TODO: prettier-plugin-astro 的 issue 满天飞，需要等待官方修复
// import eslintPluginAstro from "eslint-plugin-astro";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // 构建产物与自动生成的类型不做 lint（同 .gitignore）
  { ignores: ["dist/", ".astro/"] },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
    rules: {
      // Tailwind v4 的 @apply / @theme 与 theme.css 里的 M3 令牌变量
      // 对这套 linter 不可见，以下规则一开就是整片误报；
      // 保留语法检查（解析失败仍会报错）即可
      "css/no-invalid-at-rules": "off",
      "css/no-invalid-properties": "off",
      "css/no-important": "off",
      "css/use-baseline": "off",
    },
  },
  {
    files: ["**/*.md"],
    plugins: {
      markdown,
    },
    language: "markdown/gfm",
  },
  // TODO: prettier-plugin-astro 的 issue 满天飞，需要等待官方修复
  // ...eslintPluginAstro.configs["jsx-a11y-recommended"],
  // ...eslintPluginAstro.configs.recommended,
  eslintConfigPrettier,
]);
