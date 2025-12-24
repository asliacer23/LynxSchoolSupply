import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { updatePasswordWithSession, verifyPasswordResetToken, resetPasswordSchema, type ResetPasswordInput } from '../services/password-recovery.service';
import LogoDark from '@/components/images/Black Transparent Logo.png';
import LogoLight from '@/components/images/White Transparent Logo.png';
import { useTheme } from '@/hooks/useTheme';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
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

  // Verify the recovery token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      setVerifying(true);
      const { isValid, error } = await verifyPasswordResetToken();
      
      if (isValid) {
        setIsValid(true);
        setTokenError(null);
      } else {
        setIsValid(false);
        setTokenError(error);
      }
      
      setVerifying(false);
    };

    verifyToken();
  }, []);

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    const { error } = await updatePasswordWithSession(data.password);
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
            <CardDescription>{tokenError}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full h-10" 
              asChild
            >
              <a href="/auth/forgot-password">Request New Link</a>
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
          <a href="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="Lynx School Supplies" className="h-12 w-auto" />
            <span className="text-xl font-bold">Lynx School Supplies</span>
          </a>
        </div>

        {/* Illustration Section */}
        <div className="flex items-center justify-center -mx-12 relative z-10">
          <svg className="w-full h-64 opacity-80" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            {/* Lock Open */}
            <g className="animate-bounce" style={{ animationDelay: '0s' }}>
              <rect x="100" y="120" width="60" height="80" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" rx="4" className="text-primary" />
              <path d="M100 120 Q100 80 130 80 Q160 80 160 120" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" className="text-primary" />
            </g>
            {/* Shield */}
            <g className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <path d="M260 100 L260 160 Q260 200 300 220 Q340 200 340 160 L340 100 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" className="text-primary" />
              <path d="M290 140 L310 150 L300 170" fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.6" className="text-primary" />
            </g>
          </svg>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">Create Your New Password</h2>
            <p className="text-muted-foreground text-lg">Set a strong password to secure your account.</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Minimum 6 characters required</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Use uppercase, lowercase, and numbers for security</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Your account will be secured immediately</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground relative z-10">© 2025 Lynx School Supplies. All rights reserved.</p>
      </div>

      {/* Right Side - Reset Form */}
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm slide-up border-0 md:border shadow-none md:shadow-lg">
          <CardHeader className="text-center space-y-4">
            <a href="/" className="inline-flex items-center justify-center gap-2 mx-auto md:hidden">
              <img src={logo} alt="Lynx School Supplies" className="h-10 w-auto" />
              <span className="text-lg font-bold">Lynx</span>
            </a>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Reset Your Password</CardTitle>
              <CardDescription>Create a new strong password for your account</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
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
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="h-10"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  Your password should be at least 6 characters long. Use a mix of uppercase, lowercase, and numbers for better security.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
