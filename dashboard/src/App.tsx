import { GistDataProvider, useGistData } from '@/hooks/GistDataContext';
import { ConfigPage } from '@/components/ConfigPage';
import { Dashboard } from '@/components/Dashboard';

function AppContent() {
  const { status, gistIds, setGistIds, defaultGistIds } = useGistData();

  if (status === 'config' || gistIds.length === 0) {
    return <ConfigPage onConfirm={setGistIds} defaultGistIds={defaultGistIds} />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <GistDataProvider>
      <AppContent />
    </GistDataProvider>
  );
}

export default App;
