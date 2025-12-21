import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Package, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct } from './hooks';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getPrimaryImageUrl } from '@/lib/shared-services/imageService';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useProduct(id!);
  const { addToCart } = useCartContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const product = data?.data;
  const imageUrl = product ? getPrimaryImageUrl(product) : null;

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart.',
      });
      navigate('/auth/login');
      return;
    }
    if (product) {
      await addToCart(product.id, 1);
      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    }
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

          <Button
            size="lg"
            className="w-full"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
}
