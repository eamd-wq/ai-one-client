import { LazyStore } from "@tauri-apps/plugin-store";

import type { PreferencesSnapshot } from "../types/provider";

/**
 * 偏好设置默认值。
 */
export const defaultPreferences: PreferencesSnapshot = {
  camp: "domestic",
  themeMode: "system",
  shortcut: "Shift+Alt+W",
  lastProviderId: null,
  customProviders: [],
};

/**
 * 应用持久化存储实例。
 */
export const appStore = new LazyStore("app-preferences.json", {
  defaults: { ...defaultPreferences } as Record<string, unknown>,
  autoSave: 80,
});
