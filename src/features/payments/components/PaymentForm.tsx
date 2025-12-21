import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProcessPayment } from '../hooks';
import { validatePaymentMethod, getAvailablePaymentMethods, type PaymentMethod } from '../service';
import { MobilePaymentQR } from './MobilePaymentQR';

// Form validation schemas
const gcashSchema = z.object({
  gcashNumber: z.string().regex(/^09\d{9}$/, 'Invalid GCash number (09XXXXXXXXX)'),
});

const payMayaSchema = z.object({
  payMayaNumber: z.string().regex(/^09\d{9}$/, 'Invalid PayMaya number (09XXXXXXXXX)'),
});

const cashSchema = z.object({
  amountReceived: z.coerce.number().positive('Amount must be greater than 0'),
});

interface PaymentFormProps {
  paymentId?: string;
  amount: number;
  orderId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentForm({ paymentId, amount, orderId, onSuccess, onCancel }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | ''>('');
  const [error, setError] = useState<string>('');
  const processPaymentMutation = useProcessPayment();

  const paymentMethods = getAvailablePaymentMethods();

  // Get appropriate schema based on method
  const getSchema = () => {
    switch (selectedMethod) {
      case 'gcash':
        return gcashSchema;
      case 'paymaya':
        return payMayaSchema;
      case 'cash':
        return cashSchema;
      default:
        return z.object({});
    }
  };

  const form = useForm({
    resolver: selectedMethod ? zodResolver(getSchema()) : undefined,
    defaultValues: {
      gcashNumber: '',
      payMayaNumber: '',
      amountReceived: '',
    },
  });

  const isLoading = processPaymentMutation.isPending;

  async function onSubmit(data: any) {
    setError('');

    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    // Only handle cash payments here - GCash/PayMaya are handled in QR component
    if (selectedMethod === 'gcash' || selectedMethod === 'paymaya') {
      return;
    }

    // Validate payment method data
    const validation = validatePaymentMethod(selectedMethod, data);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    // Process payment (for cash only)
    processPaymentMutation.mutate(
      {
        paymentId,
        paymentDetails: { method: selectedMethod, ...data },
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          setError(error.message || 'Payment processing failed');
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">Payment Amount</p>
        <p className="text-3xl font-bold">₱{amount.toFixed(2)}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Select Payment Method</label>
            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => {
                    setSelectedMethod(method.value);
                    form.reset();
                    setError('');
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedMethod === method.value
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-muted-foreground'
                  }`}
                >
                  <p className="font-semibold">{method.label}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </button>
              ))}
            </div>
          </div>




          {/* GCash QR Payment Flow */}
          {selectedMethod === 'gcash' && (
            <MobilePaymentQR 
              method="gcash"
              amount={amount}
              form={form}
              onPaymentConfirm={() => {
                // Get reference number from form
                const data = form.getValues();
                processPaymentMutation.mutate(
                  {
                    paymentId,
                    paymentDetails: { method: 'gcash', gcashNumber: data.gcashNumber || '' },
                  },
                  {
                    onSuccess: () => {
                      onSuccess?.();
                    },
                    onError: (error: any) => {
                      setError(error.message || 'Payment processing failed');
                    },
                  }
                );
              }}
              isProcessing={isLoading}
            />
          )}

          {/* PayMaya QR Payment Flow */}
          {selectedMethod === 'paymaya' && (
            <MobilePaymentQR 
              method="paymaya"
              amount={amount}
              form={form}
              onPaymentConfirm={() => {
                // Get reference number from form
                const data = form.getValues();
                processPaymentMutation.mutate(
                  {
                    paymentId,
                    paymentDetails: { method: 'paymaya', payMayaNumber: data.payMayaNumber || '' },
                  },
                  {
                    onSuccess: () => {
                      onSuccess?.();
                    },
                    onError: (error: any) => {
                      setError(error.message || 'Payment processing failed');
                    },
                  }
                );
              }}
              isProcessing={isLoading}
            />
          )}

          {/* Cash Payment (On the Spot) */}
          {selectedMethod === 'cash' && (
            <>
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Amount Due:</span>
                  <span className="text-2xl font-bold text-primary">₱{amount.toFixed(2)}</span>
                </div>
              </div>

              <FormField
                control={form.control}
                name="amountReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Received</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Enter cash amount received" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('amountReceived') && Number(form.watch('amountReceived')) > 0 && (
                <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Amount Received:</span>
                    <span className="font-semibold">₱{Number(form.watch('amountReceived')).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount Due:</span>
                    <span className="font-semibold">₱{amount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-green-200 dark:border-green-800 pt-2 flex justify-between">
                    <span className="font-bold">Change:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₱{(Number(form.watch('amountReceived')) - amount).toFixed(2)}
                    </span>
                  </div>
                  {Number(form.watch('amountReceived')) < amount && (
                    <div className="text-sm text-red-600 dark:text-red-400 font-semibold mt-2">
                      ⚠️ Insufficient payment! Need ₱{(amount - Number(form.watch('amountReceived'))).toFixed(2)} more
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            {selectedMethod && (
              <Button 
                type="submit" 
                disabled={isLoading || (selectedMethod === 'cash' && Number(form.watch('amountReceived')) < amount)}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedMethod === 'cash'
                  ? 'Confirm Cash Payment'
                  : isLoading
                    ? 'Processing...'
                    : 'Pay Now'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
