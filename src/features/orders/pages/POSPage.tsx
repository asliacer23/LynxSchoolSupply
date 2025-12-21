import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, DollarSign, Printer, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/lib/shared-services/productService';
import { createOrder } from '../services/orders.api';
import { createPayment } from '@/lib/shared-services/paymentService';
import { getPrimaryImageUrl } from '@/lib/shared-services/imageService';
import { PaymentForm } from '@/features/payments/components/PaymentForm';
import { Receipt } from '../components/Receipt';
import { Product } from '@/types/database';
import { useNavigate } from 'react-router-dom';
import { canAccess } from '@/lib/authorization';

interface POSCartItem {
  productId: string;
  product: Product;
  quantity: number;
}

type POSStep = 'search' | 'checkout' | 'payment' | 'receipt';

/**
 * Point of Sale Page
 * Cashier-specific order creation interface
 * Authorization: create_order + checkout permissions required
 */
export default function POSPage() {
  const { user, roles, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Authorization check
  useEffect(() => {
    if (!authLoading && (!user || !canAccess(roles, 'create_order'))) {
      navigate('/');
    }
  }, [user, authLoading, roles, navigate]);

  // POS State
  const [step, setStep] = useState<POSStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await getProducts();
    if (error) {
      toast({ variant: 'destructive', title: 'Error loading products' });
      return;
    }
    setProducts(data || []);
    setLoading(false);
  };

  // Filter products by search
  const filteredProducts = products.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cart operations
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(
        cart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { productId: product.id, product, quantity: 1 }]);
    }
    toast({ title: `${product.name} added to cart` });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(
      cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart is empty',
        description: 'Add items before checkout',
      });
      return;
    }

    setCheckoutLoading(true);

    // Transform POSCartItem to CartItem format expected by createOrder
    const cartItemsForOrder = cart.map(item => ({
      product_id: item.productId,
      product: item.product,
      quantity: item.quantity,
    }));

    // Create order
    // NOTE: For walk-in customers (no customer account), user_id should be null
    // Only pass user_id if there's an actual customer account (not cashier)
    // This prevents the cashier from receiving customer notifications
    const { data: orderData, error: orderError } = await createOrder(
      null, // Walk-in customer - no user_id
      cartItemsForOrder as any,
      user?.id || '', // currentUserId (cashier's own ID for authorization check)
      roles,
      user?.id || undefined // cashierId (explicitly pass cashier ID)
    );

    if (orderError) {
      toast({
        variant: 'destructive',
        title: 'Failed to create order',
        description: orderError.message,
      });
      setCheckoutLoading(false);
      return;
    }

    const newOrderId = orderData?.id || null;
    if (newOrderId) {
      // Create payment record
      const { data: paymentData, error: paymentError } = await createPayment(
        {
          order_id: newOrderId,
          method: 'cash',
          status: 'completed',
          amount: total,
        },
        user?.id
      );

      if (paymentError) {
        toast({
          variant: 'destructive',
          title: 'Failed to create payment',
          description: paymentError.message,
        });
        setCheckoutLoading(false);
        return;
      }

      const newPaymentId = paymentData?.id || null;
      setOrderId(newOrderId);
      setPaymentId(newPaymentId);
      setCreatedAt(new Date().toISOString());
      setStep('payment');
    }

    setCheckoutLoading(false);
  };

  const handlePaymentSuccess = () => {
    setStep('receipt');
  };

  const resetPOS = () => {
    setCart([]);
    setOrderId(null);
    setPaymentId(null);
    setCreatedAt(null);
    setStep('search');
    setSearchQuery('');
  };

  if (authLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Step: Search & Add Items
  if (step === 'search') {
    return (
      <div className="container py-4">
        <h1 className="text-3xl font-bold mb-6">Cashier - Point of Sale</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product Search */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Find Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name or category..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No products found'}
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <Button
                        key={product.id}
                        variant="outline"
                        className="h-auto flex flex-col items-start p-2 hover:bg-primary/10"
                        onClick={() => addToCart(product)}
                      >
                        {/* Product Image */}
                        <div className="w-full h-16 bg-muted rounded mb-2 flex items-center justify-center">
                          {getPrimaryImageUrl(product) ? (
                            <img
                              src={getPrimaryImageUrl(product) || ''}
                              alt={product.name}
                              className="h-full w-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">No image</span>
                          )}
                        </div>
                        {/* Product Info */}
                        <div className="w-full text-left">
                          <p className="text-xs font-medium line-clamp-2">{product.name}</p>
                          <p className="text-xs text-primary font-bold mt-1">
                            ₱{Number(product.price).toFixed(2)}
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Stock: {product.stock}
                          </Badge>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart Summary */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded p-2">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Cart is empty
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.productId} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <div className="flex-1">
                          <p className="text-xs font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₱{Number(item.product.price).toFixed(2)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Items:</span>
                        <span className="font-medium">
                          {cart.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">₱{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0 || checkoutLoading}
                  onClick={handleCheckout}
                >
                  {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <DollarSign className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </Button>

                {cart.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => setCart([])}>
                    Clear Cart
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Step: Payment
  if (step === 'payment' && orderId) {
    return (
      <div className="container py-4">
        <h1 className="text-3xl font-bold mb-6">Process Payment</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {orderId && paymentId && (
              <PaymentForm
                paymentId={paymentId}
                orderId={orderId}
                amount={total}
                onSuccess={handlePaymentSuccess}
              />
            )}
          </div>

          {/* Order Summary */}
          <Card className="sticky top-4 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ₱{(Number(item.product.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">₱{total.toFixed(2)}</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setStep('search')}
              >
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step: Receipt
  if (step === 'receipt' && orderId && createdAt) {
    return (
      <div className="container py-4">
        <h1 className="text-3xl font-bold mb-6">Payment Successful!</h1>

        <div className="max-w-2xl mx-auto space-y-6">
          <Receipt
            orderId={orderId}
            items={cart}
            total={total}
            createdAt={createdAt}
          />

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={resetPOS}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
