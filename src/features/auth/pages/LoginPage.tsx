import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { loginSchema, type LoginInput } from '../services/auth.service';
import LogoDark from '@/components/images/Black Transparent Logo.png';
import LogoLight from '@/components/images/White Transparent Logo.png';
import { useTheme } from '@/hooks/useTheme';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { user, signIn } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error.message,
      });
      return;
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
    });
    navigate('/');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Google sign in failed',
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign in with Google',
      });
    } finally {
      setGoogleLoading(false);
    }
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
            {/* Books */}
            <g className="animate-bounce" style={{ animationDelay: '0s' }}>
              <rect x="50" y="100" width="60" height="80" fill="currentColor" fillOpacity="0.3" rx="4" className="text-primary" />
              <rect x="70" y="85" width="60" height="80" fill="currentColor" fillOpacity="0.5" rx="4" className="text-primary" />
              <rect x="90" y="70" width="60" height="80" fill="currentColor" fillOpacity="0.7" rx="4" className="text-primary" />
            </g>
            {/* Notebook */}
            <g className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <rect x="250" y="120" width="80" height="100" fill="currentColor" fillOpacity="0.4" rx="4" className="text-primary" />
              <line x1="260" y1="130" x2="320" y2="130" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" className="text-primary" />
              <line x1="260" y1="145" x2="320" y2="145" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" className="text-primary" />
              <line x1="260" y1="160" x2="320" y2="160" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" className="text-primary" />
            </g>
            {/* Pencil */}
            <g className="animate-bounce" style={{ animationDelay: '0.4s' }}>
              <line x1="180" y1="200" x2="220" y2="80" stroke="currentColor" strokeWidth="6" strokeOpacity="0.7" className="text-primary" />
              <circle cx="220" cy="75" r="8" fill="currentColor" fillOpacity="0.9" className="text-primary" />
            </g>
          </svg>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">Welcome Back to Your Learning Journey</h2>
            <p className="text-muted-foreground text-lg">Get access to quality school supplies and exclusive offers.</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Fast and secure checkout</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Wide selection of school supplies</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Order tracking and support</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground relative z-10">© 2025 Lynx School Supplies. All rights reserved.</p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm slide-up border-0 md:border shadow-none md:shadow-lg">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mx-auto md:hidden">
              <img src={logo} alt="Lynx School Supplies" className="h-10 w-auto" />
              <span className="text-lg font-bold">Lynx</span>
            </Link>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Google
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
