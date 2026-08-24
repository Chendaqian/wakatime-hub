import dayjs from 'dayjs';
import type { DimensionType } from '@/types';
import { DatePicker } from './DatePicker';
import styles from '@/styles/Controls.module.css';

interface ControlsProps {
  dateRange: { start: string; end: string };
  onDateRangeChange: (range: { start: string; end: string }) => void;
  dimension: DimensionType;
  onDimensionChange: (dim: DimensionType) => void;
  onReset: () => void;
  availableYears: number[];
  activeYear: number | null;
}

const DIMENSIONS: { key: DimensionType; label: string }[] = [
  { key: 'projects', label: '项目' },
  { key: 'languages', label: '语言' },
  { key: 'editors', label: '编辑器' },
  { key: 'categories', label: '类别' },
  { key: 'operating_systems', label: '系统' },
];

const PRESETS = [
  { label: '前三天', days: 3, endDaysAgo: 1 },
  { label: '近 7 天', days: 7, endDaysAgo: 0 },
  { label: '近 14 天', days: 14, endDaysAgo: 0 },
  { label: '近 30 天', days: 30, endDaysAgo: 0 },
];
const DAY_PRESETS = [
  { label: '今天', daysAgo: 0 },
  { label: '昨天', daysAgo: 1 },
];

export function Controls({
  dateRange,
  onDateRangeChange,
  dimension,
  onDimensionChange,
  onReset,
  availableYears,
  activeYear,
}: ControlsProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const todayJs = dayjs();

  const handleDayPreset = (daysAgo: number) => {
    const date = todayJs.subtract(daysAgo, 'day').format('YYYY-MM-DD');
    onDateRangeChange({ start: date, end: date });
  };

  const handlePreset = (days: number, endDaysAgo: number) => {
    const end = todayJs.subtract(endDaysAgo, 'day').format('YYYY-MM-DD');
    onDateRangeChange({
      start: todayJs.subtract(endDaysAgo + days - 1, 'day').format('YYYY-MM-DD'),
      end,
    });
  };

  const handleYear = (year: number) => {
    const dec31 = `${year}-12-31`;
    onDateRangeChange({
      start: `${year}-01-01`,
      end: dec31 < today ? dec31 : today,
    });
  };

  /// <summary>
  /// 开始日期变更时，结束日期自动设为当月最后一天（不超过今天）
  /// </summary>
  const handleStartChange = (start: string) => {
    const startDay = dayjs(start);
    const monthEnd = startDay.endOf('month').format('YYYY-MM-DD');
    const end = monthEnd < today ? monthEnd : today;
    onDateRangeChange({ start, end });
  };

  /// <summary>
  /// 结束日期变更时，不允许选在开始日期之前
  /// </summary>
  const handleEndChange = (end: string) => {
    if (end >= dateRange.start) {
      onDateRangeChange({ ...dateRange, end });
    }
  };

  return (
    <div className={styles.controls}>
      {DAY_PRESETS.map(({ label, daysAgo }) => {
        const date = todayJs.subtract(daysAgo, 'day').format('YYYY-MM-DD');
        const isActive = dateRange.start === date && dateRange.end === date;
        return (
          <button
            key={label}
            className={`${styles.presetBtn} ${isActive ? styles.activePreset : ''}`}
            onClick={() => handleDayPreset(daysAgo)}
          >
            {label}
          </button>
        );
      })}

      {PRESETS.map(({ label, days, endDaysAgo }) => {
        const start = todayJs.subtract(endDaysAgo + days - 1, 'day').format('YYYY-MM-DD');
        const end = todayJs.subtract(endDaysAgo, 'day').format('YYYY-MM-DD');
        const isActive = dateRange.start === start && dateRange.end === end;
        return (
          <button
            key={days}
            className={`${styles.presetBtn} ${isActive ? styles.activePreset : ''}`}
            onClick={() => handlePreset(days, endDaysAgo)}
          >
            {label}
          </button>
        );
      })}

      {availableYears.length > 0 && (
        <>
          <span className={styles.yearDivider} />
          <select
            className={styles.yearSelect}
            value={activeYear ?? ''}
            onChange={(e) => {
              const y = Number(e.target.value);
              if (y) handleYear(y);
            }}
          >
            <option value="">全年</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </>
      )}

      <DatePicker
        value={dateRange.start}
        onChange={handleStartChange}
      />

      <span className={styles.separator}>至</span>

      <DatePicker
        value={dateRange.end}
        onChange={handleEndChange}
        minDate={dateRange.start}
      />

      <div className={styles.dimSwitch}>
        {DIMENSIONS.map((d) => (
          <button
            key={d.key}
            className={`${styles.dimBtn} ${dimension === d.key ? styles.activeDim : ''}`}
            onClick={() => onDimensionChange(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <button className={styles.resetBtn} onClick={onReset}>
        切换 Gist
      </button>
    </div>
  );
}
