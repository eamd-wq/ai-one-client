# Change Log

按时间倒序追加重要 AI 改动。每条记录尽量说明改动、原因、影响和后续事项。

## 2026-05-21 - 完成 Windows NSIS 安装包打包闭环

- **改动**：确认并复用本机已安装的 NSIS，完成 `pnpm tauri build --bundles nsis` release 打包，成功生成 `AIClientCore_0.1.0_x64-setup.exe`。
- **原因**：此前桌面主体已编译通过，但安装包产出受外部工具下载阶段影响，需要把交付链路补齐到可安装状态。
- **影响**：
  - 项目现在同时具备可执行文件和 Windows 安装包两种交付物。
  - 轻量主流的 Windows 桌面分发路径已经可用，满足当前用户预期。
- **后续事项**：
  - 如需 MSI，再补 WiX 链路验证。
  - 后续可补一次真实账号登录场景下的主题同步与快捷切换回归测试。

## 2026-05-21 - 修复新终端下 `pnpm tauri` 找不到 cargo 的问题

- **改动**：新增 `scripts/run-tauri.mjs`，并把 `package.json` 中的 `tauri` 脚本改为通过该包装脚本启动，从而自动补齐 Windows 下的 `cargo` 与 `NSIS` 常见安装路径。
- **原因**：用户在新终端执行 `pnpm tauri dev` 时，Tauri CLI 因 PATH 中缺少 `cargo.exe` 而无法运行 `cargo metadata`。
- **影响**：
  - `pnpm tauri --help` 与 `pnpm tauri info` 已恢复正常。
  - 后续 `pnpm tauri dev`、`pnpm tauri build` 对终端 PATH 的依赖明显降低。

## 2026-05-21 - 完成首版 AI 聚合客户端主干实现

- **改动**：完成 `Tauri v2 + Vue3 + TypeScript` 首版业务实现，包含模型选择页、国产派 / 国际派排序、上次选择记忆、设置页、全局快捷键、主题切换、主窗口子 Webview 承载与状态保持。
- **原因**：这是当前任务的核心交付目标，需要让应用从脚手架状态进入可运行的产品主干状态。
- **影响**：
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 均已通过。
  - `cargo build --manifest-path src-tauri/Cargo.toml --release` 已通过，说明桌面可执行文件本体可以成功编译。
- **后续事项**：
  - 在真实登录状态下验证 DeepSeek、豆包、ChatGPT、Gemini 的主题同步效果与 Webview 兼容性。

## 2026-05-21 - 初始化 Tauri 脚手架并恢复仓库规范文件

- **改动**：安装了 Windows 下的 Tauri 必要构建环境，初始化了 `Tauri v2 + Vue3 + TypeScript` 脚手架，并恢复了被脚手架覆盖的 `AGENTS.md`、`.agents/skills/` 与 `docs/ai-memory/`。
- **原因**：需要正式进入业务开发；同时发现 `create-tauri-app --force` 会破坏仓库内未提交的协作规范文件，必须立刻修复。
- **影响**：
  - 本地已经具备 Rust、WebView2、Build Tools、NSIS 的桌面开发环境。
  - 工程进入“主窗口壳层 + 子 Webview”业务实现阶段。

## 2026-05-21 - 重构项目记忆并确定 Tauri 实施基线

- **改动**：重写 `docs/ai-memory/` 核心文件，并补充本次桌面 AI 聚合客户端的长期产品与工程约束。
- **原因**：需要在代码开始前先固定长期约束，避免实现和文档脱节。
- **影响**：
  - 明确了全局快捷键、主题同步、上次选择记忆、快速切换入口的长期约束。
  - 为 `tauri-vue3-best-practices` skill 提供稳定输入。
