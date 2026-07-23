import type { DailySummary } from '@/types';
import { secondsToReadable } from '@/services/format';
import styles from './OverviewCards.module.css';

interface OverviewCardsProps {
  latestSummary: DailySummary | undefined;
}

export function OverviewCards({ latestSummary }: OverviewCardsProps) {
  if (!latestSummary) {
    return null;
  }

  const cards = [
    {
      label: '🤖 总编码时长',
      value: secondsToReadable(latestSummary.grand_total.total_seconds),
    },
    {
      label: '📁 项目数',
      value: latestSummary.projects.length.toString(),
    },
    {
      label: '🔤 语言数',
      value: latestSummary.languages.length.toString(),
    },
    {
      label: '💻 编辑器数',
      value: latestSummary.editors.length.toString(),
    },
  ];

  return (
    <div className={styles.overviewCards}>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <div className={styles.label}>{card.label}</div>
          <div className={styles.value}>{card.value}</div>
        </div>
      ))}
    </div>
  );
}
