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
}: ControlsProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const todayJs = dayjs();

  const handlePreset = (days: number) => {
    onDateRangeChange({
      start: todayJs.subtract(days - 1, 'day').format('YYYY-MM-DD'),
      end: today,
    });
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

      <DatePicker
        value={dateRange.start}
        onChange={(start) =>
          onDateRangeChange({ ...dateRange, start })
        }
      />

      <span className={styles.separator}>至</span>

      <DatePicker
        value={dateRange.end}
        onChange={(end) =>
          onDateRangeChange({ ...dateRange, end })
        }
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
