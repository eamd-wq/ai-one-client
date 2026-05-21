import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  isRegistered,
  register,
  unregister,
  unregisterAll,
} from "@tauri-apps/plugin-global-shortcut";
import { defineStore } from "pinia";
import { ref } from "vue";

import { translate } from "../lib/i18n";
import { usePreferencesStore } from "./preferences";

const DEFAULT_SHORTCUT = "Shift+Alt+W";

/**
 * 全局快捷键 store，负责注册、替换与切换主窗口显示状态。
 */
export const useHotkeyStore = defineStore("hotkey", () => {
  const activeShortcut = ref<string | null>(null);
  const startupConflictShortcut = ref<string | null>(null);
  const startupConflictMessage = ref("");

  /**
   * 判断错误是否由快捷键冲突引起。
   */
  function isShortcutConflictError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }

    const normalizedMessage = error.message.toLowerCase();
    return (
      normalizedMessage.includes("already registered") ||
      normalizedMessage.includes("already in use") ||
      normalizedMessage.includes("hotkey is already registered") ||
      normalizedMessage.includes("accelerator is already registered")
    );
  }

  /**
   * 构建启动阶段快捷键冲突提示。
   */
  function buildStartupConflictMessage(shortcut: string, language: string) {
    const isChinese = language === "zh-CN";

    if (shortcut === DEFAULT_SHORTCUT) {
      return isChinese
        ? `默认快捷键 ${shortcut} 与系统或其他软件冲突。点击确定后将自动跳转到快捷键设置页，请重新设置。`
        : `The default shortcut ${shortcut} conflicts with the system or another app. Click OK to open shortcut settings and choose a new one.`;
    }

    return isChinese
      ? `已保存的快捷键 ${shortcut} 与系统或其他软件冲突。点击确定后将自动跳转到快捷键设置页，请重新设置。`
      : `The saved shortcut ${shortcut} conflicts with the system or another app. Click OK to open shortcut settings and choose a new one.`;
  }

  /**
   * 记录启动阶段的快捷键冲突，但不阻塞应用启动。
   */
  function markStartupConflict(shortcut: string) {
    const preferences = usePreferencesStore();
    startupConflictShortcut.value = shortcut;
    startupConflictMessage.value = buildStartupConflictMessage(
      shortcut,
      preferences.language,
    );
  }

  /**
   * 清空启动阶段快捷键冲突状态。
   */
  function clearStartupConflict() {
    startupConflictShortcut.value = null;
    startupConflictMessage.value = "";
  }

  /**
   * 切换应用显示状态。
   */
  async function toggleAppVisibility() {
    const currentWindow = getCurrentWindow();
    const visible = await currentWindow.isVisible();

    if (visible) {
      await currentWindow.hide();
      return;
    }

    if (await currentWindow.isMinimized()) {
      await currentWindow.unminimize();
    }

    await currentWindow.show();
    await currentWindow.setFocus();
  }

  /**
   * 注册指定快捷键。
   */
  async function registerShortcut(shortcut: string) {
    if (
      activeShortcut.value === shortcut &&
      (await isRegistered(shortcut))
    ) {
      clearStartupConflict();
      return;
    }

    if (activeShortcut.value && activeShortcut.value !== shortcut) {
      await unregister(activeShortcut.value);
    }

    await register(shortcut, async (event) => {
      if (event.state === "Pressed") {
        await toggleAppVisibility();
      }
    });

    activeShortcut.value = shortcut;
    clearStartupConflict();
  }

  /**
   * 初始化全局快捷键。
   */
  async function init() {
    const preferences = usePreferencesStore();

    try {
      await registerShortcut(preferences.shortcut);
    } catch (error) {
      if (isShortcutConflictError(error)) {
        markStartupConflict(preferences.shortcut);
        return;
      }

      throw error;
    }
  }

  /**
   * 替换当前快捷键。
   */
  async function updateShortcut(nextShortcut: string) {
    const preferences = usePreferencesStore();

    if (activeShortcut.value === nextShortcut) {
      await preferences.setShortcut(nextShortcut);
      clearStartupConflict();
      return;
    }

    const alreadyRegistered = await isRegistered(nextShortcut);
    if (alreadyRegistered) {
      throw new Error(
        translate(preferences.language, "hotkey.alreadyRegistered"),
      );
    }

    const previousShortcut = activeShortcut.value;

    if (previousShortcut) {
      await unregister(previousShortcut);
    }

    try {
      await register(nextShortcut, async (event) => {
        if (event.state === "Pressed") {
          await toggleAppVisibility();
        }
      });
    } catch (error) {
      if (previousShortcut) {
        await registerShortcut(previousShortcut);
      }
      throw error;
    }

    activeShortcut.value = nextShortcut;
    await preferences.setShortcut(nextShortcut);
    clearStartupConflict();
  }

  /**
   * 清理所有快捷键。
   */
  async function dispose() {
    await unregisterAll();
    activeShortcut.value = null;
  }

  return {
    activeShortcut,
    startupConflictShortcut,
    startupConflictMessage,
    init,
    updateShortcut,
    toggleAppVisibility,
    dispose,
    clearStartupConflict,
  };
});
