import { supabase } from '@/lib/supabase';
import type { Cart, CartItem, Product } from '@/types/database';

export async function getUserCart(userId: string) {
  const { data, error } = await supabase
    .from('carts')
    .select(`
      *,
      items:cart_items(
        *,
        product:products(*, category:categories(*), images:product_images(*))
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return { data: data as Cart | null, error };
}

export async function addItemToCart(cartId: string, productId: string, quantity: number) {
  // Check if item already exists
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert({ cart_id: cartId, product_id: productId, quantity })
    .select()
    .single();

  return { data, error };
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeCartItem(itemId);
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select()
    .single();

  return { data, error };
}

export async function removeCartItem(itemId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  return { error };
}

export async function clearCart(cartId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);

  return { error };
}
