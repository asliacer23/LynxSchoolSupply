import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderWithDetails, OrderItemDetail, PaymentDetail } from '../types';

interface ReceiptViewerProps {
  order: OrderWithDetails;
  items: OrderItemDetail[];
  payment: PaymentDetail;
  onClose: () => void;
}

export function ReceiptViewer({ order, items, payment, onClose }: ReceiptViewerProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Receipt</CardTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4 print:p-0">
          {/* Receipt Header */}
          <div className="text-center border-b pb-4">
            <h3 className="font-bold text-lg">Lynx School Supplies</h3>
            <p className="text-sm text-muted-foreground">Receipt</p>
          </div>

          {/* Order Info */}
          <div className="text-sm space-y-2 border-b pb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono text-xs">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span>{new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
            {order.cashier && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cashier:</span>
                <span>{order.cashier.full_name}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2 border-b pb-4">
            <h4 className="font-semibold text-sm mb-3">Items</h4>
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.product?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} x ₱{Number(item.price).toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">₱{(Number(item.price) * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 border-b pb-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <span>₱{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="text-sm space-y-2 border-b pb-4">
            <h4 className="font-semibold mb-2">Payment</h4>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method:</span>
              <span className="capitalize">{payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span>₱{Number(payment.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="capitalize">{payment.status}</span>
            </div>
            {payment.paid_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid At:</span>
                <span>{new Date(payment.paid_at).toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Thank you for your purchase!</p>
          </div>

          {/* Print Button */}
          <div className="flex gap-2 pt-4 print:hidden">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
