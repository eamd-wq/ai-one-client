<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import AppShell from "./components/AppShell.vue";
import { useWorkspaceStore } from "./stores/workspace";

const router = useRouter();
const workspace = useWorkspaceStore();

/**
 * 启动应用主流程。
 */
onMounted(async () => {
  await workspace.openInitialView();

  if (workspace.activeProviderId) {
    await router.replace("/workspace");
  } else {
    await router.replace("/select");
  }

  const windowApi = await import("@tauri-apps/api/window");
  const currentWindow = windowApi.getCurrentWindow();

  await currentWindow.onResized(async () => {
    await workspace.refreshActiveWebviewBounds();
  });
});
</script>

<template>
  <AppShell />
</template>
