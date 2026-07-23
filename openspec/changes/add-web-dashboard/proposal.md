## Why

项目仓库 `wakatime-hub`（原名 wakatime-sync）已能定时将 WakaTime 数据同步到 GitHub Gist，但缺少数据可视化能力。现有的 wakatime-dashboard 项目技术栈老旧（React 16 + Webpack 4），仅支持堆叠柱状图和折线图两种图表，无法充分利用 WakaTime 数据中丰富的 AI 编程指标（AI token、AI 成本、AI agent 分布等）。需要一个功能更强、更现代、能直接集成到本仓库中的 Web 看板，部署在 `https://chendaqian.github.io/wakatime-hub/dashboard`。

## What Changes

- **目录重组**：将现有同步代码（`index.js`、`package.json`、`dist/`、`.github/` 等）移至 `sync/` 二级目录，仓库根目录下形成 `sync/` 和 `dashboard/` 同级结构
- **GitHub Actions 调整**：更新 `schedule.yml` 中的 working directory 指向 `sync/`
- 在仓库中新增 `dashboard/` Web 前端应用，从 GitHub Gist API 实时读取每日 WakaTime 摘要数据并可视化展示（不依赖本地 `data/` 目录，`data/` 仅作开发参考）
- 支持通过页面输入 Gist ID 配置数据源（公开 Gist 无需 Token，可选填 Token 提高速率限制）
- 提供丰富的图表类型：堆叠柱状图（项目/语言时间分布）、折线图（趋势）、饼图/环形图（占比）、热力图（每日活动分布）
- 展示 AI 编程相关指标：AI vs 人工代码行数对比、AI Token 消耗趋势、AI Agent 成本分析
- 支持日期范围筛选和多维度切换（项目/语言/编辑器/类别/操作系统）
- 响应式布局，适配桌面端和移动端

## Capabilities

### New Capabilities

- `web-dashboard`: 基于 React 的 WakaTime 数据看板，从 GitHub Gist 读取 `summaries_*.json` 文件，提供多种图表类型和 AI 指标展示
- `data-aggregation`: 数据聚合层，负责从 Gist API 拉取原始摘要数据，按日期范围、维度进行聚合转换，供前端图表消费

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

- 仓库重命名：`wakatime-sync` → `wakatime-hub`
- 新增依赖：React 18+、Vite（构建工具）、ECharts（图表库）、TypeScript
- 新增目录：`sync/`（原同步代码移入）、`dashboard/`（前端应用源码）
- 不影响现有 `index.js` 的 GitHub Action 定时同步功能
- 新增 GitHub Actions workflow：自动构建并部署到 GitHub Pages
