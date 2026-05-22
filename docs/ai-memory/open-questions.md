# Open Questions

## 待确认

1. 远程 AI 视图是否需要支持“始终置顶”能力；当前需求未要求，默认先不实现。
2. 是否需要记录并恢复多显示器环境下的窗口位置；当前先保证基础显示 / 隐藏与聚焦。
3. 是否需要代理设置入口；部分国际 AI 服务可能依赖特定网络环境，但当前设置页范围未包含该项。

## 待观察

1. 某些 AI 网站未来可能限制 WebView 或脚本注入行为，需要在真实运行后观察兼容性。
2. 远程页面主题同步是否对主流目标站点足够有效，需要在 DeepSeek、豆包、ChatGPT、Gemini 上分别验证。
3. 如果多个远程子 Webview 常驻后的内存占用偏高，后续可能需要加入回收策略。
4. 如果后续改为交付 `MSI`，需要补验证 WiX 安装与下载链路；当前 `NSIS` 已满足 Windows 主分发需求。
5. 关闭主窗口后的托盘 / 菜单栏恢复链路虽然已经完成 Windows 本机编译验证，并通过 `DOCS_RS=1 cargo check --target aarch64-apple-darwin/x86_64-apple-darwin` 做了 Apple 目标静态检查，但 macOS 真实运行表现与最终构建仍需在 Mac 机器上确认。

## 暂定方案

1. 当前优先使用主窗口内的独立子 `Webview` 承载 AI 页面，避免 `iframe` 被 `X-Frame-Options` / `CSP` 阻止。
2. 当前优先用 `@tauri-apps/plugin-store` 保存用户偏好与上次选择，避免依赖浏览器级临时存储。
3. 当前默认只让主窗口获得 capability 权限，远程 AI 页面不直接接触 Tauri API。
4. 当前 Windows 交付默认使用 `NSIS` 安装包；`MSI` 作为后续可选补充，而不是当前阻塞项。
