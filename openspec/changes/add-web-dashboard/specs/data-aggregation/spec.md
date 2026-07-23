## ADDED Requirements

### Requirement: Data Source is GitHub Gist API
系统 SHALL 始终通过 GitHub Gist API（`https://api.github.com/gists/{gistId}`）实时拉取数据。本地 `data/` 目录仅作开发阶段的数据结构参考，不得作为生产数据源。

#### Scenario: Production data access
- **WHEN** 看板页面在浏览器中加载
- **THEN** 系统从 Gist API 实时获取数据，不读取任何本地文件

### Requirement: Fetch Gist File List
系统 SHALL 通过 GitHub Gist API 获取指定 Gist 的全部文件列表，并筛选出文件名匹配 `summaries_YYYY-MM-DD.json` 模式的 JSON 文件。

#### Scenario: Gist contains summary files
- **WHEN** 调用 `GET https://api.github.com/gists/{gistId}`
- **THEN** 系统解析响应中的 `files` 字段，过滤出 `content_type === 'application/json'` 且文件名匹配正则 `summaries_\d{4}-\d{2}-\d{2}\.json` 的文件
- **THEN** 返回按日期排序的文件列表（最新在前）

#### Scenario: Gist has no summary files
- **WHEN** Gist 中不包含任何匹配的 `summaries_*.json` 文件
- **THEN** 系统返回空数组，前端显示"暂无数据"提示

#### Scenario: API rate limit exceeded
- **WHEN** GitHub API 返回 403 状态码且 `X-RateLimit-Remaining` 为 0
- **THEN** 系统抛出速率限制错误，附带 `reset` 时间戳供前端展示剩余等待时间

### Requirement: Fetch and Parse Single Summary
系统 SHALL 获取并解析单日的 WakaTime 摘要数据（`summaries_YYYY-MM-DD.json`），将其转换为统一的数据结构。

#### Scenario: Fetch valid summary file
- **WHEN** 系统从 `raw_url` 拉取单个 summary JSON
- **THEN** 系统解析 JSON，提取第一个数组元素作为当日数据
- **THEN** 返回包含 `date`（从文件名或 `range.date` 提取）、`grand_total`、`projects`、`languages`、`editors`、`categories`、`operating_systems`、`machines`、`dependencies` 等完整维度的数据对象

#### Scenario: Summary file is malformed JSON
- **WHEN** 拉取的 summary 文件不是合法的 JSON
- **THEN** 系统记录该文件错误日志，跳过该文件，继续处理其余文件

### Requirement: Aggregate by Date Range
系统 SHALL 根据用户指定的日期范围（起止日期）筛选并聚合数据。

#### Scenario: Filter by last 7 days
- **WHEN** 日期范围设为最近 7 天（today - 6 days 到 today）
- **THEN** 系统仅返回这 7 天内对应日期的 summary 数据，按日期升序排列

#### Scenario: Filter by custom date range
- **WHEN** 用户指定起始日期 `2026-07-01` 和结束日期 `2026-07-15`
- **THEN** 系统仅返回这 15 天内对应日期的 summary 数据

### Requirement: Transform for Stacked Column Chart
系统 SHALL 将原始摘要数据转换为堆叠柱状图可用的格式（`date`, `category`, `value` 三维）。

#### Scenario: Transform by project dimension
- **WHEN** 维度设为 `projects`
- **THEN** 系统返回数组，每项包含 `{ date: "2026-07-21", category: "Beisen.UserFramework", value: 9770.7 }`
- **THEN** category 值取 Top 10 项目（按总时长降序），其余归并为"其他"

#### Scenario: Transform by language dimension
- **WHEN** 维度设为 `languages`
- **THEN** 系统返回数组，每项包含 `{ date: "2026-07-21", category: "C#", value: 4912.8 }`

### Requirement: Transform for Trend Line Chart
系统 SHALL 将原始摘要数据转换为折线趋势图的 `{ date, value }` 格式。

#### Scenario: Total coding time trend
- **WHEN** 需要折线图数据
- **THEN** 系统返回数组，每项包含 `{ date: "2026-07-21", value: 34526.9 }`（每日 `grand_total.total_seconds`）

### Requirement: Transform for Pie Chart
系统 SHALL 将选定日期范围内的总时长按维度聚合为饼图/环形图格式。

#### Scenario: Aggregate language distribution
- **WHEN** 维度设为 `languages`，日期范围包含多天
- **THEN** 系统将所有日期的同语言时长加总，返回 `[{ name: "C#", value: 12000 }, ...]` 按 value 降序排列

### Requirement: Extract AI Metrics
系统 SHALL 从每日摘要的 `grand_total` 中提取 AI 编程指标，转换为 AI 面板各图表所需格式。

#### Scenario: AI vs human code additions
- **WHEN** 需要 AI 代码对比数据
- **THEN** 系统提取每日的 `ai_additions`、`ai_deletions`、`human_additions`、`human_deletions` 字段
- **THEN** 返回 `[{ date, ai_additions, human_additions, ai_deletions, human_deletions }, ...]`

#### Scenario: AI token consumption series
- **WHEN** 需要 Token 消耗趋势数据
- **THEN** 系统提取每日的 `ai_input_tokens`、`ai_output_tokens` 字段
- **THEN** 返回 `[{ date, input_tokens, output_tokens }, ...]`

#### Scenario: AI agent cost breakdown
- **WHEN** 需要 Agent 成本数据
- **THEN** 系统提取每日的 `ai_agent_breakdown` 数组，展开为 `[{ date, agent: "Claude-Code", cost: 0.47 }, ...]`
- **THEN** 若某日无 `ai_agent_breakdown` 数据，该日 agent 成本记为 0

### Requirement: Cache Mechanism
系统 SHALL 将已拉取的 Gist 数据缓存到 `sessionStorage`，避免重复请求同一 Gist。

#### Scenario: Cache hit
- **WHEN** 用户切换日期范围但 Gist ID 未变
- **THEN** 系统从 `sessionStorage` 读取已缓存的原始数据，仅对新增日期（超出缓存范围的）发起 API 请求

#### Scenario: Gist ID changed
- **WHEN** 用户修改 Gist ID
- **THEN** 系统清除 `sessionStorage` 中旧缓存，重新拉取新 Gist 的全部数据
