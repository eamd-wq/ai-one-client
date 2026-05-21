use serde::Deserialize;
use tauri::Manager;

/**
 * 主题同步请求体。
 */
#[derive(Debug, Deserialize)]
struct ApplyThemePayload {
  label: String,
  theme: String,
}

/**
 * 生成注入到远程页面的主题同步脚本。
 */
fn build_theme_script(theme: &str) -> String {
  format!(
    r#"
      (() => {{
        const nextTheme = {theme:?};
        const root = document.documentElement;
        if (!root) return;
        root.dataset.theme = nextTheme;
        root.classList.toggle('dark', nextTheme === 'dark');
        root.classList.toggle('light', nextTheme === 'light');
        root.style.colorScheme = nextTheme;
        window.dispatchEvent(new CustomEvent('aiclient-theme-change', {{ detail: {{ theme: nextTheme }} }}));
      }})();
    "#
  )
}

/**
 * 将主题脚本注入到指定子 Webview。
 */
#[tauri::command]
fn apply_theme_to_webview<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  payload: ApplyThemePayload,
) -> Result<(), String> {
  let webview = app
    .get_webview(&payload.label)
    .ok_or_else(|| format!("webview not found: {}", payload.label))?;

  webview
    .eval(build_theme_script(&payload.theme))
    .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![apply_theme_to_webview])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
