# 按月 Gist 存储方案

## 背景

当前每天一个 `summaries_YYYY-MM-DD.json` 文件，单 Gist 超过 200 个文件后，GitHub API 随机将部分文件 content 设为 null（即使认证），导致 Dashboard 数据残缺。

**解法**：每月一个 JSON 数组文件，一个 Gist 只有 1 个文件，永不截断。

---

## 存储格式

- 每年 12 个 Gist，每月一个
- 每个 Gist 只有一个文件：`summaries_YYYY-MM.json`
- 内容为当月所有天的数据数组

```json
// Gist: 描述 "wakatime 2026-07"
// 文件: summaries_2026-07.json
[
  {
    "date": "2026-07-01",
    "grand_total": { "total_seconds": 3600, ... },
    "projects": [ ... ],
    "languages": [ ... ],
    "editors": [ ... ]
  },
  { "date": "2026-07-02", ... }
]
```

---

## Gist 清单

- 年份范围：2019 ~ 2026
- 总计：8 年 × 12 个月 = **96 个 Gist**
- 描述格式：`wakatime YYYY-MM`（如 `wakatime 2026-07`）
- **旧 Gist 不动**，新 Gist 独立创建

---

## 配置格式

### GIST_ID（sync 写入）

```json
{
  "2019-01": "xxx",
  "2019-02": "xxx",
  ...
  "2026-12": "xxx"
}
```

### VITE_GIST_IDS（dashboard 读取）

同上，或复用同一个 secret。

---

## 改动范围

### 1. 创建 120 个按月 Gist + 迁移数据

| 步骤 | 说明 |
|------|------|
| 1a | 创建 120 个空 Gist，描述 "wakatime YYYY-MM" |
| 1b | 从旧 Gist 读对应月份的天文件 |
| 1c | 拼成数组，写入 `summaries_YYYY-MM.json` |
| 1d | 输出新 GIST_ID 配置 JSON |

### 2. sync/index.js

| 改动 | 说明 |
|------|------|
| `getGistIdForDate(date)` | 改为按 `YYYY-MM` 查配置 |
| `updateGist(date, content)` | 改为：GET 拉取当月 JSON → 追加/覆盖当天数据（按 date 去重）→ PATCH 写回 |
| 去重策略 | 读已有 JSON 数组，用 Map 按 date 去重，排序后写回 |

### 3. dashboard/src/services/GistService.ts

| 改动 | 说明 |
|------|------|
| ~~`fetchGistFiles()`~~ | **废弃**，不再需要拉文件列表 |
| 新增 `fetchMonthData(monthKey, gistId, token)` | 直接 GET `summaries_YYYY-MM.json` 的 raw_url，返回 `DailySummary[]` |

### 4. dashboard/src/hooks/useGistData.ts

| 改动 | 说明 |
|------|------|
| `yearGistMap` 结构 | 从 `{"2026": ["h1","h2"]}` 改为 `{"2026-01": "xxx", ...}` |
| `loadYear(year)` | 筛选该年 12 个 monthKey → 逐个 `fetchMonthData` → 合并 |

### 5. dashboard/src/components/Controls.tsx

| 改动 | 说明 |
|------|------|
| 年份快捷选择 | 从 `yearGistMap` 的 key 中提取去重年份（`2026-07` → `2026`） |
| 无其他变化 | 预设按钮、维度切换保持不变 |

### 6. GitHub Secrets

- `GIST_ID`：更新为新的 `YYYY-MM` → Gist ID 映射
- `GIST_IDS`（dashboard 用）：同上

---

## 对比

| 维度 | 当前（天文件 H1/H2） | 按月 JSON |
|------|---------------------|-----------|
| Gist 数/年 | 2 | 12 |
| 文件数/Gist | ~200 → content 随机 null | 1 → 永不截断 |
| 单文件大小 | 25KB | ~750KB |
| 写操作 | 创建新文件 | 读 → 追加去重 → 写回 |
| Dashboard 请求/年 | 2（列表）+ N×raw_url | 12（逐个 raw_url） |
| 限频风险 | ❌ 未认证 60/h 不够 | ✅ 认证 5000/h 绰绰有余 |
| 旧数据 | 保留 | 保留不动 |

---

## 风险

- 单文件约 750KB（30天×25KB），远小于 Gist 文件限制
- 写操作需要读→改→写，但 sync 每天只跑一次，无并发冲突
- 迁移时旧 Gist 不动，Dashboard 可先读新 Gist，缺失月份再回退旧 Gist
