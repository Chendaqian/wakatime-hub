import { useState, useCallback } from 'react';
import type { DailySummary, AppStatus } from '@/types';
import { fetchGistFiles, fetchSummariesFromGistFiles } from '@/services/GistService';

const CACHE_KEY = 'wakatime_gist_cache';
const GIST_IDS_KEY = 'wakatime_gist_ids';
const GIST_IDS_TS_KEY = 'wakatime_gist_ids_ts'; // 存储时间戳
const GIST_TOKEN_KEY = 'wakatime_gist_token';

/** localStorage 过期时间：3 个月 */
const LS_EXPIRE_MS = 3 * 30 * 24 * 60 * 60 * 1000;

/**
 * 读取带过期时间的 localStorage 值
 */
function readWithExpiry<T>(key: string, tsKey: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const ts = localStorage.getItem(tsKey);
  if (ts) {
    const elapsed = Date.now() - Number(ts);
    if (elapsed > LS_EXPIRE_MS) {
      localStorage.removeItem(key);
      localStorage.removeItem(tsKey);
      return null;
    }
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * 写入带过期时间的 localStorage 值
 */
function writeWithExpiry(key: string, tsKey: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  localStorage.setItem(tsKey, String(Date.now()));
}

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
    // 优先 localStorage 用户手动输入（带 3 个月过期）
    const cached = readWithExpiry<string[]>(GIST_IDS_KEY, GIST_IDS_TS_KEY);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
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
    writeWithExpiry(GIST_IDS_KEY, GIST_IDS_TS_KEY, ids);
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
      // 逐 Gist 串行拉取（间隔 8s），直接从 API content 字段取数据，不缓存
      const allFileResults: Array<{ filename: string; rawUrl: string; date: string; content: string | null }>[] = [];
      for (let i = 0; i < gistIds.length; i++) {
        const files = await fetchGistFiles(gistIds[i], token);
        allFileResults.push(files);
        if (i < gistIds.length - 1) await new Promise(r => setTimeout(r, 8000));
      }

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

      // 直接从 Gist API 的 content 字段解析
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
