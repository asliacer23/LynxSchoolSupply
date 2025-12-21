import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

/**
 * Get all active products (for public/ordering pages)
 * Shared by: orders (POS), cart, products listing
 */
export async function getProducts(categoryId?: string) {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('name');

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  return { data: data as Product[] | null, error };
}

/**
 * Get single product by ID
 */
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
