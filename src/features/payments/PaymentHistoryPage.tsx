import { useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserPayments } from './hooks';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-200',
};

const methodLabels: Record<string, string> = {
  credit_card: 'Credit/Debit Card',
  gcash: 'GCash',
  paymaya: 'PayMaya',
  bank_transfer: 'Bank Transfer',
  cod: 'Cash on Delivery',
};

export default function PaymentHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: paymentsData, isLoading } = useUserPayments();

  if (authLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const payments = paymentsData?.data ?? [];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Payment History</h1>
        <Button onClick={() => navigate('/orders')} variant="outline">
          View Orders
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No payments yet</p>
            <p className="text-muted-foreground text-sm mt-2">
              Your payment history will appear here
            </p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map(payment => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">{methodLabels[payment.method] || payment.method}</h3>
                      <Badge className={statusColors[payment.status] || ''}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </Badge>
                    </div>

                    <p className="text-2xl font-bold mb-4">₱{payment.amount.toFixed(2)}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Order ID</p>
                        <p className="font-medium font-mono text-xs">{payment.order_id?.substring(0, 8)}...</p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">Transaction Date</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <p className="font-medium">
                            {formatDistanceToNow(new Date(payment.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>

                      {payment.paid_at && (
                        <div>
                          <p className="text-muted-foreground">Paid At</p>
                          <p className="font-medium">
                            {new Date(payment.paid_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {payment.reference_number && (
                        <div>
                          <p className="text-muted-foreground">Reference Number</p>
                          <p className="font-medium font-mono text-xs">{payment.reference_number}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => navigate(`/orders`)}
                    className="self-center"
                  >
                    View Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
