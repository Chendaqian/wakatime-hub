<p align="center">
  <h3 align="center">WakaTime Hub</h3>
  <p align="center">📊 Sync WakaTime data to Gist & visualize with charts</p>
</p>

<p align="center">
  <a href="https://github.com/Chendaqian/wakatime-hub/actions/workflows/schedule.yml"><img alt="Sync Status" src="https://img.shields.io/github/actions/workflow/status/Chendaqian/wakatime-hub/schedule.yml?label=sync&style=flat-square" /></a>
  <a href="https://github.com/Chendaqian/wakatime-hub/actions/workflows/deploy-pages.yml"><img alt="Deploy Status" src="https://img.shields.io/github/actions/workflow/status/Chendaqian/wakatime-hub/deploy-pages.yml?label=deploy&style=flat-square" /></a>
  <a href="https://github.com/Chendaqian/wakatime-hub/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/Chendaqian/wakatime-hub?include_prereleases&style=flat-square" /></a>
  <a href="https://github.com/Chendaqian/wakatime-hub/blob/master/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
  <a href="https://github.com/Chendaqian/wakatime-hub/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/Chendaqian/wakatime-hub?style=flat-square" /></a>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Platform" src="https://img.shields.io/badge/Platform-GitHub%20Pages-222222?style=flat-square&logo=githubpages&logoColor=white" />
</p>

---

[中文版](README_CN.md)

## What's inside

| Module | Description |
|--------|-------------|
| `sync/` | GitHub Action: daily sync WakaTime summary to Gist, supports yearly Gist split |
| `dashboard/` | React SPA (Vite + ECharts): read Gist data and render 7 chart types |

Live demo: `https://chendaqian.github.io/wakatime-hub/dashboard`

## Architecture

```
wakatime-hub/
├── sync/                  # Sync module (Node.js Action)
│   ├── index.js           # Main script
│   ├── action.yml         # Action definition
│   └── dist/              # ncc build output
├── dashboard/             # Dashboard module (React 19 + Vite)
│   ├── src/
│   │   ├── components/    # ChartComponents, Dashboard, ConfigPage, Controls, DatePicker, OverviewCards
│   │   ├── hooks/         # GistDataContext, useGistData
│   │   ├── services/      # GistService, DataAggregator, AIMetricsTransformer, format
│   │   ├── types/         # TypeScript type definitions
│   │   └── styles/        # CSS Modules
│   ├── vite.config.ts     # base: /wakatime-hub/dashboard/, port 3900
│   └── package.json
├── .github/workflows/
│   ├── schedule.yml       # Sync cron: UTC 13:00 (Beijing 21:00) daily
│   └── deploy-pages.yml   # Dashboard auto-build & deploy to GitHub Pages
├── README.md
├── README_CN.md
└── CLAUDE.md
```

## Quick Start

### 1. Sync Module — Auto backup WakaTime to Gist

**Prerequisites:**

1. Create a public GitHub Gist (https://gist.github.com/)
2. Create a GitHub token with the `gist` scope (https://github.com/settings/tokens/new)
3. Register WakaTime and copy your API Key (https://wakatime.com/settings/account)

**Setup:**

1. Fork this repo
2. Go to **Settings → Secrets and variables → Actions → Secrets**
3. Add the following **Secrets**:

| Secret | Required | Description |
|--------|----------|-------------|
| `GH_TOKEN` | ✅ | GitHub token with `gist` scope |
| `WAKATIME_API_KEY` | ✅ | Your WakaTime API Key |
| `GIST_IDS` | ✅ | Gist ID(s), separated by `;`. First one is the write target. |
| `GIST_ID_YYYY` | No | Year-specific Gist (e.g., `GIST_ID_2026`). Takes priority over `GIST_IDS`. |
| `SCU_KEY` | No | ServerChan key for WeChat push (https://sct.ftqq.com/) |

> **Gist ID priority**: `GIST_ID_2026` (current year) → `GIST_IDS` first ID → `GIST_ID` (legacy)

4. Run the **"Update gist with WakaTime summary"** workflow manually once.

**Why split by year?** Gist truncates at **300 files**. With ~365 days per year, single Gist will exceed the limit. Use `GIST_ID_2026`, `GIST_ID_2027` etc. to route each year's data to a different Gist.

### 2. Dashboard Module — Visualize your data

**Prerequisites:**

- Sync module already running (Gist has `summaries_*.json` files)
- Gist is **public** (or supply a GitHub Token on the config page)

**Deploy:**

1. Go to **Settings → Secrets and variables → Actions → Secrets**
2. Add Secret (or Variable) — the workflow reads both:

| Name | Value | Type |
|------|-------|------|
| `GIST_IDS` | `your-gist-id;another-gist-id` | **Secrets** or **Variables** |

3. Go to **Settings → Pages**:
   - Source: `Deploy from a branch`
   - Branch: `gh-pages`, `/ (root)` → **Save**

4. Push to `master` → GitHub Action auto-deploys. Or manually run **"Deploy Dashboard to GitHub Pages"**.

5. Visit `https://<username>.github.io/wakatime-hub/dashboard`

> **Important**: Changing `GIST_IDS` requires re-running the deploy workflow. The value is injected at build time into the JS bundle.

**Charts included:**
Stacked column · Trend line · Donut pie · Calendar heatmap · AI vs Human code · Token trends · Agent cost analysis

**Local dev:**
```bash
cd dashboard
npm install

# On Windows (PowerShell):
$env:VITE_GIST_IDS="your-gist-id"
npm run dev

# On macOS / Linux:
VITE_GIST_IDS="your-gist-id" npm run dev

# → http://localhost:3900/wakatime-hub/dashboard/
```

## Environment Variables Reference

### sync/ — GitHub Secrets

| Name | Required | Description |
|------|----------|-------------|
| `GH_TOKEN` | ✅ | GitHub token with `gist` scope |
| `WAKATIME_API_KEY` | ✅ | WakaTime API Key |
| `GIST_IDS` | ✅ | Gist IDs, `;` separated. First = write target |
| `GIST_ID_YYYY` | No | Year-specific Gist. Priority over `GIST_IDS` |
| `SCU_KEY` | No | ServerChan key for WeChat push |

### dashboard/ — GitHub Secrets or Variables

| Name | Required | Description |
|------|----------|-------------|
| `GIST_IDS` | ✅ | Default Gist IDs (built into JS). Users can override on config page |

## Warning

- Gist files list truncates at **300 files**. Split by year (`GIST_ID_YYYY`) for long-running data.
- `GIST_IDS` for the dashboard is embedded at build time. Re-deploy after changes.
- The dashboard reads Gist data client-side via the public GitHub API. Without a Token, unauthenticated rate limit is 60 req/h.

[Gist Truncation](https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#truncation)

## License

MIT

## Star History

<a href="https://www.star-history.com/?repos=Chendaqian%2Fwakatime-hub&type=date&legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Chendaqian%2Fwakatime-hub&type=date&theme=dark&legend=top-left" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Chendaqian%2Fwakatime-hub&type=date&legend=top-left" />
    <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Chendaqian%2Fwakatime-hub&type=date&legend=top-left" />
  </picture>
</a>
