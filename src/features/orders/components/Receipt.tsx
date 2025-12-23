import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/types/database';
import { format } from 'date-fns';
import { Check } from 'lucide-react';

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
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Success Checkmark */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30"></div>
          <div className="relative bg-white dark:bg-slate-900 border-2 border-green-500 rounded-full p-4">
            <Check className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Payment Successful</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Order confirmed and payment received</p>
      </div>

      {/* Receipt Card */}
      <Card className="border-2 dark:border-gray-700">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Order Details */}
          <div className="space-y-3 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Order ID</span>
              <span className="font-mono font-bold">{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Date</span>
              <span className="font-semibold">{format(new Date(createdAt), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time</span>
              <span className="font-semibold">{format(new Date(createdAt), 'hh:mm a')}</span>
            </div>
          </div>

          <Separator className="dark:bg-gray-700" />

          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Items ({itemCount})</h3>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between text-sm gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.quantity} × ₱{Number(item.product.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold whitespace-nowrap">₱{(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator className="dark:bg-gray-700" />

          {/* Summary */}
          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tax</span>
              <span>₱0.00</span>
            </div>
          </div>

          <Separator className="dark:bg-gray-700" />

          {/* Total */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-base sm:text-lg font-bold">TOTAL</span>
            <span className="text-2xl sm:text-3xl font-bold">₱{total.toFixed(2)}</span>
          </div>

          {/* Status Badge */}
          <div className="bg-black dark:bg-white/10 text-white dark:text-gray-300 rounded text-center py-2 text-sm font-semibold">
            ✓ Paid in Full
          </div>
        </CardContent>
      </Card>

      {/* Footer Message */}
      <div className="text-center mt-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400 print:hidden">
        <p>Click "Print Receipt" to print this receipt</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
