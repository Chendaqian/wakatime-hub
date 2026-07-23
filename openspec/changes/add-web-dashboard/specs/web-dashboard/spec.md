## ADDED Requirements

### Requirement: Gist ID Configuration
系统 SHALL 允许用户配置 GitHub Gist ID 作为数据源。系统 SHALL 在页面首次加载时检查 localStorage 中是否已存储 Gist ID，若不存在则显示配置页面要求用户输入。

#### Scenario: First visit without Gist ID
- **WHEN** 用户首次访问看板页面且 localStorage 中无 Gist ID
- **THEN** 系统显示配置页面，包含 Gist ID 输入框和可选的 GitHub Token 输入框
- **THEN** 用户输入 Gist ID 并点击"确认"后，系统将其保存到 localStorage 并进入主看板

#### Scenario: Return visit with saved Gist ID
- **WHEN** 用户再次访问看板页面且 localStorage 中已有 Gist ID
- **THEN** 系统直接加载主看板页面，使用已保存的 Gist ID 从 GitHub API 拉取数据

### Requirement: Dashboard Overview
系统 SHALL 在主页顶部展示当日编码总览卡片，包括总编码时长、项目数、语言数、编辑器数。

#### Scenario: Data loaded successfully
- **WHEN** 数据成功从 Gist API 加载
- **THEN** 看板顶部显示 4 个概览卡片：今日总时长（如"9h 35m"）、项目数、语言数、编辑器数

#### Scenario: Data loading failed
- **WHEN** Gist API 请求失败（网络错误、Gist ID 不存在、配额超限）
- **THEN** 系统显示错误提示信息，并提供"重试"按钮和"修改 Gist ID"链接

### Requirement: Summarize Coding Data Daily
系统 SHALL 按日汇总编码时长，并通过堆叠柱状图按用户选择的维度（项目/语言/编辑器）展示每日分布。

#### Scenario: View daily coding time by project
- **WHEN** 用户选择日期范围为近 7 天，维度选择"项目"
- **THEN** 系统展示堆叠柱状图，X 轴为日期，Y 轴为编码时长，每个项目以不同颜色的堆叠块展示
- **THEN** 图例显示项目名称（最多显示 Top 10，其余归为"其他"）

#### Scenario: Switch dimension to languages
- **WHEN** 用户在维度切换器中选择"语言"
- **THEN** 堆叠柱状图切换为按语言维度展示，每个语言以不同颜色显示

#### Scenario: Hover on chart bar
- **WHEN** 用户鼠标悬停在柱状图的某个区块上
- **THEN** 系统显示 Tooltip，包含该维度的名称和具体时长

### Requirement: Coding Time Trend
系统 SHALL 通过折线图展示总编码时长的日趋势变化。

#### Scenario: View 30-day trend
- **WHEN** 用户选择日期范围为近 30 天
- **THEN** 系统展示折线图，X 轴为日期，Y 轴为每日总编码时长

### Requirement: Pie Chart Distribution
系统 SHALL 通过环形图（饼图变体）展示选定日期范围内各维度的总时长占比分布。

#### Scenario: View language distribution
- **WHEN** 用户选择日期范围且维度为"语言"
- **THEN** 系统展示环形图，按语言编码时长占比从大到小排列

### Requirement: Heatmap of Daily Activity
系统 SHALL 通过日历热力图展示选定月份每日的编码活动热度。

#### Scenario: View monthly activity heatmap
- **WHEN** 用户切换到热力图视图
- **THEN** 系统展示类似 GitHub 贡献图的日历热力图，颜色深浅表示当日编码时长多少

### Requirement: AI Metrics Panel
系统 SHALL 在独立的 AI 指标面板中展示 AI 编程相关数据，包括 AI 代码 vs 人工代码对比、Token 消耗趋势、Agent 成本分析。

#### Scenario: AI vs human code additions comparison
- **WHEN** 用户查看 AI 指标面板
- **THEN** 系统展示对比柱状图，每日两组柱子分别表示 AI 生成行数和人工编写行数

#### Scenario: AI token consumption trend
- **WHEN** 用户查看 AI 指标面板
- **THEN** 系统展示折线图，显示每日 AI 输入 Token 和输出 Token 的数量变化趋势

#### Scenario: AI agent cost analysis
- **WHEN** 用户数据中包含 `ai_agent_costs` 字段
- **THEN** 系统展示按 Agent 分组的成本堆叠面积图，X 轴为日期，Y 轴为美元成本

#### Scenario: Old data without AI fields
- **WHEN** 较早日期的数据不包含 AI 相关字段（`ai_additions`、`ai_input_tokens` 等）
- **THEN** 系统在这些日期显示"无 AI 数据"占位符，不中断图表渲染

### Requirement: Date Range Filter
系统 SHALL 提供日期范围选择器，支持预设范围（7天、14天、30天）和自定义起止日期。

#### Scenario: Select preset range
- **WHEN** 用户点击"最近 7 天"
- **THEN** 所有图表更新为展示最近 7 天的数据

#### Scenario: Custom date range
- **WHEN** 用户选择自定义起止日期
- **THEN** 所有图表更新为展示所选日期范围内的数据

### Requirement: Loading State
系统 SHALL 在数据加载过程中展示骨架屏或加载动画，避免空白页面给用户造成困惑。

#### Scenario: Data fetching in progress
- **WHEN** 系统正在从 Gist API 拉取数据
- **THEN** 每个图表区域显示骨架屏占位符，不展示空白区域

### Requirement: Responsive Layout
系统 SHALL 适配桌面端（>= 1024px）、平板端（768-1024px）和移动端（< 768px）三种屏幕尺寸。

#### Scenario: Desktop layout
- **WHEN** 视口宽度 >= 1024px
- **THEN** 概览卡片横向排列 4 个，图表区双列布局

#### Scenario: Mobile layout
- **WHEN** 视口宽度 < 768px
- **THEN** 概览卡片堆叠为单列，图表区单列布局，图表高度自适应缩小
