/**
 * Authorization utilities for checking access control
 * Used throughout services to enforce permissions
 */

import type { RoleName, Permission } from '@/types/database';
import { hasPermission } from './permissions';

/**
 * Authorization error class
 */
export class AuthorizationError extends Error {
  constructor(message: string, public readonly permission?: Permission, public readonly role?: RoleName) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Check if user has required permission
 * @throws AuthorizationError if permission is denied
 */
export function requirePermission(roles: RoleName[], permission: Permission): void {
  const hasAccess = roles.some(role => hasPermission(role, permission));
  
  if (!hasAccess) {
    throw new AuthorizationError(
      `You do not have permission to perform this action: ${permission}`,
      permission,
      roles[0]
    );
  }
}

/**
 * Check if user has required permission (returns boolean)
 */
export function canAccess(roles: RoleName[], permission: Permission): boolean {
  return roles.some(role => hasPermission(role, permission));
}

/**
 * Get authorization status with message
 */
export function checkAccess(roles: RoleName[], permission: Permission): {
  allowed: boolean;
  message: string;
} {
  const allowed = canAccess(roles, permission);
  
  return {
    allowed,
    message: allowed
      ? `You have access to ${permission}`
      : `Access denied: ${permission} requires different permissions`,
  };
}

/**
 * Get all accessible features for a user's roles
 */
export function getAccessibleFeatures(roles: RoleName[]): Set<string> {
  const features = new Set<string>();
  
  roles.forEach(role => {
    if (role === 'superadmin' || role === 'owner') {
      features.add('products');
      features.add('categories');
      features.add('orders');
      features.add('dashboard');
      if (role === 'superadmin' || role === 'owner') {
        features.add('admin');
      }
    }
    
    if (role === 'cashier') {
      features.add('products');
      features.add('orders');
      features.add('dashboard');
    }
    
    if (role === 'user') {
      features.add('products');
      features.add('cart');
      features.add('orders');
    }
  });
  
  return features;
}

/**
 * Create authorization middleware function
 */
export function createAuthMiddleware(requiredPermissions: Permission | Permission[]) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  
  return (roles: RoleName[]): boolean => {
    return permissions.some(permission => canAccess(roles, permission));
  };
}

/**
 * Audit log authorization check
 */
export function logAuthorizationCheck(
  userId: string,
  roles: RoleName[],
  action: string,
  allowed: boolean
): void {
  const timestamp = new Date().toISOString();
  const rolesStr = roles.join(', ');
  
  if (!allowed) {
    console.warn(
      `[AUTH DENIED] ${timestamp} | User: ${userId} | Roles: ${rolesStr} | Action: ${action}`
    );
  } else {
    console.info(
      `[AUTH GRANTED] ${timestamp} | User: ${userId} | Roles: ${rolesStr} | Action: ${action}`
    );
  }
}
