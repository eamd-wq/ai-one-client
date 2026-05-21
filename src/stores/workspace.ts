import { invoke } from "@tauri-apps/api/core";
import { PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import { Webview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { getProviderById } from "../features/providers/providers";
import { usePreferencesStore } from "./preferences";

const DEFAULT_SHELL_TOP_OFFSET = 60;
const SHELL_SIDE_PADDING = 0;
const SHELL_BOTTOM_PADDING = 0;
const CONTENT_INSET = 0;

/**
 * 工作区 store，负责远程子 Webview 的创建、切换、展示与隐藏。
 */
export const useWorkspaceStore = defineStore("workspace", () => {
  const activeProviderId = ref<string | null>(null);
  const currentPane = ref<"select" | "settings" | "provider">("select");
  const createdWebviews = ref<string[]>([]);
  const shellTopOffset = ref(DEFAULT_SHELL_TOP_OFFSET);

  /**
   * 计算子 Webview 的布局矩形。
   */
  async function getWebviewRect() {
    const window = getCurrentWindow();
    const size = await window.innerSize();

    return {
      x: SHELL_SIDE_PADDING + CONTENT_INSET,
      y: shellTopOffset.value + CONTENT_INSET,
      width: Math.max(size.width - SHELL_SIDE_PADDING * 2 - CONTENT_INSET * 2, 320),
      height: Math.max(
        size.height - shellTopOffset.value - SHELL_BOTTOM_PADDING - CONTENT_INSET * 2,
        320,
      ),
    };
  }

  /**
   * 更新壳层顶部占位高度，并同步刷新活动 Webview。
   */
  async function setShellTopOffset(nextOffset: number) {
    shellTopOffset.value = nextOffset;
    await refreshActiveWebviewBounds();
  }

  /**
   * 获取 provider 对应子 Webview label。
   */
  function toWebviewLabel(providerId: string) {
    return `provider:${providerId}`;
  }

  /**
   * 获取已创建的子 Webview 实例。
   */
  async function getExistingWebview(providerId: string) {
    return Webview.getByLabel(toWebviewLabel(providerId));
  }

  /**
   * 隐藏全部已创建子 Webview。
   */
  async function hideAllWebviews() {
    for (const providerId of createdWebviews.value) {
      const view = await getExistingWebview(providerId);
      if (view) {
        await view.hide();
      }
    }
  }

  /**
   * 创建或复用 provider 子 Webview。
   */
  async function ensureProviderWebview(providerId: string) {
    const existing = await getExistingWebview(providerId);
    if (existing) {
      return existing;
    }

    const preferences = usePreferencesStore();
    const provider = getProviderById(providerId, preferences.customProviders);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const rect = await getWebviewRect();
    const window = getCurrentWindow();

    const view = new Webview(window, toWebviewLabel(providerId), {
      url: provider.url,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      focus: true,
      zoomHotkeysEnabled: false,
      dragDropEnabled: false,
    });

    await new Promise<void>((resolve, reject) => {
      void view.once("tauri://created", async () => {
        try {
          await view.setAutoResize(true);
          createdWebviews.value = [...new Set([...createdWebviews.value, providerId])];
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      void view.once("tauri://error", (event) => {
        reject(new Error(String(event.payload)));
      });
    });

    return view;
  }

  /**
   * 展示指定 provider 页面。
   */
  async function openProvider(providerId: string) {
    const preferences = usePreferencesStore();
    const view = await ensureProviderWebview(providerId);

    await hideAllWebviews();
    await view.show();
    await view.setFocus();

    activeProviderId.value = providerId;
    currentPane.value = "provider";

    await preferences.setLastProviderId(providerId);
    await syncThemeToWebviews(preferences.appliedTheme);
  }

  /**
   * 切回选择页。
   */
  async function showSelection() {
    await hideAllWebviews();
    currentPane.value = "select";
  }

  /**
   * 打开设置页。
   */
  async function showSettings() {
    await hideAllWebviews();
    currentPane.value = "settings";
  }

  /**
   * 同步主题到已创建的子 Webview。
   */
  async function syncThemeToWebviews(theme: "light" | "dark") {
    for (const providerId of createdWebviews.value) {
      const label = toWebviewLabel(providerId);

      try {
        await invoke("apply_theme_to_webview", {
          payload: {
            label,
            theme,
          },
        });
      } catch {
        // 某些远程页面尚未准备好时允许静默跳过，后续切回时会再次同步。
      }
    }
  }

  /**
   * 启动后根据历史记录决定默认页面。
   */
  async function openInitialView() {
    const preferences = usePreferencesStore();
    if (preferences.lastProviderId) {
      await openProvider(preferences.lastProviderId);
      return;
    }

    await showSelection();
  }

  /**
   * 根据窗口尺寸变化刷新活动 Webview 布局。
   */
  async function refreshActiveWebviewBounds() {
    if (!activeProviderId.value) {
      return;
    }

    const view = await getExistingWebview(activeProviderId.value);
    if (!view) {
      return;
    }

    const rect = await getWebviewRect();
    await view.setPosition(new PhysicalPosition(rect.x, rect.y));
    await view.setSize(new PhysicalSize(rect.width, rect.height));
  }

  const activeProvider = computed(() => {
    const preferences = usePreferencesStore();
    if (!activeProviderId.value) {
      return null;
    }

    return getProviderById(activeProviderId.value, preferences.customProviders);
  });

  return {
    activeProviderId,
    currentPane,
    activeProvider,
    createdWebviews,
    shellTopOffset,
    openProvider,
    showSelection,
    showSettings,
    openInitialView,
    refreshActiveWebviewBounds,
    syncThemeToWebviews,
    setShellTopOffset,
  };
});
