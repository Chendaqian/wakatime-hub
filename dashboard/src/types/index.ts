// WakaTime Summary - 顶层数据结构
export interface WakaTimeSummary {
  grand_total: GrandTotal
  range: DateRange
  projects: Project[]
  languages: Language[]
  dependencies: Dependency[]
  machines: Machine[]
  editors: Editor[]
  operating_systems: OperatingSystem[]
  categories: Category[]
}

// 时间总计
export interface GrandTotal {
  hours: number
  minutes: number
  total_seconds: number
  digital: string
  decimal: string
  text: string
  ai_additions: number
  ai_deletions: number
  human_additions: number
  human_deletions: number
  ai_agent_line_changes: Record<string, number>
  ai_input_tokens: number
  ai_output_tokens: number
  ai_prompt_length_sum: number
  ai_prompt_events_total: number
  ai_sessions: number
  ai_agent_costs: Record<string, number>
  ai_agent_breakdown: AIAgentBreakdown[]
  ai_agent_total_cost: number
  ai_prompt_length_avg: number
  ai_prompt_events_avg_per_session: number
  ai_prompt_events_median_per_session: number
  ai_prompt_length_avg_per_session: number
  ai_prompt_length_median_per_session: number
}

// AI Agent 分解
export interface AIAgentBreakdown {
  name: string
  lines: number
  cost: number
}

// 日期范围
export interface DateRange {
  start: string
  end: string
  date: string
  text: string
  timezone: string
}

// 基础维度接口（包含共同字段）
export interface DimensionItem {
  name: string
  total_seconds: number
  digital: string
  decimal: string
  text: string
  hours: number
  minutes: number
  seconds: number
  percent: number
}

// 项目维度
export interface Project extends DimensionItem {
  color: string | null
  ai_additions: number
  ai_deletions: number
  human_additions: number
  human_deletions: number
  ai_agent_line_changes: Record<string, number>
  ai_input_tokens: number
  ai_output_tokens: number
  ai_prompt_length_sum: number
  ai_prompt_events_total: number
  ai_agent_costs: Record<string, number>
  ai_agent_breakdown: AIAgentBreakdown[]
  ai_agent_total_cost: number
  ai_prompt_length_avg: number
  ai_prompt_length_avg_per_session: number
  ai_prompt_length_median_per_session: number
  ai_prompt_events_avg_per_session: number
  ai_prompt_events_median_per_session: number
  ai_sessions: number
}

// 语言维度
export interface Language extends DimensionItem {}

// 依赖维度
export interface Dependency extends DimensionItem {}

// 机器维度
export interface Machine extends DimensionItem {
  machine_name_id: string
}

// 编辑器维度
export interface Editor extends DimensionItem {
  ai_additions: number
  ai_deletions: number
  human_additions: number
  human_deletions: number
  ai_agent_line_changes: Record<string, number>
  ai_input_tokens: number
  ai_output_tokens: number
  ai_prompt_length_sum: number
  ai_prompt_events_total: number
  ai_agent_costs: Record<string, number>
  ai_agent_breakdown: AIAgentBreakdown[]
  ai_agent_total_cost: number
  ai_prompt_length_avg: number
  ai_prompt_length_avg_per_session: number
  ai_prompt_length_median_per_session: number
  ai_prompt_events_avg_per_session: number
  ai_prompt_events_median_per_session: number
  ai_sessions: number
}

// 操作系统维度
export interface OperatingSystem extends DimensionItem {}

// 活动类别维度
export interface Category extends DimensionItem {}

// Gist API 相关类型
export interface GistFile {
  filename: string
  type: string
  language: string
  raw_url: string
  size: number
  content?: string
}

export interface GistResponse {
  files: Record<string, GistFile>
  description: string
  updated_at: string
}

// 聚合后的每日数据
export interface DailySummary extends WakaTimeSummary {
  date: string
}

// 堆叠柱状图数据
export interface StackedChartItem {
  date: string
  category: string
  value: number
}

// 趋势图数据
export interface TrendItem {
  date: string
  value: number
}

// 饼图数据
export interface PieItem {
  name: string
  value: number
}

// AI 代码对比数据
export interface AICodeComparisonItem {
  date: string
  ai_additions: number
  human_additions: number
  ai_deletions: number
  human_deletions: number
}

// AI Token 趋势数据
export interface AITokenTrendItem {
  date: string
  input_tokens: number
  output_tokens: number
}

// AI Agent 成本数据
export interface AIAgentCostItem {
  date: string
  agent: string
  cost: number
}

// 维度类型
export type DimensionType = 'projects' | 'languages' | 'editors' | 'categories' | 'operating_systems'

// 应用状态
export type AppStatus = 'loading' | 'ready' | 'error' | 'config'

// 多 Gist 配置
export interface GistConfig {
  id: string
  label: string // 如 "2026"、"2025"
}
