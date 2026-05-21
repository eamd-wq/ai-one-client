# Change Log

按时间倒序记录重要 AI 改动，重点保留“改了什么、为什么改、影响是什么”。

## 2026-05-21 - 头部收起改为真全屏子 Webview + 本地悬浮展开控件

- **改动**：移除了此前会残留顶部高度的 DOM 收起图标方案；头部收起时现在把 `shellTopOffset` 动画到 `0`，并新增 `overlay-control.html` / `src/overlay-control.ts` 作为本地悬浮展开控件入口，支持顶部居中显示与仅 X 轴拖动；左上角品牌区也恢复为自然宽度。
- **原因**：用户明确要求“收起后全屏都是子 Webview”，且远程子 `Webview` 会覆盖主壳层 DOM，原方案无法稳定显示展开入口。
- **影响**：
  - 收起后的远程 AI 页面现在会真正贴满整个内容窗口，不再残留顶部占位。
  - 展开入口改为独立本地子 `Webview`，避免给远程 AI 页面开放额外 IPC 权限。
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 与 `pnpm tauri build --bundles nsis` 已全部通过。

## 2026-05-21 - 补齐 macOS 兼容配置并确认 Windows 安装包仍可产出

- **改动**：将 `src-tauri/tauri.conf.json` 补充为 `app.macOSPrivateApi = true`，以支持透明子 `Webview` 在 macOS 上工作；同时修复 `scripts/run-tauri.mjs` 中写死的 Windows `PATH` 分隔符，改为 `node:path` 的 `delimiter`；随后重新完成 `pnpm tauri build --bundles nsis`。
- **原因**：当前收起态悬浮控件依赖透明子 `Webview`，这在 macOS 上需要私有 API；而仓库内的 Tauri 包装脚本若继续写死 `;`，会直接破坏 macOS 打包环境变量。
- **影响**：
  - 代码层面对 macOS 的结构性兼容性已补齐，但 `.app` / `.dmg` 仍需在 Mac 机器上实际打包。
  - Windows 安装包仍可正常生成，产物路径保持不变。

## 2026-05-21 - 完成 Windows NSIS 安装包打包闭环

- **改动**：确认并复用本机已安装的 NSIS，完成 `pnpm tauri build --bundles nsis` release 打包，成功生成 `AIClientCore_0.1.0_x64-setup.exe`。
- **原因**：此前桌面主体已编译通过，但安装包产出受外部工具链影响，需要把交付链路补齐到可安装状态。
- **影响**：
  - 项目同时具备可执行文件和 Windows 安装包两种交付物。
  - 当前主流、轻量的 Windows 分发路径已可用。

## 2026-05-21 - 修复新终端下 `pnpm tauri` 找不到 cargo 的问题

- **改动**：新增 `scripts/run-tauri.mjs`，并把 `package.json` 中的 `tauri` 脚本改为通过该包装脚本启动，从而自动补齐 Windows 下的 `cargo` 与 `NSIS` 常见安装路径。
- **原因**：用户在新终端执行 `pnpm tauri dev` 时，Tauri CLI 因 PATH 缺少 `cargo.exe` 无法运行 `cargo metadata`。
- **影响**：
  - 后续 `pnpm tauri dev`、`pnpm tauri build` 对终端 PATH 的依赖显著降低。
  - 优先入口已经固定为仓库脚本，不要再假设外部 PATH 完全正确。

## 2026-05-21 - 支持自定义 AI 渠道与 favicon 头像

- **改动**：新增自定义 AI 渠道弹框，可录入名称和链接并持久化到 `customProviders`；筛选项新增“自定义”；provider 头像统一改为网页 favicon，获取失败则留空。
- **原因**：用户需要把更多第三方 AI 渠道纳入统一入口，并移除原先的颜色字母头像方案。
- **影响**：
  - 选择页现在基于“国产 / 国际 / 自定义”三种阵营重排。
  - 自定义渠道与内置渠道共用同一套 provider 目录与子 `Webview` 打开逻辑。

## 2026-05-21 - 完成首版 AI 聚合客户端主干实现

- **改动**：完成 `Tauri v2 + Vue3 + TypeScript` 首版业务实现，包含模型选择页、国产派 / 国际派排序、上次选择记忆、设置页、全局快捷键、主题切换、主窗口子 `Webview` 承载与状态保留。
- **原因**：这是当前任务的核心交付目标，需要让应用从脚手架状态进入可运行的产品主干状态。
- **影响**：
  - 前端校验与 Rust release 编译均已打通。
  - 已具备继续打磨交互、主题和具体 AI 渠道体验的基础。

## 2026-05-21 - 初始化 Tauri 脚手架并恢复仓库规范文件

- **改动**：安装 Windows 下的 Tauri 必要构建环境，初始化 `Tauri v2 + Vue3 + TypeScript` 脚手架，并恢复被脚手架覆盖的 `AGENTS.md`、`.agents/skills/` 与 `docs/ai-memory/`。
- **原因**：需要正式进入业务开发，同时规避 `create-tauri-app --force` 覆盖仓库协作规范文件的问题。
- **影响**：
  - 本地已经具备 Rust、WebView2、Build Tools、NSIS 的桌面开发环境。
  - 工程进入“主窗口壳层 + 子 Webview”业务实现阶段。
