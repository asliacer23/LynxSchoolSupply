import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import LogoDark from '@/components/images/Black Transparent Logo.png';
import LogoLight from '@/components/images/White Transparent Logo.png';
import { useTheme } from '@/hooks/useTheme';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Check if recovery session exists (Supabase sets this automatically when user clicks email link)
  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setIsValid(!!data.session);
      setVerifying(false);
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update password. Please try again.',
      });
      return;
    }

    setResetSuccess(true);
    toast({
      title: 'Success!',
      description: 'Your password has been reset successfully.',
    });

    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate('/auth/login');
    }, 3000);
  };

  const logo = theme === 'dark' ? LogoLight : LogoDark;

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying Recovery Link</CardTitle>
            <CardDescription>Please wait while we verify your recovery link...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md slide-up">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Recovery Link Expired</CardTitle>
            <CardDescription>This recovery link is no longer valid. Please request a new one.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full h-10" asChild>
              <Link to="/auth/forgot-password">Request New Link</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md slide-up">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
            <CardDescription>Your password has been updated. Redirecting to login...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Left Side - Branding */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="space-y-2 relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="Lynx School Supplies" className="h-12 w-auto" />
            <span className="text-xl font-bold">Lynx School Supplies</span>
          </Link>
        </div>

        {/* Illustration Section */}
        <div className="flex items-center justify-center -mx-12 relative z-10">
          <svg className="w-full h-64 opacity-80" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            {/* Lock Icon */}
            <g className="animate-bounce" style={{ animationDelay: '0s' }}>
              <rect x="100" y="110" width="80" height="100" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.5" rx="4" className="text-primary" />
              <path d="M120 110 Q120 80 140 80 Q160 80 160 110" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" className="text-primary" />
              <circle cx="140" cy="160" r="4" fill="currentColor" fillOpacity="0.5" className="text-primary" />
            </g>
            {/* Shield Icon */}
            <g className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <path d="M260 90 L260 140 Q260 180 300 200 Q340 180 340 140 L340 90 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" className="text-primary" />
              <path d="M290 140 L310 160 L325 135" fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.6" className="text-primary" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">Create New Password</h2>
            <p className="text-muted-foreground text-lg">Set a strong password to secure your account.</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Use a combination of letters and numbers</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>At least 6 characters long</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Confirm your new password</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground relative z-10">© 2025 Lynx School Supplies. All rights reserved.</p>
      </div>

      {/* Right Side - Password Reset Form */}
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm slide-up border-0 md:border shadow-none md:shadow-lg">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mx-auto md:hidden">
              <img src={logo} alt="Lynx School Supplies" className="h-10 w-auto" />
              <span className="text-lg font-bold">Lynx</span>
            </Link>

            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  {...register('password')}
                  className="h-10"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  {...register('confirmPassword')}
                  className="h-10"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Alert>
                <AlertDescription className="text-xs space-y-1">
                  <p className="font-semibold">Password Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use at least 6 characters</li>
                    <li>Mix letters and numbers</li>
                    <li>Avoid personal information</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
              <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
