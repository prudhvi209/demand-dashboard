import React from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { AnimatePresence } from 'framer-motion';

const MainContent: React.FC = () => {
  const { activeTab, loading } = useData();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading Agivant Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
        {activeTab === 'upload' && <UploadPage key="upload" />}
      </AnimatePresence>
    </AppShell>
  );
};

export function App() {
  return (
    <DataProvider>
      <MainContent />
    </DataProvider>
  );
}

export default App;
