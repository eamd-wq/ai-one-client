import { invoke } from "@tauri-apps/api/core";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { Webview } from "@tauri-apps/api/webview";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { getProviderById } from "../features/providers/providers";
import { usePreferencesStore } from "./preferences";

const DEFAULT_SHELL_TOP_OFFSET = 60;
const SHELL_SIDE_PADDING = 0;
const SHELL_BOTTOM_PADDING = 0;
const CONTENT_INSET = 0;
const COLLAPSED_CONTROL_LABEL = "overlay:collapsed-control";
const COLLAPSED_CONTROL_OVERLAY_HEIGHT = 44;

type WebviewRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * 工作区 store，负责远程子 Webview 的创建、切换、显示与隐藏。
 */
export const useWorkspaceStore = defineStore("workspace", () => {
  const activeProviderId = ref<string | null>(null);
  const currentPane = ref<"select" | "settings" | "provider">("select");
  const createdWebviews = ref<string[]>([]);
  const shellTopOffset = ref(DEFAULT_SHELL_TOP_OFFSET);

  /**
   * 将窗口物理像素尺寸转换成与前端 CSS 一致的逻辑像素尺寸。
   */
  async function getWindowLogicalSize() {
    const window = getCurrentWindow();
    const [size, scaleFactor] = await Promise.all([
      window.innerSize(),
      window.scaleFactor(),
    ]);

    return size.toLogical(scaleFactor);
  }

  /**
   * 计算子 Webview 的布局矩形。
   */
  async function getWebviewRect(): Promise<WebviewRect> {
    const size = await getWindowLogicalSize();

    return {
      x: SHELL_SIDE_PADDING + CONTENT_INSET,
      y: shellTopOffset.value + CONTENT_INSET,
      width: Math.max(
        Math.round(size.width) - SHELL_SIDE_PADDING * 2 - CONTENT_INSET * 2,
        320,
      ),
      height: Math.max(
        Math.round(size.height) -
          shellTopOffset.value -
          SHELL_BOTTOM_PADDING -
          CONTENT_INSET * 2,
        320,
      ),
    };
  }

  /**
   * 计算收起态展开控件的布局矩形。
   */
  async function getCollapsedControlRect(): Promise<WebviewRect> {
    const window = getCurrentWindow();
    const [size, scaleFactor, outerPosition, innerPosition] = await Promise.all([
      window.innerSize(),
      window.scaleFactor(),
      window.outerPosition(),
      window.innerPosition(),
    ]);
    const logicalSize = size.toLogical(scaleFactor);
    const titlebarOffsetY = Math.max(
      Math.round((innerPosition.y - outerPosition.y) / scaleFactor),
      0,
    );

    return {
      x: Math.round(outerPosition.x / scaleFactor),
      y: Math.round(outerPosition.y / scaleFactor) + titlebarOffsetY,
      width: Math.max(Math.round(logicalSize.width), 320),
      height: COLLAPSED_CONTROL_OVERLAY_HEIGHT,
    };
  }

  /**
   * 更新壳层顶部占位高度，并同步刷新原生 Webview。
   */
  async function setShellTopOffset(nextOffset: number) {
    shellTopOffset.value = nextOffset;
    await refreshWebviewBounds();
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
   * 获取收起态展开控件 Webview。
   */
  async function getCollapsedControlWebview() {
    return WebviewWindow.getByLabel(COLLAPSED_CONTROL_LABEL);
  }

  /**
   * 归一化收起态悬浮控件窗口，避免旧实例残留置顶或拦截鼠标事件。
   */
  async function normalizeCollapsedControlWindow(view: WebviewWindow) {
    await Promise.allSettled([
      view.setAlwaysOnTop(false),
      view.setIgnoreCursorEvents(true),
    ]);
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
    const provider = getProviderById(
      providerId,
      preferences.language,
      preferences.customProviders,
    );
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
          await view.setAutoResize(false);
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
   * 创建或复用收起态展开控件 Webview。
   */
  async function ensureCollapsedControlWebview() {
    const existing = await getCollapsedControlWebview();
    if (existing) {
      await normalizeCollapsedControlWindow(existing);
      return existing;
    }

    const rect = await getCollapsedControlRect();
    const view = new WebviewWindow(COLLAPSED_CONTROL_LABEL, {
      url: "/overlay-control.html",
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      parent: "main",
      focus: false,
      transparent: true,
      decorations: false,
      shadow: false,
      skipTaskbar: true,
      visible: false,
      zoomHotkeysEnabled: false,
      dragDropEnabled: false,
    });

    await new Promise<void>((resolve, reject) => {
      void view.once("tauri://created", async () => {
        try {
          await normalizeCollapsedControlWindow(view);
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
    await refreshProviderWebviewBounds(providerId);
    await view.show();
    await view.setFocus();

    activeProviderId.value = providerId;
    currentPane.value = "provider";

    await preferences.setLastProviderId(providerId);
    await syncThemeToWebviews(preferences.appliedTheme);
  }

  /**
   * 删除指定 provider 对应的运行态资源。
   */
  async function removeProvider(providerId: string) {
    const view = await getExistingWebview(providerId);
    if (view) {
      await view.close();
    }

    createdWebviews.value = createdWebviews.value.filter((item) => item !== providerId);

    if (activeProviderId.value === providerId) {
      activeProviderId.value = null;

      if (currentPane.value === "provider") {
        await showSelection();
      }
    }
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
   * 显示收起态展开控件。
   */
  async function showCollapsedControl() {
    const view = await ensureCollapsedControlWebview();

    await normalizeCollapsedControlWindow(view);
    await refreshCollapsedControlBounds();
    await view.show();
  }

  /**
   * 隐藏收起态展开控件。
   */
  async function hideCollapsedControl() {
    const view = await getCollapsedControlWebview();
    if (!view) {
      return;
    }

    await view.hide();
  }

  /**
   * 根据主窗口显隐状态同步收起态展开控件，避免主窗口隐藏后悬浮按钮残留在桌面。
   */
  async function syncCollapsedControlVisibilityWithMainWindow(isVisible: boolean) {
    if (!isVisible) {
      await hideCollapsedControl();
      return;
    }

    const preferences = usePreferencesStore();
    const shouldShowCollapsedControl =
      preferences.headerCollapsed &&
      currentPane.value === "provider" &&
      Boolean(activeProviderId.value);

    if (!shouldShowCollapsedControl) {
      await hideCollapsedControl();
      return;
    }

    await showCollapsedControl();
  }

  /**
   * 为主壳层弹框临时隐藏当前 provider 视图与相关悬浮层，避免被更高层原生 Webview 盖住。
   */
  async function hideProviderSurfaceForDialog() {
    if (currentPane.value !== "provider" || !activeProviderId.value) {
      return false;
    }

    const view = await getExistingWebview(activeProviderId.value);
    if (!view) {
      return false;
    }

    await hideCollapsedControl();
    await view.hide();

    return true;
  }

  /**
   * 恢复被主壳层弹框临时隐藏的 provider 视图。
   */
  async function restoreProviderSurfaceAfterDialog(options?: {
    restoreCollapsedControl?: boolean;
  }) {
    if (currentPane.value !== "provider" || !activeProviderId.value) {
      return;
    }

    const view = await getExistingWebview(activeProviderId.value);
    if (!view) {
      return;
    }

    await refreshProviderWebviewBounds(activeProviderId.value);
    await view.show();

    if (options?.restoreCollapsedControl ?? true) {
      await syncCollapsedControlVisibilityWithMainWindow(true);
    }
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
      const provider = getProviderById(
        preferences.lastProviderId,
        preferences.language,
        preferences.customProviders,
      );

      if (provider) {
        await openProvider(preferences.lastProviderId);
        return;
      }

      await preferences.setLastProviderId(null);
    }

    await showSelection();
  }

  /**
   * 刷新指定 provider 子 Webview 的布局。
   */
  async function refreshProviderWebviewBounds(providerId: string) {
    const view = await getExistingWebview(providerId);
    if (!view) {
      return;
    }

    const rect = await getWebviewRect();
    await view.setPosition(new LogicalPosition(rect.x, rect.y));
    await view.setSize(new LogicalSize(rect.width, rect.height));
  }

  /**
   * 根据窗口尺寸变化刷新活动 Webview 布局。
   */
  async function refreshActiveWebviewBounds() {
    if (!activeProviderId.value) {
      return;
    }

    await refreshProviderWebviewBounds(activeProviderId.value);
  }

  /**
   * 刷新所有已创建 provider 子 Webview 的布局。
   */
  async function refreshAllProviderWebviewBounds() {
    for (const providerId of createdWebviews.value) {
      await refreshProviderWebviewBounds(providerId);
    }
  }

  /**
   * 刷新收起态展开控件的布局。
   */
  async function refreshCollapsedControlBounds() {
    const view = await getCollapsedControlWebview();
    if (!view) {
      return;
    }

    const rect = await getCollapsedControlRect();
    await view.setPosition(new LogicalPosition(rect.x, rect.y));
    await view.setSize(new LogicalSize(rect.width, rect.height));
  }

  /**
   * 刷新工作区内全部原生 Webview 的布局。
   */
  async function refreshWebviewBounds() {
    await refreshAllProviderWebviewBounds();
    await refreshCollapsedControlBounds();
  }

  const activeProvider = computed(() => {
    const preferences = usePreferencesStore();
    if (!activeProviderId.value) {
      return null;
    }

    return getProviderById(
      activeProviderId.value,
      preferences.language,
      preferences.customProviders,
    );
  });

  return {
    activeProviderId,
    currentPane,
    activeProvider,
    createdWebviews,
    shellTopOffset,
    openProvider,
    removeProvider,
    showSelection,
    showSettings,
    openInitialView,
    refreshActiveWebviewBounds,
    refreshCollapsedControlBounds,
    refreshWebviewBounds,
    syncThemeToWebviews,
    setShellTopOffset,
    showCollapsedControl,
    hideCollapsedControl,
    syncCollapsedControlVisibilityWithMainWindow,
    hideProviderSurfaceForDialog,
    restoreProviderSurfaceAfterDialog,
  };
});
