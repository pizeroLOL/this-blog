import astro from "eslint-plugin-astro";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import oxlint from "eslint-plugin-oxlint";
import { parser as tsParser } from "typescript-eslint";

/**
 * oxlint 负责 JS/TS 的通用规则（快），ESLint 只补 oxlint 覆盖不到的部分：
 * Astro 模板规则、jsx-a11y 和 Tailwind 类名检查（oxlint 没有 Astro 解析器）。
 * oxlint.buildFromConfigFile 会关掉 .oxlintrc.json 里已启用的同名规则，
 * 避免两边重复报同一问题。
 */
export default [
  { ignores: ["dist/**", ".astro/**"] },
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],
  betterTailwindcss.configs.correctness,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: { parser: tsParser },
    },
  },
  {
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/styles/global.css",
      },
    },
    rules: {
      // m3-* 是 global.css 里 @layer components 定义的项目自有类
      "better-tailwindcss/no-unknown-classes": [
        "error",
        { ignore: ["^m3-", "^md$", "^hero-bg$"] },
      ],
      "better-tailwindcss/enforce-canonical-classes": "warn",
      "better-tailwindcss/no-duplicate-classes": "warn",
      "better-tailwindcss/no-deprecated-classes": "warn",
    },
  },
  ...(await oxlint.buildFromConfigFile("./.oxlintrc.json")),
];
