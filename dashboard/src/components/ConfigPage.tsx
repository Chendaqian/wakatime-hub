import { useState, type FormEvent } from 'react';
import styles from './ConfigPage.module.css';

interface ConfigPageProps {
  /** 当前的 yearGistMap JSON 字符串（预填） */
  defaultJson: string;
  /** 当前已保存的 token（预填） */
  defaultToken: string;
  onSave: (json: string, token?: string) => void;
  onCancel: () => void;
}

export function ConfigPage({ defaultJson, defaultToken, onSave, onCancel }: ConfigPageProps) {
  const [jsonValue, setJsonValue] = useState(defaultJson);
  const [tokenValue, setTokenValue] = useState(defaultToken);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = jsonValue.trim();
    if (!trimmed) return;

    // 校验 JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('格式错误：应为 {"年份": "GistID", ...} 的对象');
        return;
      }
      for (const [year, id] of Object.entries(parsed)) {
        if (typeof id !== 'string' || !id.trim()) {
          setError(`年份 ${year} 的值必须是非空字符串`);
          return;
        }
      }
    } catch {
      setError('JSON 解析失败，请检查格式');
      return;
    }

    setError('');
    onSave(trimmed, tokenValue.trim() || undefined);
  };

  return (
    <div className={styles.configPage}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1>📊 WakaTime Hub</h1>
          <p>配置 Gist 数据源和 GitHub Token</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="gistJson">Gist ID 配置（JSON 格式）</label>
            <textarea
              id="gistJson"
              rows={10}
              value={jsonValue}
              onChange={(e) => { setJsonValue(e.target.value); setError(''); }}
              autoFocus
            />
            <p className={styles.hint}>
              格式：{`{"年份": "GistID", ...}`}。每个年份对应一个 Gist ID
            </p>
          </div>

          <div className={styles.field}>
            <label htmlFor="token">GitHub Token（可选，提高 API 频率限制）</label>
            <input
              id="token"
              type="password"
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p className={styles.hint}>
              未认证 60 次/小时，认证后 5000 次/小时。Token 仅保存在浏览器 localStorage
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={!jsonValue.trim()}>
            确认并进入看板
          </button>

          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={!onCancel}>
            取消
          </button>
        </form>
      </div>
    </div>
  );
}
