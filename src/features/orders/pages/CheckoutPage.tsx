import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Loader2, CheckCircle, Package, AlertCircle, MapPin } from 'lucide-react';
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
import { getUserAddresses, UserAddress } from '@/features/address/services/address.service';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const { user, roles, loading: authLoading } = useAuth();
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

  // Load user addresses
  useEffect(() => {
    if (user && user.id) {
      setLoadingAddresses(true);
      getUserAddresses(user.id).then(result => {
        if (result.success) {
          setAddresses(result.data);
          const defaultAddr = result.data.find(a => a.is_default);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          } else if (result.data.length > 0) {
            setSelectedAddressId(result.data[0].id);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error loading addresses',
            description: 'Please try again',
          });
        }
        setLoadingAddresses(false);
      });
    }
  }, [user, toast]);

  // Validate order on mount and when items change
  useEffect(() => {
    const validation = validateOrder(items, total);
    if (!validation.valid) {
      setValidationError(validation.message);
    } else {
      setValidationError(null);
    }
  }, [items, total]);

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (!selectedAddressId) {
      toast({
        variant: 'destructive',
        title: 'No address selected',
        description: 'Please select a delivery address',
      });
      return;
    }

    const selectedAddr = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddr) {
      toast({
        variant: 'destructive',
        title: 'Invalid address',
        description: 'Please select a valid delivery address',
      });
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
      {
        shipping_address: {
          recipient_name: selectedAddr.recipient_name,
          address_line1: selectedAddr.address_line1,
          address_line2: selectedAddr.address_line2,
          city: selectedAddr.city,
          state: selectedAddr.state,
          postal_code: selectedAddr.postal_code,
          country: selectedAddr.country,
          contact_num: selectedAddr.contact_num,
        },
      }
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery Address
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/addresses')}
                  className="text-xs h-auto py-1"
                >
                  Manage
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {loadingAddresses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6 space-y-3">
                  <div className="flex justify-center">
                    <div className="bg-muted p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No addresses yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add an address to proceed
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate('/addresses')}
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === address.id
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex gap-2">
                        <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                          selectedAddressId === address.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedAddressId === address.id && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {address.label && (
                              <p className="text-xs font-semibold text-primary">
                                {address.label}
                              </p>
                            )}
                            {address.is_default && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          {address.recipient_name && (
                            <p className="font-medium text-xs mt-1">{address.recipient_name}</p>
                          )}
                          <p className="text-xs text-foreground/80 line-clamp-2">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-xs text-foreground/70">
                            {address.city}
                            {address.state && `, ${address.state}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Order Summary */}
              <div className="space-y-3 pt-2">
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
                </div>
              <Button
                className="w-full"
                size="lg"
                disabled={loading || items.length === 0 || validationError !== null}
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
    </div>
  );
}
