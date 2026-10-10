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

/** 是否为 GitHub 凭证错误（HTTP 401 Bad credentials） */
export function isBadCredentials(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

/** 把 Gist 请求异常转成可展示的中文提示 */
export function gistErrorMessage(err: unknown, gistId: string): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return 'GitHub Token 无效或已过期，请在配置页清空或更新';
    if (status === 403) return 'GitHub API 频率限制或权限不足，可在配置页填写 Token 提升额度';
    if (status === 404) return `Gist ${gistId} 不存在或已删除，请检查配置`;
    if (status) return `GitHub API 请求失败（HTTP ${status}）`;
  }
  return err instanceof Error ? err.message : '加载 Gist 数据失败';
}

export interface GistMonthFile {
  filename: string;
  rawUrl: string;
  date: string;
  content: string | null;
}

/**
 * 获取 Gist 文件列表，筛选 summaries_YYYY-MM.json 文件
 */
export async function fetchGistFiles(
  gistId: string,
  token?: string
): Promise<GistMonthFile[]> {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await axios.get(
    `https://api.github.com/gists/${gistId}?_=${Date.now()}`,
    { headers }
  );

  const files = response.data.files;
  const result: GistMonthFile[] = [];

  for (const [filename, file] of Object.entries(files)) {
    const month = extractMonthFromFilename(filename);
    if (month) {
      const f = file as { content?: string; raw_url?: string };
      result.push({
        filename,
        rawUrl: f.raw_url || '',
        date: month,
        content: f.content || null,
      });
    }
  }

  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

/**
 * 从月 JSON 文件解析 summary 数组
 * content 为 null 时用 token 回退 raw_url 下载
 */
export async function fetchSummariesFromGistFiles(
  files: GistMonthFile[],
  _token?: string
): Promise<DailySummary[]> {
  const results: DailySummary[] = [];

  for (const file of files) {
    let raw = file.content;

    // content 为 null 时回退 raw_url（公开 Gist 无需认证，避免 CORS 预检）
    if (!raw && file.rawUrl) {
      try {
        const resp = await axios.get(file.rawUrl);
        raw = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      } catch { /* skip */ }
    }

    if (raw) {
      try {
        const data = JSON.parse(raw);
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
