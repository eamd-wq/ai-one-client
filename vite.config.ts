import vue from "@vitejs/plugin-vue";
import UnoCSS from "@unocss/vite";
import { defineConfig } from "vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

/**
 * Vite 配置，包含 Tauri 固定端口与 UnoCSS 支持。
 */
export default defineConfig({
  plugins: [vue(), UnoCSS()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
