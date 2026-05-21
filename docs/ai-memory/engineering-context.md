# Engineering Context

## 技术栈

- **桌面框架**：Tauri v2（Rust 后端 + WebView 前端）
- **前端**：Vue 3 + TypeScript + Vite
- **样式方案**：UnoCSS（与现有 Vue 组件规范保持一致）
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **代码质量**：ESLint + Prettier + TypeScript strict

## 项目记忆方案

1. `AGENTS.md` 负责声明仓库内存在 AI 记忆机制，并要求在相关任务前后读取与更新。
2. `.agents/skills/project-memory/` 负责把"何时读、何时写、写到哪里"固化为 skill。
3. `docs/ai-memory/README.md` 保持短小，提供入口、规则和文件导航。
4. 其他记忆文件按主题拆分，避免单文件持续膨胀。

## 维护原则

1. 记忆文件只沉淀未来高概率复用的信息，不复制代码 diff。
2. 同一信息只保留在一个最合适的位置，避免多处漂移。
3. 重要改动统一在 `change-log.md` 追加，便于快速了解近期演进。
4. 未确认事项集中在 `open-questions.md`，闭环后应及时清理。