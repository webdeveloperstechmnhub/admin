import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CreateInstitute from './pages/CreateInstitute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <Routes>
      <Route
        path="/admin/login"
        element={isAuthenticated ? <Navigate to="/admin" replace /> : <AdminLogin onLogin={setIsAuthenticated} />}
      />
      <Route
        path="/admin"
        element={isAuthenticated ? <AdminDashboard onLogout={setIsAuthenticated} /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/create-institute"
        element={isAuthenticated ? <CreateInstitute /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/admin' : '/admin/login'} replace />}
      />
    </Routes>
  );
}

export default App;