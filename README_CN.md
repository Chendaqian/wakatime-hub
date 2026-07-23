<p align="center">
  <h3 align="center">WakaTime Hub</h3>
  <p align="center">📊 自动同步 WakaTime 数据到 Gist，并提供图表可视化看板</p>
</p>

---

[English](README.md)

## 项目组成

| 模块 | 说明 |
|------|------|
| `sync/` | GitHub Action：每日定时将 WakaTime 摘要同步到 Gist，支持按年分 Gist |
| `dashboard/` | React 单页应用（Vite + ECharts）：从 Gist 读取数据，渲染 7 种图表 |

在线演示：`https://chendaqian.github.io/wakatime-hub/dashboard`

## 项目架构

```
wakatime-hub/
├── sync/                  # 同步模块（Node.js Action）
│   ├── index.js           # 主脚本
│   ├── action.yml         # Action 定义
│   └── dist/              # ncc 构建产物
├── dashboard/             # 看板模块（React 19 + Vite）
│   ├── src/
│   │   ├── components/    # 图表、看板、配置页、控件、日期选择器、概览卡片
│   │   ├── hooks/         # GistDataContext、useGistData
│   │   ├── services/      # GistService、DataAggregator、AIMetricsTransformer、format
│   │   ├── types/         # TypeScript 类型定义
│   │   └── styles/        # CSS Modules
│   ├── vite.config.ts     # base: /wakatime-hub/dashboard/，端口 3900
│   └── package.json
├── .github/workflows/
│   ├── schedule.yml       # sync 定时：UTC 13:00（北京时间 21:00）每日
│   └── deploy-pages.yml   # dashboard 自动构建部署到 GitHub Pages
├── README.md
├── README_CN.md
└── CLAUDE.md
```

## 快速开始

### 1. 同步模块 — 自动备份 WakaTime 到 Gist

**准备工作：**

1. 创建一个公开 GitHub Gist（https://gist.github.com/）
2. 创建一个带 `gist` 权限的 GitHub Token（https://github.com/settings/tokens/new）
3. 注册 WakaTime 并复制 API Key（https://wakatime.com/settings/account）

**配置步骤：**

1. Fork 本仓库
2. 进入 **Settings → Secrets and variables → Actions → Secrets**
3. 添加以下 **Secrets**：

| Secret | 必填 | 说明 |
|--------|------|------|
| `GH_TOKEN` | ✅ | 带 `gist` 权限的 GitHub Token |
| `WAKATIME_API_KEY` | ✅ | WakaTime API Key |
| `GIST_IDS` | ✅ | Gist ID，多个用 `;` 分隔，第一个为写入目标 |
| `GIST_ID_YYYY` | 否 | 按年份的 Gist（如 `GIST_ID_2026`），优先于 `GIST_IDS` |
| `SCU_KEY` | 否 | Server酱 SendKey，用于微信推送（https://sct.ftqq.com/） |

> **Gist ID 优先级**：`GIST_ID_2026`（当年）→ `GIST_IDS` 第一个 → `GIST_ID`（旧版兼容）

4. 手动触发一次 **"Update gist with WakaTime summary"** workflow。

**为什么要按年分 Gist？** Gist 文件数超过 **300 个**会被截断。一年约 365 天，单个 Gist 不够。用 `GIST_ID_2026`、`GIST_ID_2027` 把每年数据存到不同 Gist 即可避免截断。

### 2. 看板模块 — 数据可视化

**前置条件：**

- 同步模块已运行（Gist 里有 `summaries_*.json` 文件）
- Gist 是**公开**的（或配置页输入 Token）

**部署步骤：**

1. 进入 **Settings → Secrets and variables → Actions → Secrets**
2. 添加 Secret（也支持 Variables，建议用 Secret 避免暴露）：

| 名称 | 值 | 类型 |
|------|-----|------|
| `GIST_IDS` | `你的gist-id;另一个gist-id` | **Secrets** 或 **Variables** |

3. 进入 **Settings → Pages**：
   - Source：`Deploy from a branch`
   - Branch：`gh-pages`，`/ (root)` → **Save**

4. Push 到 `master` → GitHub Action 自动构建部署。或手动运行 **"Deploy Dashboard to GitHub Pages"**。

5. 访问 `https://<你的用户名>.github.io/wakatime-hub/dashboard`

> **注意**：修改 `GIST_IDS` 后需要**重新运行部署 workflow**才会生效，因为 Gist ID 是在构建时注入到 JS 文件中的。

**包含图表：**
堆叠柱状图 · 折线趋势图 · 环形占比图 · 日历热力图 · AI vs 人工代码对比 · Token 趋势 · Agent 成本分析

**本地运行：**
```bash
cd dashboard
npm install

# Windows（PowerShell）：
$env:VITE_GIST_IDS="你的gist-id"
npm run dev

# macOS / Linux：
VITE_GIST_IDS="你的gist-id" npm run dev

# → http://localhost:3900/wakatime-hub/dashboard/
```

**配置页使用：** 首次访问会显示配置页，输入框已预填构建时注入的默认 Gist ID。你也可以手动添加更多 ID，支持逗号、分号或换行分隔多个 Gist。

## 环境变量速查

### sync/ — GitHub Secrets

| 名称 | 必填 | 说明 |
|------|------|------|
| `GH_TOKEN` | ✅ | GitHub Token，需要 `gist` 权限 |
| `WAKATIME_API_KEY` | ✅ | WakaTime API Key |
| `GIST_IDS` | ✅ | Gist ID 列表，`;` 分隔，第一个为写入目标 |
| `GIST_ID_YYYY` | 否 | 按年份的 Gist ID，优先级高于 `GIST_IDS` |
| `SCU_KEY` | 否 | Server酱 SendKey，用于微信推送 |

### dashboard/ — GitHub Secrets 或 Variables

| 名称 | 必填 | 说明 |
|------|------|------|
| `GIST_IDS` | ✅ | 默认 Gist ID（构建时注入 JS），用户可在配置页覆盖 |

## 注意事项

- Gist 文件超过 **300 个**会被截断，长期使用建议按年拆分（`GIST_ID_YYYY`）
- 看板的 `GIST_IDS` 在构建时固化到 JS 中，修改后需重新部署
- 看板在浏览器端直接调用 GitHub Gist API，公开 Gist 无需 Token，未认证速率限制 60 次/小时

[Gist 截断说明](https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#truncation)

## License

MIT
