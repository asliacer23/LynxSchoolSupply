/**
 * Route Guards for protecting pages based on roles and permissions
 * Used to prevent unauthorized access to features
 */

import type { RoleName, Permission } from '@/types/database';
import { hasPermission } from './permissions';

export interface RouteGuardConfig {
  requiredRoles?: RoleName[];
  requiredPermissions?: Permission[];
  requireAuth?: boolean;
  allowGuest?: boolean;
}

/**
 * Check if user should have access to a route
 */
export function canAccessRoute(
  userRoles: RoleName[],
  isAuthenticated: boolean,
  config: RouteGuardConfig
): {
  allowed: boolean;
  reason?: string;
} {
  // Check if route requires authentication
  if (config.requireAuth && !isAuthenticated) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  // Check if route allows guests
  if (!isAuthenticated && !config.allowGuest) {
    return {
      allowed: false,
      reason: 'Guests are not allowed on this page',
    };
  }

  // Check required roles
  if (config.requiredRoles && config.requiredRoles.length > 0) {
    const hasRole = config.requiredRoles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return {
        allowed: false,
        reason: `Required roles: ${config.requiredRoles.join(', ')}`,
      };
    }
  }

  // Check required permissions
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    const hasPermissionAccess = config.requiredPermissions.some(permission =>
      userRoles.some(role => hasPermission(role, permission))
    );
    if (!hasPermissionAccess) {
      return {
        allowed: false,
        reason: `Required permissions: ${config.requiredPermissions.join(', ')}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Route guard configurations
 */
export const routeGuards: Record<string, RouteGuardConfig> = {
  '/': {
    allowGuest: true,
    requireAuth: false,
  },
  '/products': {
    allowGuest: true,
    requireAuth: false,
  },
  '/products/:id': {
    allowGuest: true,
    requireAuth: false,
  },
  '/cart': {
    requireAuth: true,
    requiredPermissions: ['view_cart'],
  },
  '/checkout': {
    requireAuth: true,
    requiredPermissions: ['checkout'],
  },
  '/orders': {
    requireAuth: true,
    requiredPermissions: ['view_own_orders', 'view_all_orders'],
  },
  '/dashboard': {
    requireAuth: true,
    requiredRoles: ['superadmin', 'owner', 'cashier'],
    requiredPermissions: ['view_dashboard'],
  },
  '/admin': {
    requireAuth: true,
    requiredRoles: ['superadmin', 'owner'],
    requiredPermissions: ['access_admin_panel'],
  },
  '/products/manage': {
    requireAuth: true,
    requiredRoles: ['superadmin', 'owner'],
    requiredPermissions: ['create_product'],
  },
  '/categories/manage': {
    requireAuth: true,
    requiredRoles: ['superadmin', 'owner'],
    requiredPermissions: ['manage_categories'],
  },
};

/**
 * Get route guard config by path
 */
export function getRouteGuardConfig(path: string): RouteGuardConfig | undefined {
  return routeGuards[path];
}

/**
 * Check if route exists in guards
 */
export function isProtectedRoute(path: string): boolean {
  return !!routeGuards[path];
}
