# Change Log

按时间倒序追加重要 AI 改动。每条记录尽量说明改动、原因、影响和后续事项。

## 2026-05-20 - AIClientCore 项目初始化

- **改动**：创建 Tauri + Vue3 + TypeScript 桌面聚合 AI 客户端项目。
- **原因**：需要一个统一的桌面应用来聚合各大厂商的 AI 对话页面，避免在多个浏览器标签间切换。
- **影响**：
  - 确立了 Tauri v2 + Vue3 + TS + UnoCSS + Pinia 技术栈。
  - 创建了 `.agents/skills/tauri-vue3-best-practices/` 技能规范。
  - 更新了 `product-context.md` 和 `engineering-context.md`，固化产品需求与工程约束。
- **后续事项**：
  - 关注 Tauri v2 Windows WebView 兼容性。
  - 关注多 WebView 内存占用情况。
  - 后续迭代可考虑添加更多 AI 厂商。