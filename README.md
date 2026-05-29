# AIOneClient ✨

一个基于 `Tauri v2 + Vue 3 + TypeScript + Rust` 的桌面 AI 聚合客户端。

AIOneClient 的目标不是再造一个聊天界面，而是提供一个轻量、本地化的桌面壳层，把常用 AI Web 应用放在同一个工作区里：快速切换、保留登录态、统一偏好设置，并通过全局快捷键在桌面环境里随手唤起或隐藏。

## 它解决什么问题 🧭

日常使用多个 AI 服务时，浏览器标签页很容易变成一排难以管理的入口。AIOneClient 把这些入口收束到一个桌面应用中：

- 对话页面仍然使用各服务自己的官方 Web 页面，尽量减少兼容成本。
- 本地壳层负责选择、切换、主题、快捷键、启动行为、关闭行为等桌面体验。
- 已创建的 AI 页面会被复用，切换时不主动销毁 WebView，尽量保留登录态和会话现场。
- 支持自定义 AI 渠道，适合接入团队内部模型、代理页面或其他 Web AI 工具。

## 功能概览 🚀

- 聚合常见 AI 入口：`DeepSeek`、`豆包`、`通义千问`、`文心一言`、`Kimi`、`ChatGPT`、`Gemini`、`Claude`、`Copilot`、`Perplexity`。
- 支持 `国产派 / 国际派 / 自定义` 排序视图。
- 支持新增自定义 AI 渠道，并尝试读取站点 `favicon`。
- 记住上次选择的 AI，下次启动可直接恢复。
- 全局快捷键默认 `Shift + Alt + W`，支持录制式修改。
- 支持 `跟随系统 / 浅色 / 深色` 主题。
- 支持中英文界面。
- 支持头部收起，让远程 AI WebView 获得更大显示区域。
- 支持最小化到托盘、开机自启、静默启动等桌面偏好。

## 架构说明 🧩

项目采用“本地壳层 + 原生 WebView”的结构：

- `src/`：Vue 3 前端壳层，负责路由、状态、设置页、模型列表和 UI。
- `src/stores/`：Pinia 状态，包括偏好设置、工作区状态、快捷键状态。
- `src-tauri/`：Tauri/Rust 桌面层，负责托盘、窗口、全局快捷键、系统能力和打包配置。
- `src/features/providers/`：内置 AI 渠道定义。
- `overlay-control.html` + `src/overlay-control.ts`：头部收起后的悬浮展开控件。

远程 AI 页面优先通过 Tauri 原生 WebView 承载，而不是 `iframe`。这样可以避开很多站点的 `X-Frame-Options` / `CSP` 限制，也更贴近桌面客户端的窗口与焦点模型。

## 技术栈 🛠️

- `Tauri v2`
- `Rust`
- `Vue 3`
- `TypeScript`
- `Vite`
- `Pinia`
- `Vue Router`
- `UnoCSS`
- `@tauri-apps/plugin-store`
- `@tauri-apps/plugin-global-shortcut`
- `@tauri-apps/plugin-autostart`

## 本地开发 💻

推荐使用 `pnpm`。

```bash
pnpm install
pnpm tauri dev
```

常用脚本：

```bash
pnpm build        # 类型检查 + 前端构建
pnpm typecheck    # 仅运行 vue-tsc
pnpm lint         # ESLint
pnpm tauri dev    # 启动 Tauri 开发模式
```

## Windows 构建 🪟

### 环境要求

Windows 构建建议使用 MSVC 工具链：

- Node.js
- pnpm
- Rust stable MSVC toolchain
- Microsoft C++ Build Tools，并安装 `Desktop development with C++`
- WebView2 Runtime
- NSIS，用于生成轻量安装包

如果是首次准备 Rust MSVC 环境，可以确认：

```powershell
rustup default stable-msvc
rustc --version
cargo --version
```

### 开发构建

```powershell
pnpm install
pnpm tauri dev
```

### 生成安装包

当前仓库的 Windows 分发方案使用 `NSIS`：

```powershell
pnpm tauri build --bundles nsis
```

常见产物位置：

```text
src-tauri/target/release/aiclientcore.exe
src-tauri/target/release/bundle/nsis/AIOneClient_0.1.8_x64-setup.exe
```

如果只需要 release 可执行文件，也可以直接运行：

```powershell
pnpm tauri build
```

### Windows ARM64

默认构建通常面向 `x86_64-pc-windows-msvc`。如果需要 Windows ARM64，需要准备对应 Rust target 和依赖链路，例如：

```powershell
rustup target add aarch64-pc-windows-msvc
pnpm tauri build --target aarch64-pc-windows-msvc
```

实际能否顺利产出还取决于本机 C++ 工具链、Tauri 依赖和打包目标支持情况。

## macOS 构建 🍎

macOS 的 `.app` / `.dmg` 必须在 Mac 上构建。Windows 机器不能直接产出可用的 macOS 应用包。

### 环境要求

- macOS
- Xcode Command Line Tools
- Node.js
- pnpm
- Rust stable toolchain

安装基础工具：

```bash
xcode-select --install
rustup default stable
pnpm install
```

### Apple Silicon 构建

适用于 M 系列芯片：

```bash
rustup target add aarch64-apple-darwin
pnpm tauri build --bundles app --target aarch64-apple-darwin
pnpm tauri build --bundles dmg --target aarch64-apple-darwin
```

常见产物位置：

```text
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/
src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
```

### Intel Mac 构建

适用于 Intel 芯片：

```bash
rustup target add x86_64-apple-darwin
pnpm tauri build --bundles app --target x86_64-apple-darwin
pnpm tauri build --bundles dmg --target x86_64-apple-darwin
```

常见产物位置：

```text
src-tauri/target/x86_64-apple-darwin/release/bundle/macos/
src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/
```

### Universal 构建

如果希望一个包同时覆盖 Apple Silicon 和 Intel：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm tauri build --bundles app --target universal-apple-darwin
pnpm tauri build --bundles dmg --target universal-apple-darwin
```

常见产物位置：

```text
src-tauri/target/universal-apple-darwin/release/bundle/macos/
src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

Universal 包分发心智更简单，但包体通常更大。

### 签名与公证

本仓库当前 README 只覆盖本地构建。若要正式分发 macOS 应用，通常还需要配置 Apple Developer ID 签名与 notarization。相关证书、团队 ID、钥匙串和 CI 密钥管理不建议写死在仓库中，应通过本地环境变量或 CI Secret 注入。

## 配置与数据 📦

应用偏好使用 Tauri Store 持久化，典型内容包括：

- 当前语言
- 主题模式
- 全局快捷键
- 上次选择的 AI
- 自定义渠道
- 启动和关闭行为
- 头部收起状态

远程 AI 页面登录态由 WebView 自身管理；切换 AI 时不会主动清理浏览数据。

## 使用提示 ⌨️

- 默认全局快捷键：`Shift + Alt + W`
- 修改快捷键：进入 `设置 -> 全局快捷键`，点击录制区域后直接按下新组合键。
- 添加渠道：在模型选择页打开 `自定义 AI 渠道`，填写名称和 URL。
- 快速切换：点击顶部 `切换 AI` 返回模型列表。
- 收起头部：进入 AI 页面后点击顶部居中的收起按钮，可让 WebView 占满更多空间。

## 构建排障 🔎

- Windows 上找不到 Rust 或 NSIS：确认 `~/.cargo/bin` 和 NSIS 安装目录已在 `PATH` 中。本仓库的 `scripts/run-tauri.mjs` 会在运行 Tauri CLI 时补齐常见路径。
- Windows 编译失败且涉及 C++：优先检查 Microsoft C++ Build Tools 是否安装了 `Desktop development with C++`。
- macOS 无法交叉打包：这是预期行为，`.app` / `.dmg` 需要在 Mac 上构建。
- 全局快捷键无效：先确认快捷键没有被系统或其他软件占用，再到设置页重新录制。

## 当前状态 🧪

- Windows 桌面端为主要验证环境。
- macOS 构建路径已整理，但真实签名、公证和分发流程需要在 Mac 环境继续验证。
- 项目更偏向“本地桌面壳层 + 远程 AI Web 页面”的工作流，不计划把所有 AI 服务重写为统一聊天协议。
