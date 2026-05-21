/**
 * AI 阵营类型。
 */
export type ProviderCamp = "domestic" | "international";

/**
 * 主题模式。
 */
export type ThemeMode = "system" | "light" | "dark";

/**
 * AI 提供方定义。
 */
export interface ProviderDefinition {
  id: string;
  name: string;
  camp: ProviderCamp;
  url: string;
  description: string;
  accent: string;
  badge: string;
}

/**
 * 偏好设置持久化结构。
 */
export interface PreferencesSnapshot {
  camp: ProviderCamp;
  themeMode: ThemeMode;
  shortcut: string;
  lastProviderId: string | null;
}
