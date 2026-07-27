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
 * 从 Gist API 返回的文件列表中解析 summary
 * 优先用 API content 字段，为 null 时回退 raw_url 下载（需要 token）
 */
export async function fetchSummariesFromGistFiles(
  files: Array<{ filename: string; rawUrl: string; date: string; content: string | null }>,
  token?: string
): Promise<DailySummary[]> {
  const results: DailySummary[] = [];

  for (const file of files) {
    let raw = file.content;

    // content 为 null 时尝试 raw_url 回退下载
    if (!raw && file.rawUrl && token) {
      try {
        const headers: Record<string, string> = { Authorization: `token ${token}` };
        const resp = await axios.get(file.rawUrl, { headers });
        raw = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      } catch { /* 下载失败跳过 */ }
    }

    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          results.push({ date: file.date, ...(data[0] as WakaTimeSummary) } as DailySummary);
        }
      } catch {}
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}
