/**
 * 秒数转可读时间格式
 */
export function secondsToReadable(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * 格式化大数字（用于 token 数量等）
 */
export function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return n.toString();
}

/**
 * 格式化 Token 数量（简化展示）
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toLocaleString();
}

/**
 * 格式化美元金额
 */
export function formatCost(cost: number): string {
  if (cost >= 100) {
    return `$${cost.toFixed(0)}`;
  }
  if (cost >= 1) {
    return `$${cost.toFixed(2)}`;
  }
  return `$${cost.toFixed(4)}`;
}

/**
 * 日期字符串转中文格式：2026-07-21 → 7月21日
 */
export function formatDateCN(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return `${month}月${day}日`;
}

/**
 * 日期范围转中文：2026-07-17 ~ 2026-07-23 → 7月17日 至 7月23日
 */
export function formatDateRangeCN(start: string, end: string): string {
  const s = start.split('-');
  const e = end.split('-');
  if (s.length !== 3 || e.length !== 3) return `${start} ~ ${end}`;
  const sMonth = parseInt(s[1], 10);
  const sDay = parseInt(s[2], 10);
  const eMonth = parseInt(e[1], 10);
  const eDay = parseInt(e[2], 10);
  if (sMonth === eMonth) {
    return `${sMonth}月${sDay}日 至 ${eDay}日`;
  }
  return `${sMonth}月${sDay}日 至 ${eMonth}月${eDay}日`;
}
