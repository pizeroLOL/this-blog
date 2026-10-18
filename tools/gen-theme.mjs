/**
 * 从壁纸提取种子色，生成 M3 Expressive 配色令牌。
 *
 * 用法：pnpm theme
 *
 * 管线（Material You 默认）：
 *   src/assets/luoxi.jpg
 *     → Celebi 量化(128 色)
 *     → Score 评分（filter: true）
 *     → 种子色
 *     → SchemeExpressive(specVersion: 2025)
 *
 * 量化里的 k-means 初始化使用了 Math.random；这里替换成固定种子的
 * PRNG，保证同一张图在每台机器上得到同一个种子、同一份 theme.css。
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import {
  Hct,
  MaterialDynamicColors,
  QuantizerCelebi,
  SchemeExpressive,
  Score,
  argbFromRgb,
  hexFromArgb,
} from "@material/material-color-utilities";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE = resolve(ROOT, "src/assets/luoxi.jpg");
const SPEC = "2025";
const MAX_COLORS = 128;
const RNG_SEED = 1;
const SAMPLE_WIDTH = 256;

/* favicon / apple-touch-icon 共用的 `>_<` 字形 */
const GLYPH_PATH =
  "M166.568 395.888L338.824 502.288V540.816L168.808 647.216L148.424 619.44L306.568 521.776L148.424 424.336L166.568 395.888ZM400.025 743.312V710.384H624.025V743.312H400.025ZM857.93 395.888L876.074 424.784L717.93 521.776L876.074 619.664L855.914 647.216L685.674 540.816V502.288L857.93 395.888Z";

const ROLES = [
  "primary",
  "onPrimary",
  "primaryContainer",
  "onPrimaryContainer",
  "secondary",
  "onSecondary",
  "secondaryContainer",
  "onSecondaryContainer",
  "tertiary",
  "onTertiary",
  "tertiaryContainer",
  "onTertiaryContainer",
  "error",
  "onError",
  "errorContainer",
  "onErrorContainer",
  "surface",
  "onSurface",
  "surfaceVariant",
  "onSurfaceVariant",
  "surfaceDim",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "outline",
  "outlineVariant",
  "inverseSurface",
  "inverseOnSurface",
  "inversePrimary",
  "shadow",
  "scrim",
  "surfaceTint",
];

const kebab = (s) => s.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/* mulberry32：给量化器一个确定性的 Math.random */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function extractSeed() {
  const { data, info } = await sharp(IMAGE)
    .resize(SAMPLE_WIDTH, null, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < info.width * info.height; i++) {
    pixels.push(argbFromRgb(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]));
  }

  const originalRandom = Math.random;
  Math.random = mulberry32(RNG_SEED);
  try {
    const quantized = QuantizerCelebi.quantize(pixels, MAX_COLORS);
    const [seed] = Score.score(quantized, { filter: true });
    return seed;
  } finally {
    Math.random = originalRandom;
  }
}

function collect(seed, isDark) {
  const scheme = new SchemeExpressive(seed, isDark, 0, SPEC);
  const out = {};
  for (const role of ROLES) {
    const dyn = MaterialDynamicColors[role];
    if (!dyn) {
      throw new Error(`MaterialDynamicColors 缺少颜色角色：${role}`);
    }
    out[kebab(role)] = hexFromArgb(dyn.getArgb(scheme));
  }
  return out;
}

const block = (obj, indent = "  ") =>
  Object.entries(obj)
    .map(([k, v]) => `${indent}--md-${k}: ${v};`)
    .join("\n");

/**
 * 浏览器 favicon：保留原来的圆角条 + 描边环 + `>_<` 字形，
 * 只把浅色 / 深色两套 primary / on-primary 换成当前生成的方案。
 */
const faviconSvg = (
  light,
  dark
) => `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <style>
    /* 跟随系统的浅色 / 深色主题，配色取自 theme.css 的 primary / on-primary */
    :root {
      --favicon-bg: ${light.primary};
      --favicon-fg: ${light["on-primary"]};
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --favicon-bg: ${dark.primary};
        --favicon-fg: ${dark["on-primary"]};
      }
    }
    .bg { fill: var(--favicon-bg); }
    .ring { fill: none; stroke: var(--favicon-fg); stroke-opacity: 0.25; stroke-width: 8; }
    .glyph { fill: var(--favicon-fg); }
  </style>
  <rect y="170" width="1024" height="683" rx="240" class="bg" />
  <rect x="4" y="174" width="1016" height="675" rx="236" class="ring" />
  <path
    d="${GLYPH_PATH}"
    class="glyph"
  />
</svg>
`;

/**
 * iOS 会自己裁圆角，所以这里直接铺满 primary 底色，
 * 再把字形放大 1.2 倍居中（与旧图标构图一致）。
 */
const appleTouchSvg = (
  primary,
  onPrimary
) => `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${primary}" />
  <path
    d="${GLYPH_PATH}"
    fill="${onPrimary}"
    transform="translate(512 512) scale(1.2) translate(-512 -569)"
  />
</svg>
`;

/**
 * 32px PNG 回退：librsvg 不解析 SVG 里的 CSS 变量，
 * 所以栅格化时把同一套图形写成直接的颜色属性。
 */
const faviconRasterSvg = (
  primary,
  onPrimary
) => `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect y="170" width="1024" height="683" rx="240" fill="${primary}" />
  <rect x="4" y="174" width="1016" height="675" rx="236" fill="none" stroke="${onPrimary}" stroke-opacity="0.25" stroke-width="8" />
  <path
    d="${GLYPH_PATH}"
    fill="${onPrimary}"
  />
</svg>
`;

const seedArgb = await extractSeed();
const seed = Hct.fromInt(seedArgb);
const light = collect(seed, false);
const dark = collect(seed, true);

const css = `/* ===========================================================================
 * Material 3 Expressive 配色令牌 —— 自动生成，请勿手改（pnpm theme）
 *
 * 取色：src/assets/luoxi.jpg → Celebi 量化(${MAX_COLORS}) → Score 评分（Material You 默认）
 * 量化器的随机初始化固定为 seed ${RNG_SEED}，结果可复现
 * 种子：#${hexFromArgb(seedArgb).slice(1)}（HCT ${seed.hue.toFixed(0)}° / ${seed.chroma.toFixed(1)} / ${seed.tone.toFixed(0)}）
 * 方案：SchemeExpressive，specVersion ${SPEC}（M3 Expressive 色彩规范）
 * 深浅模式：跟随系统 prefers-color-scheme，无运行时主题切换
 * =========================================================================== */

:root {
${block(light)}
}

@media (prefers-color-scheme: dark) {
  :root {
${block(dark)}
  }
}
`;

writeFileSync(resolve(ROOT, "src/styles/theme.css"), css);

writeFileSync(
  resolve(ROOT, "src/styles/theme-meta.ts"),
  `/* 自动生成，请勿手改（pnpm theme）：用于浏览器 chrome 的 theme-color */
export const lightSurface = "${light.surface}";
export const darkSurface = "${dark.surface}";
`
);

/* favicon：SVG 跟随系统明暗；PNG 回退固定用浅色方案 */
const favicon = faviconSvg(light, dark);
writeFileSync(resolve(ROOT, "src/favicon.svg"), favicon);

await Promise.all([
  sharp(Buffer.from(faviconRasterSvg(light.primary, light["on-primary"])))
    .resize(32, 32)
    .png({ compressionLevel: 9 })
    .toFile(resolve(ROOT, "src/assets/favicon-32.png")),
  sharp(Buffer.from(appleTouchSvg(light.primary, light["on-primary"])))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(resolve(ROOT, "src/assets/apple-touch-icon.png")),
]);

console.log("seed      ", hexFromArgb(seedArgb));
console.log(
  "light     ",
  "primary",
  light.primary,
  "| on-primary",
  light["on-primary"],
  "| surface",
  light.surface
);
console.log(
  "dark      ",
  "primary",
  dark.primary,
  "| on-primary",
  dark["on-primary"],
  "| surface",
  dark.surface
);
console.log(
  "favicon    已写入 src/favicon.svg / favicon-32.png / apple-touch-icon.png"
);
