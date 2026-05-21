import type { ThemeMode } from "../types/provider";

/**
 * 计算当前实际生效主题。
 */
export function resolveAppliedTheme(mode: ThemeMode) {
  if (mode !== "system") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * 将主题应用到根节点。
 */
export function applyDocumentTheme(theme: "light" | "dark") {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

/**
 * 生成给远程页面注入的主题同步脚本。
 */
export function createWebviewThemeScript(theme: "light" | "dark") {
  const serializedTheme = JSON.stringify(theme);

  return `
    (() => {
      const nextTheme = ${serializedTheme};
      const root = document.documentElement;
      if (!root) return;
      root.dataset.theme = nextTheme;
      root.classList.toggle('dark', nextTheme === 'dark');
      root.classList.toggle('light', nextTheme === 'light');
      root.style.colorScheme = nextTheme;
      window.dispatchEvent(new CustomEvent('aiclient-theme-change', { detail: { theme: nextTheme } }));
    })();
  `;
}
