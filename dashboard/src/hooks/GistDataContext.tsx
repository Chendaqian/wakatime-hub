import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useGistData as useRawGistData } from '@/hooks/useGistData';
import type { DailySummary, AppStatus } from '@/types';

interface GistDataContextValue {
  summaries: DailySummary[];
  status: AppStatus;
  error: string | null;
  yearGistMap: Record<string, string>;
  loadedYears: Set<string>;
  activeYear: string | null;
  setActiveYear: (year: string) => void;
  loadData: () => Promise<void>;
  resetConfig: () => void;
  showConfig: boolean;
  openConfig: () => void;
  closeConfig: () => void;
  saveConfig: (json: string, token?: string) => void;
}

const GistDataContext = createContext<GistDataContextValue | null>(null);

export function GistDataProvider({ children }: { children: ReactNode }) {
  const data = useRawGistData();

  useEffect(() => {
    const years = Object.keys(data.yearGistMap);
    if (years.length > 0 && data.activeYear === null) {
      // 默认加载当前年份（仅首次）
      const currentYear = String(new Date().getFullYear());
      const year = data.yearGistMap[currentYear] ? currentYear : years[0];
      data.setActiveYear(year);
    }
  }, [data.yearGistMap, data.activeYear]);

  return (
    <GistDataContext.Provider value={data}>{children}</GistDataContext.Provider>
  );
}

export function useGistData(): GistDataContextValue {
  const ctx = useContext(GistDataContext);
  if (!ctx) throw new Error('useGistData must be used within GistDataProvider');
  return ctx;
}
