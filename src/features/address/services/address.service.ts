import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/database';

export async function updateAddressAndContact(
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
      return { success: false, error };
    }

    return { success: true, data: data as Profile };
  } catch (error) {
    console.error('Error updating address and contact:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

export async function getAddress(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('address, contact_num')
      .eq('id', userId)
      .single();

    if (error) {
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching address:', error);
    return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}
