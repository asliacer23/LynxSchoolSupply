import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/types/database';
import { format } from 'date-fns';

interface ReceiptProps {
  orderId: string;
  items: Array<{
    productId: string;
    product: Product;
    quantity: number;
  }>;
  total: number;
  createdAt: string;
}

export function Receipt({ orderId, items, total, createdAt }: ReceiptProps) {
  return (
    <Card className="bg-white text-black max-w-md mx-auto">
      <CardHeader className="text-center pb-2">
        <h2 className="text-2xl font-bold">LYNX SUPPLIES</h2>
        <p className="text-xs text-muted-foreground">Sales Receipt</p>
      </CardHeader>
      <CardContent className="space-y-2 text-xs font-mono">
        {/* Order Info */}
        <div className="text-center">
          <p>Order ID: {orderId.slice(0, 8).toUpperCase()}</p>
          <p>Date: {format(new Date(createdAt), 'MMM dd, yyyy')}</p>
          <p>Time: {format(new Date(createdAt), 'hh:mm a')}</p>
        </div>

        <Separator className="my-2" />

        {/* Items */}
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.productId}>
              <div className="flex justify-between">
                <span className="flex-1">{item.product.name}</span>
                <span className="text-right">
                  {item.quantity} x ₱{Number(item.product.price).toFixed(2)}
                </span>
              </div>
              <div className="text-right text-muted-foreground">
                ₱{(Number(item.product.price) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>₱0.00</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p>Thank you for your purchase!</p>
          <p className="mt-1">Please come again</p>
        </div>

        {/* Print Instructions */}
        <div className="text-center text-xs mt-4 print:hidden">
          <p className="text-muted-foreground">Click "Print Receipt" to print</p>
        </div>
      </CardContent>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Card>
  );
}
