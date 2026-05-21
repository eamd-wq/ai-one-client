import { createRouter, createWebHashHistory } from "vue-router";

import ModelSelectionPage from "../pages/ModelSelectionPage.vue";
import SettingsPage from "../pages/SettingsPage.vue";
import WorkspacePage from "../pages/WorkspacePage.vue";

/**
 * 应用路由。
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/workspace",
    },
    {
      path: "/workspace",
      component: WorkspacePage,
    },
    {
      path: "/settings",
      component: SettingsPage,
    },
    {
      path: "/select",
      component: ModelSelectionPage,
    },
  ],
});
