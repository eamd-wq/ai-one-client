import { defineConfig, presetIcons, presetUno, presetWebFonts } from "unocss";

/**
 * UnoCSS 配置，提供设计所需的基础原子类与字体。
 */
export default defineConfig({
  presets: [
    presetUno(),
    presetIcons(),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: "Manrope",
        display: "Cormorant Garamond",
      },
    }),
  ],
});
