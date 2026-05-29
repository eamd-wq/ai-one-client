import { invoke } from "@tauri-apps/api/core";
import {
  isRegistered,
  register,
  unregister,
  unregisterAll,
  type ShortcutEvent,
} from "@tauri-apps/plugin-global-shortcut";
import { defineStore } from "pinia";
import { ref } from "vue";

import { translate } from "../lib/i18n";
import { usePreferencesStore } from "./preferences";
import { useWorkspaceStore } from "./workspace";

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
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "";
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.includes("already registered") ||
      normalizedMessage.includes("already in use") ||
      normalizedMessage.includes("hotkey is already registered") ||
      normalizedMessage.includes("accelerator is already registered") ||
      normalizedMessage.includes("unable to register hotkey")
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
   * 隐藏主窗口，并同步隐藏收起态展开按钮。
   */
  async function hideAppWindow() {
    await invoke("hide_main_window");
  }

  /**
   * 展示主窗口，并尽量可靠地恢复到最前。
   */
  async function showAppWindow() {
    const workspace = useWorkspaceStore();
    await invoke("show_main_window");
    await workspace.syncCollapsedControlVisibilityWithMainWindow(true);
  }

  /**
   * 切换应用显示状态。
   */
  async function toggleAppVisibility() {
    await invoke("toggle_main_window_visibility");
  }

  /**
   * 处理全局快捷键触发事件，只在按下瞬间切换窗口状态。
   */
  function handleShortcutEvent(event: ShortcutEvent) {
    if (event.state !== "Pressed") {
      return;
    }

    void toggleAppVisibility().catch((error) => {
      globalThis.console.error("Failed to toggle app visibility.", error);
    });
  }

  /**
   * 判断当前应用是否已注册指定快捷键。
   */
  async function isShortcutRegistered(shortcut: string) {
    return isRegistered(shortcut);
  }

  /**
   * 注册指定快捷键。
   */
  async function registerShortcut(shortcut: string) {
    if (await isShortcutRegistered(shortcut)) {
      activeShortcut.value = shortcut;
      clearStartupConflict();
      return;
    }

    if (activeShortcut.value && activeShortcut.value !== shortcut) {
      await unregister(activeShortcut.value);
    }

    await register(shortcut, handleShortcutEvent);

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

    const alreadyRegistered = await isShortcutRegistered(nextShortcut);
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
      await register(nextShortcut, handleShortcutEvent);
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
    showAppWindow,
    hideAppWindow,
    dispose,
    clearStartupConflict,
  };
});
