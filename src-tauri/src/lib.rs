use serde::Deserialize;
use tauri::menu::MenuEvent;
use tauri::menu::MenuBuilder;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};

const MAIN_WINDOW_LABEL: &str = "main";
const RESTORE_FROM_TRAY_EVENT: &str = "app:restore-from-tray";
const TRAY_MENU_SHOW_ID: &str = "tray.show-main";
const TRAY_MENU_QUIT_ID: &str = "tray.quit-app";

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
 * 恢复主窗口显示。
 */
fn show_main_window_fallback<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
  let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
    return Ok(());
  };

  if window.is_minimized()? {
    window.unminimize()?;
  }

  window.show()?;
  window.set_focus()?;

  Ok(())
}

/**
 * 请求打开主窗口，优先复用前端快捷键展示链路，同时保留 Rust 侧兜底显示。
 */
fn request_show_main_window<R: Runtime>(app: &AppHandle<R>) {
  let _ = app.emit(RESTORE_FROM_TRAY_EVENT, ());
  let _ = show_main_window_fallback(app);
}

/**
 * 统一处理托盘菜单点击事件，避免“打开面板”与“退出应用”分散在多个回调里。
 */
fn handle_tray_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
  if event.id() == TRAY_MENU_SHOW_ID {
    request_show_main_window(app);
    return;
  }

  if event.id() == TRAY_MENU_QUIT_ID {
    app.exit(0);
  }
}

/**
 * 统一处理托盘图标点击事件；当前仅在 Windows 左键弹出恢复主窗口。
 */
fn handle_tray_icon_event<R: Runtime>(app: &AppHandle<R>, event: TrayIconEvent) {
  if !cfg!(target_os = "windows") {
    return;
  }

  if matches!(
    event,
    TrayIconEvent::Click {
      button: MouseButton::Left,
      button_state: MouseButtonState::Up,
      ..
    }
      | TrayIconEvent::DoubleClick {
        button: MouseButton::Left,
        ..
      }
  ) {
    request_show_main_window(app);
  }
}

/**
 * 创建跨平台托盘图标与菜单，负责恢复主窗口和退出应用。
 */
fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
  let menu = MenuBuilder::new(app)
    .text(TRAY_MENU_SHOW_ID, "打开面板")
    .separator()
    .text(TRAY_MENU_QUIT_ID, "退出应用")
    .build()?;

  let mut builder = TrayIconBuilder::with_id("main-tray")
    .menu(&menu)
    .tooltip("AIClientCore")
    .show_menu_on_left_click(cfg!(target_os = "macos"));

  if let Some(icon) = app.default_window_icon().cloned() {
    builder = builder.icon(icon);
  }

  let _ = builder.build(app)?;

  Ok(())
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

/**
 * 从前端发起真正的应用退出，避免再次触发窗口关闭拦截。
 */
#[tauri::command]
fn exit_application<R: Runtime>(app: AppHandle<R>) {
  app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .on_menu_event(|app, event| {
      handle_tray_menu_event(app, event);
    })
    .on_tray_icon_event(|tray, event| {
      handle_tray_icon_event(tray, event);
    })
    .setup(|app| {
      setup_tray(&app.handle())?;
      Ok(())
    })
    .on_page_load(|webview, payload| {
      if matches!(payload.event(), tauri::webview::PageLoadEvent::Started) {
        disable_context_menu_for_webview(webview);
      }
    })
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      apply_theme_to_webview,
      exit_application
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
