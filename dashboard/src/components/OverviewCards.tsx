import { secondsToReadable } from '@/services/format';
import styles from './OverviewCards.module.css';

interface OverviewCardsProps {
  totalSeconds: number;
  projectCount: number;
  languageCount: number;
  editorCount: number;
}

export function OverviewCards({ totalSeconds, projectCount, languageCount, editorCount }: OverviewCardsProps) {
  if (totalSeconds === 0 && projectCount === 0) {
    return null;
  }

  const cards = [
    {
      label: '总编码时长',
      value: secondsToReadable(totalSeconds),
    },
    {
      label: '项目数',
      value: projectCount.toString(),
    },
    {
      label: '语言数',
      value: languageCount.toString(),
    },
    {
      label: '编辑器数',
      value: editorCount.toString(),
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
