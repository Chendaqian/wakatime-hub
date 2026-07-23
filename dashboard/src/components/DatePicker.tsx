import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './DatePicker.module.css';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

function parseDate(v: string): { y: number; m: number; d: number } {
  const [y, m, d] = v.split('-').map(Number);
  return { y: y || 2026, m: m || 1, d: d || 1 };
}

function formatDate(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

function formatDisplay(y: number, m: number, d: number): string {
  return `${y}年${m}月${d}日`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function firstDayOfWeek(y: number, m: number): number {
  return new Date(y, m - 1, 1).getDay();
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { y, m } = parseDate(value);

  const [viewYear, setViewYear] = useState(y);
  const [viewMonth, setViewMonth] = useState(m);
  const [editingYear, setEditingYear] = useState(false);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // value 变化时同步视图
  useEffect(() => {
    const p = parseDate(value);
    setViewYear(p.y);
    setViewMonth(p.m);
  }, [value]);

  const selectDay = useCallback(
    (day: number) => {
      onChange(formatDate(viewYear, viewMonth, day));
      setOpen(false);
    },
    [viewYear, viewMonth, onChange]
  );

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfWeek(viewYear, viewMonth);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const cells: React.ReactNode[] = [];
  // 前置空白
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`e${i}`} className={styles.dayEmpty} />);
  }
  // 日期
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDate(viewYear, viewMonth, day);
    const isSelected = dateStr === value;
    const isToday = dateStr === todayStr;
    cells.push(
      <button
        key={day}
        className={[
          styles.dayBtn,
          isSelected ? styles.daySelected : '',
          isToday ? styles.dayToday : '',
        ].join(' ')}
        onClick={() => selectDay(day)}
      >
        {day}
      </button>
    );
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <span className={styles.trigger} onClick={() => setOpen(!open)}>
        {formatDisplay(parseDate(value).y, parseDate(value).m, parseDate(value).d)}
      </span>

      {open && (
        <div className={styles.popover}>
          <div className={styles.nav}>
            <button className={styles.navBtn} onClick={prevMonth}>
              ‹
            </button>
            <div className={styles.navTitle}>
              {editingYear ? (
                <span className={styles.yearEditor}>
                  <input
                    type="number"
                    className={styles.yearInput}
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value) || viewYear)}
                    onBlur={() => setEditingYear(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingYear(false); }}
                    autoFocus
                    min={2000}
                    max={2100}
                  />
                </span>
              ) : (
                <span onClick={() => setEditingYear(true)}>{viewYear}年</span>
              )}
              <span>{viewMonth}月</span>
            </div>
            <button className={styles.navBtn} onClick={nextMonth}>
              ›
            </button>
          </div>

          <div className={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <span key={w} className={styles.weekDay}>{w}</span>
            ))}
          </div>

          <div className={styles.daysGrid}>{cells}</div>
        </div>
      )}
    </div>
  );
}
