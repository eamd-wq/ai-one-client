# Change Log

按时间倒序记录重要 AI 改动，重点保留“改了什么、为什么改、影响是什么”。

## 2026-05-21 - 版本升级到 0.1.1 并重新产出 Windows NSIS 安装包

- **改动**：将 `package.json`、`src-tauri/tauri.conf.json` 与 `src-tauri/Cargo.toml` 的版本号统一从 `0.1.0` 升到 `0.1.1`，并重新执行 `pnpm tauri build --bundles nsis`。
- **原因**：用户要求打一个新的 Windows 包，并明确要求版本号上升一个版本。
- **影响**：
  - 成功生成新的 Windows 安装包：`src-tauri/target/release/bundle/nsis/AIClientCore_0.1.1_x64-setup.exe`。
  - `pnpm build` 已通过。
  - 当前 Windows 机器上的 Tauri CLI 仅支持 `msi` / `nsis` bundle，无法直接构建 macOS 的 `.app` / `.dmg`，仍需在 Mac 机器上执行对应打包命令。

## 2026-05-21 - 修复快捷键冲突白屏启动与高 DPI 下子 Webview 错位

- **改动**：将全局快捷键初始化改为“冲突不阻塞启动”，新增启动冲突提示并在用户确认后自动跳转到设置页；同时把 `src/stores/workspace.ts` 的子 `Webview` 布局统一改为基于 `scaleFactor()` 换算后的逻辑像素，并补上窗口缩放变化时的 bounds 刷新。
- **原因**：快捷键与系统或其他软件冲突时，原流程会在 `app.mount` 前抛错导致界面只剩背景色；而子 `Webview` 之前混用了物理像素和逻辑像素，在不同分辨率 / 缩放下会出现网页横向偏移、头部只显示一半和收起按钮被裁切。
- **影响**：
  - 启动时即使快捷键冲突，主界面也会正常显示，并引导用户直接去设置页修复。
  - provider 页面与收起态悬浮控件在高 DPI / 多分辨率下会与壳层头部重新对齐。
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 已通过。

## 2026-05-21 - 修复当前机器 Rust toolchain 缺失与 Tauri 脚本用户目录写死问题

- **改动**：在当前 Windows 机器上执行了 `rustup default stable`，安装并设置默认 `stable-x86_64-pc-windows-msvc`；同时将 `scripts/run-tauri.mjs` 中写死的 `C:\\Users\\admin\\.cargo\\bin` 改为基于当前用户 home 目录动态拼接。
- **原因**：当前环境里 `rustup` 没有任何已安装/激活的 toolchain，导致 `cargo metadata` 直接失败；而脚本里写死其他账户的 cargo 路径，会让 PATH 兜底在当前用户下失效。
- **影响**：
  - `cargo metadata` 已恢复正常，`pnpm tauri info` 可成功运行并识别到 `rustc` / `cargo`。
  - 后续在当前用户下执行 `pnpm tauri dev`、`pnpm tauri build` 的环境稳定性更高。

## 2026-05-21 - 清理残留 dev 进程，修复 Tauri 开发端口 1420 冲突

- **改动**：定位并清理了当前仓库残留的 `vite`、`tauri dev` 和相关 `cargo run` 进程，释放固定开发端口 `1420`；随后重新验证 `pnpm tauri dev` 已不再报端口占用或 `cargo metadata` 错误。
- **原因**：仓库 `vite.config.ts` 使用固定端口 `1420` 且 `strictPort = true`，一旦上次启动残留 `vite` 进程，新的 Tauri dev 就会直接失败。
- **影响**：
  - 当前机器上的开发启动链路已恢复。
  - 后续若再次遇到 `Port 1420 is already in use`，优先清理本仓库残留 dev 进程，而不是改端口。

## 2026-05-21 - 让 Tauri beforeDevCommand 自动复用已有 Vite dev server

- **改动**：新增 `scripts/run-vite-dev.mjs`，并将 `src-tauri/tauri.conf.json` 的 `beforeDevCommand` 从直接执行 `pnpm dev` 改为先探测 `1420` 端口；如果已经是当前仓库自己的 Vite dev server，则直接复用，否则再拉起新的 dev server。
- **原因**：当前开发链路固定使用 `1420` 且 `strictPort = true`，同一个仓库重复执行 `pnpm tauri dev` 时，很容易因为已有 Vite 进程占端口而立刻失败。
- **影响**：
  - 二次执行 `pnpm tauri dev` 时会优先复用已存在的前端 dev server，不再反复撞固定端口。
  - 如果 `1420` 被其他非本仓库服务占用，脚本会明确报错而不是静默复用错误目标。

## 2026-05-21 - 修正 beforeDevCommand 脚本路径

- **改动**：将 `src-tauri/tauri.conf.json` 中 `beforeDevCommand` 的脚本路径从 `node ../scripts/run-vite-dev.mjs` 改为 `node scripts/run-vite-dev.mjs`。
- **原因**：Tauri 执行 `beforeDevCommand` 时的当前工作目录是仓库根目录，不是 `src-tauri/`；原路径会多退一层，直接报 `MODULE_NOT_FOUND`。
- **影响**：
  - `beforeDevCommand` 现在可以正常找到并执行 `run-vite-dev`。
  - 本仓库的 Vite dev server 已能再次成功拉起到 `1420`。

## 2026-05-21 - 去掉壳层头部最大宽度限制

- **改动**：移除了 `src/components/AppShell.vue` 外层壳层容器的 `max-w-[1600px]`，改为 `w-full` 撑满窗口宽度。
- **原因**：用户明确要求头部内容不要再限制最大宽度，在全屏或大窗口下应与软件窗口等宽展示。
- **影响**：
  - 头部背景、品牌区和右侧操作区现在会随窗口完整铺满，不再在大屏下出现中间收窄。
  - `pnpm typecheck`、`pnpm lint` 已通过。

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

## 2026-05-21 - 增加中英双语 UI 与双语 README

- **改动**：新增 `src/lib/i18n.ts`，把设置页、模型选择页、工作区空态、头部导航、渠道弹框、provider 描述和快捷键提示统一改为 `zh-CN / en-US` 双语；语言选择项加入设置页并持久化到 `preferences.language`；同时将 `README.md` 改写为中英双语版本。
- **原因**：用户要求软件和文档同时支持中文与英文，并且软件内可以直接切换语言。
- **影响**：
  - UI 文案现在会随语言设置实时切换，且重启后保持上次选择。
  - 内置 provider 的名称与描述也会随语言变化。
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 已全部通过。

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
