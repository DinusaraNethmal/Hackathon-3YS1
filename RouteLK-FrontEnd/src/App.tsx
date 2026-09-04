import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { HeroSearch } from './components/HeroSearch';
import { Footer } from './components/Footer';
import { ChatBotWidget } from './components/ChatBotWidget';
import './App.css';

type ViewMode = 'home' | 'login' | 'register' | 'admin' | 'user-dashboard';

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('home');

  // Admin users only access the Admin Dashboard after login
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      if (activeView !== 'admin') {
        setActiveView('admin');
      }
    }
  }, [isAuthenticated, user?.role, activeView]);

  return (
    <div className="app-wrapper">
      <Navbar activeView={activeView} setActiveView={setActiveView} />

      <main style={{ flex: 1 }}>
        {activeView === 'home' && (!isAuthenticated || user?.role !== 'admin') && (
          <HeroSearch
            onNavigateToDashboard={() => setActiveView('user-dashboard')}
            onNavigateToLogin={() => setActiveView('login')}
          />
        )}

        {activeView === 'login' && (
          <LoginPage
            onSuccess={(role) => {
              if (role === 'admin') {
                setActiveView('admin');
              } else {
                setActiveView('user-dashboard');
              }
            }}
            onNavigateToRegister={() => setActiveView('register')}
          />
        )}

        {activeView === 'register' && (
          <RegisterPage
            onSuccess={() => setActiveView('user-dashboard')}
            onNavigateToLogin={() => setActiveView('login')}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard />
        )}

        {activeView === 'user-dashboard' && (
          <UserDashboard onBackToSearch={() => setActiveView('home')} />
        )}
      </main>

      <Footer />

      {(!isAuthenticated || user?.role !== 'admin') && activeView !== 'admin' && (
        <ChatBotWidget />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

