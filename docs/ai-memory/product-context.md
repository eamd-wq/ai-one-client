# Product Context

## 用户长期偏好

1. 希望 AI 的每次改动都能沉淀成项目内可复用的记录，而不是只存在于当前会话。
2. 记录需要帮助未来 AI 更快理解项目，并更准确继承用户提出过的细节要求。
3. 要优先采用成熟方案；如果没有完全合适的现成方案，再在当前项目内补齐。

## AIClientCore 产品定义

AIClientCore 是一个桌面聚合型 AI 客户端，基于 Tauri 构建，聚合市面各大厂商的 AI 对话页面。

### 核心功能

1. **AI 对话聚合**：内嵌 WebView 加载 DeepSeek、豆包、ChatGPT、Gemini 等厂商的对话页面。
2. **国产派 / 国际派分类**：
   - 国产派优先国产模型（DeepSeek、豆包等）排在列表前部。
   - 国际派优先国际模型（ChatGPT、Gemini 等）排在列表前部。
   - 页面布局：模型竖向列表在布局中心，列表上方有国产派/国际派切换选项，实时排序。
   - 每个列表项右侧有箭头，点击后直接打开对应模型的对话页面。
3. **记忆上次选择**：用户选择过模型后，下次打开软件直接进入上次的对话页；首次使用进入选择页。
4. **全局快捷键**：
   - 默认 `Shift+Alt+W` 快速隐藏/展示软件窗口。
   - 展示时自动聚焦到软件窗口。
   - 支持用户在设置中自定义快捷键。
5. **设置页面**：
   - 快捷键设置。
   - 主题设置（浅色 / 深色 / 跟随系统）。
6. **AI 切换入口**：点击后回到 AI 选择页面，已登录的 AI 页面状态保持不清除。

### 主题系统

1. 浅色 / 深色两套主题，默认跟随系统。
2. 主题变化时修改内嵌网页的主题标识，使适配主题的网页也能随系统变化。

### 模型列表

#### 国产派
- DeepSeek（deepseek.com）
- 豆包（doubao.com）
- 通义千问（tongyi.aliyun.com）
- 文心一言（yiyan.baidu.com）
- Kimi（kimi.moonshot.cn）

#### 国际派
- ChatGPT（chatgpt.com）
- Gemini（gemini.google.com）
- Claude（claude.ai）
- Copilot（copilot.microsoft.com）
- Perplexity（perplexity.ai）

## 当前约定

1. 项目记忆采用"短入口 + 分层专题文件 + 强制更新 change log"的方式维护。
2. 长期约束、偏好与业务细节应尽量写在本文件；临时实施细节不要放在这里。
3. 对未来高价值但不稳定的事项，优先写进 `open-questions.md`，确认稳定后再迁移到本文件或 `engineering-context.md`。