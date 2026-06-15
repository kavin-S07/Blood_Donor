import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types/auth';

interface Props {
  children: React.ReactNode;
  role?: Role;
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0303]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-red-400 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    const home = user?.role === 'donor' ? '/donor' : user?.role === 'hospital' ? '/hospital' : '/admin';
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;