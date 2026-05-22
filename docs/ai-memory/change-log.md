# Change Log

## 2026-05-22 - Fix collapsed overlay intercepting clicks on other pages

- Removed the temporary focus-based workaround in `src/components/AppShell.vue`.
- Normalized the collapsed control `WebviewWindow` in `src/stores/workspace.ts` so it is no longer created as `alwaysOnTop`, and existing instances are forced back to `setAlwaysOnTop(false)` plus `setIgnoreCursorEvents(true)`.
- Updated `src/overlay-control.ts` so the transparent overlay defaults to click-through and only the round button itself remains interactive.
- This regression happened because the transparent `WebviewWindow` could stay above normal content and keep owning mouse events across the whole strip.
- Window-layer behavior and capability changes require a full Tauri process restart for validation; frontend HMR alone is not enough.

按时间倒序记录重要 AI 改动，重点保留“改了什么、为什么改、影响是什么”。

## 2026-05-22 - README 补充 Win / macOS 打包方式与 CPU 架构约束

- **改动**：重写 `README.md` 为干净的中英双语文档，补充 Windows `NSIS` 打包命令、当前已验证产物路径、macOS 在 Mac 机器上的 `.app` / `.dmg` 构建方式，以及 `x64 / ARM64 / universal-apple-darwin` 的架构说明；同时更新 `docs/ai-memory/README.md` 的项目速记。
- **原因**：用户要求把 Win 和 macOS 的打包方式写入 README，并明确确认是否需要按不同 CPU 架构分别打包。
- **影响**：
  - 仓库文档现在明确区分了“Windows 可直接产包”和“macOS 必须在 Mac 上构建”的边界。
  - 后续发版时可以直接参考 README 中的命令和产物目录，减少重复确认成本。

## 2026-05-22 - 收起态展开控件改为按钮级命中区域，避免挡住底层网页交互

- **改动**：将收起头部后的展开控件从“横跨整行的透明子 Webview”收窄为“只包住圆形按钮本身的小型子 Webview”；`src/stores/workspace.ts` 改为按按钮位置计算悬浮控件 bounds，`src/overlay-control.ts` 改为拖动时直接移动自身 Webview，并通过事件把位置提交回主壳层持久化。
- **原因**：原方案虽然 DOM 层已经 `pointer-events: none`，但原生子 Webview 仍会在顶部整条区域拦截鼠标，导致轨道背后的 AI 网页无法 hover 或点击。
- **影响**：
  - 按钮之外的顶部区域现在会把鼠标事件还给底层 AI 网页。
  - 继续保留收起态的展开与 X 轴拖动能力。
  - 如果后续想做“整条轨道都可拖拽且网页仍可交互”，需要升级为独立透明 `WebviewWindow` 并结合 `setIgnoreCursorEvents` 一类的窗口级穿透能力。

## 2026-05-22 - 优化收起态展开按钮拖动手感，避免高频原生移动带来的闪动

- **改动**：将 `src/overlay-control.ts` 的拖动逻辑改为“拖动中只更新前端按钮的视觉位置，松手后再一次性同步原生 Webview 位置”；同时拖动期间移除 `transform` 过渡，只保留颜色与边框过渡。
- **原因**：上一版在每次 `pointermove` 时都调用 `Webview.setPosition`，IPC 频率过高会导致按钮不跟手并出现闪动。
- **影响**：
  - 拖动阶段的手感会更接近纯前端元素拖拽。
  - 原生悬浮控件位置仍会在拖动结束后正确持久化。

## 2026-05-22 - 修复启动后收起态展开按钮不可见

- **改动**：重写 `src/overlay-control.ts`，恢复“小型悬浮 Webview 自己移动、按钮始终固定在自身窗口内边距”的坐标体系，并保留拖动节流与位置持久化。
- **原因**：上一版为了优化拖动手感，把按钮的 `left` 错误地按主窗口全局坐标渲染到仅有 `44px` 宽的小悬浮 Webview 内，导致在“上次记忆为收起态”时启动后按钮被画到可视区域外，看起来像没有恢复。
- **影响**：
  - 如果用户上次是收起态，应用再次启动时会按记忆直接显示展开按钮。
  - 拖动逻辑仍然保持较低闪动的实现方式。

## 2026-05-22 - 收起态展开控件升级为独立透明 WebviewWindow，拖动改走纯前端路径

- **改动**：将收起态展开控件从主窗口内的子 `Webview` 改为独立透明 `WebviewWindow`；`src-tauri/capabilities/default.json` 新增 `core:webview:allow-create-webview-window` 与 `core:window:allow-set-ignore-cursor-events`；`src/stores/workspace.ts` 改为创建整条顶部透明悬浮窗；`src/overlay-control.ts` 改为在悬浮窗内部只移动 DOM 按钮，并使用窗口级 `setIgnoreCursorEvents` 让按钮之外的区域鼠标穿透到底层网页。
- **原因**：此前无论是“小型子 Webview 高频移动”还是“局部节流后继续移动子 Webview”，拖动本质上都依赖高频原生位置变更，手感仍然不跟手且容易闪动。
- **影响**：
  - 拖动阶段回到纯前端 DOM 位移，手感理论上会明显优于原来的子 Webview 移动方案。
  - 悬浮窗按钮之外的顶部区域可继续把 hover / click 透传给底层 AI 网页。
  - 这条交互链路后续应继续沿 `WebviewWindow + ignore cursor events` 方向迭代，不建议回退到子 `Webview` 高频移动方案。

## 2026-05-22 - 为收起态展开悬浮窗补齐 capability 绑定

- **改动**：将 `src-tauri/capabilities/default.json` 的 `windows` 从仅 `main` 扩展为同时覆盖 `overlay:collapsed-control`。
- **原因**：收起态展开控件已经升级为独立 `WebviewWindow`，如果 capability 仍只绑定主窗口，这个悬浮窗内的本地脚本就无法稳定访问 `event`、`store`、`window` 等 API，表现上容易出现“按钮不显示”或交互异常。
- **影响**：
  - 悬浮窗内脚本现在与主窗口一样具备所需的本地 IPC 能力。
  - 此类 capability 变更需要完整重启 Tauri 进程，不能只依赖前端热更新。

## 2026-05-22 - 修正独立展开悬浮窗的坐标系，改为跟随主窗口屏幕位置

- **改动**：`src/stores/workspace.ts` 中的 `getCollapsedControlRect()` 不再把独立 `WebviewWindow` 固定到桌面 `(0, 0)`，而是改为基于主窗口的 `outerPosition / innerPosition / scaleFactor` 计算屏幕坐标；`src/App.vue` 额外在主窗口 `onMoved` 时刷新所有原生视图 bounds。
- **原因**：独立 `WebviewWindow` 的 `x/y` 是相对整个桌面，而不是相对主窗口。此前仍沿用“子 Webview 在主窗口内部”的思维把坐标写成 `(0, 0)`，导致展开按钮实际上出现在桌面左上角而不是应用顶部，所以用户在软件里看不到。
- **影响**：
  - 收起态展开按钮现在会跟随主窗口出现在正确的顶部区域。
  - 主窗口移动、缩放、尺寸变化时，悬浮窗都会一起同步。

## 2026-05-22 - 去掉 overlay-control 脚本里错误的自定位覆盖与早期穿透干扰

- **改动**：移除 `src/overlay-control.ts` 里在恢复时再次调用窗口 `setPosition(0, 0)` 的逻辑，避免把主壳层已计算好的悬浮窗位置重新覆盖成桌面左上角；同时暂时移除脚本内部的 `setIgnoreCursorEvents` 控制与 `showCollapsedControl()` 里的强制切换，先恢复“稳定可见、稳定可点”的基础态。
- **原因**：即便主壳层已经把独立悬浮窗摆到主窗口顶部，脚本自身后续又把窗口重置到 `(0, 0)`，会再次导致用户在应用内看不到按钮；而窗口级鼠标穿透又增加了额外的显示/交互干扰，不利于先把可见性问题收敛。
- **影响**：
  - 展开按钮应优先恢复稳定显示。
  - 后续如要重新加回“按钮之外区域鼠标穿透”，应在可见性完全稳定后单独迭代，不要与定位链路一起改。

## 2026-05-22 - 初始化展开按钮展示逻辑改为依赖本地状态与工作区状态，不再绑死路由

- **改动**：`src/components/AppShell.vue` 中 `canCollapseHeader` 改为直接依据 `workspace.currentPane === "provider"` 与 `activeProviderId` 判断；恢复收起态和自动展示展开按钮的 watch 也改为监听 `workspace.currentPane / activeProviderId / preferences.headerCollapsed`，不再依赖 `route.path === "/workspace"`。
- **原因**：用户明确要求“需要根据本地状态初始化展开按钮的展示”。此前初始化链路把“是否应该显示收起态展开按钮”部分绑死在路由字符串上，启动阶段如果工作区状态已恢复但路由切换时序稍晚，就可能错过初始化展示。
- **影响**：
  - 只要本地已记住 `headerCollapsed = true` 且本次启动恢复到了某个 provider，壳层就会优先按收起态初始化。
  - 这条初始化链路后续应继续基于真实业务状态，而不是基于页面路径做隐式判断。

## 2026-05-22 - 补齐独立展开悬浮窗的 window 级定位与尺寸权限

- **改动**：在 `src-tauri/capabilities/default.json` 中为 `overlay:collapsed-control` 所在 capability 额外补充 `core:window:allow-set-position` 与 `core:window:allow-set-size`。
- **原因**：当前收起按钮已经承载在独立 `WebviewWindow` 中，`workspace.refreshCollapsedControlBounds()` 对它调用的 `setPosition()` / `setSize()` 走的是 `window` 权限，而不是 `webview` 权限。如果这两个权限缺失，哪怕本地缓存已经正确读到 `headerCollapsed = true`，悬浮窗也可能无法被摆到正确位置。
- **影响**：
  - 本地收起状态恢复后，独立悬浮窗可以真正按主窗口顶部位置被显示出来。
  - 这类 capability 变更仍然需要完整重启 Tauri 进程才能生效。

## 2026-05-22 - 独立展开悬浮窗改为“默认鼠标穿透，仅按钮附近接管交互”

- **改动**：`src/overlay-control.ts` 使用窗口级 `setIgnoreCursorEvents` 实现默认穿透；通过定时轮询系统光标位置，只在光标接近按钮矩形附近时临时启用交互，离开后恢复穿透。拖动时继续强制保持可交互。
- **原因**：用户反馈“展开按钮有了，但依然会遮挡网页内容的点击和 hover”。对于全宽透明悬浮窗，如果整窗始终接管鼠标事件，底层网页就一定会被挡住。
- **影响**：
  - 按钮之外的顶部区域应恢复给底层 AI 网页，hover / click 可继续使用。
  - 按钮本身仍可点击和拖动。
  - 这类实现依赖窗口级穿透能力，比 DOM `pointer-events` 更适合独立 `WebviewWindow`。

## 2026-05-21 - 全局禁用右键菜单并覆盖远程子 Webview

- **改动**：在 `src/main.ts` 禁用主壳层右键，在 `src/overlay-control.ts` 禁用收起态悬浮控件右键，并在 `src-tauri/src/lib.rs` 通过 `Builder::on_page_load` 给所有 Webview 注入禁右键脚本。
- **原因**：用户反馈右键菜单仍未禁掉；根因是远程 AI 页面位于独立子 `Webview`，仅在 Vue 壳层监听 `contextmenu` 不会影响这些远程网页。
- **影响**：
  - 主壳层、悬浮展开控件和远程 AI 页面现在都会统一禁用右键菜单。
  - `pnpm typecheck`、`pnpm lint`、`cargo check` 已通过。

## 2026-05-21 - 隐藏快速切换 AI 列表的原生滚动条

- **改动**：为 `src/pages/ModelSelectionPage.vue` 的 provider 列表滚动区增加 `scrollbar-hidden` 类，并在 `src/styles/app.css` 里统一隐藏滚动条样式。
- **原因**：用户要求列表继续可以滚动，但不要显示原生滚动条，避免破坏桌面壳层的视觉观感。
- **影响**：
  - 快速切换 AI 页面仍可滚动访问完整列表。
  - 滚动条在 Windows / WebKit 环境下不再可见，界面更干净。

## 2026-05-21 - 修复快速切换 AI 页面列表不可滚动

- **改动**：将 `src/pages/ModelSelectionPage.vue` 从整页垂直居中布局调整为“顶部说明区 + 下方独立滚动列表区”，为 provider 列表补上 `min-h-0` 和 `overflow-y-auto`。
- **原因**：用户要求快速切换 AI 页面里的 AI 列表可以滚动；原布局在 `AppShell` 的 `overflow-hidden` 下会把长列表后半段裁掉。
- **影响**：
  - provider 数量较多时，快速切换 AI 页面现在可以正常滚动访问完整列表。
  - `pnpm typecheck`、`pnpm lint` 已通过。

## 2026-05-21 - 补齐选择页滚动高度链路

- **改动**：为 `src/components/AppShell.vue` 的 `main` 和 `src/pages/ModelSelectionPage.vue` 的根容器补上 `min-h-0` / `flex-1`，让列表滚动区真正继承到窗口可用高度。
- **原因**：此前即使列表区本身设置了 `overflow-y-auto`，上游父容器高度没有收敛，仍会导致选择页看起来无法滚动。
- **影响**：
  - 快速切换 AI 页面的滚动容器现在能以窗口剩余高度为基准工作。
  - `pnpm typecheck`、`pnpm lint` 已通过。

## 2026-05-21 - 将壳层高度从 min-h-screen 收敛为 h-screen

- **改动**：把 `src/components/AppShell.vue` 的外层壳层从 `min-h-screen` 调整为 `h-screen`，内部主容器同步改成 `h-full min-h-0`，并让 `main` 也显式保持 `flex-col + min-h-0`。
- **原因**：选择页无法滚动的更上游原因是壳层本身会被内容撑长，但全局又禁了外层滚动，导致页面内部滚动链路失效。
- **影响**：
  - 路由页可用高度现在会严格收敛到窗口高度，内部滚动区更容易稳定工作。
  - `pnpm typecheck`、`pnpm lint` 已通过。

## 2026-05-21 - 持久化头部收起状态与悬浮展开 icon 位置

- **改动**：为 `preferences` 新增 `headerCollapsed` 与 `collapsedControlLeft` 两个持久化字段；`AppShell` 在头部收起/展开时写入并在启动或回到工作区时恢复；`overlay-control.ts` 在拖动结束后保存悬浮 icon 水平位置，并在下次打开时恢复。
- **原因**：用户要求头部展开状态和收起 icon 的位移位置都要记忆到本地，重启软件后保持上次状态。
- **影响**：
  - 用户再次打开软件时，工作区头部会恢复为上次的展开或收起状态。
  - 收起态顶部悬浮控件会恢复到上次拖动后的横向位置。
  - `pnpm typecheck`、`pnpm lint` 已通过。

## 2026-05-21 - 版本升级到 0.1.1 并重新产出 Windows NSIS 安装包

- **改动**：将 `package.json`、`src-tauri/tauri.conf.json` 与 `src-tauri/Cargo.toml` 的版本号统一从 `0.1.0` 升到 `0.1.1`，并重新执行 `pnpm tauri build --bundles nsis`。
- **原因**：用户要求打一个新的 Windows 包，并明确要求版本号上升一个版本。
- **影响**：
  - 成功生成新的 Windows 安装包：`src-tauri/target/release/bundle/nsis/AIClientCore_0.1.1_x64-setup.exe`。
  - `pnpm build` 已通过。
  - 当前 Windows 机器上的 Tauri CLI 仅支持 `msi` / `nsis` bundle，无法直接构建 macOS 的 `.app` / `.dmg`，仍需在 Mac 机器上执行对应打包命令。

## 2026-05-21 - 修复快捷键冲突白屏启动与高 DPI 下子 Webview 错位

- **改动**：将全局快捷键初始化改为“冲突不阻塞启动”，新增启动冲突提示并在用户确认后自动跳转到设置页；同时把 `src/stores/workspace.ts` 的子 `Webview` 布局统一改为基于 `scaleFactor()` 换算后的逻辑像素，并补上窗口缩放变化时的 bounds 刷新。
- **原因**：快捷键与系统或其他软件冲突时，原流程会在 `app.mount` 前抛错导致界面只剩背景色；而子 `Webview` 之前混用了物理像素和逻辑像素，在不同分辨率 / 缩放下会出现网页横向偏移、头部只显示一半和收起按钮被裁切。
- **影响**：
  - 启动时即使快捷键冲突，主界面也会正常显示，并引导用户直接去设置页修复。
  - provider 页面与收起态悬浮控件在高 DPI / 多分辨率下会与壳层头部重新对齐。
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 已通过。

## 2026-05-21 - 修复当前机器 Rust toolchain 缺失与 Tauri 脚本用户目录写死问题

- **改动**：在当前 Windows 机器上执行了 `rustup default stable`，安装并设置默认 `stable-x86_64-pc-windows-msvc`；同时将 `scripts/run-tauri.mjs` 中写死的 `C:\\Users\\admin\\.cargo\\bin` 改为基于当前用户 home 目录动态拼接。
- **原因**：当前环境里 `rustup` 没有任何已安装/激活的 toolchain，导致 `cargo metadata` 直接失败；而脚本里写死其他账户的 cargo 路径，会让 PATH 兜底在当前用户下失效。
- **影响**：
  - `cargo metadata` 已恢复正常，`pnpm tauri info` 可成功运行并识别到 `rustc` / `cargo`。
  - 后续在当前用户下执行 `pnpm tauri dev`、`pnpm tauri build` 的环境稳定性更高。

## 2026-05-21 - 清理残留 dev 进程，修复 Tauri 开发端口 1420 冲突

- **改动**：定位并清理了当前仓库残留的 `vite`、`tauri dev` 和相关 `cargo run` 进程，释放固定开发端口 `1420`；随后重新验证 `pnpm tauri dev` 已不再报端口占用或 `cargo metadata` 错误。
- **原因**：仓库 `vite.config.ts` 使用固定端口 `1420` 且 `strictPort = true`，一旦上次启动残留 `vite` 进程，新的 Tauri dev 就会直接失败。
- **影响**：
  - 当前机器上的开发启动链路已恢复。
  - 后续若再次遇到 `Port 1420 is already in use`，优先清理本仓库残留 dev 进程，而不是改端口。

## 2026-05-21 - 让 Tauri beforeDevCommand 自动复用已有 Vite dev server

- **改动**：新增 `scripts/run-vite-dev.mjs`，并将 `src-tauri/tauri.conf.json` 的 `beforeDevCommand` 从直接执行 `pnpm dev` 改为先探测 `1420` 端口；如果已经是当前仓库自己的 Vite dev server，则直接复用，否则再拉起新的 dev server。
- **原因**：当前开发链路固定使用 `1420` 且 `strictPort = true`，同一个仓库重复执行 `pnpm tauri dev` 时，很容易因为已有 Vite 进程占端口而立刻失败。
- **影响**：
  - 二次执行 `pnpm tauri dev` 时会优先复用已存在的前端 dev server，不再反复撞固定端口。
  - 如果 `1420` 被其他非本仓库服务占用，脚本会明确报错而不是静默复用错误目标。

## 2026-05-21 - 修正 beforeDevCommand 脚本路径

- **改动**：将 `src-tauri/tauri.conf.json` 中 `beforeDevCommand` 的脚本路径从 `node ../scripts/run-vite-dev.mjs` 改为 `node scripts/run-vite-dev.mjs`。
- **原因**：Tauri 执行 `beforeDevCommand` 时的当前工作目录是仓库根目录，不是 `src-tauri/`；原路径会多退一层，直接报 `MODULE_NOT_FOUND`。
- **影响**：
  - `beforeDevCommand` 现在可以正常找到并执行 `run-vite-dev`。
  - 本仓库的 Vite dev server 已能再次成功拉起到 `1420`。

## 2026-05-21 - 去掉壳层头部最大宽度限制

- **改动**：移除了 `src/components/AppShell.vue` 外层壳层容器的 `max-w-[1600px]`，改为 `w-full` 撑满窗口宽度。
- **原因**：用户明确要求头部内容不要再限制最大宽度，在全屏或大窗口下应与软件窗口等宽展示。
- **影响**：
  - 头部背景、品牌区和右侧操作区现在会随窗口完整铺满，不再在大屏下出现中间收窄。
  - `pnpm typecheck`、`pnpm lint` 已通过。

## 2026-05-21 - 头部收起改为真全屏子 Webview + 本地悬浮展开控件

- **改动**：移除了此前会残留顶部高度的 DOM 收起图标方案；头部收起时现在把 `shellTopOffset` 动画到 `0`，并新增 `overlay-control.html` / `src/overlay-control.ts` 作为本地悬浮展开控件入口，支持顶部居中显示与仅 X 轴拖动；左上角品牌区也恢复为自然宽度。
- **原因**：用户明确要求“收起后全屏都是子 Webview”，且远程子 `Webview` 会覆盖主壳层 DOM，原方案无法稳定显示展开入口。
- **影响**：
  - 收起后的远程 AI 页面现在会真正贴满整个内容窗口，不再残留顶部占位。
  - 展开入口改为独立本地子 `Webview`，避免给远程 AI 页面开放额外 IPC 权限。
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 与 `pnpm tauri build --bundles nsis` 已全部通过。

## 2026-05-21 - 补齐 macOS 兼容配置并确认 Windows 安装包仍可产出

- **改动**：将 `src-tauri/tauri.conf.json` 补充为 `app.macOSPrivateApi = true`，以支持透明子 `Webview` 在 macOS 上工作；同时修复 `scripts/run-tauri.mjs` 中写死的 Windows `PATH` 分隔符，改为 `node:path` 的 `delimiter`；随后重新完成 `pnpm tauri build --bundles nsis`。
- **原因**：当前收起态悬浮控件依赖透明子 `Webview`，这在 macOS 上需要私有 API；而仓库内的 Tauri 包装脚本若继续写死 `;`，会直接破坏 macOS 打包环境变量。
- **影响**：
  - 代码层面对 macOS 的结构性兼容性已补齐，但 `.app` / `.dmg` 仍需在 Mac 机器上实际打包。
  - Windows 安装包仍可正常生成，产物路径保持不变。

## 2026-05-21 - 增加中英双语 UI 与双语 README

- **改动**：新增 `src/lib/i18n.ts`，把设置页、模型选择页、工作区空态、头部导航、渠道弹框、provider 描述和快捷键提示统一改为 `zh-CN / en-US` 双语；语言选择项加入设置页并持久化到 `preferences.language`；同时将 `README.md` 改写为中英双语版本。
- **原因**：用户要求软件和文档同时支持中文与英文，并且软件内可以直接切换语言。
- **影响**：
  - UI 文案现在会随语言设置实时切换，且重启后保持上次选择。
  - 内置 provider 的名称与描述也会随语言变化。
  - `pnpm typecheck`、`pnpm lint`、`pnpm build` 已全部通过。

## 2026-05-21 - 完成 Windows NSIS 安装包打包闭环

- **改动**：确认并复用本机已安装的 NSIS，完成 `pnpm tauri build --bundles nsis` release 打包，成功生成 `AIClientCore_0.1.0_x64-setup.exe`。
- **原因**：此前桌面主体已编译通过，但安装包产出受外部工具链影响，需要把交付链路补齐到可安装状态。
- **影响**：
  - 项目同时具备可执行文件和 Windows 安装包两种交付物。
  - 当前主流、轻量的 Windows 分发路径已可用。

## 2026-05-21 - 修复新终端下 `pnpm tauri` 找不到 cargo 的问题

- **改动**：新增 `scripts/run-tauri.mjs`，并把 `package.json` 中的 `tauri` 脚本改为通过该包装脚本启动，从而自动补齐 Windows 下的 `cargo` 与 `NSIS` 常见安装路径。
- **原因**：用户在新终端执行 `pnpm tauri dev` 时，Tauri CLI 因 PATH 缺少 `cargo.exe` 无法运行 `cargo metadata`。
- **影响**：
  - 后续 `pnpm tauri dev`、`pnpm tauri build` 对终端 PATH 的依赖显著降低。
  - 优先入口已经固定为仓库脚本，不要再假设外部 PATH 完全正确。

## 2026-05-21 - 支持自定义 AI 渠道与 favicon 头像

- **改动**：新增自定义 AI 渠道弹框，可录入名称和链接并持久化到 `customProviders`；筛选项新增“自定义”；provider 头像统一改为网页 favicon，获取失败则留空。
- **原因**：用户需要把更多第三方 AI 渠道纳入统一入口，并移除原先的颜色字母头像方案。
- **影响**：
  - 选择页现在基于“国产 / 国际 / 自定义”三种阵营重排。
  - 自定义渠道与内置渠道共用同一套 provider 目录与子 `Webview` 打开逻辑。

## 2026-05-21 - 完成首版 AI 聚合客户端主干实现

- **改动**：完成 `Tauri v2 + Vue3 + TypeScript` 首版业务实现，包含模型选择页、国产派 / 国际派排序、上次选择记忆、设置页、全局快捷键、主题切换、主窗口子 `Webview` 承载与状态保留。
- **原因**：这是当前任务的核心交付目标，需要让应用从脚手架状态进入可运行的产品主干状态。
- **影响**：
  - 前端校验与 Rust release 编译均已打通。
  - 已具备继续打磨交互、主题和具体 AI 渠道体验的基础。

## 2026-05-21 - 初始化 Tauri 脚手架并恢复仓库规范文件

- **改动**：安装 Windows 下的 Tauri 必要构建环境，初始化 `Tauri v2 + Vue3 + TypeScript` 脚手架，并恢复被脚手架覆盖的 `AGENTS.md`、`.agents/skills/` 与 `docs/ai-memory/`。
- **原因**：需要正式进入业务开发，同时规避 `create-tauri-app --force` 覆盖仓库协作规范文件的问题。
- **影响**：
  - 本地已经具备 Rust、WebView2、Build Tools、NSIS 的桌面开发环境。
  - 工程进入“主窗口壳层 + 子 Webview”业务实现阶段。
