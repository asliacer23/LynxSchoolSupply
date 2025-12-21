import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Moon, Sun, LogOut, LayoutDashboard, Package, CreditCard, ShoppingBag, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';
import logoDark from '@/components/images/White Transparent Logo.png';
import logoLight from '@/components/images/Black Transparent Logo.png';

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export function Header({ cartCount = 0, onCartClick }: HeaderProps) {
  const { user, profile, isAdmin, isCashier, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug: Log role info
  if (user) {
    console.log('Current User:', { 
      email: user.email, 
      isCashier: isCashier(), 
      isAdmin: isAdmin() 
    });
  }

  const schoolName = 'LynxSupplies';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold hover:opacity-80 transition-opacity">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt={schoolName}
            className="h-8 w-auto"
            onError={(e) => {
              // Fallback if logo image doesn't exist
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
          <span className="hidden sm:inline">{schoolName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {!isCashier() && (
            <>
              <Link to="/products" className={`text-sm font-medium transition-colors ${location.pathname === '/products' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
                Products
              </Link>
              {user && (
                <Link to="/orders" className={`text-sm font-medium transition-colors ${location.pathname === '/orders' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
                  My Orders
                </Link>
              )}
            </>
          )}
          {isAdmin() && (
            <>
              <Link to="/dashboard" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
                Dashboard
              </Link>
              <Link to="/products/manage" className={`text-sm font-medium transition-colors ${location.pathname === '/products/manage' ? 'text-foreground font-semibold text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                Manage Products
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user && !isCashier() && (
            <>
              <NotificationDropdown />
              <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                    {cartCount}
                  </span>
                )}
              </Button>
            </>
          )}

          {user && isCashier() && (
            <NotificationDropdown />
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />

                {/* CASHIER MENU - Only POS System */}
                {isCashier() && !isAdmin() && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/cashier/pos')}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      POS System
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* ADMIN MENU - Dashboard and Management */}
                {isAdmin() && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/products/manage')}>
                      <Package className="mr-2 h-4 w-4" />
                      Manage Products
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/audit-logs')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Audit Logs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/admin/cleanup')}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cleanup Database
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* USER MENU - Orders and Payments */}
                {!isCashier() && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/payments')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => navigate('/auth/login')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
