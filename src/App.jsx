import React, { useState, useEffect } from 'react';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <>
      {isAuthenticated ? (
        <AdminDashboard onLogout={setIsAuthenticated} />
      ) : (
        <AdminLogin onLogin={setIsAuthenticated} />
      )}
    </>
  );
}

export default App;