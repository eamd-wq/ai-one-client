import "@unocss/reset/tailwind.css";
import "uno.css";
import "./styles/app.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { router } from "./router";
import { useHotkeyStore } from "./stores/hotkey";
import { usePreferencesStore } from "./stores/preferences";

/**
 * 初始化 Vue 应用、Pinia、路由与全局桌面能力。
 */
async function bootstrap() {
  const pinia = createPinia();
  const app = createApp(App);
  const preferences = usePreferencesStore(pinia);
  const hotkey = useHotkeyStore(pinia);

  app.use(pinia);
  app.use(router);

  await preferences.init();
  try {
    await hotkey.init();
  } catch (error) {
    console.error("Failed to initialize hotkey.", error);
  }

  app.mount("#app");
}

void bootstrap();
