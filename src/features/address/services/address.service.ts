import { supabase } from '@/integrations/supabase/client';

/**
 * Update user's delivery address and contact number
 */
export async function updateUserAddressAndContact(
  userId: string,
  address: string,
  contactNum: string
) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        address,
        contact_num: contactNum,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update address',
    };
  }
}

