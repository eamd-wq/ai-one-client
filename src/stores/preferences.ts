import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { appStore, defaultPreferences } from "../lib/store";
import { applyDocumentTheme, resolveAppliedTheme } from "../lib/theme";
import type { PreferencesSnapshot, ProviderCamp, ThemeMode } from "../types/provider";

/**
 * 偏好设置 store，负责阵营、主题、快捷键与上次选择持久化。
 */
export const usePreferencesStore = defineStore("preferences", () => {
  const isReady = ref(false);
  const camp = ref<ProviderCamp>(defaultPreferences.camp);
  const themeMode = ref<ThemeMode>(defaultPreferences.themeMode);
  const shortcut = ref(defaultPreferences.shortcut);
  const lastProviderId = ref<string | null>(defaultPreferences.lastProviderId);
  const appliedTheme = ref<"light" | "dark">("light");

  /**
   * 从持久化存储读取偏好设置。
   */
  async function init() {
    if (isReady.value) {
      return;
    }

    await appStore.init();

    camp.value = (await appStore.get<ProviderCamp>("camp")) ?? defaultPreferences.camp;
    themeMode.value =
      (await appStore.get<ThemeMode>("themeMode")) ?? defaultPreferences.themeMode;
    shortcut.value =
      (await appStore.get<string>("shortcut")) ?? defaultPreferences.shortcut;
    lastProviderId.value =
      (await appStore.get<string | null>("lastProviderId")) ??
      defaultPreferences.lastProviderId;

    await syncTheme();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", () => {
      if (themeMode.value === "system") {
        void syncTheme();
      }
    });

    const currentWindow = getCurrentWindow();
    await currentWindow.onThemeChanged(async () => {
      if (themeMode.value === "system") {
        await syncTheme();
      }
    });

    isReady.value = true;
  }

  /**
   * 同步主题到窗口与文档。
   */
  async function syncTheme() {
    const resolvedTheme = resolveAppliedTheme(themeMode.value);
    appliedTheme.value = resolvedTheme;
    applyDocumentTheme(resolvedTheme);
    await getCurrentWindow().setTheme(themeMode.value === "system" ? null : resolvedTheme);
  }

  /**
   * 更新阵营偏好。
   */
  async function setCamp(nextCamp: ProviderCamp) {
    camp.value = nextCamp;
    await appStore.set("camp", nextCamp);
  }

  /**
   * 更新主题模式。
   */
  async function setThemeMode(nextMode: ThemeMode) {
    themeMode.value = nextMode;
    await appStore.set("themeMode", nextMode);
    await syncTheme();
  }

  /**
   * 更新快捷键。
   */
  async function setShortcut(nextShortcut: string) {
    shortcut.value = nextShortcut;
    await appStore.set("shortcut", nextShortcut);
  }

  /**
   * 更新上次选择的提供方。
   */
  async function setLastProviderId(nextProviderId: string | null) {
    lastProviderId.value = nextProviderId;
    await appStore.set("lastProviderId", nextProviderId);
  }

  /**
   * 获取默认窗口尺寸，供首次子视图布局时参考。
   */
  async function getWorkspaceBounds() {
    const monitor = await currentMonitor();
    const window = getCurrentWindow();
    const outerPosition = await window.outerPosition();
    const outerSize = await window.outerSize();

    return {
      monitor,
      outerPosition,
      outerSize,
    };
  }

  const snapshot = computed<PreferencesSnapshot>(() => ({
    camp: camp.value,
    themeMode: themeMode.value,
    shortcut: shortcut.value,
    lastProviderId: lastProviderId.value,
  }));

  return {
    isReady,
    camp,
    themeMode,
    shortcut,
    lastProviderId,
    appliedTheme,
    snapshot,
    init,
    syncTheme,
    setCamp,
    setThemeMode,
    setShortcut,
    setLastProviderId,
    getWorkspaceBounds,
  };
});
