/**
 * AI 阵营类型。
 */
export type ProviderCamp = "domestic" | "international" | "custom";
export type AppLanguage = "zh-CN" | "en-US";

/**
 * 主题模式。
 */
export type ThemeMode = "system" | "light" | "dark";
export type WindowCloseBehavior = "tray" | "quit";

/**
 * 自定义 AI 渠道持久化结构。
 */
export interface CustomProviderRecord {
  id: string;
  name: string;
  url: string;
}

/**
 * AI 提供方定义。
 */
export interface ProviderDefinition {
  id: string;
  name: string;
  camp: ProviderCamp;
  url: string;
  description: string;
  iconUrl: string | null;
  isCustom?: boolean;
}

/**
 * 偏好设置持久化结构。
 */
export interface PreferencesSnapshot {
  language: AppLanguage;
  camp: ProviderCamp;
  themeMode: ThemeMode;
  shortcut: string;
  autoStartEnabled: boolean;
  silentLaunchEnabled: boolean;
  closeBehavior: WindowCloseBehavior;
  closePromptEnabled: boolean;
  lastProviderId: string | null;
  customProviders: CustomProviderRecord[];
  headerCollapsed: boolean;
  collapsedControlLeft: number | null;
}
