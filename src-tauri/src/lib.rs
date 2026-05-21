use serde::Deserialize;
use tauri::Manager;

const DISABLE_CONTEXT_MENU_SCRIPT: &str = r#"
  (() => {
    if (window.__AI_CLIENT_CONTEXT_MENU_DISABLED__) {
      return;
    }

    Object.defineProperty(window, "__AI_CLIENT_CONTEXT_MENU_DISABLED__", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });

    const disableContextMenu = (event) => {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    window.addEventListener("contextmenu", disableContextMenu, true);
    document.addEventListener("contextmenu", disableContextMenu, true);
  })();
"#;

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
 * 向指定 Webview 注入右键菜单禁用脚本。
 */
fn disable_context_menu_for_webview<R: tauri::Runtime>(webview: &tauri::Webview<R>) {
  let _ = webview.eval(DISABLE_CONTEXT_MENU_SCRIPT);
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
    .on_page_load(|webview, payload| {
      if matches!(payload.event(), tauri::webview::PageLoadEvent::Started) {
        disable_context_menu_for_webview(webview);
      }
    })
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![apply_theme_to_webview])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
