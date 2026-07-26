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
 * 返回 content（从 Gist API 直接获取，避免逐个下载 raw_url 触发限频）
 */
export async function fetchGistFiles(
  gistId: string,
  token?: string
): Promise<Array<{ filename: string; rawUrl: string; date: string; content: string | null }>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await axios.get<GistResponse>(
    `${GIST_API_BASE}/gists/${gistId}?_=${Date.now()}`,
    { headers }
  );

  const files = response.data.files;
  const summaryFiles: Array<{ filename: string; rawUrl: string; date: string; content: string | null }> = [];

  for (const [filename, file] of Object.entries(files)) {
    const date = extractDateFromFilename(filename);
    if (date) {
      summaryFiles.push({
        filename,
        rawUrl: file.raw_url || '',
        date,
        // Gist API 自带文件内容（未截断时），省去逐个下载
        content: file.content || null,
      });
    }
  }

  // 按日期降序排列（最新在前）
  summaryFiles.sort((a, b) => b.date.localeCompare(a.date));

  return summaryFiles;
}

/**
 * 从 Gist API 返回的文件列表中直接解析 summary
 * 如果 content 为空（Gist 被截断），则回退到 raw_url 下载（带重试和间隔）
 */
export async function fetchSummariesFromGistFiles(
  files: Array<{ filename: string; rawUrl: string; date: string; content: string | null }>
): Promise<DailySummary[]> {
  const results: DailySummary[] = [];

  // 先尝试从 content 直接解析
  const needFetch: Array<{ rawUrl: string; date: string }> = [];
  for (const file of files) {
    if (file.content) {
      try {
        const data = JSON.parse(file.content);
        if (Array.isArray(data) && data.length > 0) {
          results.push({ date: file.date, ...(data[0] as WakaTimeSummary) } as DailySummary);
          continue;
        }
      } catch {}
    }
    needFetch.push({ rawUrl: file.rawUrl, date: file.date });
  }

  // 回退：串行下载（带间隔防限频）
  if (needFetch.length > 0) {
    for (const f of needFetch) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const r = await axios.get(f.rawUrl);
          const data = r.data;
          if (Array.isArray(data) && data.length > 0) {
            results.push({ date: f.date, ...(data[0] as WakaTimeSummary) } as DailySummary);
          }
          break;
        } catch (e) {
          if (e.response?.status === 403 && attempt < 2) {
            await new Promise(r => setTimeout(r, 30000));
          }
        }
      }
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}
