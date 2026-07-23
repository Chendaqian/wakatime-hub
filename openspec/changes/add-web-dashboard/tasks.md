## 0. 目录重组

- [x] 0.1 创建 `sync/` 目录，将现有同步代码移入
- [x] 0.2 更新 `.github/workflows/schedule.yml`
- [x] 0.3 更新 `sync/package.json` name 字段
- [x] 0.4 根目录保留关键文件，`data/` 保留作开发参考

## 1. 项目初始化

- [x] 1.1 Vite 创建 React + TypeScript 项目
- [x] 1.2 安装核心依赖：echarts、echarts-for-react、dayjs、axios
- [x] 1.3 安装开发依赖
- [x] 1.4 配置 Vite：base `/wakatime-hub/dashboard/`，端口 3900
- [x] 1.5 配置 TypeScript
- [x] 1.6 创建目录结构

## 2. 数据层

- [x] 2.1 定义 TypeScript 类型
- [x] 2.2 实现 `GistService`
- [x] 2.3 实现 `DataAggregator`
- [x] 2.4 实现 `AIMetricsTransformer`
- [x] 2.5 实现 `useGistData` Hook

## 3. 配置页

- [x] 3.1 实现 `ConfigPage` 组件
- [x] 3.2 localStorage 持久化
- [x] 3.3 首次访问检测

## 4. 概览卡片

- [x] 4.1 实现 `OverviewCards` 组件
- [x] 4.2 数字格式化工具函数

## 5. 核心图表

- [x] 5.1 StackedColumnChart
- [x] 5.2 TrendLineChart
- [x] 5.3 PieChart
- [x] 5.4 ActivityHeatmap
- [x] 5.5 DateRangePicker + Controls
- [x] 5.6 DimensionSwitcher

## 6. AI 指标面板

- [x] 6.1 AICodeComparison
- [x] 6.2 AITokenTrend
- [x] 6.3 AIAgentCost

## 7. 主看板与布局

- [x] 7.1 Dashboard 主组件
- [x] 7.2 响应式布局
- [x] 7.3 骨架屏加载态
- [x] 7.4 错误状态处理

## 8. 多 Gist ID 支持

- [x] 8.1 sync/index.js：按年份自动路由 Gist ID（`GIST_ID_2026` 等）
- [x] 8.2 ConfigPage：支持输入多个 Gist ID 逗号分隔
- [x] 8.3 useGistData：支持多 Gist 并发拉取合并
- [x] 8.4 Dashboard 顶部显示活跃 Gist 列表

## 9. 部署

- [x] 9.1 Vite base 配置
- [x] 9.2 deploy-pages.yml
- [x] 9.3 workflow 构建步骤
- [x] 9.4 仓库 Settings 启用 GitHub Pages（需手动操作）
- [x] 9.5 仓库重命名为 `wakatime-hub`（需手动操作）
- [x] 9.6 本地预览可正常运行

## 10. 文档

- [x] 10.1 更新 README.md（英文）
- [x] 10.2 新增 README_CN.md（中文），互相链接
- [x] 10.3 更新 CLAUDE.md（双模块架构、环境变量、目录结构）
- [x] 10.4 更新 schedule.yml：传递 GIST_IDS（兼容旧 GIST_ID）
- [x] 10.5 更新 deploy-pages.yml：注入 VITE_GITHUB_TOKEN
- [x] 10.7 修复 echarts-for-react 按需引入 → 全量引入（ESM/CJS 兼容）
- [x] 10.8 修复多实例状态不同步：useGistData → GistDataContext
- [x] 10.9 日期中文化：X 轴、tooltip、分隔符、日期范围标签
