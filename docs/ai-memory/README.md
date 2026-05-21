# AI Memory

这个目录用于沉淀会在后续 AI 协作中反复用到、但容易在上下文压缩后丢失的长期项目信息。

## 开工前必读

1. 先读本文件，再按任务需要读取其他 memory 文件。
2. 完成任何非微小改动后，同步更新至少一个相关 memory 文件。
3. 只记录长期有效的信息、关键决策和后续风险，不写流水账。

## 文件导航

- `product-context.md`：产品规则、用户长期偏好、容易遗漏的需求细节。
- `engineering-context.md`：工程结构、实现边界、推荐模式、已知约束。
- `change-log.md`：按时间倒序记录重要 AI 改动与原因。
- `open-questions.md`：尚未闭环的事项、风险、待确认点。

## 当前项目速记

1. 当前仓库是一个 `Tauri v2 + Vue 3 + TypeScript` 桌面 AI 聚合客户端。
2. 应用聚合 DeepSeek、豆包、ChatGPT、Gemini 等 AI 对话页面，支持国产派 / 国际派排序、上次选择记忆、快捷切换、主题同步和全局快捷键。
3. 当前代码已完成首版主干实现，并已通过前端校验、Rust release 编译和 Windows NSIS 安装包打包。
4. 后续继续开发前，优先复用仓库内的 `tauri-vue3-best-practices` skill 与既有窗口 / Webview 架构，不要回退到 `iframe` 方案。
