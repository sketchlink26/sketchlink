import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login       from './components/Auth/Login';
import Register    from './components/Auth/Register';
import Dashboard   from './components/Dashboard/Dashboard';
import Whiteboard  from './components/Canvas/Whiteboard';
import Landing     from './components/Landing/Landing';
import './App.css';

// Protected route wrapper
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Root route: show Landing if logged out, Dashboard if logged in
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">Loading…</div>;
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"            element={<RootRoute />} />
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/board/:id"   element={<PrivateRoute><Whiteboard /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
