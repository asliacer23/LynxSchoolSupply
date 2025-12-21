import { supabase } from '@/lib/supabase';

export async function updateProfile(userId: string, updates: {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  address?: string;
}) {
  try {
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
