# AIClientCore

[中文](#中文版) | [English](#english)

## 中文版

### 软件简介

`AIClientCore` 是一个基于 `Tauri v2 + Vue 3 + TypeScript + Rust` 构建的桌面 AI 聚合客户端。  
它把多个主流 AI 对话网页统一放进一个本地桌面壳层里，方便你在不同模型之间快速切换，同时尽量保留各自网页里的登录态和会话状态。

### 当前功能

- 聚合多个主流 AI 对话入口：`DeepSeek`、`豆包`、`通义千问`、`文心一言`、`Kimi`、`ChatGPT`、`Gemini`、`Claude`、`Copilot`、`Perplexity`
- 支持按 `国产派 / 国际派 / 自定义` 对模型列表即时排序
- 选择某个 AI 后直接打开对应对话网页
- 记住上次打开的 AI，下次启动可直接回到上次页面
- 支持新增自定义 AI 渠道
- 自定义渠道可填写名称和链接，并自动尝试读取网站 favicon
- 全局快捷键默认是 `Shift + Alt + W`
- 支持修改全局快捷键，启动后即注册生效
- 支持浅色 / 深色 / 跟随系统主题
- 壳层主题会同步到已创建的 AI 页面
- 支持头部收起，收起后 AI 内容区全屏展示
- 支持中英文界面切换

### 使用方式

#### 1. 安装依赖

```bash
pnpm install
```

#### 2. 开发模式启动

```bash
pnpm tauri dev
```

#### 3. 构建前端

```bash
pnpm build
```

#### 4. 生成 Windows 安装包

```bash
pnpm tauri build --bundles nsis
```

生成后的安装包默认位于：

```text
src-tauri/target/release/bundle/nsis/AIClientCore_0.1.0_x64-setup.exe
```

### 软件内如何使用

#### 选择 AI

1. 启动软件后，进入模型选择页。
2. 使用顶部的 `国产派 / 国际派 / 自定义` 切换排序方式。
3. 点击任意模型卡片，直接进入对应 AI 网页。

#### 快速切换 AI

1. 点击顶部的 `快速切换 AI`。
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
2. 在 `全局快捷键` 卡片中点击录制区域。
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

- 当前主要面向桌面场景，优先保证 Windows 可运行与可打包。
- macOS 代码路径已兼容，但真正的 `.app` / `.dmg` 产物需要在 Mac 机器上执行 Tauri 打包。
- 当前使用的是“本地壳层 + 原生子 Webview”方案，而不是 `iframe`。

---

## English

### Overview

`AIClientCore` is a desktop AI aggregator built with `Tauri v2 + Vue 3 + TypeScript + Rust`.  
It wraps multiple mainstream AI chat websites inside one local desktop shell, making it easy to switch between models while preserving login state and session state as much as possible.

### Current Features

- Aggregates multiple AI chat entries: `DeepSeek`, `Doubao`, `Tongyi Qianwen`, `ERNIE Bot`, `Kimi`, `ChatGPT`, `Gemini`, `Claude`, `Copilot`, and `Perplexity`
- Instantly reorders the list by `Domestic / International / Custom`
- Opens the selected AI chat page directly
- Remembers the last opened AI and restores it on the next launch
- Supports adding custom AI channels
- Custom channels accept a name and URL, then try to use the website favicon automatically
- Default global shortcut is `Shift + Alt + W`
- Global shortcut can be updated and is registered on app startup
- Supports `Light / Dark / Follow System` themes
- Syncs shell theme to created AI pages when possible
- Supports collapsing the header so the AI content can take the full window
- Supports Chinese and English UI switching

### Usage

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

#### 4. Build the Windows installer

```bash
pnpm tauri build --bundles nsis
```

The generated installer is typically located at:

```text
src-tauri/target/release/bundle/nsis/AIClientCore_0.1.0_x64-setup.exe
```

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

- The current delivery target is desktop usage, with Windows prioritized for packaging and runtime stability.
- macOS code paths are prepared, but real `.app` / `.dmg` bundles must still be built on a Mac machine.
- The app uses a `local shell + native child Webview` architecture instead of `iframe`.
