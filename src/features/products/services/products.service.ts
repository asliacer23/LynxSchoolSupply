import { supabase } from '@/lib/supabase';
import { canAccess } from '@/lib/authorization';
import { logProductCreated, logProductUpdated, logAction } from '@/lib/audit-logger';
import type { Product, Category, ProductImage, RoleName } from '@/types/database';

/**
 * Get products with role-based filtering
 * - Guests & Users: See only active products
 * - Staff: See all products including inactive/archived
 */
export async function getProducts(categoryId?: string, userRoles: RoleName[] = []) {
  const isStaff = userRoles.some(role => canAccess([role], 'view_dashboard'));
  
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .order('name');

  // Apply filters based on role
  if (!isStaff) {
    query = query.eq('is_active', true).eq('is_archived', false);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  return { data: data as Product[] | null, error };
}

export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .eq('id', id)
    .maybeSingle();

  return { data: data as Product | null, error };
}

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return { data: data as Category[] | null, error };
}

export async function searchProducts(query: string, userRoles: RoleName[] = []) {
  const isStaff = userRoles.some(role => canAccess([role], 'view_dashboard'));
  
  let searchQuery = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .ilike('name', `%${query}%`)
    .order('name');

  // Apply filters based on role
  if (!isStaff) {
    searchQuery = searchQuery.eq('is_active', true).eq('is_archived', false);
  }

  const { data, error } = await searchQuery;
  return { data: data as Product[] | null, error };
}

// Re-export shared image utility for convenience
export { getPrimaryImageUrl } from '@/lib/shared-services/imageService';

/**
 * Upload a photo for a product to the SchoolSupplyPhotos bucket
 */
export async function uploadProductPhoto(productId: string, file: File, userId?: string) {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const fileName = `${productId}/${timestamp}-${random}.${extension}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('SchoolSupplyPhotos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('SchoolSupplyPhotos')
      .getPublicUrl(uploadData.path);

    // Insert into product_images table
    const { data: imageData, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        file_url: urlData.publicUrl,
        is_primary: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log image upload
    if (userId) {
      await logAction(userId, 'CREATE', 'product_images', imageData.id, {
        product_id: productId,
        file_name: file.name,
        file_size: file.size,
      });
    }

    return { data: imageData as ProductImage, error: null };
  } catch (error: any) {
    console.error('Photo upload error:', error);
    return { data: null, error };
  }
}

/**
 * Delete a product photo
 */
export async function deleteProductPhoto(photoId: string, userId?: string) {
  try {
    // Get the photo record first
    const { data: photoData, error: fetchError } = await supabase
      .from('product_images')
      .select('file_url')
      .eq('id', photoId)
      .single();

    if (fetchError) throw fetchError;

    // Extract the path from the file URL
    const url = new URL(photoData.file_url);
    const path = url.pathname.split('/storage/v1/object/public/SchoolSupplyPhotos/')[1];

    // Delete from storage
    const { error: deleteStorageError } = await supabase.storage
      .from('SchoolSupplyPhotos')
      .remove([path]);

    if (deleteStorageError) throw deleteStorageError;

    // Delete the record from product_images table
    const { error: deleteDbError } = await supabase
      .from('product_images')
      .delete()
      .eq('id', photoId);

    if (deleteDbError) throw deleteDbError;

    // Log image deletion
    if (userId) {
      await logAction(userId, 'DELETE', 'product_images', photoId, {
        timestamp: new Date().toISOString(),
      });
    }

    return { data: null, error: null };
  } catch (error: any) {
    console.error('Photo deletion error:', error);
    return { data: null, error };
  }
}

/**
 * Create a new product
 * Isolated in products feature
 */
export async function createProduct(
  product: { name: string; price: number; stock?: number; description?: string; category_id?: string; is_active?: boolean },
  userRoles: RoleName[] = [],
  userId?: string
) {
  const { data, error } = await supabase
    .from('products')
    .insert({ ...product, created_by: userId })
    .select()
    .single();

  // Log product creation
  if (data && !error && userId) {
    await logProductCreated(userId, data.id, product.name);
  }

  return { data: data as Product | null, error };
}

/**
 * Update a product
 * Isolated in products feature
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  userRoles: RoleName[] = [],
  userId?: string
) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  // Log product update
  if (data && !error && userId) {
    await logProductUpdated(userId, id, updates);
  }

  return { data: data as Product | null, error };
}

/**
 * Check if product has orders
 * Isolated in products feature
 */
export async function checkProductOrders(id: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select('id')
    .eq('product_id', id)
    .limit(1);

  return { hasOrders: (data?.length ?? 0) > 0, error };
}

/**
 * Delete a product
 * Isolated in products feature
 */
export async function deleteProduct(id: string, userRoles: RoleName[] = [], userId?: string) {
  // Check if product has any orders
  const { hasOrders, error: checkError } = await checkProductOrders(id);
  
  if (checkError) {
    return { data: null, error: checkError };
  }

  if (hasOrders) {
    return { data: null, error: new Error('Cannot delete product with orders. Archive instead.') };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  // Log product deletion
  if (!error && userId) {
    await logAction(userId, 'DELETE', 'products', id, {
      timestamp: new Date().toISOString(),
    });
  }

  return { data: null, error };
}

/**
 * Archive a product
 * Isolated in products feature
 */
export async function archiveProduct(
  id: string,
  userRoles: RoleName[] = [],
  userId?: string
) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: true, is_active: false })
    .eq('id', id)
    .select()
    .single();

  // Log product archive
  if (data && !error && userId) {
    await logAction(userId, 'UPDATE', 'products', id, {
      action: 'archived',
      timestamp: new Date().toISOString(),
    });
  }

  return { data: data as Product | null, error };
}

/**
 * Unarchive a product
 * Isolated in products feature
 */
export async function unarchiveProduct(
  id: string,
  userRoles: RoleName[] = [],
  userId?: string
) {
  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: false })
    .eq('id', id)
    .select()
    .single();

  // Log product unarchive
  if (data && !error && userId) {
    await logAction(userId, 'UPDATE', 'products', id, {
      action: 'unarchived',
      timestamp: new Date().toISOString(),
    });
  }

  return { data: data as Product | null, error };
}

/**
 * Get all products (admin view)
 * Isolated in products feature
 */
export async function getAllProducts(userRoles: RoleName[] = []) {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*)')
    .order('name');

  return { data: data as Product[] | null, error };
}
