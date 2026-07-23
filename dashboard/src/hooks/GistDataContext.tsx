import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useGistData as useRawGistData } from '@/hooks/useGistData';
import type { DailySummary, AppStatus } from '@/types';

interface GistDataContextValue {
  summaries: DailySummary[];
  status: AppStatus;
  error: string | null;
  gistIds: string[];
  setGistIds: (ids: string[]) => void;
  loadData: () => Promise<void>;
  resetConfig: () => void;
  defaultGistIds: string[];
}

const GistDataContext = createContext<GistDataContextValue | null>(null);

export function GistDataProvider({ children }: { children: ReactNode }) {
  const data = useRawGistData();

  useEffect(() => {
    if (data.gistIds.length > 0) {
      data.loadData();
    }
  }, [data.gistIds]);

  return (
    <GistDataContext.Provider value={data}>{children}</GistDataContext.Provider>
  );
}

export function useGistData(): GistDataContextValue {
  const ctx = useContext(GistDataContext);
  if (!ctx) throw new Error('useGistData must be used within GistDataProvider');
  return ctx;
}
