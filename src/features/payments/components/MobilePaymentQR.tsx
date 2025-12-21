import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';

interface MobilePaymentQRProps {
  method: 'gcash' | 'paymaya';
  amount: number;
  form: UseFormReturn<any>;
  onPaymentConfirm: () => void;
  isProcessing: boolean;
}

export function MobilePaymentQR({ 
  method, 
  amount, 
  form, 
  onPaymentConfirm,
  isProcessing 
}: MobilePaymentQRProps) {
  const [paymentStep, setPaymentStep] = useState<'qr' | 'sent' | 'confirmed'>('qr');
  const [amountVerified, setAmountVerified] = useState(false);

  const methodLabel = method === 'gcash' ? 'GCash' : 'PayMaya';
  const fieldName = method === 'gcash' ? 'gcashNumber' : 'payMayaNumber';

  // Generate dummy QR code (in real app, this would be from API)
  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${methodLabel}-PAYMENT-${amount}`;
  };

  return (
    <div className="space-y-4">
      {/* Step 1: QR Code Display */}
      {paymentStep === 'qr' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">📱 {methodLabel} Payment</span>
              <span className="text-sm font-normal text-muted-foreground">Step 1 of 3</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount Display */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
              <p className="text-3xl font-bold text-primary">₱{amount.toFixed(2)}</p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <img 
                src={generateQRCode()} 
                alt={`${methodLabel} QR Code`}
                className="w-64 h-64"
              />
            </div>

            {/* Instructions */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Customer: Scan this QR code using your {methodLabel} app and send ₱{amount.toFixed(2)}
              </AlertDescription>
            </Alert>

            {/* Account Number (Optional) */}
            {method === 'gcash' && (
              <div className="text-center text-sm">
                <p className="text-muted-foreground mb-2">Or send to {methodLabel} number:</p>
                <p className="font-mono font-bold text-lg">09XX XXXX XXXX</p>
              </div>
            )}

            {/* Confirm Button */}
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setPaymentStep('sent')}
            >
              Payment Sent ✓
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Payment Verification */}
      {paymentStep === 'sent' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">💰 Verify Payment</span>
              <span className="text-sm font-normal text-muted-foreground">Step 2 of 3</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Amount Verification */}
            <div className="space-y-2">
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Amount Received</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">₱{amount.toFixed(2)}</p>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Cashier: Confirm that you received the ₱{amount.toFixed(2)} payment from {methodLabel}
              </AlertDescription>
            </Alert>

            {/* Reference Number Input (Optional) */}
            <FormField
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{methodLabel} Transaction/Reference Number (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., TXN123456789"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setPaymentStep('qr')}
              >
                Back
              </Button>
              <Button 
                className="flex-1"
                size="lg"
                onClick={() => {
                  setAmountVerified(true);
                  setPaymentStep('confirmed');
                }}
              >
                Confirm Payment ✓
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment Confirmed */}
      {paymentStep === 'confirmed' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-lg">Payment Confirmed!</span>
              <span className="text-sm font-normal text-muted-foreground">Step 3 of 3</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-semibold capitalize">{methodLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold">₱{amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Received ✓</span>
              </div>
            </div>

            <Alert className="border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Ready to finalize order and print receipt
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={() => {
                onPaymentConfirm();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Finalize Order'}
            </Button>

            <Button 
              variant="outline"
              className="w-full"
              onClick={() => setPaymentStep('qr')}
              disabled={isProcessing}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
