<p align="center">
  <h3 align="center">WakaTime Hub</h3>
  <p align="center">📊 Sync WakaTime data to Gist & visualize with a modern dashboard</p>
</p>

---

[中文版](README_CN.md)

## What's inside

| Module | Description |
|--------|-------------|
| `sync/` | GitHub Action: daily sync WakaTime summary to Gist |
| `dashboard/` | React SPA: dashboard that reads Gist data and renders charts |

## Quick Start

### 1. Sync Module — Auto backup WakaTime to Gist

**Prep work:**

1. Create a new public GitHub Gist (https://gist.github.com/)
2. Create a GitHub token with the `gist` scope (https://github.com/settings/tokens/new)
3. Sign up for WakaTime and copy your API Key (https://wakatime.com/settings/account)

**Setup:**

1. Fork this repo
2. Go to repo **Settings → Secrets and variables → Actions**
3. Add these **Secrets**:

| Secret | Description |
|--------|-------------|
| `GH_TOKEN` | GitHub token with `gist` scope |
| `WAKATIME_API_KEY` | Your WakaTime API Key |
| `GIST_IDS` | Gist ID(s), separated by `;`. Uses first one as write target. Support yearly split: `GIST_ID_2026`, `GIST_ID_2027`... |
| `SCU_KEY` | (Optional) ServerChan key for WeChat push |

4. Run workflow manually (forked repos won't auto-run)

> **Multi-Gist (by year):** Set `GIST_ID_2026` in Secrets for 2026 data. The sync script auto-picks the current year's Gist. Falls back to first ID in `GIST_IDS`.

**WeChat Daily Report:**

Use [ServerChan](https://sct.ftqq.com/) to push daily reports to WeChat. Set `SCU_KEY` Secret.

<p align="center">
  <img width="400" src="./screenshot/daily-report.jpg">
</p>

### 2. Dashboard Module — Visualize your data

**Live demo:** `https://chendaqian.github.io/wakatime-hub/dashboard`

Deploy your own:

1. Go to repo **Settings → Secrets and variables → Actions → Variables**
2. Add repository variable:

| Variable | Value |
|----------|-------|
| `GIST_IDS` | Your Gist ID(s), separated by `;` or `,` |

3. Push to `master` — GitHub Action auto-deploys to GitHub Pages
4. Enable Pages at **Settings → Pages**: source = `gh-pages` branch, `/ (root)`
5. Visit `https://<username>.github.io/wakatime-hub/dashboard`

**Charts included:** Stacked column · Trend line · Donut pie · Calendar heatmap · AI vs Human code · Token trends · Agent cost analysis

**Local dev:**
```bash
cd dashboard
npm install
npm run dev        # http://localhost:3900/wakatime-hub/dashboard/
```

## Warning

Gist files list truncates at **300 files**. For long-running data, split by year (use `GIST_ID_YYYY`).

[Gist Truncation](https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#truncation)

## License

MIT
