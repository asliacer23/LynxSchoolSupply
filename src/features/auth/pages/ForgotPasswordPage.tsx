import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { sendPasswordRecoveryEmail, forgotPasswordSchema, type ForgotPasswordInput } from '../services/password-recovery.service';
import LogoDark from '@/components/images/Black Transparent Logo.png';
import LogoLight from '@/components/images/White Transparent Logo.png';
import { useTheme } from '@/hooks/useTheme';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailSent, setEmailSent] = useState('');
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const emailValue = watch('email');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    const { error, message } = await sendPasswordRecoveryEmail(data.email);
    setLoading(false);

    if (error) {
      // More specific error messages
      let errorMessage = error.message || 'Failed to send recovery email.';
      
      if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
        errorMessage = 'Email service temporarily unavailable. Please try again later or contact support.';
      } else if (error.message?.includes('not found') || error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
      return;
    }

    setEmailSent(data.email);
    setSubmitted(true);
    toast({
      title: 'Success!',
      description: message,
    });
  };

  const logo = theme === 'dark' ? LogoLight : LogoDark;

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
            {/* Mail Envelope */}
            <g className="animate-bounce" style={{ animationDelay: '0s' }}>
              <rect x="80" y="80" width="120" height="80" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.5" rx="4" className="text-primary" />
              <path d="M80 80 L140 130 L200 80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.6" className="text-primary" />
            </g>
            {/* Key */}
            <g className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <circle cx="280" cy="120" r="15" fill="none" stroke="currentColor" strokeWidth="3" strokeOpacity="0.6" className="text-primary" />
              <path d="M295 120 L330 120" stroke="currentColor" strokeWidth="4" strokeOpacity="0.6" className="text-primary" />
              <rect x="325" y="115" width="12" height="10" fill="currentColor" fillOpacity="0.5" className="text-primary" />
            </g>
          </svg>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">Forgot Your Password?</h2>
            <p className="text-muted-foreground text-lg">We'll help you recover access to your account securely.</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Secure password recovery process</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Email verification for your protection</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Reset link valid for 24 hours</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground relative z-10">© 2025 Lynx School Supplies. All rights reserved.</p>
      </div>

      {/* Right Side - Recovery Form */}
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm slide-up border-0 md:border shadow-none md:shadow-lg">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mx-auto md:hidden">
              <img src={logo} alt="Lynx School Supplies" className="h-10 w-auto" />
              <span className="text-lg font-bold">Lynx</span>
            </Link>

            {submitted ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-success/10">
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription>
                  We've sent a password recovery link to {emailSent}
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                <CardDescription>
                  Enter your email and we'll send you a link to reset your password
                </CardDescription>
              </>
            )}
          </CardHeader>

          {submitted ? (
            <>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    The recovery link will expire in 24 hours. If you don't receive an email, check your spam folder or request a new link.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  <p className="font-semibold text-foreground">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Check your email for the recovery link</li>
                    <li>Click the link to reset your password</li>
                    <li>Enter your new password</li>
                    <li>You'll be logged in automatically</li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full h-10" asChild>
                  <Link to="/auth/login">Back to Login</Link>
                </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    className="h-10"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full h-10" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Recovery Link
                </Button>
                <Link to="/auth/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
