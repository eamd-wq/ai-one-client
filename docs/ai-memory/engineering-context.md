# Engineering Context

## 当前阶段

1. 仓库已经完成基础 Tauri 脚手架初始化，并实现了首版业务主干。
2. 当前已通过前端构建、TypeScript 校验、ESLint 校验、Rust release 编译，以及 Windows NSIS 安装包打包。
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
- 代码质量：TypeScript strict、ESLint、`vue-tsc`

## 已确认工程决策

1. 使用官方 `create-tauri-app` 创建项目，不手工拼装基础脚手架。
2. 产品采用“主窗口壳层 + 子 Webview”方案，而不是 `iframe` 或多个顶层窗口。
3. 主窗口负责模型选择页、设置页、快速切换入口与全局状态管理。
4. 每个 AI 对话页使用惰性创建、可复用的远程子 Webview 承载，隐藏时保留状态。
5. 用户偏好与上次选择使用 `@tauri-apps/plugin-store` 持久化。
6. 全局快捷键使用 `@tauri-apps/plugin-global-shortcut`，默认值为 `Shift+Alt+W`，支持用户修改并持久化。
7. 主题同步采用“双层策略”：
   - 本地壳层通过 CSS 变量与 Tauri 窗口主题切换。
   - 远程 AI 视图通过 Rust 命令向子 Webview 注入脚本，同步 `data-theme`、类名和 `color-scheme`。
8. 子 Webview 创建依赖 Tauri `unstable` feature，因此 `src-tauri/Cargo.toml` 显式启用了 `tauri = { features = ["unstable"] }`。
9. Tauri v2 权限使用 capability 文件精细控制，只给主窗口开启所需权限。
10. Windows 轻量打包路线当前采用 `NSIS`，符合“只装 Build Tools、不装完整 Visual Studio”的目标。

## 当前实现结构

1. `src/features/providers/` 维护 AI 厂商清单与排序逻辑。
2. `src/stores/preferences.ts` 管理阵营偏好、主题模式、快捷键和上次选择。
3. `src/stores/workspace.ts` 管理子 Webview 的创建、显示、隐藏、布局与主题同步。
4. `src/stores/hotkey.ts` 管理全局快捷键注册与主窗口显示切换。
5. `src/pages/ModelSelectionPage.vue` 提供国产派 / 国际派排序切换与模型入口列表。
6. `src/pages/SettingsPage.vue` 提供快捷键与主题设置。
7. `src/pages/WorkspacePage.vue` 作为 AI 工作区壳层，子 Webview 显示在其下方区域。
8. `src-tauri/src/lib.rs` 提供主题脚本注入命令，并注册 store / opener / global-shortcut 插件。

## 实现边界

1. 本期不做多账号体系，也不做 AI 厂商统一消息协议，只做页面聚合与切换。
2. 本期不清理远程页面缓存，保留登录态与会话状态是第一优先级。
3. 本期设置页只覆盖快捷键与主题，不扩展更多系统设置。
4. 本期以 Windows 开发环境为主，优先保证 Windows 下的可运行性和可打包性。

## 已知风险

1. 部分远程 AI 页面可能不理会通用主题标识，主题同步只能做到“尽可能适配”。
2. 多个远程 Webview 同时常驻会增加内存占用，需要保持惰性创建、按需展示。
3. `create-tauri-app --force` 会覆盖工作区中的未提交文件，后续在现有仓库中初始化脚手架时应避免直接覆盖约束目录。
4. 如果后续需要 `MSI`，仍需补齐 WiX 相关环境或可访问的下载链路；当前 `NSIS` 安装包已可作为主交付物。
5. `pnpm tauri build --bundles nsis` 在本机成功的前提之一是运行环境可找到 `makensis.exe` 与 `cargo.exe`；若新终端 PATH 缺失，需要显式补上。
6. 仓库已提供 `scripts/run-tauri.mjs` 作为 Tauri CLI 包装脚本，`package.json` 中的 `pnpm tauri ...` 会自动补齐 Windows 下常见的 `cargo` 与 `NSIS` 路径，优先复用这条入口，不要再假设终端 PATH 已正确配置。
