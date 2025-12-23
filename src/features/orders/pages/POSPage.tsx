import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, DollarSign, Printer, Loader2, X, Package } from 'lucide-react';
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
import { canAccess } from '@/lib/authorization';

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

type POSStep = 'search' | 'checkout' | 'payment' | 'receipt';

/**
 * Point of Sale (POS) Page - Mobile-First Design
 * Cashier interface for creating walk-in customer orders
 * Authorization: create_order permission required
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

  // State Management
  const [step, setStep] = useState<POSStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data, error } = await getProducts();
    if (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Error loading products',
        description: error.message 
      });
      return;
    }
    setProducts(data || []);
    setLoading(false);
  };

  // Filter products by search
  const filteredProducts = products.filter(p =>
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

    // Create order
    const cartItemsForOrder = cart.map(item => ({
      product_id: item.productId,
      product: item.product,
      quantity: item.quantity,
    }));

    const { data: orderData, error: orderError } = await createOrder(
      null, // Walk-in customer
      cartItemsForOrder as any,
      user?.id || '',
      roles,
      user?.id || undefined
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
      // Create payment
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

  // STEP 1: Search & Add Items
  if (step === 'search') {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-background to-muted/30 flex flex-col">
        {/* Header */}
        <div className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
          <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold">Point of Sale</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Search and add items to cart</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-4 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full flex-1 min-h-0">
              {/* Products Section */}
              <div className="lg:col-span-2 flex flex-col min-h-0">
                <Card className="flex flex-col h-full">
                  <CardHeader className="border-b shrink-0">
                    <CardTitle className="text-base sm:text-lg">Find Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex flex-col flex-1 overflow-hidden py-4">
                    {/* Search Bar */}
                    <div className="relative shrink-0">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 h-10"
                      />
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 overflow-y-auto flex-1 pr-2">
                      {loading ? (
                        <div className="col-span-full flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          {searchQuery ? 'No products found' : 'Loading products...'}
                        </div>
                      ) : (
                        filteredProducts.map(product => (
                          <div
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="group cursor-pointer rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all active:scale-95 overflow-hidden flex flex-col h-full"
                          >
                            {/* Image Container */}
                            <div className="relative w-full aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/5 transition-colors">
                              {getPrimaryImageUrl(product) ? (
                                <img
                                  src={getPrimaryImageUrl(product) || ''}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground">
                                  <Package className="h-8 w-8 mb-1 opacity-50" />
                                  <span className="text-xs">No image</span>
                                </div>
                              )}
                              
                              {/* Stock Badge */}
                              <Badge 
                                variant={product.stock === 0 ? "destructive" : "secondary"}
                                className="absolute top-2 right-2 text-xs"
                              >
                                {product.stock === 0 ? 'Out of Stock' : `${product.stock} Available`}
                              </Badge>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col flex-1 p-2 sm:p-3">
                              <p className="text-xs sm:text-sm font-semibold line-clamp-2 flex-1">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Stock: {product.stock} available
                              </p>
                              <div className="flex items-end justify-between mt-2 pt-2 border-t border-border/50">
                                <div>
                                  <p className="text-xs text-muted-foreground">Price</p>
                                  <p className="text-sm sm:text-base font-bold text-primary">
                                    ₱{Number(product.price).toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cart Summary */}
              <div className="lg:col-span-1 flex flex-col min-h-0">
                <Card className="flex flex-col h-full lg:sticky lg:top-4">
                  <CardHeader className="border-b shrink-0">
                    <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex flex-col flex-1 overflow-hidden py-4">
                    {/* Cart Items */}
                    <div className="space-y-2 overflow-y-auto border rounded p-2 flex-1">
                      {cart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Cart is empty
                        </p>
                      ) : (
                        cart.map(item => (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between gap-2 p-2 bg-muted rounded text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium line-clamp-1">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ₱{Number(item.product.price).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-4 text-center text-xs font-bold">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive hover:bg-destructive/10 ml-1"
                                onClick={() => removeFromCart(item.productId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Totals & Actions */}
                    {cart.length > 0 && (
                      <>
                        <Separator className="shrink-0" />
                        <div className="space-y-3 shrink-0">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Items:</span>
                            <span className="font-semibold">
                              {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-base sm:text-lg font-bold bg-primary/10 p-2 rounded">
                            <span>Total:</span>
                            <span className="text-primary">₱{total.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Buttons */}
                    <div className="space-y-2 shrink-0 mt-auto">
                      <Button
                        className="w-full gap-2"
                        size="lg"
                        disabled={cart.length === 0 || checkoutLoading}
                        onClick={handleCheckout}
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4" />
                            <span>Checkout</span>
                          </>
                        )}
                      </Button>

                      {cart.length > 0 && (
                        <Button variant="outline" className="w-full" onClick={() => setCart([])}>
                          <X className="h-4 w-4 mr-2" />
                          Clear Cart
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Payment
  if (step === 'payment' && orderId) {
    return (
      <div className="container py-4">
        <h1 className="text-3xl font-bold mb-6">Process Payment</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {paymentId && (
              <PaymentForm
                paymentId={paymentId}
                orderId={orderId}
                amount={total}
                onSuccess={handlePaymentSuccess}
              />
            )}
          </div>

          {/* Summary */}
          <Card className="sticky top-4 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span>{item.product.name} x {item.quantity}</span>
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

  // STEP 3: Receipt
  if (step === 'receipt' && orderId && createdAt) {
    return (
      <div className="container py-4">
        <h1 className="text-3xl font-bold mb-6"> </h1>

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
