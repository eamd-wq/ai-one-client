---
name: vue-component-development
description: Vue3 组件开发规范。Use when 开发或重构 Vue 组件，需遵循组件分层、命名、script 顺序、props 与样式规则、通用组件约定及自动导入/自动注册约束。
---
# 组件开发规范

## 概述
1. 使用 Vue 3 + Nuxt 3。
2. 遵循自动导入和自动注册。

## 组件分类
1. Layers 通用组件：`layers/base/components/`。
2. 应用级组件：`apps/[app]/components/`。
3. 页面级组件：`apps/[app]/pages/[page]/components/`（可配置前缀）。

## 命名规范
1. 文件名使用 PascalCase（例：`ProTable.vue`）。
2. 组件名遵循目录结构语义（例：`LayoutVertical`）。

## MUST: Script 顺序
1. 类型定义。
2. Props / Emits。
3. 响应式数据。
4. 计算属性。
5. 方法（优先 `function`）。
6. 监听器。
7. 生命周期。
8. `defineExpose`。

## Props 规范
1. 使用 TypeScript 类型。
2. 对象/数组默认值必须使用函数返回。

## 样式规范
1. 使用 UnoCSS。
2. 渐变色使用行内样式。
3. 必要时使用 `scoped`。

## 通用组件认知
1. `ProTable`：高级表格。
2. `SearchForm`：搜索表单。
3. `ButtonPopConfirm`：确认按钮。

## 最佳实践
1. 遵循单一职责原则。
2. 做好组件与逻辑拆分。
3. 自动导入 API 不手动 `import`。
4. 自动注册组件不手动注册。
5. 保持 TypeScript 类型完整。

## 输出前检查清单
1. 组件是否放在正确层级目录。
2. Script 顺序是否严格符合约定。
3. 是否避免了多余 import/注册代码。
