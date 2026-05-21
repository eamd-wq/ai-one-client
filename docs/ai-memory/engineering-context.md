# Engineering Context

## 当前阶段

1. 仓库已经完成 `Tauri v2 + Vue 3 + TypeScript` 桌面壳层的基础实现，并可正常打包为 Windows 安装包。
2. 当前已验证通过前端 `typecheck`、`lint`、`build`，以及 `pnpm tauri build --bundles nsis`。
3. 当前可交付产物包括：
   - `src-tauri/target/release/aiclientcore.exe`
   - `src-tauri/target/release/bundle/nsis/AIClientCore_0.1.0_x64-setup.exe`

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
3. 设置页当前只覆盖快捷键与主题，不扩展更多系统设置。
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
