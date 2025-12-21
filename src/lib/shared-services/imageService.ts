import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

/**
 * Get primary image URL from product object
 * Shared utility - used by all features
 */
export function getPrimaryImageUrl(product: Product | null): string | null {
  if (!product) return null;
  
  const images = (product as any).images as Array<{ file_url: string; is_primary: boolean }> | undefined;
  if (!images || images.length === 0) return null;
  
  const primaryImage = images.find(img => img.is_primary);
  if (primaryImage?.file_url) return primaryImage.file_url;
  
  return images[0]?.file_url || null;
}

/**
 * Get primary image URL by product ID
 * Shared utility - fetches from database
 */
export async function getPrimaryImageUrlById(productId: string): Promise<string | null> {
  if (!productId) return null;

  const { data, error } = await supabase
    .from('product_images')
    .select('file_url')
    .eq('product_id', productId)
    .eq('is_primary', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching primary image:', error);
    return null;
  }

  return data?.file_url || null;
}
