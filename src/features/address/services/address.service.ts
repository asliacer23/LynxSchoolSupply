import { supabase } from '@/integrations/supabase/client';

export interface UserAddress {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string | null;
  contact_num: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressInput {
  label?: string;
  recipient_name?: string;
  contact_num?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

// Type-safe wrapper for Supabase queries on user_addresses table
// Since the table may not be in generated types, we use any to bypass TypeScript checking
type AddressQuery = ReturnType<typeof supabase.from> & {
  select: (columns: string) => any;
  insert: (data: any) => any;
  update: (data: any) => any;
  delete: () => any;
};

/**
 * Helper function to safely query the user_addresses table
 * Works around TypeScript type limitations with Supabase client
 */
function getAddressTable() {
  return ((supabase as any).from('user_addresses') as unknown) as AddressQuery;
}

/**
 * Fetch all addresses for a user
 */
export async function getUserAddresses(userId: string) {
  try {
    const { data, error } = await getAddressTable()
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: (data || []) as UserAddress[] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch addresses',
      data: [],
    };
  }
}

/**
 * Get a single address by ID
 */
export async function getAddressById(addressId: string, userId: string) {
  try {
    const { data, error } = await getAddressTable()
      .select('*')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: (data as UserAddress) || null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch address',
      data: null,
    };
  }
}

/**
 * Get the default address for a user
 */
export async function getDefaultAddress(userId: string) {
  try {
    const { data, error } = await getAddressTable()
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is acceptable
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: (data as UserAddress) || null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch default address',
      data: null,
    };
  }
}

/**
 * Create a new address for a user
 * If it's marked as default, other addresses will have is_default set to false
 */
export async function createAddress(userId: string, addressInput: CreateAddressInput) {
  try {
    const isDefault = addressInput.is_default || false;

    // If setting as default, unset other default addresses
    if (isDefault) {
      await getAddressTable()
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data, error } = await getAddressTable()
      .insert({
        user_id: userId,
        label: addressInput.label || null,
        recipient_name: addressInput.recipient_name || null,
        contact_num: addressInput.contact_num || null,
        address_line1: addressInput.address_line1,
        address_line2: addressInput.address_line2 || null,
        city: addressInput.city,
        state: addressInput.state || null,
        postal_code: addressInput.postal_code || null,
        country: addressInput.country || 'PH',
        is_default: isDefault,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: (data as UserAddress) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create address',
      data: null,
    };
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(addressId: string, userId: string, addressInput: Partial<CreateAddressInput>) {
  try {
    const isDefault = addressInput.is_default;

    // If setting as default, unset other default addresses
    if (isDefault) {
      await getAddressTable()
        .update({ is_default: false })
        .eq('user_id', userId)
        .neq('id', addressId)
        .eq('is_default', true);
    }

    const updateData: Partial<UserAddress> = {};
    
    if (addressInput.label !== undefined) updateData.label = addressInput.label || null;
    if (addressInput.recipient_name !== undefined) updateData.recipient_name = addressInput.recipient_name || null;
    if (addressInput.contact_num !== undefined) updateData.contact_num = addressInput.contact_num || null;
    if (addressInput.address_line1 !== undefined) updateData.address_line1 = addressInput.address_line1;
    if (addressInput.address_line2 !== undefined) updateData.address_line2 = addressInput.address_line2 || null;
    if (addressInput.city !== undefined) updateData.city = addressInput.city;
    if (addressInput.state !== undefined) updateData.state = addressInput.state || null;
    if (addressInput.postal_code !== undefined) updateData.postal_code = addressInput.postal_code || null;
    if (addressInput.country !== undefined) updateData.country = addressInput.country || 'PH';
    if (isDefault !== undefined) updateData.is_default = isDefault;
    
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await getAddressTable()
      .update(updateData)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: (data as UserAddress) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update address',
      data: null,
    };
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(addressId: string, userId: string) {
  try {
    // First check if this is the default address
    const { data: addressData } = await getAddressTable()
      .select('is_default')
      .eq('id', addressId)
      .eq('user_id', userId)
      .single();

    const wasDefault = (addressData as any)?.is_default;

    // Delete the address
    const { error } = await getAddressTable()
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // If it was the default, set the most recent address as default
    if (wasDefault) {
      const { data: addresses } = await getAddressTable()
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (addresses && (addresses as any[]).length > 0) {
        await getAddressTable()
          .update({ is_default: true })
          .eq('id', (addresses as any[])[0].id);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete address',
    };
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddress(addressId: string, userId: string) {
  try {
    // Unset all other default addresses
    await getAddressTable()
      .update({ is_default: false })
      .eq('user_id', userId)
      .neq('id', addressId);

    // Set this address as default
    const { data, error } = await getAddressTable()
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: (data as UserAddress) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set default address',
      data: null,
    };
  }
}

/**
 * Update user's delivery address and contact number (legacy - kept for backward compatibility)
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

