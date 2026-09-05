import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen w-full theme-bg-app theme-text-primary flex flex-col items-center justify-center font-mono text-xs p-4 select-none">
        <div className="inst-panel p-6 max-w-sm w-full text-center space-y-3">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent animate-spin mx-auto rounded-full" />
          <div className="font-bold theme-text-primary uppercase tracking-wider">
            AUTHENTICATING SESSION...
          </div>
          <div className="text-[10px] theme-text-secondary">
            VERIFYING DILRMP SECURITY TOKEN
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
