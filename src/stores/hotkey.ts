import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  isRegistered,
  register,
  unregister,
  unregisterAll,
} from "@tauri-apps/plugin-global-shortcut";
import { defineStore } from "pinia";
import { ref } from "vue";

import { usePreferencesStore } from "./preferences";

/**
 * 全局快捷键 store，负责注册、替换与切换主窗口显示状态。
 */
export const useHotkeyStore = defineStore("hotkey", () => {
  const activeShortcut = ref<string | null>(null);

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
  }

  /**
   * 初始化全局快捷键。
   */
  async function init() {
    const preferences = usePreferencesStore();
    await registerShortcut(preferences.shortcut);
  }

  /**
   * 替换当前快捷键。
   */
  async function updateShortcut(nextShortcut: string) {
    const preferences = usePreferencesStore();

    if (activeShortcut.value === nextShortcut) {
      await preferences.setShortcut(nextShortcut);
      return;
    }

    const alreadyRegistered = await isRegistered(nextShortcut);
    if (alreadyRegistered) {
      throw new Error("该快捷键已被当前应用注册。");
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
    init,
    updateShortcut,
    toggleAppVisibility,
    dispose,
  };
});
