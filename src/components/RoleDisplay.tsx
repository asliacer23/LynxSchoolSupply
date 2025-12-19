import type { RoleName } from '@/types/database';
import { getRoleDisplayName, getRoleDescription } from '@/lib/permissions';
import { Badge } from '@/components/ui/badge';

interface RoleBadgeProps {
  role: RoleName;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

/**
 * Display a role as a styled badge
 */
export function RoleBadge({ role, variant = 'default' }: RoleBadgeProps) {
  const roleColors: Record<RoleName, string> = {
    superadmin: 'bg-red-600',
    owner: 'bg-blue-600',
    cashier: 'bg-green-600',
    user: 'bg-gray-600',
  };

  return (
    <Badge className={`${roleColors[role]} text-white`}>
      {getRoleDisplayName(role)}
    </Badge>
  );
}

interface RoleTagProps {
  role: RoleName;
  showDescription?: boolean;
}

/**
 * Display a role with optional description
 */
export function RoleTag({ role, showDescription = false }: RoleTagProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <RoleBadge role={role} />
      </div>
      {showDescription && (
        <p className="text-sm text-gray-600">{getRoleDescription(role)}</p>
      )}
    </div>
  );
}

interface RolesListProps {
  roles: RoleName[];
  showDescription?: boolean;
}

/**
 * Display multiple roles as a list
 */
export function RolesList({ roles, showDescription = false }: RolesListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map(role => (
        <RoleTag key={role} role={role} showDescription={showDescription} />
      ))}
    </div>
  );
}

interface RolePermissionsProps {
  role: RoleName;
}

/**
 * Display all permissions for a specific role
 */
export function RolePermissions({ role }: RolePermissionsProps) {
  const permissions: Record<RoleName, string[]> = {
    superadmin: [
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
    owner: [
      'View Products',
      'Create/Edit/Delete Products',
      'Manage Categories',
      'View All Orders',
      'Update Order Status',
      'View Dashboard',
      'Manage Users',
      'Access Admin Panel',
    ],
    cashier: [
      'View Products',
      'Create & Checkout Orders',
      'View All Orders',
      'Update Order Status',
      'View Dashboard',
    ],
    user: [
      'View Products',
      'View Cart',
      'Add to Cart',
      'Checkout',
      'View Own Orders',
    ],
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{getRoleDisplayName(role)} Permissions</h3>
      <ul className="list-disc list-inside space-y-1">
        {permissions[role].map((permission, idx) => (
          <li key={idx} className="text-sm text-gray-700">
            {permission}
          </li>
        ))}
      </ul>
    </div>
  );
}
