import axios from 'axios';
import type { GistResponse, DailySummary, WakaTimeSummary } from '@/types';

const GIST_API_BASE = 'https://api.github.com';

/**
 * 从文件名提取日期
 * 格式: summaries_2026-07-21.json -> 2026-07-21
 */
function extractDateFromFilename(filename: string): string | null {
  const match = filename.match(/summaries_(\d{4}-\d{2}-\d{2})\.json/);
  return match ? match[1] : null;
}

/**
 * 获取 Gist 文件列表，筛选出 summaries_*.json 文件
 */
export async function fetchGistFiles(
  gistId: string,
  token?: string
): Promise<Array<{ filename: string; rawUrl: string; date: string }>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await axios.get<GistResponse>(
    `${GIST_API_BASE}/gists/${gistId}`,
    { headers }
  );

  const files = response.data.files;
  const summaryFiles: Array<{ filename: string; rawUrl: string; date: string }> = [];

  for (const [filename, file] of Object.entries(files)) {
    const date = extractDateFromFilename(filename);
    if (date && file.raw_url) {
      summaryFiles.push({
        filename,
        rawUrl: file.raw_url,
        date,
      });
    }
  }

  // 按日期降序排列（最新在前）
  summaryFiles.sort((a, b) => b.date.localeCompare(a.date));

  return summaryFiles;
}

/**
 * 获取并解析单个 summary JSON 文件
 */
export async function fetchSingleSummary(rawUrl: string): Promise<WakaTimeSummary | null> {
  try {
    const response = await axios.get(rawUrl);
    // 数据是数组格式，取第一个元素
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as WakaTimeSummary;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch summary from ${rawUrl}:`, error);
    return null;
  }
}

/**
 * 批量获取指定日期范围内的 summary 数据
 */
export async function fetchSummariesByFiles(
  files: Array<{ filename: string; rawUrl: string; date: string }>
): Promise<DailySummary[]> {
  const results: DailySummary[] = [];

  // 并行请求所有文件
  const promises = files.map(async (file) => {
    const summary = await fetchSingleSummary(file.rawUrl);
    if (summary) {
      return {
        date: file.date,
        ...summary,
      } as DailySummary;
    }
    return null;
  });

  const resolved = await Promise.all(promises);
  for (const item of resolved) {
    if (item) {
      results.push(item);
    }
  }

  // 按日期升序排列
  results.sort((a, b) => a.date.localeCompare(b.date));

  return results;
}
