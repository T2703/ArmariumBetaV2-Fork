import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from './backend/useAuth';

function ProtectedRoute({ element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; 
  }

  return user ? element : <Navigate to="/login" />;
}

export default ProtectedRoute;