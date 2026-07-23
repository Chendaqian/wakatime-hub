import { useMemo } from 'react';
import EChartsReact from 'echarts-for-react';
import * as echarts from 'echarts';
import { secondsToReadable, formatLargeNumber, formatDateCN } from '@/services/format';
import type {
  StackedChartItem,
  TrendItem,
  PieItem,
  AICodeComparisonItem,
  AITokenTrendItem,
  AIAgentCostItem,
} from '@/types';
import chartStyles from '@/styles/Charts.module.css';

// ====== 通用包装组件 ======

function ChartCard({
  title,
  loading,
  hasData,
  children,
}: {
  title: string;
  loading?: boolean;
  hasData: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={chartStyles.chartCard}>
      <div className={chartStyles.title}>{title}</div>
      {loading ? (
        <div className={chartStyles.skeleton} />
      ) : hasData ? (
        children
      ) : (
        <div className={chartStyles.emptyText}>暂无数据</div>
      )}
    </div>
  );
}

// ====== 1. 堆叠柱状图 ======

interface StackedColumnChartProps {
  data: StackedChartItem[];
  title: string;
  loading?: boolean;
}

export function StackedColumnChart({ data, title, loading }: StackedColumnChartProps) {
  const option = useMemo(() => {
    const dates = [...new Set(data.map((d) => d.date))].sort();
    const categories = [...new Set(data.map((d) => d.category))];

    const series = categories.map((cat) => {
      const catData = dates.map((date) => {
        const item = data.find((d) => d.date === date && d.category === cat);
        return item ? (item.value / 3600).toFixed(2) : 0;
      });
      return {
        name: cat,
        type: 'bar' as const,
        stack: 'total',
        emphasis: { focus: 'series' as const },
        data: catData,
      };
    });

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        valueFormatter: (value: unknown) => {
          const hours = Number(value);
          return `${hours.toFixed(1)}h`;
        },
      },
      legend: {
        type: 'scroll' as const,
        textStyle: { color: '#71717a', fontSize: 11 },
        bottom: 0,
      },
      grid: { left: 50, right: 20, top: 10, bottom: 40 },
      xAxis: {
        type: 'category' as const,
        data: dates.map(formatDateCN),
        axisLabel: { color: '#71717a', fontSize: 11 },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: '#71717a',
          formatter: (value: number) => `${value.toFixed(0)}h`,
          fontSize: 11,
        },
        splitLine: { lineStyle: { color: 'rgba(39,39,42,0.6)' } },
      },
      series,
    };
  }, [data]);

  return (
    <ChartCard title={title} loading={loading} hasData={data.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}

// ====== 2. 折线趋势图 ======

interface TrendLineChartProps {
  data: TrendItem[];
  title: string;
  loading?: boolean;
}

export function TrendLineChart({ data, title, loading }: TrendLineChartProps) {
  const option = useMemo(() => {
    const dates = data.map((d) => d.date);
    const values = data.map((d) => +(d.value / 3600).toFixed(2));

    return {
      tooltip: {
        trigger: 'axis' as const,
        valueFormatter: (value: unknown) => {
          const hours = Number(value);
          return `${hours.toFixed(1)}h`;
        },
      },
      grid: { left: 50, right: 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: dates.map(formatDateCN),
        axisLabel: { color: '#71717a' },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: '#94a3b8',
          formatter: (value: number) => `${value}h`,
        },
        splitLine: { lineStyle: { color: 'rgba(39,39,42,0.6)' } },
      },
      series: [
        {
          type: 'line' as const,
          data: values,
          smooth: true,
          lineStyle: { color: '#6366f1', width: 2 },
          itemStyle: { color: '#6366f1' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(99,102,241,0.25)' },
              { offset: 1, color: 'rgba(99,102,241,0)' },
            ]),
          },
        },
      ],
    };
  }, [data]);

  return (
    <ChartCard title={title} loading={loading} hasData={data.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}

// ====== 3. 环形饼图 ======

interface PieChartProps {
  data: PieItem[];
  title: string;
  loading?: boolean;
}

export function PieChart({ data, title, loading }: PieChartProps) {
  const option = useMemo(() => {
    const top10 = data.slice(0, 10);

    return {
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: { name: string; value: number }) => {
          return `${params.name}: ${secondsToReadable(params.value)}`;
        },
      },
      legend: {
        orient: 'vertical' as const,
        right: '5%',
        top: 'center',
        textStyle: { color: '#71717a', fontSize: 11 },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['45%', '75%'],
          center: ['40%', '50%'],
          data: top10.map((item) => ({
            name: item.name,
            value: item.value,
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            color: '#94a3b8',
            formatter: '{b}\n{d}%',
          },
        },
      ],
    };
  }, [data]);

  return (
    <ChartCard title={title} loading={loading} hasData={data.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}

// ====== 4. 日历热力图 ======

interface ActivityHeatmapProps {
  summaries: Array<{ date: string; total_seconds: number }>;
  title: string;
  loading?: boolean;
}

export function ActivityHeatmap({ summaries, title, loading }: ActivityHeatmapProps) {
  const option = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const data = summaries.map((s) => {
      return [s.date, s.total_seconds / 3600] as [string, number];
    });

    return {
      tooltip: {
        formatter: (params: { data: [string, number] }) => {
          const [dateStr, hours] = params.data;
          return `${formatDateCN(dateStr)}: ${hours.toFixed(1)}h`;
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((d) => d[1]), 8),
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#18181b', '#1e1b4b', '#312e81', '#4338ca', '#6366f1'],
        },
        textStyle: { color: '#71717a' },
      },
      calendar: {
        top: 20,
        left: 30,
        right: 30,
        cellSize: ['auto', 15],
        range: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        itemStyle: {
          borderColor: '#09090b',
          borderWidth: 2,
        },
        yearLabel: { show: true },
        monthLabel: { color: '#71717a' },
        dayLabel: { color: '#52525b' },
      },
      series: [
        {
          type: 'heatmap' as const,
          coordinateSystem: 'calendar' as const,
          data,
        },
      ],
    };
  }, [summaries]);

  return (
    <ChartCard title={title} loading={loading} hasData={summaries.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}

// ====== 5. AI 代码对比柱状图 ======

interface AICodeComparisonProps {
  data: AICodeComparisonItem[];
  title: string;
  loading?: boolean;
}

export function AICodeComparison({ data, title, loading }: AICodeComparisonProps) {
  const option = useMemo(() => {
    const dates = data.map((d) => d.date);
    return {
      tooltip: { trigger: 'axis' as const },
      legend: {
        data: ['AI 新增', '人工新增'],
        textStyle: { color: '#94a3b8' },
        top: 0,
      },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: dates.map(formatDateCN),
        axisLabel: { color: '#71717a' },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: '#71717a' },
        splitLine: { lineStyle: { color: 'rgba(39,39,42,0.6)' } },
      },
      series: [
        {
          name: 'AI 新增',
          type: 'bar' as const,
          data: data.map((d) => d.ai_additions),
          itemStyle: { color: '#06b6d4' },
        },
        {
          name: '人工新增',
          type: 'bar' as const,
          data: data.map((d) => d.human_additions),
          itemStyle: { color: '#a78bfa' },
        },
      ],
    };
  }, [data]);

  return (
    <ChartCard title={title} loading={loading} hasData={data.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}

// ====== 6. AI Token 趋势图 ======

interface AITokenTrendProps {
  data: AITokenTrendItem[];
  title: string;
  loading?: boolean;
}

export function AITokenTrend({ data, title, loading }: AITokenTrendProps) {
  const option = useMemo(() => {
    const dates = data.map((d) => d.date);
    return {
      tooltip: {
        trigger: 'axis' as const,
        valueFormatter: (value: unknown) => formatLargeNumber(Number(value)),
      },
      legend: {
        data: ['输入 Token', '输出 Token'],
        textStyle: { color: '#94a3b8' },
        top: 0,
      },
      grid: { left: 60, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: dates.map(formatDateCN),
        axisLabel: { color: '#71717a' },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: '#94a3b8',
          formatter: (value: number) => formatLargeNumber(value),
        },
        splitLine: { lineStyle: { color: 'rgba(39,39,42,0.6)' } },
      },
      series: [
        {
          name: '输入 Token',
          type: 'line' as const,
          data: data.map((d) => d.input_tokens),
          smooth: true,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
        },
        {
          name: '输出 Token',
          type: 'line' as const,
          data: data.map((d) => d.output_tokens),
          smooth: true,
          lineStyle: { color: '#10b981', width: 2 },
          itemStyle: { color: '#10b981' },
        },
      ],
    };
  }, [data]);

  return (
    <ChartCard title={title} loading={loading} hasData={data.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}

// ====== 7. AI Agent 成本堆叠面积图 ======

interface AIAgentCostProps {
  data: AIAgentCostItem[];
  title: string;
  loading?: boolean;
}

export function AIAgentCost({ data, title, loading }: AIAgentCostProps) {
  const option = useMemo(() => {
    const dates = [...new Set(data.map((d) => d.date))].sort();
    const agents = [...new Set(data.map((d) => d.agent))];

    const series = agents.map((agent) => {
      const agentData = dates.map((date) => {
        const item = data.find((d) => d.date === date && d.agent === agent);
        return item ? item.cost : 0;
      });
      return {
        name: agent,
        type: 'line' as const,
        stack: 'total',
        areaStyle: {},
        emphasis: { focus: 'series' as const },
        data: agentData,
      };
    });

    return {
      tooltip: {
        trigger: 'axis' as const,
        valueFormatter: (value: unknown) => `$${Number(value).toFixed(2)}`,
      },
      legend: {
        type: 'scroll' as const,
        textStyle: { color: '#71717a', fontSize: 11 },
        bottom: 0,
      },
      grid: { left: 60, right: 20, top: 10, bottom: 40 },
      xAxis: {
        type: 'category' as const,
        data: dates.map(formatDateCN),
        axisLabel: { color: '#71717a' },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: {
          color: '#94a3b8',
          formatter: (value: number) => `$${value.toFixed(0)}`,
        },
        splitLine: { lineStyle: { color: 'rgba(39,39,42,0.6)' } },
      },
      series,
    };
  }, [data]);

  return (
    <ChartCard title={title} loading={loading} hasData={data.length > 0}>
      <EChartsReact
        option={option}
        style={{ width: '100%', height: '350px' }}
        notMerge
        lazyUpdate
      />
    </ChartCard>
  );
}
