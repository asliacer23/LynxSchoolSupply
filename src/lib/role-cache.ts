/**
 * Role Cache System
 * Caches role IDs to eliminate N+1 queries
 * Reduces notification queries from 36+ to just 1-3 per event
 */

import { supabase } from '@/lib/supabase';

interface RoleCache {
  [roleName: string]: string;
}

export class RoleCacheManager {
  private static cache: RoleCache = {};
  private static isInitialized = false;

  /**
   * Initialize the role cache on app startup
   * Should be called in App.tsx or main.tsx useEffect
   */
  static async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const { data: roles, error } = await supabase
        .from('roles')
        .select('id, name');

      if (error || !roles) {
        console.error('Failed to initialize role cache:', error);
        return;
      }

      // Build cache map: { 'cashier': 'uuid-123', 'owner': 'uuid-456', ... }
      roles.forEach(role => {
        this.cache[role.name] = role.id;
      });

      this.isInitialized = true;
      console.log('✅ Role cache initialized:', Object.keys(this.cache).length, 'roles');
    } catch (error) {
      console.error('Error initializing role cache:', error);
    }
  }

  /**
   * Get role ID by name from cache
   * Returns undefined if role not found (prevents queries for invalid roles)
   */
  static getRoleId(roleName: string): string | undefined {
    if (!this.isInitialized) {
      console.warn(`⚠️ Role cache not initialized. Call RoleCacheManager.init() first.`);
    }
    return this.cache[roleName];
  }

  /**
   * Get all cached roles
   */
  static getAllRoles(): RoleCache {
    return { ...this.cache };
  }

  /**
   * Refresh cache manually (useful if roles are added dynamically)
   */
  static async refresh(): Promise<void> {
    this.cache = {};
    this.isInitialized = false;
    await this.init();
  }

  /**
   * Get users with a specific role
   * Uses cached role ID instead of querying roles table
   */
  static async getUsersByRole(roleName: string): Promise<string[] | null> {
    const roleId = this.getRoleId(roleName);
    
    if (!roleId) {
      console.error(`Role "${roleName}" not found in cache`);
      return null;
    }

    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role_id', roleId);

    if (error) {
      console.error(`Failed to fetch users for role "${roleName}":`, error);
      return null;
    }

    return userRoles?.map(ur => ur.user_id) || [];
  }

  /**
   * Get users for multiple roles in a single operation
   * More efficient than calling getUsersByRole multiple times
   */
  static async getUsersByRoles(roleNames: string[]): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};

    const roleIds = roleNames
      .map(name => this.getRoleId(name))
      .filter(id => id !== undefined) as string[];

    if (roleIds.length === 0) {
      console.error('No valid roles found for:', roleNames);
      return result;
    }

    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select('user_id, role_id')
      .in('role_id', roleIds);

    if (error) {
      console.error('Failed to fetch users for roles:', error);
      return result;
    }

    // Map results back to role names
    roleNames.forEach(roleName => {
      const roleId = this.getRoleId(roleName);
      result[roleName] = userRoles
        ?.filter(ur => ur.role_id === roleId)
        .map(ur => ur.user_id) || [];
    });

    return result;
  }
}

// Export singleton instance
export const roleCache = RoleCacheManager;
