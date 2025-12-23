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
  const isCashier = roles.includes('cashier') && !roles.includes('superadmin') && !roles.includes('owner');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Log route access attempt for debugging
  console.log(`📍 Route access attempt:`, {
    path: window.location.pathname,
    isAuthenticated,
    roles,
    isCashier,
    config,
  });

  // Redirect cashiers to POS system - they can only access /cashier/pos
  if (isCashier && !window.location.pathname.startsWith('/cashier/pos')) {
    console.warn(`🚫 Cashier redirected from ${window.location.pathname} to /cashier/pos`);
    return <Navigate to="/cashier/pos" replace />;
  }

  const accessCheck = canAccessRoute(roles, isAuthenticated, config);

  if (!accessCheck.allowed) {
    // Redirect to login if not authenticated
    if (!isAuthenticated && config.requireAuth) {
      console.warn(`🔐 Redirecting to login - requires authentication`);
      return <Navigate to={fallbackPath} replace />;
    }

    // Redirect cashiers to POS if they don't have permission
    if (isCashier) {
      console.warn(`🚫 Cashier denied access - redirecting to POS`);
      return <Navigate to="/cashier/pos" replace />;
    }

    // Show access denied for authenticated users without permission
    console.error(`❌ Access denied:`, accessCheck.reason);
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

  console.log(`✅ Access granted to ${window.location.pathname}`);
  return <>{children}</>;
}
