<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import AppShell from "./components/AppShell.vue";
import { useHotkeyStore } from "./stores/hotkey";
import { useWorkspaceStore } from "./stores/workspace";

const router = useRouter();
const hotkey = useHotkeyStore();
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

  const currentWindow = getCurrentWindow();

  await currentWindow.onResized(async () => {
    await workspace.refreshWebviewBounds();
  });

  await currentWindow.onScaleChanged(async () => {
    await workspace.refreshWebviewBounds();
  });

  if (hotkey.startupConflictMessage) {
    globalThis.window.alert(hotkey.startupConflictMessage);
    await workspace.showSettings();
    await router.replace("/settings");
  }
});
</script>

<template>
  <AppShell />
</template>
