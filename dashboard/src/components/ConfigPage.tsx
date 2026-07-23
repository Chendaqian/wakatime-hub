import { useState, type FormEvent } from 'react';
import styles from './ConfigPage.module.css';
import { saveGistToken } from '@/hooks/useGistData';

interface ConfigPageProps {
  onConfirm: (gistIds: string[]) => void;
  defaultGistIds?: string[];
}

export function ConfigPage({ onConfirm, defaultGistIds }: ConfigPageProps) {
  const defaultText = defaultGistIds?.length ? defaultGistIds.join(';\n') : '';
  const [inputValue, setInputValue] = useState(defaultText);
  const [tokenValue, setTokenValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (tokenValue.trim()) {
      saveGistToken(tokenValue.trim());
    }

    // 支持用逗号、换行、空格分隔多个 Gist ID
    const ids = trimmed
      .split(/[\n,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    onConfirm(ids);
  };

  const handleSkip = () => {
    // 直接用默认值（如果存在）
    if (defaultGistIds?.length) {
      onConfirm(defaultGistIds);
    }
  };

  return (
    <div className={styles.configPage}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1>📊 WakaTime Hub</h1>
          <p>输入 GitHub Gist ID 来查看编码数据看板</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="gistId">Gist ID（支持多个）*</label>
            <textarea
              id="gistId"
              rows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`802ac7121f6edc199e738fb63cd4c48d; e4f5678901234567890abcdef1234567890ab`}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #334155',
                borderRadius: '8px',
                background: '#0f172a',
                color: '#f1f5f9',
                fontSize: '0.938rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'monospace',
              }}
            />
            <p className={styles.hint}>
              多个 Gist ID 用逗号、分号或换行分隔（如按年份分别存储的 Gist，可一次性输入所有年份的 ID）
            </p>
          </div>

          <div className={styles.field}>
            <label htmlFor="token">GitHub Token（可选）</label>
            <input
              id="token"
              type="password"
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
            />
            <p className={styles.hint}>
              公开 Gist 无需 Token。添加 Token 可提高 API 速率限制（60→5000 次/小时）
            </p>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!inputValue.trim()}
          >
            确认并进入看板
          </button>

          {defaultGistIds && defaultGistIds.length > 0 && (
            <button
              type="button"
              className={styles.submitBtn}
              style={{ marginTop: '0.5rem', background: '#334155' }}
              onClick={handleSkip}
            >
              使用默认配置直接进入
            </button>
          )}
        </form>

        <div className={styles.demoHint}>
          还没有 Gist？用{' '}
          <a
            href="https://github.com/Chendaqian/wakatime-hub"
            target="_blank"
            rel="noopener noreferrer"
          >
            wakatime-hub
          </a>{' '}
          自动同步 WakaTime 数据到 Gist
        </div>
      </div>
    </div>
  );
}
