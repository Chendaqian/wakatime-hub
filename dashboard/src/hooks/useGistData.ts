import { useState, useCallback } from 'react';
import type { DailySummary, AppStatus } from '@/types';
import { fetchGistFiles, fetchSummariesFromGistFiles } from '@/services/GistService';

const CACHE_KEY = 'wakatime_gist_cache';
const GIST_IDS_KEY = 'wakatime_gist_ids';
const GIST_TOKEN_KEY = 'wakatime_gist_token';

/**
 * 获取默认的 Gist ID 列表（从构建时环境变量注入）
 */
function getDefaultGistIds(): string[] {
  const raw = import.meta.env.VITE_GIST_IDS;
  if (raw) {
    return raw
      .split(/[\n,;\s]+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
}

interface UseGistDataReturn {
  summaries: DailySummary[];
  status: AppStatus;
  error: string | null;
  gistIds: string[];
  setGistIds: (ids: string[]) => void;
  loadData: () => Promise<void>;
  resetConfig: () => void;
  defaultGistIds: string[];
}

/**
 * 多 Gist 数据获取与缓存 Hook
 * 优先级：localStorage（用户手动输入） > VITE_GIST_IDS（构建时环境变量）
 */
export function useGistData(): UseGistDataReturn {
  const defaultIds = getDefaultGistIds();

  const [gistIds, setGistIdsState] = useState<string[]>(() => {
    // 优先 localStorage 用户手动输入
    const raw = localStorage.getItem(GIST_IDS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // ignore parse error
      }
    }
    // 向下兼容旧的单 Gist ID
    const oldId = localStorage.getItem('wakatime_gist_id');
    if (oldId) return [oldId];
    // 回退到构建时环境变量默认值
    return defaultIds;
  });

  // 首次：如果有默认值且没手动存过，直接用默认值并自动进入 loading
  const hasLocalConfig = !!(localStorage.getItem(GIST_IDS_KEY) || localStorage.getItem('wakatime_gist_id'));

  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [status, setStatus] = useState<AppStatus>(() => {
    if (gistIds.length > 0) return 'loading';
    if (hasLocalConfig) return 'loading';
    return 'config';
  });
  const [error, setError] = useState<string | null>(null);

  const setGistIds = useCallback((ids: string[]) => {
    setGistIdsState(ids);
    localStorage.setItem(GIST_IDS_KEY, JSON.stringify(ids));
  }, []);

  const resetConfig = useCallback(() => {
    localStorage.removeItem(GIST_IDS_KEY);
    localStorage.removeItem('wakatime_gist_id');
    localStorage.removeItem(GIST_TOKEN_KEY);
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(CACHE_KEY)) sessionStorage.removeItem(key);
    }
    setGistIdsState([]);
    setSummaries([]);
    setStatus('config');
    setError(null);
  }, []);

  const loadData = useCallback(async () => {
    if (gistIds.length === 0) {
      setStatus('config');
      return;
    }

    setStatus('loading');
    setError(null);

    const token = localStorage.getItem(GIST_TOKEN_KEY) || undefined;

    try {
      // 并发拉 16 个 Gist 元数据（每个响应自带文件 content）
      const allFileResults = await Promise.all(
        gistIds.map(async (gistId) => {
          const cached = sessionStorage.getItem(`${CACHE_KEY}_${gistId}`);
          if (cached) {
            try {
              return JSON.parse(cached) as Array<{ filename: string; rawUrl: string; date: string; content: string | null }>;
            } catch {
              // 缓存损坏，重新拉
            }
          }
          const files = await fetchGistFiles(gistId, token);
          if (files.length > 0) {
            try {
              // 只缓存元信息（不含 content），避免超出 sessionStorage 5MB 限制
              const meta = files.map(f => ({ filename: f.filename, rawUrl: f.rawUrl, date: f.date }));
              sessionStorage.setItem(`${CACHE_KEY}_${gistId}`, JSON.stringify(meta));
            } catch {
              // 缓存满了就跳过，不影响主流程
            }
          }
          return files;
        })
      );

      // 合并去重：按日期优先
      const fileMap = new Map<string, { filename: string; rawUrl: string; date: string; content: string | null }>();
      for (const files of allFileResults) {
        for (const f of files) {
          if (!fileMap.has(f.date)) {
            fileMap.set(f.date, f);
          }
        }
      }

      const mergedFiles = Array.from(fileMap.values()).sort(
        (a, b) => a.date.localeCompare(b.date)
      );

      if (mergedFiles.length === 0) {
        setSummaries([]);
        setStatus('ready');
        return;
      }

      // 直接从 Gist API 的 content 字段解析，无需额外网络请求
      const allSummaries = await fetchSummariesFromGistFiles(mergedFiles);
      setSummaries(allSummaries);
      setStatus('ready');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch Gist data';
      setError(message);
      setStatus('error');
    }
  }, [gistIds]);

  return {
    summaries,
    status,
    error,
    gistIds,
    setGistIds,
    loadData,
    resetConfig,
    defaultGistIds: defaultIds,
  };
}

/**
 * Gist Token 持久化辅助函数
 */
export function saveGistToken(token: string): void {
  localStorage.setItem(GIST_TOKEN_KEY, token);
}

export function getGistToken(): string | null {
  return localStorage.getItem(GIST_TOKEN_KEY);
}
