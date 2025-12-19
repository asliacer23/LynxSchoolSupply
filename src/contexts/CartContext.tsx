import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem, Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { getUserCart, addItemToCart, updateCartItemQuantity, removeCartItem, clearCart as clearCartService } from '@/features/cart/service';
import { getPrimaryImageUrl } from '@/features/products/service';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | null>(null);

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await getUserCart(user.id);
    setCart(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!cart) return;
    await addItemToCart(cart.id, productId, quantity);
    await refreshCart();
  }, [cart, refreshCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    await updateCartItemQuantity(itemId, quantity);
    await refreshCart();
  }, [refreshCart]);

  const removeItem = useCallback(async (itemId: string) => {
    await removeCartItem(itemId);
    await refreshCart();
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    if (!cart) return;
    await clearCartService(cart.id);
    await refreshCart();
  }, [cart, refreshCart]);

  const items = cart?.items ?? [];
  const total = items.reduce(
    (sum, item) => sum + (Number(item.product?.price ?? 0) * item.quantity),
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      items,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
      total,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}
