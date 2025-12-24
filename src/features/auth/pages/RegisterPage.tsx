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
import { registerSchema, type RegisterInput } from '../services/auth.service';
import LogoDark from '@/components/images/Black Transparent Logo.png';
import LogoLight from '@/components/images/White Transparent Logo.png';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { user, signUp } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName);
    setLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('already registered')) {
        message = 'This email is already registered. Please sign in instead.';
      }
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: message,
      });
      return;
    }

    toast({
      title: 'Account created!',
      description: 'Welcome to LynxSupplies! Please check your email to verify your account.',
    });
    
    setTimeout(() => {
      navigate('/auth/login');
    }, 2000);
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
            {/* Shopping Bag */}
            <g className="animate-bounce" style={{ animationDelay: '0s' }}>
              <path d="M80 80 L100 60 L160 60 L180 80 L180 200 L80 200 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" className="text-primary" />
              <path d="M110 60 L110 80" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" className="text-primary" />
              <path d="M150 60 L150 80" stroke="currentColor" strokeWidth="2" strokeOpacity="0.7" className="text-primary" />
            </g>
            {/* Graduation Cap */}
            <g className="animate-bounce" style={{ animationDelay: '0.2s' }}>
              <path d="M250 100 L280 120 L310 100 L280 80 Z" fill="currentColor" fillOpacity="0.5" className="text-primary" />
              <line x1="280" y1="120" x2="280" y2="160" stroke="currentColor" strokeWidth="3" strokeOpacity="0.7" className="text-primary" />
            </g>
            {/* Stars */}
            <g className="animate-pulse" style={{ animationDelay: '0.4s' }}>
              <circle cx="220" cy="140" r="4" fill="currentColor" fillOpacity="0.6" className="text-primary" />
              <circle cx="240" cy="120" r="3" fill="currentColor" fillOpacity="0.5" className="text-primary" />
              <circle cx="260" cy="180" r="3" fill="currentColor" fillOpacity="0.5" className="text-primary" />
            </g>
          </svg>
        </div>

        <div className="space-y-6 relative z-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight">Start Your School Supply Journey Today</h2>
            <p className="text-muted-foreground text-lg">Join thousands of students and parents who trust us for quality supplies.</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Quick and easy registration</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Exclusive member discounts</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary mt-1">✓</span>
              <span>Order history and tracking</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground relative z-10">© 2025 Lynx School Supplies. All rights reserved.</p>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-sm slide-up border-0 md:border shadow-none md:shadow-lg">
          <CardHeader className="text-center space-y-4">
            <Link to="/" className="inline-flex items-center justify-center gap-2 mx-auto md:hidden">
              <img src={logo} alt="Lynx School Supplies" className="h-10 w-auto" />
              <span className="text-lg font-bold">Lynx</span>
            </Link>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Create an account</CardTitle>
              <CardDescription>Get started with Lynx School Supplies today</CardDescription>
            </div>
          </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                {...register('fullName')}
                className="h-10"
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>
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
              <Label htmlFor="password">Password</Label>
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
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{' '}
              <Link to="#" className="text-primary hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
    </div>
  );
}
