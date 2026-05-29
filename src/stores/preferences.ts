import {
  disable as disableAutoStart,
  enable as enableAutoStart,
  isEnabled as isAutoStartEnabled,
} from "@tauri-apps/plugin-autostart";
import { invoke } from "@tauri-apps/api/core";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { appStore, defaultPreferences } from "../lib/store";
import { applyDocumentTheme, resolveAppliedTheme } from "../lib/theme";
import type {
  AppLanguage,
  CustomProviderRecord,
  PreferencesSnapshot,
  ProviderCamp,
  ThemeMode,
  WindowCloseBehavior,
} from "../types/provider";

const AUTOSTART_REGISTRATION_VERSION = 1;

/**
 * 偏好设置 store，负责阵营、主题、快捷键、上次选择与自定义渠道持久化。
 */
export const usePreferencesStore = defineStore("preferences", () => {
  const isReady = ref(false);
  const language = ref<AppLanguage>(defaultPreferences.language);
  const camp = ref<ProviderCamp>(defaultPreferences.camp);
  const themeMode = ref<ThemeMode>(defaultPreferences.themeMode);
  const shortcut = ref(defaultPreferences.shortcut);
  const autoStartEnabled = ref(defaultPreferences.autoStartEnabled);
  const silentLaunchEnabled = ref(defaultPreferences.silentLaunchEnabled);
  const closeBehavior = ref<WindowCloseBehavior>(defaultPreferences.closeBehavior);
  const closePromptEnabled = ref(defaultPreferences.closePromptEnabled);
  const lastProviderId = ref<string | null>(defaultPreferences.lastProviderId);
  const customProviders = ref<CustomProviderRecord[]>(defaultPreferences.customProviders);
  const headerCollapsed = ref(defaultPreferences.headerCollapsed);
  const collapsedControlLeft = ref<number | null>(
    defaultPreferences.collapsedControlLeft,
  );
  const appliedTheme = ref<"light" | "dark">("light");
  const startupSilentLaunch = ref(false);

  /**
   * 从持久化存储读取偏好设置。
   */
  async function init() {
    if (isReady.value) {
      return;
    }

    await appStore.init();

    const [
      nextLanguage,
      nextCamp,
      nextThemeMode,
      nextShortcut,
      nextAutoStartEnabled,
      nextSilentLaunchEnabled,
      nextCloseBehavior,
      nextClosePromptEnabled,
      nextLastProviderId,
      nextCustomProviders,
      nextHeaderCollapsed,
      nextCollapsedControlLeft,
    ] = await Promise.all([
      appStore.get<AppLanguage>("language"),
      appStore.get<ProviderCamp>("camp"),
      appStore.get<ThemeMode>("themeMode"),
      appStore.get<string>("shortcut"),
      appStore.get<boolean>("autoStartEnabled"),
      appStore.get<boolean>("silentLaunchEnabled"),
      appStore.get<WindowCloseBehavior>("closeBehavior"),
      appStore.get<boolean>("closePromptEnabled"),
      appStore.get<string | null>("lastProviderId"),
      appStore.get<CustomProviderRecord[]>("customProviders"),
      appStore.get<boolean>("headerCollapsed"),
      appStore.get<number | null>("collapsedControlLeft"),
    ]);

    language.value = nextLanguage ?? defaultPreferences.language;
    camp.value = nextCamp ?? defaultPreferences.camp;
    themeMode.value = nextThemeMode ?? defaultPreferences.themeMode;
    shortcut.value = nextShortcut ?? defaultPreferences.shortcut;
    autoStartEnabled.value =
      nextAutoStartEnabled ?? defaultPreferences.autoStartEnabled;
    silentLaunchEnabled.value =
      nextSilentLaunchEnabled ?? defaultPreferences.silentLaunchEnabled;
    closeBehavior.value = nextCloseBehavior ?? defaultPreferences.closeBehavior;
    closePromptEnabled.value =
      nextClosePromptEnabled ?? defaultPreferences.closePromptEnabled;
    lastProviderId.value = nextLastProviderId ?? defaultPreferences.lastProviderId;
    customProviders.value =
      nextCustomProviders ?? defaultPreferences.customProviders;
    headerCollapsed.value = nextHeaderCollapsed ?? defaultPreferences.headerCollapsed;
    collapsedControlLeft.value =
      nextCollapsedControlLeft ?? defaultPreferences.collapsedControlLeft;

    let launchedFromAutostart = false;
    try {
      launchedFromAutostart = await invoke<boolean>("is_launched_from_autostart");
    } catch (error) {
      console.warn("Failed to detect autostart launch context.", error);
    }

    startupSilentLaunch.value =
      silentLaunchEnabled.value && autoStartEnabled.value && launchedFromAutostart;

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

    void syncAutoStartState();
  }

  /**
   * 后台同步系统开机自启状态，避免阻塞首屏。
   */
  async function syncAutoStartState() {
    try {
      const systemAutoStartEnabled = await isAutoStartEnabled();
      const autoStartRegistrationVersion =
        (await appStore.get<number>("autoStartRegistrationVersion")) ?? 0;

      if (autoStartEnabled.value) {
        if (
          !systemAutoStartEnabled ||
          autoStartRegistrationVersion < AUTOSTART_REGISTRATION_VERSION
        ) {
          await enableAutoStart();
        }
      } else if (systemAutoStartEnabled) {
        await disableAutoStart();
      }

      autoStartEnabled.value = await isAutoStartEnabled();
      await appStore.set("autoStartEnabled", autoStartEnabled.value);
      if (autoStartEnabled.value) {
        await appStore.set(
          "autoStartRegistrationVersion",
          AUTOSTART_REGISTRATION_VERSION,
        );
      }
    } catch (error) {
      console.warn("Failed to synchronize autostart state.", error);
    }
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
   * 更新界面语言。
   */
  async function setLanguage(nextLanguage: AppLanguage) {
    language.value = nextLanguage;
    await appStore.set("language", nextLanguage);
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
   * 更新系统开机自启状态，并同步回本地偏好。
   */
  async function setAutoStartEnabled(nextEnabled: boolean) {
    if (nextEnabled) {
      await enableAutoStart();
      await appStore.set(
        "autoStartRegistrationVersion",
        AUTOSTART_REGISTRATION_VERSION,
      );
    } else {
      await disableAutoStart();
    }

    autoStartEnabled.value = nextEnabled;
    await appStore.set("autoStartEnabled", nextEnabled);
  }

  /**
   * 更新静默启动开关；仅影响后续新的启动会话。
   */
  async function setSilentLaunchEnabled(nextEnabled: boolean) {
    silentLaunchEnabled.value = nextEnabled;
    await appStore.set("silentLaunchEnabled", nextEnabled);
  }

  /**
   * 更新关闭窗口时的默认行为。
   */
  async function setCloseBehavior(nextBehavior: WindowCloseBehavior) {
    closeBehavior.value = nextBehavior;
    await appStore.set("closeBehavior", nextBehavior);
  }

  /**
   * 更新关闭窗口时是否继续弹出确认提示。
   */
  async function setClosePromptEnabled(nextEnabled: boolean) {
    closePromptEnabled.value = nextEnabled;
    await appStore.set("closePromptEnabled", nextEnabled);
  }

  /**
   * 更新上次选择的提供方。
   */
  async function setLastProviderId(nextProviderId: string | null) {
    lastProviderId.value = nextProviderId;
    await appStore.set("lastProviderId", nextProviderId);
  }

  /**
   * 更新头部收起状态。
   */
  async function setHeaderCollapsed(nextCollapsed: boolean) {
    headerCollapsed.value = nextCollapsed;
    await appStore.set("headerCollapsed", nextCollapsed);
  }

  /**
   * 更新收起态悬浮控件位置。
   */
  async function setCollapsedControlLeft(nextLeft: number | null) {
    collapsedControlLeft.value = nextLeft;
    await appStore.set("collapsedControlLeft", nextLeft);
  }

  /**
   * 标记本次启动的静默隐藏流程已经处理完成。
   */
  function clearStartupSilentLaunch() {
    startupSilentLaunch.value = false;
  }

  /**
   * 新增自定义渠道。
   */
  async function addCustomProvider(payload: { name: string; url: string }) {
    const nextProvider: CustomProviderRecord = {
      id: `custom:${crypto.randomUUID()}`,
      name: payload.name,
      url: payload.url,
    };

    customProviders.value = [...customProviders.value, nextProvider];
    await appStore.set("customProviders", customProviders.value);

    return nextProvider;
  }

  /**
   * 删除自定义渠道，并收敛相关偏好状态。
   */
  async function removeCustomProvider(providerId: string) {
    customProviders.value = customProviders.value.filter(
      (provider) => provider.id !== providerId,
    );
    await appStore.set("customProviders", customProviders.value);

    if (lastProviderId.value === providerId) {
      await setLastProviderId(null);
    }

    if (camp.value === "custom" && customProviders.value.length === 0) {
      await setCamp(defaultPreferences.camp);
    }
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
    language: language.value,
    camp: camp.value,
    themeMode: themeMode.value,
    shortcut: shortcut.value,
    autoStartEnabled: autoStartEnabled.value,
    silentLaunchEnabled: silentLaunchEnabled.value,
    closeBehavior: closeBehavior.value,
    closePromptEnabled: closePromptEnabled.value,
    lastProviderId: lastProviderId.value,
    customProviders: customProviders.value,
    headerCollapsed: headerCollapsed.value,
    collapsedControlLeft: collapsedControlLeft.value,
  }));

  return {
    isReady,
    language,
    camp,
    themeMode,
    shortcut,
    autoStartEnabled,
    silentLaunchEnabled,
    closeBehavior,
    closePromptEnabled,
    lastProviderId,
    customProviders,
    headerCollapsed,
    collapsedControlLeft,
    appliedTheme,
    snapshot,
    init,
    syncTheme,
    setCamp,
    setLanguage,
    setThemeMode,
    setShortcut,
    setAutoStartEnabled,
    setSilentLaunchEnabled,
    setCloseBehavior,
    setClosePromptEnabled,
    setLastProviderId,
    setHeaderCollapsed,
    setCollapsedControlLeft,
    startupSilentLaunch,
    clearStartupSilentLaunch,
    addCustomProvider,
    removeCustomProvider,
    getWorkspaceBounds,
  };
});
