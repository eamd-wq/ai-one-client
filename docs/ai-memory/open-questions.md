# Open Questions

## 待决策

1. **WebView 方案**：Tauri v2 中加载外部 AI 页面，使用 `<iframe>` 还是多个独立 WebView 窗口？`<iframe>` 更简单但可能被某些网站通过 `X-Frame-Options` 阻止；独立 WebView 更灵活但内存占用更高。建议先用 `<iframe>` 尝试，被阻止的网站使用独立 WebView 兜底。

2. **用户数据持久化**：本地存储方案用 Tauri 的 `tauri-plugin-store` 还是直接用 `localStorage`？`tauri-plugin-store` 更可靠但需要额外插件；`localStorage` 简单但可能在 WebView 清理时丢失。

3. **登录状态跨页面保持**：如果多个 AI 页面需要保持登录状态，是否需要独立的 cookie 存储分区？Tauri 默认共享 WebView 的 cookie 存储。

## 待观察

1. 当前方案先采用手工维护的 markdown 记忆文件，后续可再评估是否需要脚本化辅助，例如自动追加 change log 模板或校验必填项。
2. 需要在后续几次真实开发任务里观察：
   - `change-log.md` 的粒度是否偏粗或偏细
   - `product-context.md` 与 `engineering-context.md` 是否出现职责重叠
   - `AGENTS.md` 是否足以让不同 agent 在仓库入口阶段就读取这套记忆

## 待确认

1. 是否需要支持窗口置顶功能？
2. 是否需要支持多显示器场景下的窗口位置记忆？
3. 是否需要支持代理设置（部分 AI 服务可能需要特殊网络环境访问）？