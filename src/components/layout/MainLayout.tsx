import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { CartDrawer } from '@/features/orders/components/CartDrawer';
import { CartProvider, useCartContext } from '@/contexts/CartContext';

function MainLayoutContent() {
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCartContext();

  return (
    <div className="min-h-screen bg-background">
      <Header cartCount={itemCount} onCartClick={() => setCartOpen(true)} />
      <main className="fade-in">
        <Outlet />
      </main>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

export function MainLayout() {
  return (
    <CartProvider>
      <MainLayoutContent />
    </CartProvider>
  );
}
