import { supabase } from '@/lib/supabase';
import { canAccess } from '@/lib/authorization';
import type { RoleName } from '@/types/database';

/**
 * Update a user's profile
 * Requires either:
 * - edit_profile permission (for admins to edit any profile)
 * - edit_own_profile permission (for regular users to edit their own profile)
 */
export async function updateProfile(
  userId: string, 
  updates: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
    address?: string;
  },
  currentUserId?: string,
  userRoles?: RoleName[]
) {
  try {
    // Authorization check
    if (currentUserId && userRoles) {
      const canEditAnyProfile = canAccess(userRoles, 'edit_profile');
      const canEditOwnProfile = canAccess(userRoles, 'edit_own_profile');
      
      // Check if user has permission to edit this profile
      if (!canEditAnyProfile && !(canEditOwnProfile && currentUserId === userId)) {
        return { 
          success: false, 
          error: new Error('You do not have permission to edit this profile') 
        };
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return { success: false, error };
    }

    console.log('✅ Profile updated:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Profile update failed:', error);
    return { success: false, error };
  }
}
