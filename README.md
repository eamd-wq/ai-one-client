# AIClientCore

[中文](#中文) | [English](#english)

## 中文

### 项目简介

`AIClientCore` 是一个基于 `Tauri v2 + Vue 3 + TypeScript + Rust` 构建的桌面 AI 聚合客户端。

它将多个主流 AI 对话页面统一放进一个本地桌面壳层中，方便你在不同模型之间快速切换，同时尽量保留各自网页里的登录态和会话状态。

### 当前功能

- 聚合多个主流 AI 对话入口：`DeepSeek`、`豆包`、`通义千问`、`文心一言`、`Kimi`、`ChatGPT`、`Gemini`、`Claude`、`Copilot`、`Perplexity`
- 支持按 `国产派 / 国际派 / 自定义` 实时重排模型列表
- 选择某个 AI 后直接打开对应对话页面
- 记住上次打开的 AI，下次启动可直接回到上次页面
- 支持新增自定义 AI 渠道
- 自定义渠道可填写名称和链接，并尝试自动读取网页 `favicon`
- 默认全局快捷键为 `Shift + Alt + W`
- 支持录制式修改全局快捷键，启动后自动注册生效
- 支持 `跟随系统 / 浅色 / 深色` 主题
- 壳层主题会同步到已创建的 AI 页面
- 支持头部收起，收起后子 Webview 全屏显示
- 支持中英文界面切换

### 开发运行

#### 1. 安装依赖

```bash
pnpm install
```

#### 2. 启动开发模式

```bash
pnpm tauri dev
```

#### 3. 构建前端

```bash
pnpm build
```

### 打包说明

#### Windows 打包

当前仓库已经在 Windows 上验证通过的轻量安装包方案是 `NSIS`。

```bash
pnpm tauri build --bundles nsis
```

当前机器上最近一次成功产物位置：

```text
src-tauri/target/release/bundle/nsis/AIClientCore_0.1.1_x64-setup.exe
```

同时会生成可执行文件：

```text
src-tauri/target/release/aiclientcore.exe
```

#### macOS 打包

`macOS` 安装包必须在 `Mac` 机器上构建，不能直接在当前这台 Windows 机器上产出 `.app` 或 `.dmg`。

先安装前置依赖：

```bash
xcode-select --install
pnpm install
```

如果只打 Apple Silicon 版本：

```bash
rustup target add aarch64-apple-darwin
pnpm tauri build --bundles app --target aarch64-apple-darwin
pnpm tauri build --bundles dmg --target aarch64-apple-darwin
```

常见产物目录：

```text
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/
src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
```

如果只打 Intel 版本：

```bash
rustup target add x86_64-apple-darwin
pnpm tauri build --bundles app --target x86_64-apple-darwin
pnpm tauri build --bundles dmg --target x86_64-apple-darwin
```

常见产物目录：

```text
src-tauri/target/x86_64-apple-darwin/release/bundle/macos/
src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/
```

如果希望一个包同时覆盖 Intel 和 Apple Silicon，可以在 Mac 上构建 Universal 包：

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm tauri build --bundles app --target universal-apple-darwin
pnpm tauri build --bundles dmg --target universal-apple-darwin
```

常见产物目录：

```text
src-tauri/target/universal-apple-darwin/release/bundle/macos/
src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

#### 是否需要按 CPU 架构分别打包？

需要，安装包通常和目标 CPU 架构绑定。

- Windows：当前已经打出的安装包是 `x64`。如果你要支持 `Windows ARM64`，通常需要改为面向 `aarch64-pc-windows-msvc` 目标构建。
- macOS：如果你分别面向 `Intel` 和 `Apple Silicon`，通常需要分别打包；如果想只提供一个安装包，建议在 Mac 上构建 `universal-apple-darwin`。
- Universal 包更省分发心智，但体积通常会更大。

### 软件使用方式

#### 选择 AI

1. 启动软件后，进入模型选择页。
2. 使用顶部的 `国产派 / 国际派 / 自定义` 切换排序方式。
3. 点击任意模型卡片，直接进入对应 AI 网页。

#### 快速切换 AI

1. 点击头部的 `切换 AI`。
2. 返回模型列表。
3. 重新选择目标 AI。

说明：
切换时不会主动清理已创建 AI 页面的登录态和会话状态。

#### 新增自定义 AI 渠道

1. 在模型选择页点击 `自定义 AI 渠道`。
2. 输入名称和链接地址。
3. 点击 `保存`。
4. 新渠道会加入列表，并自动归入 `自定义` 分类。

#### 修改快捷键

1. 进入 `设置` 页面。
2. 在 `全局快捷键` 区域点击录制框。
3. 直接按下新的组合键。
4. 更新后立即生效。

#### 切换主题

1. 进入 `设置` 页面。
2. 在 `主题模式` 中选择：
   - `跟随系统`
   - `浅色`
   - `深色`

#### 切换语言

1. 进入 `设置` 页面。
2. 在 `界面语言` 中选择：
   - `简体中文`
   - `English`

### 技术栈

- Tauri v2
- Rust
- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- UnoCSS

### 说明

- 当前交付重点是桌面端体验，Windows 已完成实际安装包验证。
- macOS 代码路径已准备好，但真实 `.app` / `.dmg` 需要在 Mac 上构建。
- 当前采用的是 `本地壳层 + 原生子 Webview` 方案，而不是 `iframe`。

---

## English

### Overview

`AIClientCore` is a desktop AI aggregator built with `Tauri v2 + Vue 3 + TypeScript + Rust`.

It wraps multiple mainstream AI chat websites inside one local desktop shell, making it easy to switch between models while preserving login state and session state as much as possible.

### Current Features

- Aggregates multiple AI chat entries: `DeepSeek`, `Doubao`, `Tongyi Qianwen`, `ERNIE Bot`, `Kimi`, `ChatGPT`, `Gemini`, `Claude`, `Copilot`, and `Perplexity`
- Reorders the list in real time by `Domestic / International / Custom`
- Opens the selected AI chat page directly
- Remembers the last opened AI and restores it on the next launch
- Supports adding custom AI channels
- Custom channels accept a name and URL, then try to use the website `favicon`
- Default global shortcut is `Shift + Alt + W`
- Supports recorder-style hotkey replacement and registers it on app startup
- Supports `Follow System / Light / Dark` themes
- Syncs the shell theme to created AI pages
- Supports collapsing the header so the child Webview can take the full window
- Supports Chinese and English UI switching

### Development

#### 1. Install dependencies

```bash
pnpm install
```

#### 2. Start in development mode

```bash
pnpm tauri dev
```

#### 3. Build the frontend

```bash
pnpm build
```

### Packaging

#### Windows packaging

The validated lightweight installer route for this repo on Windows is `NSIS`.

```bash
pnpm tauri build --bundles nsis
```

Latest verified output on this machine:

```text
src-tauri/target/release/bundle/nsis/AIClientCore_0.1.1_x64-setup.exe
```

The executable is also produced at:

```text
src-tauri/target/release/aiclientcore.exe
```

#### macOS packaging

`macOS` bundles must be built on a `Mac`. This Windows machine cannot directly produce `.app` or `.dmg` outputs.

Install prerequisites first:

```bash
xcode-select --install
pnpm install
```

For Apple Silicon only:

```bash
rustup target add aarch64-apple-darwin
pnpm tauri build --bundles app --target aarch64-apple-darwin
pnpm tauri build --bundles dmg --target aarch64-apple-darwin
```

Common output directories:

```text
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/
src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
```

For Intel only:

```bash
rustup target add x86_64-apple-darwin
pnpm tauri build --bundles app --target x86_64-apple-darwin
pnpm tauri build --bundles dmg --target x86_64-apple-darwin
```

Common output directories:

```text
src-tauri/target/x86_64-apple-darwin/release/bundle/macos/
src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/
```

If you want one package for both Intel and Apple Silicon, build a Universal package on a Mac:

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
pnpm tauri build --bundles app --target universal-apple-darwin
pnpm tauri build --bundles dmg --target universal-apple-darwin
```

Common output directories:

```text
src-tauri/target/universal-apple-darwin/release/bundle/macos/
src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

#### Do I need separate packages for different CPU architectures?

Yes. Packages are usually tied to the target CPU architecture.

- Windows: the current installer is `x64`. If you need `Windows ARM64`, build for `aarch64-pc-windows-msvc`.
- macOS: build separately for `Intel` and `Apple Silicon` unless you intentionally produce `universal-apple-darwin`.
- Universal packaging simplifies distribution, but usually increases bundle size.

### How to Use the App

#### Select an AI

1. Launch the app and enter the model selection page.
2. Use `Domestic / International / Custom` to change the ordering.
3. Click any model card to open the target AI page.

#### Quickly switch between AI pages

1. Click `Switch AI` in the header.
2. Return to the model list.
3. Choose another AI.

Note:
Existing login and conversation state are intentionally preserved whenever possible.

#### Add a custom AI channel

1. Click `Custom AI Channel` on the selection page.
2. Enter the channel name and URL.
3. Click `Save`.
4. The new item will be added under the `Custom` category.

#### Change the global shortcut

1. Open the `Settings` page.
2. Click the recorder area inside the `Global Hotkey` section.
3. Press a new key combination.
4. The new shortcut takes effect immediately.

#### Change the theme

1. Open the `Settings` page.
2. Select one of:
   - `Follow System`
   - `Light`
   - `Dark`

#### Change the language

1. Open the `Settings` page.
2. In `Interface Language`, choose:
   - `简体中文`
   - `English`

### Tech Stack

- Tauri v2
- Rust
- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- UnoCSS

### Notes

- The current delivery focus is desktop usage, and Windows packaging has been verified.
- macOS code paths are prepared, but real `.app` / `.dmg` bundles still need to be built on a Mac.
- The app uses a `local shell + native child Webview` architecture instead of `iframe`.
