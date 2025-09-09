import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isLoading, user } = useContext(AuthContext);
  if (isLoading) return <div className="loading">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return children;
}

