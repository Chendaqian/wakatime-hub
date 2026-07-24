import { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { OverviewCards } from './OverviewCards';
import {
  StackedColumnChart,
  TrendLineChart,
  PieChart,
  ActivityHeatmap,
  AICodeComparison,
  AITokenTrend,
  AIAgentCost,
} from './ChartComponents';
import { Controls } from './Controls';
import { useGistData } from '@/hooks/GistDataContext';
import {
  filterByDateRange,
  transformToStackedChart,
  transformToTrend,
  transformToPie,
  getAggregatedSummary,
} from '@/services/DataAggregator';
import {
  extractAICodeComparison,
  extractAITokenTrend,
  extractAIAgentCost,
} from '@/services/AIMetricsTransformer';
import { secondsToBadgeLabel, secondsToReadable } from '@/services/format';
import type { DimensionType } from '@/types';
import styles from './Dashboard.module.css';

/**
 * 生成 shields.io Code Time 徽标 URL（按当周累计）
 */
function getCodeTimeBadgeUrl(totalSeconds: number): string {
  const label = secondsToBadgeLabel(totalSeconds);
  return `https://img.shields.io/badge/Code%20Time-${encodeURIComponent(label)}-blue?style=flat`;
}

export function Dashboard() {
  const { summaries, status, error, gistIds, loadData, resetConfig } = useGistData();

  const today = dayjs().format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    end: today,
  });
  const [dimension, setDimension] = useState<DimensionType>('projects');

  // 按日期范围筛选
  const filteredSummaries = useMemo(
    () => filterByDateRange(summaries, dateRange.start, dateRange.end),
    [summaries, dateRange]
  );

  // 各图表数据
  const stackedData = useMemo(
    () => transformToStackedChart(filteredSummaries, dimension),
    [filteredSummaries, dimension]
  );

  const trendData = useMemo(
    () => transformToTrend(filteredSummaries),
    [filteredSummaries]
  );

  const pieData = useMemo(
    () => transformToPie(filteredSummaries, dimension),
    [filteredSummaries, dimension]
  );

  const heatmapData = useMemo(
    () =>
      filteredSummaries.map((s) => ({
        date: s.date,
        total_seconds: s.grand_total.total_seconds,
      })),
    [filteredSummaries]
  );

  // AI 指标数据
  const aiCodeData = useMemo(
    () => extractAICodeComparison(filteredSummaries),
    [filteredSummaries]
  );

  const aiTokenData = useMemo(
    () => extractAITokenTrend(filteredSummaries),
    [filteredSummaries]
  );

  const aiAgentCostData = useMemo(
    () => extractAIAgentCost(filteredSummaries),
    [filteredSummaries]
  );

  const overviewStats = useMemo(
    () => getAggregatedSummary(filteredSummaries),
    [filteredSummaries]
  );

  // 全部历史总时长（用于 Code Time 徽标）
  const totalCodeTime = useMemo(
    () => summaries.reduce((sum, s) => sum + s.grand_total.total_seconds, 0),
    [summaries]
  );

  // 当周总时长（用于顶部徽标）
  const startOfWeek = dayjs().startOf('week').format('YYYY-MM-DD');
  const endOfWeek = dayjs().endOf('week').format('YYYY-MM-DD');
  const weekSummaries = useMemo(
    () => filterByDateRange(summaries, startOfWeek, endOfWeek),
    [summaries, startOfWeek, endOfWeek]
  );
  const weekSeconds = useMemo(
    () => weekSummaries.reduce((sum, s) => sum + s.grand_total.total_seconds, 0),
    [weekSummaries]
  );
  const weekLabel = useMemo(() => secondsToReadable(weekSeconds), [weekSeconds]);

  const isLoading = status === 'loading';

  const handleReset = useCallback(() => {
    resetConfig();
  }, [resetConfig]);

  // 错误状态
  if (status === 'error') {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.errorBox}>
          <h2>⚠️ 数据加载失败</h2>
          <p>{error || '未知错误'}</p>
          <button className={styles.retryBtn} onClick={loadData}>
            重试
          </button>
          <button className={styles.configLinkBtn} onClick={handleReset}>
            修改 Gist ID
          </button>
        </div>
      </div>
    );
  }

  const dimensionLabel =
    dimension === 'projects'
      ? '项目'
      : dimension === 'languages'
        ? '语言'
        : dimension === 'editors'
          ? '编辑器'
          : dimension === 'categories'
            ? '类别'
            : '系统';

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>WakaTime Hub</h1>
          <div className={styles.badges}>
            {totalCodeTime > 0 && (
              <img
                className={styles.codeTimeBadge}
                src={getCodeTimeBadgeUrl(totalCodeTime)}
                alt="Code Time"
                loading="lazy"
              />
            )}
            <span className={styles.gistBadge} data-count={gistIds.length}>
              {gistIds.length} 个数据源
            </span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.weekStat}>
            <span className={styles.weekLabel}>本周</span>
            <span className={styles.weekValue}>{weekLabel}</span>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <OverviewCards
          totalSeconds={overviewStats.totalSeconds}
          projectCount={overviewStats.projectCount}
          languageCount={overviewStats.languageCount}
          editorCount={overviewStats.editorCount}
        />

        <Controls
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          dimension={dimension}
          onDimensionChange={setDimension}
          onReset={handleReset}
        />

        <div className={styles.chartGrid}>
          <StackedColumnChart
            data={stackedData}
            title={`每日编码分布 - ${dimensionLabel}`}
            loading={isLoading}
          />
          <TrendLineChart
            data={trendData}
            title="总编码时长趋势"
            loading={isLoading}
          />
          <PieChart
            data={pieData}
            title={`${dimensionLabel} 占比分布`}
            loading={isLoading}
          />
          <ActivityHeatmap
            summaries={heatmapData}
            title="每日活动热力图"
            loading={isLoading}
          />
        </div>

        <div className={styles.aiSection}>
          <div className={styles.aiSectionTitle}>🤖 AI 编程指标</div>
          <div className={styles.aiGrid}>
            <AICodeComparison
              data={aiCodeData}
              title="AI vs 人工 代码新增行数对比"
              loading={isLoading}
            />
            <AITokenTrend
              data={aiTokenData}
              title="AI Token 消耗趋势（输入/输出）"
              loading={isLoading}
            />
            <div className={styles.chartFull}>
              <AIAgentCost
                data={aiAgentCostData}
                title="AI Agent 成本分析（美元）"
                loading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  // 骨架屏 + 响应式已在 ChartComponents ChartCard 和 Dashboard.module.css 中实现
  // 错误状态已在上方 status === 'error' 分支中处理
