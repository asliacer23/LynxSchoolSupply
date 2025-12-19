import { supabase } from '@/lib/supabase';
import { canAccess } from '@/lib/authorization';
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

// Helper to get primary image URL from product
export function getPrimaryImageUrl(product: Product): string | null {
  if (!product.images || product.images.length === 0) return null;
  const primary = product.images.find(img => img.is_primary);
  return primary?.file_url ?? product.images[0]?.file_url ?? null;
}
