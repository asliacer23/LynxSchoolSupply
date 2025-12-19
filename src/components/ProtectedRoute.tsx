import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccessRoute } from '@/lib/route-guards';
import type { RouteGuardConfig } from '@/lib/route-guards';

interface ProtectedRouteProps {
  children: ReactNode;
  config: RouteGuardConfig;
  fallbackPath?: string;
}

/**
 * ProtectedRoute component to guard pages based on authentication and permissions
 */
export function ProtectedRoute({
  children,
  config,
  fallbackPath = '/auth/login',
}: ProtectedRouteProps) {
  const { user, roles, loading } = useAuth();
  const isAuthenticated = !!user;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const accessCheck = canAccessRoute(roles, isAuthenticated, config);

  if (!accessCheck.allowed) {
    // Redirect to login if not authenticated
    if (!isAuthenticated && config.requireAuth) {
      return <Navigate to={fallbackPath} replace />;
    }

    // Show access denied for authenticated users without permission
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{accessCheck.reason}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
