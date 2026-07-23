## Context

wakatime-sync 是一个 GitHub Action 项目，定时将 WakaTime 编码数据同步到 GitHub Gist。Gist 中以 `summaries_YYYY-MM-DD.json` 格式存储每日摘要。wakatime-dashboard 是一个独立的 React 16 项目，提供基础的 Gist 数据可视化，已多年未更新，图表类型少（仅堆叠柱状图），且无法展示 WakaTime 新增的 AI 编程指标。

本次变更将仓库重组为双模块结构：`sync/`（定时同步代码）和 `dashboard/`（Web 看板），看板数据来源为 GitHub Gist API 实时读取，不依赖本地 `data/` 目录。

## Goals / Non-Goals

**Goals:**
- 从 GitHub Gist API 读取 `summaries_*.json` 数据并可视化
- 提供堆叠柱状图、折线趋势图、饼图、热力图等多种图表
- 展示 AI 编程指标：AI vs 人工代码对比、Token 消耗趋势、Agent 成本分析
- 支持日期范围筛选和多数据维度切换
- 通过 GitHub Pages 部署，无需服务器

**Non-Goals:**
- 不需要用户登录认证系统（Gist 数据是公开或通过 Token 访问的）
- 不需要后端服务（纯静态前端，直接调 Gist API）
- 不修改现有 `sync/index.js` 的同步业务逻辑，仅移动文件位置
- 不依赖本地 `data/` 目录（该目录仅作开发参考，看板始终从 Gist API 实时拉取）
- 不实现实时数据推送

## Decisions

### 1. 构建工具：Vite

选 Vite 而非 Webpack（wakatime-dashboard 使用的）：
- **为什么 Vite**: 开发服务器秒级启动，HMR 即时生效，构建速度远超 Webpack 4；原生支持 TypeScript 和 JSX；配置文件更简洁
- **备选方案**: Next.js — 功能过重，纯静态站点不需要 SSR；Create React App — 已不推荐，构建慢

### 2. 图表库：ECharts（Apache ECharts）

选 ECharts 而非 BizCharts（wakatime-dashboard 使用的）或 AntV/G2：
- **为什么 ECharts**: 图表类型最丰富（柱状图、折线图、饼图、热力图、雷达图等），中文本地化好，社区庞大，canvas 渲染性能好，对大数据量友好；AI 成本分析用堆叠面积图，热力图展示每日活动分布很方便
- **备选方案**: AntV/G2 — 语法灵活但学习曲线陡；Recharts — React 组件化好但图表类型少于 ECharts

### 3. 状态管理：React Context + useReducer

- **为什么**: 应用状态简单（Gist ID、日期范围、图表类型切换），不需要 Redux 或 Zustand 等额外依赖
- 通过 `localStorage` 持久化用户配置（Gist ID、偏好设置）

### 4. CSS 方案：CSS Modules

- **为什么**: Vite 原生支持，无额外依赖，样式隔离好，适合中等规模项目
- **备选方案**: Tailwind CSS — 需要额外配置和学习成本；styled-components — 运行时开销

### 5. 数据获取策略

- 前端直接调用 GitHub Gist API（`https://api.github.com/gists/{gistId}`）
- 无需 Gist Token（公开 Gist 可直接访问），可选支持 Token 提高速率限制
- 数据聚合全在前端完成（数据量不大，单日约 50KB，一年约 18MB 在客户端处理足够）

### 6. 部署：GitHub Pages（项目级 Pages）

- 仓库重命名为 `wakatime-hub`
- 看板部署到 GitHub Pages，访问地址：`https://chendaqian.github.io/wakatime-hub/dashboard`
- Vite `base` 设为 `/wakatime-hub/dashboard/`（适配项目级 GitHub Pages 子路径）
- 新增 GitHub Actions workflow：构建 dashboard → 部署到 `gh-pages` 分支的 `/dashboard/` 路径
- 无需自定义域名，使用 GitHub 默认的 `chendaqian.github.io` 域名
- 与用户已有的博客（根路径 `chendaqian.github.io`）互不影响

## Risks / Trade-offs

- **[Risk] Gist API 速率限制**: 未认证请求 60次/小时 → 添加可选 Token 输入，缓存已加载数据到 `sessionStorage`
- **[Risk] 数据量增长**: 每日新增一个文件，年累计 365+ 个 → API 分批拉取 + 前端分页加载，默认显示近 30 天
- **[Risk] ECharts 包体积大约 1MB gzip后 ~330KB** → 按需引入图表组件（`echarts/core` + 需要的 chart/renderer），不用完整包
- **[Risk] WakaTime 数据结构变化**: 旧数据可能缺少 AI 字段 → 前端做字段存在性检查，缺失时显示 "无数据" 而非报错

## Open Questions

- 是否需要支持多个 Gist ID 对比展示？（当前设计为单 Gist ID）
- 是否需要导出图表为图片功能？
