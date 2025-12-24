import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LogoDark from '@/components/images/Black Transparent Logo.png';
import LogoLight from '@/components/images/White Transparent Logo.png';
import { useTheme } from '@/hooks/useTheme';

export default function HomePage() {
  const { theme } = useTheme();
  const logo = theme === 'dark' ? LogoLight : LogoDark;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4 slide-up">
              <div className="inline-flex items-center gap-2">
                <img src={logo} alt="Lynx School Supplies" className="h-8 w-auto" />
                <span className="text-sm font-semibold text-primary">Lynx School Supplies</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                Everything for Your
                <br />
                <span className="text-primary">School Year</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Premium school supplies at unbeatable prices. From notebooks to calculators, we've got everything you need to succeed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 slide-up" style={{ animationDelay: '100ms' }}>
              <Button size="lg" asChild className="gap-2">
                <Link to="/products">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth/register">Create Account</Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-8 text-sm slide-up" style={{ animationDelay: '200ms' }}>
              <div>
                <div className="text-2xl font-bold">10K+</div>
                <p className="text-muted-foreground">Happy Customers</p>
              </div>
              <div>
                <div className="text-2xl font-bold">500+</div>
                <p className="text-muted-foreground">Products</p>
              </div>
              <div>
                <div className="text-2xl font-bold">24/7</div>
                <p className="text-muted-foreground">Support</p>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-3xl"></div>
              
              {/* Animated SVG */}
              <svg className="relative w-80 h-80 opacity-90" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                {/* Floating Books */}
                <g className="animate-bounce" style={{ animationDelay: '0s' }}>
                  <rect x="60" y="80" width="70" height="100" fill="currentColor" fillOpacity="0.2" rx="4" className="text-primary" />
                  <rect x="75" y="65" width="70" height="100" fill="currentColor" fillOpacity="0.4" rx="4" className="text-primary" />
                  <rect x="90" y="50" width="70" height="100" fill="currentColor" fillOpacity="0.6" rx="4" className="text-primary" />
                </g>
                
                {/* Rotating Logo Background */}
                <g className="origin-center" style={{
                  animation: 'spin 8s linear infinite',
                  transformBox: 'fill-box',
                  transformOrigin: 'center'
                }}>
                  <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" className="text-primary" />
                </g>

                {/* Center Icon with Glow */}
                <g filter="drop-shadow(0 0 20px currentColor)" className="text-primary opacity-40">
                  <circle cx="200" cy="200" r="80" fill="currentColor" fillOpacity="0.1" className="text-primary" />
                  <circle cx="200" cy="200" r="60" fill="currentColor" fillOpacity="0.2" className="text-primary" />
                </g>

                {/* Floating Elements */}
                <g className="animate-pulse">
                  <circle cx="320" cy="120" r="8" fill="currentColor" fillOpacity="0.5" className="text-primary" />
                  <circle cx="100" cy="300" r="6" fill="currentColor" fillOpacity="0.4" className="text-primary" />
                  <circle cx="340" cy="280" r="7" fill="currentColor" fillOpacity="0.3" className="text-primary" />
                </g>
              </svg>

              <img src={logo} alt="Lynx School Supplies" className="absolute w-48 h-48 object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-20">
          <div className="text-center space-y-4 mb-16 slide-up">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose Lynx?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're committed to providing the best school shopping experience with quality products and exceptional service.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Fast Shipping',
                description: 'Quick delivery to get you ready for school. Most orders ship within 24 hours.',
              },
              {
                icon: Shield,
                title: 'Quality Guaranteed',
                description: 'All products are from trusted brands with 30-day satisfaction guarantee.',
              },
              {
                icon: RotateCcw,
                title: 'Easy Returns',
                description: 'hassle-free returns and exchanges within 30 days of purchase.',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="space-y-4 p-8 rounded-xl bg-background border hover:border-primary transition-colors slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="relative rounded-2xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/20 p-8 md:p-16 text-center overflow-hidden">
          {/* Animated Background Shapes */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of students and parents who trust Lynx for quality school supplies at great prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="gap-2">
                <Link to="/products">
                  Start Shopping
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth/register">Create Account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
