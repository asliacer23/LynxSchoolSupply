import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, CheckCircle, Package, AlertCircle, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/lib/shared-services/orderService';
import { getPrimaryImageUrl } from '@/lib/shared-services/imageService';
import { validateOrder } from '@/lib/cart-validation';
import { AddressModal } from '@/features/address/components/AddressModal';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const { user, profile, roles, loading: authLoading, refreshProfile } = useAuth();
  const { items, total, clearCart } = useCartContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && items.length === 0 && !success) {
      navigate('/products');
    }
  }, [items, authLoading, user, navigate, success]);

  // Validate order on mount and when items change
  useEffect(() => {
    const validation = validateOrder(items, total);
    if (!validation.valid) {
      setValidationError(validation.message);
    } else {
      setValidationError(null);
    }
  }, [items, total]);

  // Auto-open address modal if user has no address
  useEffect(() => {
    if (!authLoading && user && profile && !profile.address && !success) {
      setAddressModalOpen(true);
    }
  }, [authLoading, user, profile, success]);

  const handlePlaceOrder = async () => {
    if (!user || !profile) return;

    // Check address before placing order
    if (!profile.address || !profile.contact_num) {
      toast({
        variant: 'destructive',
        title: 'Delivery address required',
        description: 'Please add your delivery address and contact number',
      });
      setAddressModalOpen(true);
      return;
    }

    // Final validation check
    const validation = validateOrder(items, total);
    if (!validation.valid) {
      toast({
        variant: 'destructive',
        title: 'Cannot place order',
        description: validation.message,
      });
      return;
    }

    setLoading(true);
    const { data, error } = await createOrder(
      user.id, 
      items, 
      user.id, 
      roles,
      undefined,
      profile.address,
      profile.contact_num
    );
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Order failed',
        description: error.message || 'Failed to place order. Please try again.',
      });
      return;
    }

    await clearCart();
    setSuccess(true);
    toast({
      title: 'Order placed!',
      description: 'Your order has been successfully placed.',
    });
  };

  if (authLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success">
              <CheckCircle className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your order. We'll process it shortly.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/orders')}>View My Orders</Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {validationError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map(item => {
                const imageUrl = item.product ? getPrimaryImageUrl(item.product) : null;
                const isOutOfStock = !item.product || item.product.stock <= 0;
                const exceedsStock = item.product && item.quantity > item.product.stock;

                return (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      <div className="h-16 w-16 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.product?.name}
                            className="object-cover w-full h-full rounded"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ₱{Number(item.product?.price ?? 0).toFixed(2)}
                        </p>
                        {isOutOfStock && (
                          <p className="text-xs text-destructive mt-1">Out of stock</p>
                        )}
                        {exceedsStock && (
                          <p className="text-xs text-warning mt-1">
                            Only {item.product?.stock} available
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₱{(Number(item.product?.price ?? 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {(isOutOfStock || exceedsStock) && <Separator className="mt-4" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery Address Section */}
              <div className="space-y-2 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Delivery Address</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddressModalOpen(true)}
                  >
                    {profile?.address ? 'Edit' : 'Add'}
                  </Button>
                </div>
                {profile?.address ? (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="line-clamp-2">{profile.address}</p>
                    {profile.contact_num && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {profile.contact_num}
                      </p>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Delivery address required
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="font-medium">
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={
                  loading || 
                  items.length === 0 || 
                  validationError !== null ||
                  !profile?.address ||
                  !profile?.contact_num
                }
                onClick={handlePlaceOrder}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Place Order
              </Button>
              {validationError && (
                <p className="text-xs text-destructive text-center">{validationError}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {user && profile && (
        <AddressModal
          open={addressModalOpen}
          onOpenChange={setAddressModalOpen}
          profile={profile}
          userId={user.id}
          onAddressUpdated={() => refreshProfile()}
        />
      )}
    </div>
  );
}
