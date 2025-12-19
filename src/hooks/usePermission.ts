import { useAuth } from './useAuth';
import { canAccess, getAccessibleFeatures } from '@/lib/authorization';
import type { Permission, RoleName } from '@/types/database';

/**
 * Hook to check permissions in components
 */
export function usePermission() {
  const { roles } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    return canAccess(roles, permission);
  };

  const can = (action: string): boolean => {
    return hasPermission(action as Permission);
  };

  const getAccessibleFeatures = (): Set<string> => {
    const features = new Set<string>();
    
    roles.forEach(role => {
      if (role === 'superadmin' || role === 'owner') {
        features.add('products');
        features.add('categories');
        features.add('orders');
        features.add('dashboard');
        features.add('admin');
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
  };

  return {
    hasPermission,
    can,
    getAccessibleFeatures,
  };
}

/**
 * Hook to get user role information
 */
export function useRoles() {
  const { roles, hasRole, isAdmin, isCashier, isStaff } = useAuth();

  const isSuperAdmin = () => hasRole('superadmin');
  const isOwner = () => hasRole('owner');
  const isUser = () => hasRole('user');
  const isCashierRole = () => hasRole('cashier');

  return {
    roles,
    hasRole,
    isAdmin,
    isCashier,
    isStaff,
    isSuperAdmin,
    isOwner,
    isUser,
    isCashierRole,
  };
}
