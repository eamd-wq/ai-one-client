import "@unocss/reset/tailwind.css";
import "uno.css";
import "./styles/app.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { router } from "./router";

/**
 * 在主壳层 Webview 中全局禁用浏览器右键菜单。
 */
function disableShellContextMenu() {
  document.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    { capture: true },
  );
}

/**
 * 初始化 Vue 应用、Pinia、路由与全局桌面能力。
 */
function bootstrap() {
  const pinia = createPinia();
  const app = createApp(App);

  app.use(pinia);
  app.use(router);

  disableShellContextMenu();

  app.mount("#app");
}

bootstrap();
