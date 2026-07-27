import { useState, useCallback, useRef } from 'react';
import type { DailySummary, AppStatus } from '@/types';
import { fetchGistFiles, fetchSummariesFromGistFiles } from '@/services/GistService';
import type { GistMonthFile } from '@/services/GistService';

const CACHE_KEY = 'wakatime_gist_cache';
const GIST_IDS_KEY = 'wakatime_gist_ids';
const GIST_IDS_TS_KEY = 'wakatime_gist_ids_ts';
const GIST_TOKEN_KEY = 'wakatime_gist_token';

/** localStorage 过期时间：3 个月 */
const LS_EXPIRE_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function readWithExpiry<T>(key: string, tsKey: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const ts = localStorage.getItem(tsKey);
  if (ts) {
    if (Date.now() - Number(ts) > LS_EXPIRE_MS) {
      localStorage.removeItem(key);
      localStorage.removeItem(tsKey);
      return null;
    }
  }
  try { return JSON.parse(raw) as T; } catch { return null; }
}

function writeWithExpiry(key: string, tsKey: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  localStorage.setItem(tsKey, String(Date.now()));
}

/**
 * 解析 Gist 配置 JSON
 * 新格式: { "2026": "gist_id", ... } → 每年一个 Gist
 * 兼容旧格式: { "2026": ["h1", "h2"] } → 取第一个
 */
function parseGistIds(raw: string): Record<string, string> {
  if (!raw) return {};
  if (raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const result: Record<string, string> = {};
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === 'string') result[key] = val;
        else if (Array.isArray(val) && val.length > 0) result[key] = String(val[0]);
      }
      return result;
    } catch { /* fall through */ }
  }
  // 旧版分号分隔 → 全归 2020
  const ids = raw.split(/[\n,;\s]+/).map(s => s.trim()).filter(Boolean);
  return ids.length > 0 ? { '2020': ids[0] } : {};
}

export interface UseGistDataReturn {
  summaries: DailySummary[];
  status: AppStatus;
  error: string | null;
  yearGistMap: Record<string, string>;     // 年份 → Gist ID
  loadedYears: Set<string>;
  activeYear: string | null;
  setActiveYear: (year: string) => void;
  loadData: () => Promise<void>;
  resetConfig: () => void;
  defaultYearGistMap: Record<string, string>;
  showConfig: boolean;
  openConfig: () => void;
  closeConfig: () => void;
  saveConfig: (json: string, token?: string) => void;
}

export function useGistData(): UseGistDataReturn {
  const raw = import.meta.env.VITE_GIST_IDS;
  const defaultMap = parseGistIds(raw);

  const [yearGistMap, setYearGistMapState] = useState<Record<string, string>>(() => {
    const cached = readWithExpiry<Record<string, string>>(GIST_IDS_KEY, GIST_IDS_TS_KEY);
    if (cached && Object.keys(cached).length > 0) return cached;
    return defaultMap;
  });

  const loadedYearsRef = useRef<Set<string>>(new Set());
  const [loadedYears, setLoadedYears] = useState<Set<string>>(new Set());
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [status, setStatus] = useState<AppStatus>(() =>
    Object.keys(yearGistMap).length > 0 ? 'loading' : 'config'
  );
  const [error, setError] = useState<string | null>(null);
  const [activeYear, setActiveYearState] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const openConfig = useCallback(() => setShowConfig(true), []);
  const closeConfig = useCallback(() => setShowConfig(false), []);

  const saveConfig = useCallback((json: string, token?: string) => {
    const map = parseGistIds(json);
    if (Object.keys(map).length === 0) return;
    writeWithExpiry(GIST_IDS_KEY, GIST_IDS_TS_KEY, map);
    if (token) {
      localStorage.setItem(GIST_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(GIST_TOKEN_KEY);
    }
    setYearGistMapState(map);
    loadedYearsRef.current = new Set();
    setLoadedYears(new Set());
    setSummaries([]);
    setStatus('loading');
    setError(null);
    setActiveYearState(null);
    setShowConfig(false);
  }, []);

  const resetConfig = useCallback(() => {
    localStorage.removeItem(GIST_IDS_KEY);
    localStorage.removeItem(GIST_IDS_TS_KEY);
    localStorage.removeItem('wakatime_gist_id');
    localStorage.removeItem(GIST_TOKEN_KEY);
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(CACHE_KEY)) sessionStorage.removeItem(key);
    }
    setYearGistMapState(defaultMap);
    loadedYearsRef.current = new Set();
    setLoadedYears(new Set());
    setSummaries([]);
    setStatus(Object.keys(defaultMap).length > 0 ? 'loading' : 'config');
    setError(null);
    setActiveYearState(null);
  }, [defaultMap]);

  /** 加载指定年份的数据（每年一个 Gist，含 12 个 JSON 月文件） */
  const loadYear = useCallback(async (year: string, map: Record<string, string>) => {
    const gistId = map[year];
    if (!gistId) return;

    const token = localStorage.getItem(GIST_TOKEN_KEY) || undefined;

    setStatus('loading');
    let files: GistMonthFile[] = [];
    try {
      files = await fetchGistFiles(gistId, token);
    } catch { /* skip failed Gist */ }

    const newSummaries = await fetchSummariesFromGistFiles(files, token);
    if (newSummaries.length > 0) {
      setSummaries(prev => {
        const merged = [...prev, ...newSummaries];
        merged.sort((a, b) => a.date.localeCompare(b.date));
        return merged;
      });
    }

    loadedYearsRef.current.add(year);
    setLoadedYears(new Set(loadedYearsRef.current));
    setStatus('ready');
  }, []);

  const setActiveYear = useCallback((year: string) => {
    setActiveYearState(year);
    if (!yearGistMap[year]) return;
    if (loadedYearsRef.current.has(year)) {
      setStatus('ready');
      return;
    }
    setStatus('loading');
    setError(null);
    loadYear(year, yearGistMap).catch((err: Error) => {
      setError(err.message);
      setStatus('error');
    });
  }, [yearGistMap, loadYear]);

  const loadData = useCallback(async () => {
    const years = Object.keys(yearGistMap).sort((a, b) => Number(b) - Number(a));
    const first = years[0];
    if (!first) { setStatus('config'); return; }
    setActiveYear(first);
  }, [yearGistMap, setActiveYear]);

  return {
    summaries,
    status,
    error,
    yearGistMap,
    loadedYears,
    activeYear,
    setActiveYear,
    loadData,
    resetConfig,
    defaultYearGistMap: defaultMap,
    showConfig,
    openConfig,
    closeConfig,
    saveConfig,
  };
}

export function saveGistToken(token: string): void {
  localStorage.setItem(GIST_TOKEN_KEY, token);
}

export function getGistToken(): string | null {
  return localStorage.getItem(GIST_TOKEN_KEY);
}
