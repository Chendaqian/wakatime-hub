import axios from 'axios';
import type { DailySummary } from '@/types';

/**
 * 从文件名提取月份
 * 格式: summaries_2026-07.json -> 2026-07
 */
function extractMonthFromFilename(filename: string): string | null {
  const match = filename.match(/summaries_(\d{4}-\d{2})\.json/);
  return match ? match[1] : null;
}

/**
 * 获取 Gist 文件列表，筛选 summaries_YYYY-MM.json 文件
 * 每月一个 JSON，文件数少（≤12），content 不会被截断
 */
export async function fetchGistFiles(
  gistId: string,
  token?: string
): Promise<Array<{ filename: string; date: string; content: string | null }>> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await axios.get(
    `https://api.github.com/gists/${gistId}?_=${Date.now()}`,
    { headers }
  );

  const files = response.data.files;
  const result: Array<{ filename: string; date: string; content: string | null }> = [];

  for (const [filename, file] of Object.entries(files)) {
    const month = extractMonthFromFilename(filename);
    if (month) {
      result.push({
        filename,
        date: month,
        content: (file as { content?: string }).content || null,
      });
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

/**
 * 从月 JSON 文件直接解析 summary 数组
 * 每月文件内容是 DailySummary[]，直接 flatMap
 */
export function fetchSummariesFromGistFiles(
  files: Array<{ filename: string; date: string; content: string | null }>
): DailySummary[] {
  const results: DailySummary[] = [];

  for (const file of files) {
    if (file.content) {
      try {
        const data = JSON.parse(file.content);
        if (Array.isArray(data) && data.length > 0) {
          for (const item of data) {
            if (item.date && item.grand_total) {
              results.push(item as DailySummary);
            }
          }
        }
      } catch {}
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}
