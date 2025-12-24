import { useQuery } from '@tanstack/react-query';
import { Loader2, X, Package, Calendar, User, MapPin, Phone, DollarSign, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getOrderWithItems } from '../services/orders.service';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

interface OrderDetailsModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
};

export function OrderDetailsModal({ orderId, open, onOpenChange }: OrderDetailsModalProps) {
  const { user, roles } = useAuth();
  const isMobile = useIsMobile();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => {
      if (!orderId || !user) return null;
      return getOrderWithItems(orderId, user.id, roles);
    },
    enabled: !!orderId && !!user,
  });

  const order = data?.data;

  const Content = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error || !order ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load order details</p>
        </div>
      ) : (
        <>
          {/* Order Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                  <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                    {statusConfig[order.status as keyof typeof statusConfig]?.label || 'Unknown'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(order.created_at), 'PPp')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl sm:text-3xl font-bold">₱{order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Customer & Delivery Info - Show ONLY if this is a customer order */}
          {order.user_id && !order.cashier_id && (
            <>
              <Separator />
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-foreground block mb-1">Name:</span>
                      <p className="text-muted-foreground">
                        {(order as any).customer_profile?.full_name || 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {order.shipping_address && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {typeof order.shipping_address === 'object' ? (
                        <div className="space-y-1 text-muted-foreground">
                          {(order.shipping_address as any).recipient_name && (
                            <p>
                              <span className="font-medium text-foreground">To:</span> {(order.shipping_address as any).recipient_name}
                            </p>
                          )}
                          {(order.shipping_address as any).address_line1 && (
                            <p>{(order.shipping_address as any).address_line1}</p>
                          )}
                          {(order.shipping_address as any).address_line2 && (
                            <p>{(order.shipping_address as any).address_line2}</p>
                          )}
                          {(order.shipping_address as any).city && (
                            <p>
                              {(order.shipping_address as any).city}
                              {(order.shipping_address as any).state ? `, ${(order.shipping_address as any).state}` : ''}
                            </p>
                          )}
                          {(order.shipping_address as any).postal_code && (
                            <p>{(order.shipping_address as any).postal_code}</p>
                          )}
                          {(order.shipping_address as any).country && (
                            <p>{(order.shipping_address as any).country}</p>
                          )}
                          {(order.shipping_address as any).contact_num && (
                            <p className="flex items-center gap-2 pt-2 border-t mt-2">
                              <Phone className="h-4 w-4" />
                              {(order.shipping_address as any).contact_num}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">{order.shipping_address}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Cashier Info - Show ONLY for POS walk-in orders */}
          {order.cashier_id && (
            <>
              <Separator />
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Cashier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground block mb-1">Cashier Name:</span>
                    <p className="text-muted-foreground">
                      {(order as any).cashier_profile?.full_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground block mb-1">Transaction Type:</span>
                    <p className="text-muted-foreground">Walk-in / POS</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Separator />

          {/* Order Items */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-muted font-semibold text-sm">
                    <div className="col-span-6">Product</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                  <div className="divide-y">
                    {order.items.map((item: any) => {
                      const itemPrice = Number(item.price) || 0;
                      const itemQty = Number(item.quantity) || 0;
                      const itemSubtotal = itemPrice * itemQty;

                      return (
                        <div key={item.id} className="p-4 space-y-2 sm:space-y-0">
                          {/* Mobile Layout */}
                          <div className="sm:hidden space-y-1">
                            <p className="font-semibold text-sm">{item.product?.name || 'Unknown Product'}</p>
                            {item.product?.sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                            )}
                            <div className="flex justify-between text-sm pt-2">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-medium">₱{itemPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Quantity:</span>
                              <span className="font-medium">{itemQty}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1 border-t">
                              <span className="text-muted-foreground">Subtotal:</span>
                              <span className="font-medium">₱{itemSubtotal.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:grid grid-cols-12 gap-4 items-center text-sm">
                            <div className="col-span-6">
                              <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                              {item.product?.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                              )}
                            </div>
                            <div className="col-span-2 text-right">₱{itemPrice.toFixed(2)}</div>
                            <div className="col-span-2 text-right">{itemQty}</div>
                            <div className="col-span-2 text-right font-semibold">₱{itemSubtotal.toFixed(2)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">No items in this order</div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₱{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span className="font-medium">₱0.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span className="font-medium">₱0.00</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount:</span>
              <span className="text-foreground">₱{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Print Button */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(90vh-80px)]">
            <Content />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
}
