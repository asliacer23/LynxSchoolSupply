import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingCart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight slide-up">
            Everything for Your
            <br />
            <span className="text-muted-foreground">School Year</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto slide-up" style={{ animationDelay: '100ms' }}>
            Quality school supplies at great prices. From notebooks to calculators, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center slide-up" style={{ animationDelay: '200ms' }}>
            <Button size="lg" asChild>
              <Link to="/products">
                Shop Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30">
        <div className="container py-20">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Wide Selection</h3>
              <p className="text-muted-foreground text-sm">
                From basic supplies to specialty items, find everything you need in one place.
              </p>
            </div>
            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Easy Ordering</h3>
              <p className="text-muted-foreground text-sm">
                Simple checkout process with order tracking and fast delivery options.
              </p>
            </div>
            <div className="text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Quality Guaranteed</h3>
              <p className="text-muted-foreground text-sm">
                All products are from trusted brands with satisfaction guaranteed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <div className="bg-card border rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create an account today and start shopping for all your school supply needs.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth/register">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
