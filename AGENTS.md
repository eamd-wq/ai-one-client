# AGENTS.md

本文件是当前仓库的 Agent 总纲。

更细的专项规则放在 `.agents/skills/` 中；处理具体任务时，优先加载与任务直接相关的 skill。

## 基本原则

1. 先理解上下文，再动代码；不要跳过项目约定直接实现。
2. 优先做最小且可验证的改动，避免顺手扩散重构。
3. 规则冲突时，任务专属 skill 优先于通用说明；如果仍有歧义，以离代码最近、约束最具体的规则为准。

## 开工前检查

1. 先阅读 `docs/ai-memory/README.md`。
2. 按任务需要再读取其他 memory 文件，不要一次性加载全部长期记忆。
3. 涉及目录定位、技术栈或模块边界时，优先使用 `.agents/skills/monorepo-architecture/`。
4. 涉及专项开发时，加载对应 skill，例如 Nuxt、Vue 组件、Nitro、Prisma 等。

## Skill 使用约定

1. `.agents/skills/` 是仓库内专项规则的唯一入口。
2. 任务命中已有 skill 时，先遵循 skill，再补充局部代码上下文。
3. 如果任务没有现成 skill，再按现有代码模式谨慎实现；不要凭空引入新的大约定。
4. 涉及项目长期上下文、历史决策或改动留痕时，使用 `.agents/skills/project-memory/`。

## 项目记忆

本仓库使用 `docs/ai-memory/` 维护可复用的 AI 长期记忆，目的是减少上下文压缩后丢失用户偏好、历史决策和关键实现细节。

1. 完成任何非微小改动后，必须判断是否需要更新 memory 文件。
2. 重要改动应追加到 `docs/ai-memory/change-log.md`。
3. 用户长期偏好、细节要求、业务约束写入 `docs/ai-memory/product-context.md`。
4. 工程边界、实现约束、已知坑点写入 `docs/ai-memory/engineering-context.md`。
5. 未闭环事项、待确认点、暂缓处理的风险写入 `docs/ai-memory/open-questions.md`。
6. 只更新必要文件，避免同一信息重复出现在多个记忆文件中。

## 完成任务时

1. 说明本次是否更新了 `docs/ai-memory/`，以及更新了哪些文件。
2. 如果未更新 memory，默认应能解释为什么这次改动不需要沉淀长期记忆。
