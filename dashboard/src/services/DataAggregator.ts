import type {
  DailySummary,
  StackedChartItem,
  TrendItem,
  PieItem,
  DimensionType,
  DimensionItem,
} from '@/types';

/**
 * 按日期范围筛选 summary 数据
 */
export function filterByDateRange(
  summaries: DailySummary[],
  startDate: string,
  endDate: string
): DailySummary[] {
  return summaries.filter((s) => s.date >= startDate && s.date <= endDate);
}

/**
 * 从 DailySummary 中提取指定维度的数据
 */
function getDimensionItems(
  summary: DailySummary,
  dimension: DimensionType
): DimensionItem[] {
  switch (dimension) {
    case 'projects':
    case 'languages':
    case 'editors':
    case 'categories':
    case 'operating_systems':
      return (summary as unknown as Record<string, DimensionItem[]>)[dimension] || [];
    default:
      return [];
  }
}

/**
 * 将摘要数据转换为堆叠柱状图格式
 * 维度 Top 10，其余归并为"其他"
 */
export function transformToStackedChart(
  summaries: DailySummary[],
  dimension: DimensionType
): StackedChartItem[] {
  // 先统计所有维度的总时长，用于计算 Top 10
  const categoryTotals: Record<string, number> = {};
  for (const summary of summaries) {
    const items = getDimensionItems(summary, dimension);
    for (const item of items) {
      categoryTotals[item.name] = (categoryTotals[item.name] || 0) + item.total_seconds;
    }
  }

  // 取 Top 10
  const top10 = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name);

  const top10Set = new Set(top10);

  // 构建堆叠数据
  const result: StackedChartItem[] = [];
  for (const summary of summaries) {
    const items = getDimensionItems(summary, dimension);
    let otherSeconds = 0;

    for (const item of items) {
      if (top10Set.has(item.name)) {
        result.push({
          date: summary.date,
          category: item.name,
          value: item.total_seconds,
        });
      } else {
        otherSeconds += item.total_seconds;
      }
    }

    if (otherSeconds > 0) {
      result.push({
        date: summary.date,
        category: '其他',
        value: otherSeconds,
      });
    }
  }

  return result;
}

/**
 * 将摘要数据转换为折线趋势图格式
 */
export function transformToTrend(
  summaries: DailySummary[]
): TrendItem[] {
  return summaries.map((s) => ({
    date: s.date,
    value: s.grand_total.total_seconds,
  }));
}

/**
 * 将摘要数据转换为饼图格式（聚合日期范围内所有数据）
 */
export function transformToPie(
  summaries: DailySummary[],
  dimension: DimensionType
): PieItem[] {
  const categoryTotals: Record<string, number> = {};

  for (const summary of summaries) {
    const items = getDimensionItems(summary, dimension);
    for (const item of items) {
      categoryTotals[item.name] =
        (categoryTotals[item.name] || 0) + item.total_seconds;
    }
  }

  return Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * 生成日期范围内的每一天（用于热力图等）
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * 获取指定日期范围的最新一天数据（用于概览卡片）
 */
export function getLatestSummary(
  summaries: DailySummary[]
): DailySummary | undefined {
  if (summaries.length === 0) return undefined;
  return summaries[summaries.length - 1];
}
