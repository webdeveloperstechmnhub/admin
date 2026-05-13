import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CreateInstitute from './pages/CreateInstitute';
import Events from './pages/Events';
import EventEditor from './pages/EventEditor';
import EventRegistrations from './pages/EventRegistrations';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('adminToken')));


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
        path="/admin/events"
        element={isAuthenticated ? <Events /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/events/create"
        element={isAuthenticated ? <EventEditor /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/events/:id/edit"
        element={isAuthenticated ? <EventEditor /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/event-registrations"
        element={isAuthenticated ? <EventRegistrations /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="/admin/session-bookings"
        element={isAuthenticated ? <AdminDashboard onLogout={setIsAuthenticated} /> : <Navigate to="/admin/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/admin' : '/admin/login'} replace />}
      />
    </Routes>
  );
}

export default App;
