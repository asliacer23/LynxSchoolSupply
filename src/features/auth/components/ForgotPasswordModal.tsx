import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password recovery error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to send recovery email.',
        });
        setLoading(false);
        return;
      }

      setEmailSent(data.email);
      setSubmitted(true);
      toast({
        title: 'Success!',
        description: 'Recovery email sent. Check your inbox.',
      });
    } catch (error) {
      console.error('Password recovery error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send recovery email.',
      });
    }

    setLoading(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSubmitted(false);
      setEmailSent('');
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-success/10">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </div>
              <DialogTitle className="text-center">Check Your Email</DialogTitle>
              <DialogDescription className="text-center">
                We've sent a password recovery link to <strong>{emailSent}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Click the link in the email to reset your password. The link is valid for 24 hours.
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                onClick={() => handleClose(false)}
              >
                Back to Login
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Reset Password
              </DialogTitle>
              <DialogDescription>
                Enter your email address and we'll send you a link to reset your password
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  disabled={loading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  We'll send you a secure link to reset your password.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Recovery Link
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

