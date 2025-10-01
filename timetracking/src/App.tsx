import { useState } from 'react';
import './App.css';
import AdminTools from './components/admin/AdminDashboard.refactored';
import AuthUI from './components/AuthForm.refactored';
import PunchClock from './components/timeTracker';
import type { User } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated && user ? (
        user.role === 'admin' ? (
          <AdminTools user={user} onLogout={handleLogout} />
        ) : (
          <PunchClock user={user} onLogout={handleLogout} />
        )
      ) : (
        <AuthUI onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

export default App
