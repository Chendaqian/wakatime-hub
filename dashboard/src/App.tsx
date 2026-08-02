import { GistDataProvider, useGistData } from '@/hooks/GistDataContext';
import { ThemeProvider } from '@/hooks/ThemeContext';
import { Dashboard } from '@/components/Dashboard';
import { ConfigPage } from '@/components/ConfigPage';
import { getGistToken } from '@/hooks/useGistData';

function AppContent() {
  const { status, yearGistMap, showConfig, saveConfig, closeConfig } = useGistData();
  const years = Object.keys(yearGistMap);

  // 显示配置页：无数据源或手动打开
  if (status === 'config' || showConfig) {
    const defaultJson = years.length > 0
      ? JSON.stringify(yearGistMap, null, 2)
      : '';
    return (
      <ConfigPage
        defaultJson={defaultJson}
        defaultToken={getGistToken() || ''}
        onSave={saveConfig}
        onCancel={() => years.length > 0 ? closeConfig() : undefined}
      />
    );
  }

  if (years.length === 0) {
    return <div>Loading...</div>;
  }

  return <Dashboard />;
}

function App() {
  return (
    <ThemeProvider>
      <GistDataProvider>
        <AppContent />
      </GistDataProvider>
    </ThemeProvider>
  );
}

export default App;
