import { GistDataProvider, useGistData } from '@/hooks/GistDataContext';
import { Dashboard } from '@/components/Dashboard';

function AppContent() {
  const { status, yearGistMap } = useGistData();
  const years = Object.keys(yearGistMap);

  if (status === 'config' || years.length === 0) {
    return <div>Loading...</div>;
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
