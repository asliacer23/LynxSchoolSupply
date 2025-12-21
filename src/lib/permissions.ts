/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines what each role can do in the system
 */

import type { RoleName, Permission } from '@/types/database';

/**
 * Permission matrix defining what each role can do
 * 
 * SUPERADMIN: Full system access (16 permissions)
 * OWNER: Business operations & order management (14 permissions)
 * CASHIER: POS operations only (5 permissions - no order management)
 * USER: Shopping only (6 permissions)
 */
const rolePermissions: Record<RoleName, Permission[]> = {
  superadmin: [
    'view_products',
    'create_product',
    'edit_product',
    'delete_product',
    'manage_categories',
    'view_cart',
    'add_to_cart',
    'checkout',
    'view_own_orders',
    'view_all_orders',
    'create_order',
    'update_order_status',
    'view_dashboard',
    'manage_users',
    'access_admin_panel',
    'view_audit_logs',
  ],
  owner: [
    'view_products',
    'create_product',
    'edit_product',
    'delete_product',
    'manage_categories',
    'view_cart',
    'add_to_cart',
    'checkout',
    'view_own_orders',
    'view_all_orders',
    'create_order',
    'update_order_status',
    'view_dashboard',
    'manage_users',
    'access_admin_panel',
    'view_audit_logs',
  ],
  cashier: [
    'view_products',
    'checkout',
    'view_own_orders', // Cashier can only see their own sales
    'create_order',
    'view_dashboard', // Cashier-specific dashboard (sales only)
  ],
  user: [
    'view_products',
    'view_cart',
    'add_to_cart',
    'checkout',
    'view_own_orders',
    'create_order',
  ],
};

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: RoleName): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: RoleName, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}

/**
 * Check if any of the provided roles have a specific permission
 */
export function hasAnyPermission(roles: RoleName[], permission: Permission): boolean {
  return roles.some(role => hasPermission(role, permission));
}

/**
 * Check if all of the provided roles have a specific permission
 */
export function hasAllPermissions(roles: RoleName[], permission: Permission): boolean {
  return roles.every(role => hasPermission(role, permission));
}

/**
 * Get all unique permissions across multiple roles
 */
export function getAggregatePermissions(roles: RoleName[]): Permission[] {
  const permissions = new Set<Permission>();
  roles.forEach(role => {
    getRolePermissions(role).forEach(permission => permissions.add(permission));
  });
  return Array.from(permissions);
}

/**
 * Role hierarchy - higher roles inherit lower role capabilities
 */
export const roleHierarchy: Record<RoleName, number> = {
  superadmin: 4,
  owner: 3,
  cashier: 2,
  user: 1,
};

/**
 * Check if one role is at or above another in hierarchy
 */
export function isRoleAboveOrEqual(role: RoleName, targetRole: RoleName): boolean {
  return roleHierarchy[role] >= roleHierarchy[targetRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: RoleName): string {
  const displayNames: Record<RoleName, string> = {
    superadmin: 'Super Admin',
    owner: 'Store Owner',
    cashier: 'Cashier',
    user: 'Customer',
  };
  return displayNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: RoleName): string {
  const descriptions: Record<RoleName, string> = {
    superadmin: 'Full system access - can manage everything',
    owner: 'Can manage products, categories, and view orders',
    cashier: 'Can process orders and manage sales',
    user: 'Regular customer with shopping capabilities',
  };
  return descriptions[role];
}

/**
 * Default permissions for each role (for quick reference)
 */
export const roleFeatureAccess: Record<RoleName, {
  name: string;
  features: string[];
}> = {
  superadmin: {
    name: 'Super Admin',
    features: [
      'View Products',
      'Create/Edit/Delete Products',
      'Manage Categories',
      'Create & Checkout Orders',
      'View All Orders',
      'Update Order Status',
      'View Dashboard',
      'Manage Users',
      'Access Admin Panel',
    ],
  },
  owner: {
    name: 'Store Owner',
    features: [
      'View Products',
      'Create/Edit/Delete Products',
      'Manage Categories',
      'View All Orders',
      'Update Order Status',
      'View Dashboard',
      'Manage Users',
      'Access Admin Panel',
    ],
  },
  cashier: {
    name: 'Cashier',
    features: [
      'View Products',
      'Create & Checkout Orders',
      'View All Orders',
      'Update Order Status',
      'View Dashboard',
    ],
  },
  user: {
    name: 'Customer',
    features: [
      'View Products',
      'View Cart',
      'Add to Cart',
      'Checkout',
      'View Own Orders',
    ],
  },
};
