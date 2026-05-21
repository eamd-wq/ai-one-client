---
name: tauri-vue3-best-practices
description: Tauri v2 + Vue3 + TypeScript 桌面应用最佳实践。Use when 创建、重构或评审 Tauri + Vue 项目，需要统一脚手架、权限模型、窗口架构、状态持久化、远程 WebView、安全边界、主题同步与验证流程。
---

# Tauri Vue3 Best Practices

用于 Tauri v2 + Vue 3 + TypeScript 项目的实现约束，目标是在保持工程清晰的前提下，优先采用 Tauri 官方脚手架与插件生态的成熟模式。

## 何时使用

以下情况应使用本 skill：

1. 从零创建 Tauri + Vue 项目。
2. 为 Tauri 项目增加窗口、WebView、快捷键、持久化、主题或设置能力。
3. 评审 Tauri 项目时，需要判断是否符合安全边界与社区通用实践。

## 默认技术基线

1. 用官方 `create-tauri-app` 初始化项目，不手工拼装基础目录。
2. 前端默认使用 Vue 3 + TypeScript + Vite。
3. 前端状态优先使用 Pinia；跨页面长期偏好用 `@tauri-apps/plugin-store` 持久化。
4. 桌面能力优先使用官方插件，不重复造轮子。
5. 代码质量至少包含 TypeScript strict、ESLint、Prettier、`vue-tsc` 和基础测试。

## 环境基线

Windows 开发环境至少检查：

1. Node.js 可用。
2. Rust `stable-msvc` 工具链可用。
3. Microsoft C++ Build Tools 已安装，并包含 “Desktop development with C++”。
4. WebView2 运行时可用。

如果缺失，优先按 Tauri 官方文档补齐，而不是尝试规避。

## 架构原则

### 1. 本地壳层与远程页面分离

1. 本地壳层窗口负责导航、设置、偏好、状态管理和桌面交互。
2. 远程站点优先放到独立 `WebviewWindow` 或子 `Webview`，不要优先尝试 `iframe`。
3. 只有在远程页面确实需要内嵌且确认不会被 `X-Frame-Options` / `CSP` 拦截时，才考虑 `iframe`。

### 2. 懒创建，重复利用

1. 远程 AI 视图按需创建。
2. 已创建视图优先 `show` / `hide` 复用，不要频繁销毁重建。
3. 需要保留登录态或页面会话时，不清理 WebView 浏览数据。

### 3. Rust 负责桌面编排

以下能力优先放在 Rust / Tauri 层：

1. 全局快捷键注册、更新和冲突处理。
2. 主窗口与远程视图的显示、隐藏、聚焦与启动重定向。
3. 主题模式下发与远程视图注入脚本。
4. 应用生命周期与跨窗口事件协调。

## 权限与安全边界

1. 使用 Tauri v2 capability 文件管理权限。
2. 只给本地壳层窗口分配所需 permission。
3. 远程 AI 页面默认不暴露 Tauri API。
4. 不要为了图省事开启全局开放权限。

## 插件选择

优先考虑以下官方插件：

1. `plugin-store`：保存主题、快捷键、阵营偏好、上次选择。
2. `plugin-global-shortcut`：全局快捷键。
3. `plugin-opener`：需要把链接交给系统默认程序时使用。
4. `plugin-window-state`：只有在明确需要恢复窗口尺寸与位置时再加。

## 主题最佳实践

1. 主题模式值只保留三种：`system`、`light`、`dark`。
2. 本地壳层同时维护用户选择的主题模式与当前实际生效主题。
3. 切换主题时同步更新：
   - Tauri 窗口主题 API
   - 前端根节点主题类和 CSS 变量
   - 已创建远程视图的通用主题标识

## 针对“聚合 AI 页面”场景的特别规则

1. 如果产品需要保留本地设置页与切换入口，优先“主窗口壳层 + 子 Webview”模式。
2. 快速切换时返回主窗口，但不要销毁远程视图。
3. 上次选择记录的是 provider 标识，不是瞬时 URL 片段。
4. 全局快捷键切换显示状态时，应优先操作当前活动视图所在主窗口。

## 反模式

1. 在多个 Vue 组件里直接散写 `new Webview(...)`。
2. 把所有 Tauri 权限直接开到默认窗口和远程窗口。
3. 用浏览器本地存储替代桌面配置存储。
4. 切换 AI 时关闭并重建视图，导致登录态丢失。
