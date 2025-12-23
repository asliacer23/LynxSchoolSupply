import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, DollarSign, Printer, Loader2, ShoppingCart, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
 * Alternative POS Page - Table-Based Layout
 * Better for larger screens and power users
 * Shows more products at once with search/filter
 */
export default function POSPageTable() {
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category?.name === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))) as string[];

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

    const cartItemsForOrder = cart.map(item => ({
      product_id: item.productId,
      product: item.product,
      quantity: item.quantity,
    }));

    const { data: orderData, error: orderError } = await createOrder(
      null,
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
    setCategoryFilter('all');
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
      <div className="w-full min-h-screen bg-white dark:bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="border-b sticky top-0 z-40 bg-white dark:bg-slate-950">
          <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Point of Sale</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Table view - Select items to add to cart</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Items in cart</p>
                <p className="text-2xl font-bold text-black dark:text-white">{cart.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col flex-1 gap-4 min-h-0">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  <Button
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter('all')}
                    className="whitespace-nowrap"
                  >
                    All
                  </Button>
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={categoryFilter === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCategoryFilter(cat)}
                      className="whitespace-nowrap"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-hidden flex flex-col border rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No products found
                </div>
              ) : (
                <div className="overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted/50">
                      <TableRow>
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="hidden sm:table-cell font-semibold">Category</TableHead>
                        <TableHead className="font-semibold text-right">Price</TableHead>
                        <TableHead className="font-semibold text-center">Stock</TableHead>
                        <TableHead className="font-semibold text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map(product => (
                        <TableRow
                          key={product.id}
                          className="hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                                {getPrimaryImageUrl(product) ? (
                                  <img
                                    src={getPrimaryImageUrl(product) || ''}
                                    alt={product.name}
                                    className="h-full w-full object-cover rounded"
                                  />
                                ) : (
                                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <span>{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {product.category?.name || '-'}
                          </TableCell>
                          <TableCell className="font-semibold text-right">₱{Number(product.price).toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={product.stock > 10 ? 'secondary' : product.stock > 0 ? 'outline' : 'destructive'}>
                              {product.stock === 0 ? 'Out' : `${product.stock} pcs`}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              className="gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="hidden sm:inline">Add</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        {cart.length > 0 && (
          <div className="border-t bg-background/95 backdrop-blur-sm sticky bottom-0">
            <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
                      <p className="text-xl font-bold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-black dark:text-white">₱{total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCart([])}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="gap-2"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    <span>Checkout</span>
                  </Button>
                </div>
              </div>

              {/* Quick cart view */}
              <div className="mt-4 max-h-32 overflow-y-auto border rounded p-3 bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center justify-between gap-2 bg-background p-2 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
                <span className="text-black dark:text-white">₱{total.toFixed(2)}</span>
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
