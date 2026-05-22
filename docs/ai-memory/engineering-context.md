# Engineering Context

## 当前阶段

1. 仓库已经完成 `Tauri v2 + Vue 3 + TypeScript` 桌面壳层的基础实现，并可正常打包为 Windows 安装包。
2. 当前已验证通过前端 `typecheck`、`lint`、`build`，以及 `pnpm tauri build --bundles nsis`。
3. 当前可交付产物包括：
   - `src-tauri/target/release/aiclientcore.exe`
   - `src-tauri/target/release/bundle/nsis/AIClientCore_0.1.5_x64-setup.exe`

## 目标技术栈

- 桌面框架：Tauri v2
- 后端语言：Rust
- 前端框架：Vue 3 + TypeScript + Vite
- 状态管理：Pinia
- 路由：Vue Router
- 样式方案：UnoCSS
- 质量基线：TypeScript strict、ESLint、`vue-tsc`

## 已确认工程决策

1. 使用官方 `create-tauri-app` 创建项目，不手工拼装基础脚手架。
2. 产品采用“主窗口壳层 + 子 Webview”方案，不使用 `iframe` 承载主流 AI 站点。
3. 主窗口负责模型选择页、设置页、快速切换入口、主题同步与全局状态管理。
4. 每个 AI 对话页使用惰性创建、可复用的远程子 `Webview` 承载，隐藏时保留登录态和会话状态。
5. 用户偏好与上次选择使用 `@tauri-apps/plugin-store` 持久化。
6. 全局快捷键使用 `@tauri-apps/plugin-global-shortcut`，默认值为 `Shift+Alt+W`，支持修改与持久化。
7. 主题同步采用“双层策略”：
   - 本地壳层通过 CSS 变量与 Tauri 窗口主题同步。
   - 远程 AI 视图通过 Rust 命令向子 `Webview` 注入主题脚本，同步 `data-theme`、类名与 `color-scheme`。
8. 子 `Webview` 创建依赖 Tauri `unstable` feature，`src-tauri/Cargo.toml` 必须保留对应配置。
9. Tauri v2 权限使用 capability 文件精细控制，只给主窗口开启所需权限。
10. Windows 轻量打包路线当前采用 `NSIS`，符合“只装 Build Tools、不装完整 Visual Studio”的目标。
11. 头部收起的最终形态是“`shellTopOffset = 0` + 远程子 `Webview` 全屏铺满”，不能再保留任何顶部占位条。
12. 收起后的展开入口不再使用主壳层 DOM，而是使用本地子 `Webview` `overlay:collapsed-control`；它负责顶部居中显示、仅 X 轴拖动和展开请求。
13. 仓库为此新增了第二个前端入口：根目录 `overlay-control.html` 和 `src/overlay-control.ts`，`vite.config.ts` 里必须保留 `rollupOptions.input` 多入口配置，否则 Tauri 产物里会缺失该控件页面。
14. 远程 AI 页默认不暴露 Tauri IPC，因此像“展开头部”这种壳层交互不要依赖给远程页面注入可回传命令的脚本，优先使用本地安全控件层。
15. 当前收起态悬浮控件使用了透明子 `Webview`，为兼容 macOS 必须在 `src-tauri/tauri.conf.json` 中保持 `app.macOSPrivateApi = true`；这同时意味着该方案不适用于 mac App Store 分发。
16. `scripts/run-tauri.mjs` 是跨平台入口脚本，必须使用 Node 的 `path.delimiter` 处理 `PATH`，不能再把分隔符写死成 Windows 的 `;`，否则会破坏 macOS / Linux 的打包环境。
17. 界面语言当前支持 `zh-CN` 和 `en-US` 两种，并通过 `preferences.language` 持久化；新增用户可见文案时，优先补到 `src/lib/i18n.ts`，不要在组件里再写死字符串。
18. 内置 provider 的名称与描述已经改成按语言生成，调用 `getProviderCatalog` / `getProviderById` 时必须传入当前语言，避免壳层标题与选择页出现中英不一致。
19. 子 `Webview` 的位置和尺寸必须与前端 DOM 一样按“逻辑像素 / CSS 像素”计算；`window.innerSize()` 返回物理像素时要先结合 `scaleFactor()` 转成 logical，再传给 `LogicalPosition` / `LogicalSize`，否则在高 DPI 或多分辨率下会出现头部裁切、宽度溢出和页面横向偏移。
20. 启动阶段全局快捷键注册失败不能阻塞 Vue 挂载；冲突应降级为前端提示，并在用户确认后自动跳转到设置页重新配置。
21. Windows 机器执行 `pnpm tauri ...` 前必须保证 `rustup` 已安装并配置默认 toolchain；如果 `rustup show` 显示 `no active toolchain`，先执行 `rustup default stable`。
22. `scripts/run-tauri.mjs` 里补 PATH 时不能写死 `C:\\Users\\admin\\.cargo\\bin` 这类用户目录，必须基于当前用户 home 目录动态拼接，否则换 Windows 账户后会重新出现 `cargo metadata` 启动失败。
23. 若 `pnpm tauri dev` 报 `Port 1420 is already in use`，优先检查是否有本仓库残留的 `vite` / `tauri dev` / `cargo run` 进程；当前 dev 端口是固定 `1420` 且 `strictPort = true`，所以不会自动换端口。
24. `src-tauri/tauri.conf.json` 的 `beforeDevCommand` 现在不是直接 `pnpm dev`，而是 `node scripts/run-vite-dev.mjs`；Tauri 在当前仓库根目录执行这个命令，不是以 `src-tauri/` 为相对基准。该脚本会优先复用当前仓库已经运行在 `1420` 上的 Vite dev server，避免二次执行 `pnpm tauri dev` 时因固定端口冲突而直接失败。
25. 头部收起状态和收起态悬浮展开控件位置现在通过 `app-preferences.json` 持久化，字段分别是 `headerCollapsed` 与 `collapsedControlLeft`；其中 `collapsedControlLeft` 现在保存的是 `0..1` 的相对宽度比例而不是绝对像素，继续调整 `AppShell` 或 `overlay-control.ts` 时要同步维护比例/像素互转与旧值兼容恢复逻辑。
26. 模型选择页当前采用“顶部说明区固定 + 下方 provider 列表独立滚动”的布局；继续改 `ModelSelectionPage.vue` 时，必须保留列表区的 `min-h-0 + overflow-y-auto`，否则在快速切换 AI 场景下列表会被父容器裁切。
27. 选择页滚动是否生效不仅取决于列表容器本身，还取决于 `AppShell` 的 `main` 和页面根节点是否同时具备 `min-h-0` / `flex-1`；缺任一层都会让 `h-full` 拿不到真实窗口高度，最终表现为“看起来有滚动容器但实际不能滚”。
28. 对这个桌面壳层来说，外层页面高度要优先使用 `h-screen` / `h-full`，不要在承载路由页的壳层继续使用 `min-h-screen`；否则内容会把页面实际高度撑长，但外层又禁了全局滚动，最终会让内部滚动区域失效。
29. 快速切换 AI 页面的 provider 列表当前使用 `scrollbar-hidden` 样式类隐藏原生滚动条，但仍保留 `overflow-y-auto`；后续若继续调整该区域，避免把滚动条隐藏和滚动能力一起删掉。
30. “禁用右键菜单”不能只在 Vue 主壳层里监听 `contextmenu`；远程 AI 页面运行在独立子 `Webview` 中，必须额外在 `src-tauri/src/lib.rs` 里通过 `Builder::on_page_load` 给每个 Webview 注入禁右键脚本，悬浮展开控件 `overlay-control.ts` 也要单独拦截。
31. 收起态展开按钮当前承载在独立 `WebviewWindow` 中，它不会随主窗口 `hide()` 自动联动；凡是通过快捷键或其他路径隐藏主窗口时，都要同步调用 `workspace.syncCollapsedControlVisibilityWithMainWindow(false)`，恢复显示时也要按 `headerCollapsed + provider` 状态重新决定是否显示。
32. 主窗口关闭行为当前在 `src/App.vue` 通过 `getCurrentWindow().onCloseRequested(...)` 拦截；如果要“真正退出应用”，必须调用 Rust 命令 `exit_application`，不要直接走前端 `currentWindow.close()`，否则会再次命中关闭拦截。
33. 托盘 / macOS 菜单栏图标由 `src-tauri/src/lib.rs` 中的 `TrayIconBuilder` 创建，依赖 `src-tauri/Cargo.toml` 里的 `tauri` feature `tray-icon`；当前约定是 Windows 左键恢复主窗口，macOS 左键保留菜单，恢复后通过事件 `app:restore-from-tray` 通知前端同步收起态悬浮展开按钮。
34. 关闭窗口相关持久化偏好当前保存在 `preferences.closeBehavior` 与 `preferences.closePromptEnabled`；设置页与关闭提示框都必须共用这两个字段，避免出现“设置页和实际关闭行为不一致”的双状态。
35. 主壳层里的 DOM 弹框默认盖不住 provider 原生子 `Webview`；凡是要在主窗口上弹确认框、引导层或其他模态内容时，都要先临时隐藏当前 provider 子 `Webview`，结束后再按场景恢复，否则用户看到的会是“弹框被网页盖住”或“只有遮罩没有面板”。
36. 当前托盘恢复链路统一挂在 `tauri::Builder::on_menu_event` 与 `tauri::Builder::on_tray_icon_event` 上，由 `src-tauri/src/lib.rs` 内的 `handle_tray_menu_event()` / `handle_tray_icon_event()` 分发；不要再把“打开面板 / 退出应用”只绑在 `TrayIconBuilder` 的局部回调里，否则排查“托盘菜单点击无效”时会更分散、更难定位。
37. 前端托盘恢复链路现在应优先直接复用 `src/stores/hotkey.ts` 的 `showAppWindow()`，不要在 `App.vue` 再复制一套 `unminimize -> show -> syncCollapsedControlVisibilityWithMainWindow(true) -> setFocus`。只有这样，托盘“打开面板”和全局快捷键“显示窗口”才能稳定走同一条已验证过的展示链路。

## 当前实现结构

1. `src/features/providers/` 维护 AI 厂商清单、排序逻辑与 favicon 地址推导。
2. `src/stores/preferences.ts` 管理阵营偏好、主题模式、快捷键、上次选择与自定义渠道。
3. `src/stores/workspace.ts` 管理远程子 `Webview` 的创建、显示、隐藏、布局、主题同步，以及收起态悬浮控件 `Webview`。
4. `src/stores/hotkey.ts` 管理全局快捷键注册与主窗口显示切换。
5. `src/pages/ModelSelectionPage.vue` 提供国产派 / 国际派 / 自定义三种筛选与模型入口列表。
6. `src/pages/SettingsPage.vue` 提供快捷键与主题设置。
7. `src/pages/WorkspacePage.vue` 作为 AI 工作区壳层，实际网页内容由原生子 `Webview` 覆盖承载。
8. `src/components/AppShell.vue` 负责顶部导航、快速切换入口、收起动画，以及监听悬浮展开控件事件。
9. `src-tauri/src/lib.rs` 提供远程子 `Webview` 的主题注入命令，并注册 store / opener / global-shortcut 插件。
10. `src/features/providers/providers.ts` 统一处理内置 provider 与自定义 provider 的合并、查询和排序。

## 实现边界

1. 当前阶段不做统一消息协议，只做网页聚合、切换与状态保留。
2. 当前阶段不清理远程页面缓存，保留登录态与会话状态优先级最高。
3. 设置页当前覆盖快捷键、主题、语言与关闭窗口行为，不再只限于快捷键与主题。
4. 当前优先保证 Windows 下的可运行性与可打包性。

## 已知风险

1. 部分远程 AI 页面可能不响应通用主题标识，主题同步只能做到“尽可能适配”。
2. 多个远程 `Webview` 同时常驻会增加内存占用，需要继续保持惰性创建与按需展示。
3. `create-tauri-app --force` 会覆盖工作区里的未提交文件，后续不要再直接覆盖包含规范与记忆文件的目录。
4. 若后续需要 `MSI`，仍需补齐 WiX 相关环境；当前 `NSIS` 安装包已可作为主交付物。
5. `pnpm tauri ...` 应优先通过仓库内的 `scripts/run-tauri.mjs` 启动，以自动补齐常见的 `cargo` 与 `NSIS` 路径。
6. provider 列表头像当前统一使用网页 favicon，策略是从目标 URL 推导 `${origin}/favicon.ico`；如果加载失败则留空，不再回退为颜色字母块。
7. 当前是贴边式布局，凡是继续调整头部高度、浮层或工作区边界时，都要同步检查 `AppShell` 与 `workspace.setShellTopOffset` / `refreshWebviewBounds` 是否仍然匹配。
8. 仓库可以在当前 Windows 机器上稳定产出 `NSIS` 安装包，但 macOS `.app` / `.dmg` 仍需在 Mac 机器上执行 `pnpm tauri bundle --bundles app,dmg`，并准备签名 / 公证环境。
9. README 当前维护为单文件双语文档，使用顶部锚点在 `中文` 和 `English` 之间跳转；后续文档更新要同步维护两种语言版本。
