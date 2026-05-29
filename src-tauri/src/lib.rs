use serde::Deserialize;
use tauri::menu::MenuBuilder;
use tauri::menu::MenuEvent;
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    GA_ROOT, GetAncestor, GetForegroundWindow, IsChild,
};

const AUTOSTART_LAUNCH_ARG: &str = "--autostart";
const COLLAPSED_CONTROL_LABEL: &str = "overlay:collapsed-control";
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
    let _ = window.set_always_on_top(true);
    let _ = window.set_focus();
    let _ = window.set_always_on_top(false);
    let _ = window.set_focus();

    Ok(())
}

/**
 * 隐藏收起态悬浮控件，避免主窗口隐藏后残留在桌面。
 */
fn hide_collapsed_control_fallback<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(COLLAPSED_CONTROL_LABEL) {
        let _ = window.hide();
    }
}

/**
 * 隐藏主窗口，并同步隐藏收起态悬浮控件。
 */
fn hide_main_window_fallback<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    hide_collapsed_control_fallback(app);

    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    window.hide()?;
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
        } | TrayIconEvent::DoubleClick {
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

/**
 * 判断当前进程是否由系统开机自启入口拉起。
 */
#[tauri::command]
fn is_launched_from_autostart() -> bool {
    std::env::args().any(|arg| arg == AUTOSTART_LAUNCH_ARG)
}

/**
 * Windows 下判断当前前台窗口是否属于主窗口或其子 Webview。
 */
fn is_main_window_foreground_internal<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let window = app
            .get_webview_window(MAIN_WINDOW_LABEL)
            .ok_or_else(|| format!("window not found: {MAIN_WINDOW_LABEL}"))?;

        let hwnd = window.hwnd().map_err(|error| error.to_string())?;
        let foreground = unsafe { GetForegroundWindow() };

        if foreground.0.is_null() {
            return Ok(false);
        }

        if hwnd == foreground {
            return Ok(true);
        }

        let foreground_root = unsafe { GetAncestor(foreground, GA_ROOT) };

        if hwnd == foreground_root {
            return Ok(true);
        }

        let is_child_of_main = unsafe { IsChild(hwnd, foreground).as_bool() };
        let is_child_of_foreground_root = if foreground_root.0.is_null() {
            false
        } else {
            unsafe { IsChild(hwnd, foreground_root).as_bool() }
        };

        Ok(is_child_of_main || is_child_of_foreground_root)
    }

    #[cfg(not(target_os = "windows"))]
    {
        let window = app
            .get_webview_window(MAIN_WINDOW_LABEL)
            .ok_or_else(|| format!("window not found: {MAIN_WINDOW_LABEL}"))?;

        window.is_focused().map_err(|error| error.to_string())
    }
}

/**
 * 根据窗口状态切换主窗口显隐。
 */
fn toggle_main_window_visibility_internal<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| format!("window not found: {MAIN_WINDOW_LABEL}"))?;

    let visible = window.is_visible().map_err(|error| error.to_string())?;
    let minimized = window.is_minimized().map_err(|error| error.to_string())?;
    let foreground = if visible && !minimized {
        is_main_window_foreground_internal(app)?
    } else {
        false
    };

    if !visible || minimized || !foreground {
        show_main_window_fallback(app).map_err(|error| error.to_string())?;
        let _ = app.emit(RESTORE_FROM_TRAY_EVENT, ());
        return Ok(());
    }

    hide_main_window_fallback(app).map_err(|error| error.to_string())
}

/**
 * 在主线程执行快捷键触发的窗口切换。
 */
fn toggle_main_window_visibility_from_shortcut<R: Runtime>(app: &AppHandle<R>) {
    let app_handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        let _ = toggle_main_window_visibility_internal(&app_handle);
    });
}

/**
 * 注册全局快捷键，并在按下时切换主窗口显隐。
 */
#[tauri::command]
fn register_global_shortcut<R: Runtime>(app: AppHandle<R>, shortcut: String) -> Result<(), String> {
    app.global_shortcut()
        .register(shortcut.as_str())
        .map_err(|error| error.to_string())
}

/**
 * 取消注册全局快捷键。
 */
#[tauri::command]
fn unregister_global_shortcut<R: Runtime>(
    app: AppHandle<R>,
    shortcut: String,
) -> Result<(), String> {
    app.global_shortcut()
        .unregister(shortcut.as_str())
        .map_err(|error| error.to_string())
}

/**
 * 取消注册当前应用内的所有全局快捷键。
 */
#[tauri::command]
fn unregister_all_global_shortcuts<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|error| error.to_string())
}

/**
 * 判断当前应用是否已注册指定全局快捷键。
 */
#[tauri::command]
fn is_global_shortcut_registered<R: Runtime>(app: AppHandle<R>, shortcut: String) -> bool {
    app.global_shortcut().is_registered(shortcut.as_str())
}

/**
 * 主窗口显示命令，供前端与托盘恢复链路复用。
 */
#[tauri::command]
fn show_main_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    show_main_window_fallback(&app).map_err(|error| error.to_string())
}

/**
 * 主窗口隐藏命令，供前端与快捷键链路复用。
 */
#[tauri::command]
fn hide_main_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    hide_main_window_fallback(&app).map_err(|error| error.to_string())
}

/**
 * 原生切换主窗口显隐。
 */
#[tauri::command]
fn toggle_main_window_visibility<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    toggle_main_window_visibility_internal(&app)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            request_show_main_window(app);
        }))
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .arg(AUTOSTART_LAUNCH_ARG)
                .build(),
        )
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
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_main_window_visibility_from_shortcut(app);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            apply_theme_to_webview,
            exit_application,
            is_launched_from_autostart,
            is_global_shortcut_registered,
            register_global_shortcut,
            show_main_window,
            hide_main_window,
            unregister_all_global_shortcuts,
            unregister_global_shortcut,
            toggle_main_window_visibility
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
