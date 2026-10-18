/**
 * @material/material-color-utilities 的 ESM 产物使用了无扩展名的相对导入
 * （如 "./dynamiccolor/dynamic_color"），Node 原生 ESM 解析不了。
 * 这个钩子只给这类相对路径补上 .js，供 tools/gen-theme.mjs 使用。
 */
import { registerHooks } from "node:module";

const HAS_EXTENSION = /\.[a-z0-9]+$/i;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !HAS_EXTENSION.test(specifier)) {
      try {
        return nextResolve(`${specifier}.js`, context);
      } catch {
        // 落回原始说明符，让 Node 报原本的错误
      }
    }
    return nextResolve(specifier, context);
  },
});
