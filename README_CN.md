<p align="center">
  <h3 align="center">WakaTime Hub</h3>
  <p align="center">📊 自动同步 WakaTime 数据到 Gist，并提供现代化看板可视化</p>
</p>

---

[English](README.md)

## 项目组成

| 模块 | 说明 |
|------|------|
| `sync/` | GitHub Action：每日定时将 WakaTime 摘要同步到 Gist |
| `dashboard/` | React 单页应用：从 Gist 读取数据并渲染可视化图表 |

## 快速开始

### 1. 同步模块 — 自动备份 WakaTime 到 Gist

**准备工作：**

1. 创建一个公开的 GitHub Gist（https://gist.github.com/）
2. 创建一个带 `gist` 权限的 GitHub Token（https://github.com/settings/tokens/new）
3. 注册 WakaTime 并复制 API Key（https://wakatime.com/settings/account）

**配置步骤：**

1. Fork 本仓库
2. 进入仓库 **Settings → Secrets and variables → Actions**
3. 添加以下 **Secrets**：

| Secret | 说明 |
|--------|------|
| `GH_TOKEN` | 带 `gist` 权限的 GitHub Token |
| `WAKATIME_API_KEY` | WakaTime API Key |
| `GIST_IDS` | Gist ID，多个用 `;` 分隔。第一个作为写入目标。支持按年拆分：`GIST_ID_2026`、`GIST_ID_2027`... |
| `SCU_KEY` | （可选）Server酱 SendKey，用于推送到微信 |

4. 手动触发一次 workflow（Fork 的仓库默认不会自动运行）

> **多 Gist 按年存储：** 在 Secrets 中配置 `GIST_ID_2026`，sync 脚本会根据当前年份自动选择对应 Gist。没配按年的话回退到 `GIST_IDS` 的第一个。

**微信日报推送：**

用 [Server酱](https://sct.ftqq.com/) 推送每日编码报告到微信。在 Secrets 中设置 `SCU_KEY`。

<p align="center">
  <img width="400" src="./screenshot/daily-report.jpg">
</p>

### 2. 看板模块 — 数据可视化

**在线演示：** `https://chendaqian.github.io/wakatime-hub/dashboard`

自行部署：

1. 进入仓库 **Settings → Secrets and variables → Actions → Variables**
2. 添加 repository variable：

| Variable | Value |
|----------|-------|
| `GIST_IDS` | 你的 Gist ID，多个用 `;` 或 `,` 分隔 |

3. Push 到 `master` — GitHub Action 自动构建并部署到 GitHub Pages
4. 在 **Settings → Pages** 启用 Pages：source 选 `gh-pages` 分支，`/ (root)`
5. 访问 `https://<username>.github.io/wakatime-hub/dashboard`

**包含图表：** 堆叠柱状图 · 折线趋势图 · 环形占比图 · 日历热力图 · AI vs 人工代码对比 · Token 趋势 · Agent 成本分析

**本地运行：**
```bash
cd dashboard
npm install
npm run dev        # http://localhost:3900/wakatime-hub/dashboard/
```

## 注意事项

Gist 文件列表超过 **300 个**会被截断。长期使用建议按年拆分（配置 `GIST_ID_YYYY`）。

[Gist 截断说明](https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#truncation)

## License

MIT
