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

const PRESETS = [7, 14, 30];

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

  const handlePreset = (days: number) => {
    onDateRangeChange({
      start: todayJs.subtract(days - 1, 'day').format('YYYY-MM-DD'),
      end: today,
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
      {PRESETS.map((days) => {
        const start = todayJs.subtract(days - 1, 'day').format('YYYY-MM-DD');
        const end = today;
        const isActive = dateRange.start === start && dateRange.end === end;
        return (
          <button
            key={days}
            className={`${styles.presetBtn} ${isActive ? styles.activePreset : ''}`}
            onClick={() => handlePreset(days)}
          >
            近 {days} 天
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
