# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**wakatime-hub** 是一个 WakaTime 数据中台，包含两个模块：
- `sync/`：GitHub Action，每日定时将 WakaTime 编码活动数据同步到 GitHub Gist，支持按年份多 Gist 存储，也支持 Server酱 推送日报到微信
- `dashboard/`：React + TypeScript + Vite 前端，从 GitHub Gist API 实时拉取数据，使用 ECharts 可视化展示编码统计和 AI 编程指标

部署地址：`https://chendaqian.github.io/wakatime-hub/dashboard`

## sync/ 技术栈

- 运行时：Node.js 20（GitHub Action）
- 核心依赖：wakatime-client、@octokit/rest、axios、dayjs
- 构建工具：@vercel/ncc（打包为单文件 `dist/index.js`）

## dashboard/ 技术栈

- 框架：React 19 + TypeScript
- 构建工具：Vite
- 图表库：ECharts（按需引入）
- 样式：CSS Modules
- 部署：GitHub Pages（项目级子路径 `/wakatime-hub/dashboard/`）

## 常用命令

```bash
# sync 模块
cd sync
npm install
npm run build       # ncc 打包到 dist/index.js

# dashboard 模块
cd dashboard
npm install
npm run dev         # 开发服务器 http://localhost:3900/wakatime-hub/dashboard/
npm run build       # 生产构建，输出到 dist/
```

本地开发时设置 Gist ID 环境变量：

```powershell
# PowerShell
$env:VITE_GIST_IDS = '{"2026":"your-gist-id"}'
npm run dev
```

## 项目架构

### sync/ 核心流程（index.js）

1. 解析 `GIST_IDS` JSON 配置（格式 `{"2026":"gist_id",...}`），根据日期年份查找对应 Gist ID
2. 以北京时间当天日期通过 WakaTime API 获取编码摘要
3. 将数据写入对应年份的 Gist，文件名格式 `summaries_YYYY-MM.json`（按月存储，每年 12 个文件）
4. 可选通过 Server酱 推送微信日报

### dashboard/ 核心流程

1. 配置页输入 Gist 配置（JSON 格式 `{"2026":"gist_id",...}`），空值使用 `VITE_GIST_IDS` 默认值；私有 Gist 需填写 GitHub Token
2. `useGistData` Hook：按年加载多 Gist 数据（每年一个 Gist，含 12 个月 JSON 文件）→ 按日期去重合并 → 分批拉取原始 summary
3. `DataAggregator`：按日期范围筛选，按维度（项目/语言/编辑器/类别/系统）聚合
4. `AIMetricsTransformer`：AI vs 人工代码、Token 消耗、Agent 成本
5. 图表组件：StackedColumnChart / TrendLineChart / PieChart / ActivityHeatmap / AICodeComparison / AITokenTrend / AIAgentCost

### 目录结构

```
wakatime-hub/
├── sync/                       # 定时同步模块
│   ├── index.js
│   ├── action.yml
│   ├── package.json
│   └── dist/                   # ncc 构建产物
├── dashboard/                  # Web 看板模块
│   ├── src/
│   │   ├── components/         # 图表 + 配置 + 概览
│   │   ├── hooks/              # useGistData Hook
│   │   ├── services/           # GistService, DataAggregator, AIMetricsTransformer, format
│   │   ├── types/              # TypeScript 类型
│   │   └── styles/             # CSS Modules
│   ├── vite.config.ts          # base: /wakatime-hub/dashboard/
│   └── package.json
├── data/                       # 开发参考数据
├── .github/workflows/
│   ├── schedule.yml            # sync 定时：UTC 13:00 (北京 21:00)
│   └── deploy-pages.yml        # dashboard 部署到 GitHub Pages
├── README.md
├── README_CN.md
└── CLAUDE.md
```

## 环境变量

### sync/ — GitHub Secrets

| Secret | 说明 |
|--------|------|
| `GH_TOKEN` | GitHub Token（需要 gist scope） |
| `WAKATIME_API_KEY` | WakaTime API Key |
| `GIST_IDS` | JSON 格式：`{"2026":"gist_id",...}`，年份 → Gist ID 映射 |
| `SCU_KEY` | Server酱 SendKey（可选） |

### dashboard/ — GitHub Actions Variables

| Variable | 说明 |
|----------|------|
| `GIST_IDS` | 同上 JSON 格式，构建时注入，用户可在页面内覆盖 |

## 注意事项

- sync: 构建后 `dist/index.js` 需一并提交
- sync: Gist 文件名格式为 `summaries_YYYY-MM.json`（按月），每年 12 个文件，单个 Gist 可存约 25 年
- sync: 所有 WakaTime Gist 均为**私有**，dashboard 需要 GitHub Token 访问
- dashboard: `VITE_GIST_IDS` 构建时固化，更新后需重新构建部署
- dashboard: 多 Gist 数据按日期去重，同一天以最先出现的为准
