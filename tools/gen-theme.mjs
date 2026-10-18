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

  const pixels = new Array(info.width * info.height);
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = argbFromRgb(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
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
    if (!dyn) continue;
    out[kebab(role)] = hexFromArgb(dyn.getArgb(scheme));
  }
  return out;
}

const block = (obj, indent = "  ") =>
  Object.entries(obj)
    .map(([k, v]) => `${indent}--md-${k}: ${v};`)
    .join("\n");

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
  "favicon   需要同步：浅色 =",
  light.primary,
  "/",
  light["on-primary"],
  "，深色 =",
  dark.primary,
  "/",
  dark["on-primary"]
);
