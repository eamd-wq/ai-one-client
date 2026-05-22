<script setup lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import AppShell from "./components/AppShell.vue";
import { useI18n } from "./lib/i18n";
import { useHotkeyStore } from "./stores/hotkey";
import { usePreferencesStore } from "./stores/preferences";
import { useWorkspaceStore } from "./stores/workspace";
import type { WindowCloseBehavior } from "./types/provider";

const router = useRouter();
const hotkey = useHotkeyStore();
const preferences = usePreferencesStore();
const workspace = useWorkspaceStore();
const { t } = useI18n();

const isCloseDialogOpen = ref(false);
const rememberCloseChoice = ref(false);
const isHandlingCloseAction = ref(false);
const closeDialogMaskedProviderSurface = ref(false);
const unlistenCallbacks = ref<Array<() => void>>([]);

/**
 * 记录窗口事件清理函数，便于组件卸载时统一解绑。
 */
function registerCleanup(cleanup: () => void) {
  unlistenCallbacks.value.push(cleanup);
}

/**
 * 关闭“退出还是托盘”提示框并重置临时选择。
 */
function closeCloseDialog() {
  isCloseDialogOpen.value = false;
  rememberCloseChoice.value = false;
}

/**
 * 恢复被关闭提示框临时隐藏的 provider 视图。
 */
async function restoreCloseDialogProviderSurface(options?: {
  restoreCollapsedControl?: boolean;
}) {
  if (!closeDialogMaskedProviderSurface.value) {
    return;
  }

  closeDialogMaskedProviderSurface.value = false;
  await workspace.restoreProviderSurfaceAfterDialog(options);
}

/**
 * 打开关闭提示框前，先临时隐藏会盖住弹框的原生子 Webview。
 */
async function openCloseDialog() {
  closeDialogMaskedProviderSurface.value =
    await workspace.hideProviderSurfaceForDialog();
  isCloseDialogOpen.value = true;
  rememberCloseChoice.value = false;
}

/**
 * 根据用户选择执行关闭行为；若勾选“不再提示”，则同时持久化。
 */
async function performCloseBehavior(
  nextBehavior: WindowCloseBehavior,
  persistSelection = false,
) {
  if (isHandlingCloseAction.value) {
    return;
  }

  isHandlingCloseAction.value = true;

  try {
    if (persistSelection) {
      await preferences.setCloseBehavior(nextBehavior);
      await preferences.setClosePromptEnabled(false);
    }

    if (nextBehavior === "tray") {
      closeCloseDialog();
      await restoreCloseDialogProviderSurface({
        restoreCollapsedControl: false,
      });
      await workspace.syncCollapsedControlVisibilityWithMainWindow(false);
      await getCurrentWindow().hide();
      return;
    }

    closeCloseDialog();
    await invoke("exit_application");
  } finally {
    isHandlingCloseAction.value = false;
  }
}

/**
 * 处理关闭提示框中的具体行为选择。
 */
async function selectCloseBehavior(nextBehavior: WindowCloseBehavior) {
  await performCloseBehavior(nextBehavior, rememberCloseChoice.value);
}

/**
 * 取消关闭提示框，并恢复被临时隐藏的 provider 视图。
 */
async function cancelCloseDialog() {
  closeCloseDialog();
  await restoreCloseDialogProviderSurface();
}

/**
 * 拦截主窗口关闭请求，按偏好决定是提示、托盘还是直接退出。
 */
async function handleCloseRequested(event: { preventDefault: () => void }) {
  if (isHandlingCloseAction.value) {
    return;
  }

  event.preventDefault();

  if (preferences.closePromptEnabled) {
    await openCloseDialog();
    return;
  }

  await performCloseBehavior(preferences.closeBehavior);
}

/**
 * 从托盘恢复主窗口后，同步恢复收起态展开控件的显隐。
 */
async function handleRestoreFromTray() {
  const currentWindow = getCurrentWindow();

  if (await currentWindow.isMinimized()) {
    await currentWindow.unminimize();
  }

  await currentWindow.show();
  await workspace.syncCollapsedControlVisibilityWithMainWindow(true);
  await currentWindow.setFocus();
}

/**
 * 启动应用主流程。
 */
onMounted(async () => {
  const currentWindow = getCurrentWindow();

  registerCleanup(
    await currentWindow.onCloseRequested(async (event) => {
      await handleCloseRequested(event);
    }),
  );
  registerCleanup(
    await currentWindow.onResized(async () => {
      await workspace.refreshWebviewBounds();
    }),
  );
  registerCleanup(
    await currentWindow.onScaleChanged(async () => {
      await workspace.refreshWebviewBounds();
    }),
  );
  registerCleanup(
    await currentWindow.onMoved(async () => {
      await workspace.refreshWebviewBounds();
    }),
  );
  registerCleanup(
    await listen("app:restore-from-tray", async () => {
      await handleRestoreFromTray();
    }),
  );

  await workspace.openInitialView();

  if (workspace.activeProviderId) {
    await router.replace("/workspace");
  } else {
    await router.replace("/select");
  }

  if (hotkey.startupConflictMessage) {
    globalThis.window.alert(hotkey.startupConflictMessage);
    await workspace.showSettings();
    await router.replace("/settings");
  }
});

onBeforeUnmount(() => {
  for (const cleanup of unlistenCallbacks.value) {
    void cleanup();
  }

  unlistenCallbacks.value = [];
});
</script>

<template>
  <AppShell />

  <div
    v-if="isCloseDialogOpen"
    class="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(18,24,33,0.36)] px-6 backdrop-blur-sm"
  >
    <div
      class="w-full max-w-[460px] rounded-[24px] border border-[var(--app-border)] bg-[var(--app-bg-elevated)] p-6 shadow-[var(--app-shadow)]"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="font-display text-[1.3rem] tracking-[0.08em] text-[var(--app-text)]">
            {{ t("closeDialog.title") }}
          </div>
          <div class="mt-2 text-sm leading-6 text-[var(--app-text-soft)]">
            {{ t("closeDialog.description") }}
          </div>
        </div>

        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-text-soft)] transition hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-text)]"
          :aria-label="t('common.close')"
          :disabled="isHandlingCloseAction"
          @click="cancelCloseDialog"
        >
          <span class="relative block h-3.5 w-3.5">
            <span
              class="absolute left-1/2 top-1/2 h-[1.5px] w-full -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-current"
            />
            <span
              class="absolute left-1/2 top-1/2 h-[1.5px] w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-current"
            />
          </span>
        </button>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          class="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
          :disabled="isHandlingCloseAction"
          @click="selectCloseBehavior('tray')"
        >
          {{ t("common.minimizeToTray") }}
        </button>
        <button
          class="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-bg-strong)] px-4 py-3 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]"
          :disabled="isHandlingCloseAction"
          @click="selectCloseBehavior('quit')"
        >
          {{ t("common.closeApp") }}
        </button>
      </div>

      <label
        class="mt-5 flex items-start gap-3 rounded-[16px] border border-[var(--app-border)] px-4 py-3 transition hover:bg-[var(--app-accent-soft)]"
      >
        <input
          v-model="rememberCloseChoice"
          class="mt-1 h-4 w-4 accent-[var(--app-accent)]"
          type="checkbox"
        >
        <span class="text-sm text-[var(--app-text-soft)]">
          {{ t("closeDialog.rememberChoice") }}
        </span>
      </label>
    </div>
  </div>
</template>
