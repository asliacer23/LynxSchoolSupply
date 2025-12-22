import { Link } from 'react-router-dom';
import { ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { Product } from '@/types/database';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getPrimaryImageUrl } from '@/lib/shared-services/imageService';
import { validateAddToCart, MAX_CART_ITEM_QUANTITY } from '@/lib/cart-validation';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, items } = useCartContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const imageUrl = getPrimaryImageUrl(product);
  const isOutOfStock = product.stock <= 0;

  // Find current quantity of this item in cart
  const cartItem = items.find(item => item.product_id === product.id);
  const currentQuantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart.',
      });
      return;
    }

    // Validate before adding
    const validation = validateAddToCart(product, currentQuantityInCart, quantity);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Cannot add to cart',
        description: validation.message,
      });
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(product.id, quantity);
      toast({
        title: 'Added to cart',
        description: `${quantity}x ${product.name} added to your cart.`,
      });
      setQuantity(1);
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stock);
    setQuantity(value);
  };

  const maxAddable = Math.min(
    product.stock - currentQuantityInCart,
    MAX_CART_ITEM_QUANTITY - currentQuantityInCart
  );

  return (
    <Card className="group overflow-hidden hover-lift">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Package className="h-16 w-16 text-muted-foreground" />
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
          )}
          <h3 className="font-medium line-clamp-2">{product.name}</h3>
          <p className="text-lg font-bold mt-2">₱{Number(product.price).toFixed(2)}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex flex-col gap-3">
        {!isOutOfStock && maxAddable > 0 && (
          <div className="flex items-center gap-2 w-full">
            <Input
              type="number"
              min="1"
              max={maxAddable}
              value={quantity}
              onChange={handleQuantityChange}
              className="h-10 w-20"
            />
            <span className="text-xs text-muted-foreground flex-1">
              Max: {maxAddable}
            </span>
          </div>
        )}
        {currentQuantityInCart > 0 && (
          <div className="text-xs text-muted-foreground w-full">
            {currentQuantityInCart} in cart
          </div>
        )}
        {maxAddable === 0 && !isOutOfStock && (
          <div className="flex items-center gap-2 text-xs text-warning">
            <AlertCircle className="h-3 w-3" />
            <span>Max quantity in cart</span>
          </div>
        )}
        <Button
          className="w-full"
          variant={isOutOfStock || maxAddable === 0 ? 'secondary' : 'default'}
          disabled={isOutOfStock || maxAddable === 0 || isAdding}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Out of Stock' : maxAddable === 0 ? 'Max in Cart' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
