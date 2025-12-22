import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProduct } from '../hooks/useProducts';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getPrimaryImageUrl } from '@/lib/shared-services/imageService';
import { validateAddToCart, MAX_CART_ITEM_QUANTITY, getStockMessage } from '@/lib/cart-validation';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useProduct(id!);
  const { addToCart, items } = useCartContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const product = data?.data;
  const imageUrl = product ? getPrimaryImageUrl(product) : null;

  // Find current quantity of this item in cart
  const cartItem = items.find(item => item.product_id === product?.id);
  const currentQuantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart.',
      });
      navigate('/auth/login');
      return;
    }

    if (!product) return;

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
    const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), product?.stock || 1);
    setQuantity(value);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground text-lg">Product not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxAddable = Math.min(
    product.stock - currentQuantityInCart,
    MAX_CART_ITEM_QUANTITY - currentQuantityInCart
  );

  return (
    <div className="container py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => navigate('/products')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <Package className="h-24 w-24 text-muted-foreground" />
          )}
        </div>

        <div className="space-y-6">
          {product.category && (
            <Badge variant="secondary">{product.category.name}</Badge>
          )}
          
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <p className="text-4xl font-bold">₱{Number(product.price).toFixed(2)}</p>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="secondary">Only {product.stock} left</Badge>
            ) : (
              <div className="flex items-center text-sm text-success">
                <Check className="mr-1 h-4 w-4" />
                In Stock
              </div>
            )}
          </div>

          {/* Stock info and quantity selector */}
          {!isOutOfStock && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {getStockMessage(product.stock, currentQuantityInCart)}
              </p>
              
              {maxAddable > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Quantity:</label>
                  <Input
                    type="number"
                    min="1"
                    max={maxAddable}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-20"
                  />
                  <span className="text-xs text-muted-foreground">
                    (Max: {maxAddable})
                  </span>
                </div>
              )}

              {maxAddable === 0 && !isOutOfStock && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Maximum quantity ({MAX_CART_ITEM_QUANTITY}) already in cart
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={isOutOfStock || maxAddable === 0 || isAdding}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isOutOfStock ? 'Out of Stock' : maxAddable === 0 ? 'Max in Cart' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
