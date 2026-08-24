import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UploadPage } from './pages/UploadPage';
import { ProfilePage } from './pages/ProfilePage';
import { UsersPage } from './pages/UsersPage';
import { AnimatePresence } from 'framer-motion';

const MainRouter: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeTab } = useData();

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

  if (!user) {
    return <Login />;
  }

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && <Dashboard key="dashboard" />}
        {activeTab === 'upload' && <UploadPage key="upload" />}
        {activeTab === 'profile' && <ProfilePage key="profile" />}
        {activeTab === 'users' && user.isAdmin && <UsersPage key="users" />}
      </AnimatePresence>
    </AppShell>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainRouter />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
