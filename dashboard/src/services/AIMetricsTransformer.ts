import type {
  DailySummary,
  AICodeComparisonItem,
  AITokenTrendItem,
  AIAgentCostItem,
} from '@/types';

/**
 * 提取 AI vs 人工代码对比数据
 */
export function extractAICodeComparison(summaries: DailySummary[]): AICodeComparisonItem[] {
  return summaries.map((s) => ({
    date: s.date,
    ai_additions: s.grand_total.ai_additions || 0,
    human_additions: s.grand_total.human_additions || 0,
    ai_deletions: s.grand_total.ai_deletions || 0,
    human_deletions: s.grand_total.human_deletions || 0,
  }));
}

/**
 * 提取 AI Token 消耗趋势数据
 */
export function extractAITokenTrend(summaries: DailySummary[]): AITokenTrendItem[] {
  return summaries.map((s) => ({
    date: s.date,
    input_tokens: s.grand_total.ai_input_tokens || 0,
    output_tokens: s.grand_total.ai_output_tokens || 0,
  }));
}

/**
 * 提取 AI Agent 成本数据（堆叠面积图格式）
 */
export function extractAIAgentCost(summaries: DailySummary[]): AIAgentCostItem[] {
  const result: AIAgentCostItem[] = [];

  for (const s of summaries) {
    const breakdown = s.grand_total.ai_agent_breakdown || [];
    if (breakdown.length > 0) {
      for (const agent of breakdown) {
        result.push({
          date: s.date,
          agent: agent.name,
          cost: agent.cost,
        });
      }
    }
  }

  return result;
}

/**
 * 检查数据是否包含 AI 指标
 */
export function hasAIMetrics(summaries: DailySummary[]): boolean {
  if (summaries.length === 0) return false;
  return summaries.some(
    (s) =>
      s.grand_total.ai_additions > 0 ||
      s.grand_total.ai_input_tokens > 0 ||
      s.grand_total.ai_agent_breakdown?.length > 0
  );
}
