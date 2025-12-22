import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Moon, Sun, LogOut, LayoutDashboard, Package, CreditCard, ShoppingBag, FileText, Trash2, Edit2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';
import { EditProfileModal } from '@/features/profile/components/EditProfileModal';
import { AddressModal } from '@/features/address/components/AddressModal';
import { getRoleDisplayName } from '@/lib/permissions';
import logoDark from '@/components/images/White Transparent Logo.png';
import logoLight from '@/components/images/Black Transparent Logo.png';

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export function Header({ cartCount = 0, onCartClick }: HeaderProps) {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const { user, profile, roles, hasRole, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const schoolName = 'LynxSupplies';

  const getPrimaryRole = () => {
    if (roles.includes('superadmin')) return 'superadmin';
    if (roles.includes('owner')) return 'owner';
    if (roles.includes('cashier')) return 'cashier';
    return 'user';
  };

  const primaryRole = getPrimaryRole();
  const isSuperadmin = hasRole('superadmin');
  const isOwner = hasRole('owner');
  const isCashier = hasRole('cashier');
  const isStaff = isSuperadmin || isOwner || isCashier;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      superadmin: 'bg-red-600',
      owner: 'bg-blue-600',
      cashier: 'bg-green-600',
      user: 'bg-gray-600',
    };
    return colors[role] || 'bg-gray-600';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold hover:opacity-80 transition-opacity">
          <img src={theme === 'dark' ? logoDark : logoLight} alt={schoolName} className="h-8 w-auto" onError={(e) => { const img = e.target as HTMLImageElement; img.style.display = 'none'; }} />
          <span className="hidden sm:inline">{schoolName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {isSuperadmin && <>
            <Link to="/dashboard" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Dashboard</Link>
            <Link to="/admin/audit-logs" className={`text-sm font-medium transition-colors ${location.pathname === '/admin/audit-logs' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Audit Logs</Link>
            <Link to="/admin/cleanup" className={`text-sm font-medium transition-colors ${location.pathname === '/admin/cleanup' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Cleanup</Link>
          </>}

          {isOwner && !isSuperadmin && <>
            <Link to="/dashboard" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Dashboard</Link>
            <Link to="/products/manage" className={`text-sm font-medium transition-colors ${location.pathname === '/products/manage' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Manage Products</Link>
            <Link to="/admin/audit-logs" className={`text-sm font-medium transition-colors ${location.pathname === '/admin/audit-logs' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Audit Logs</Link>
          </>}

          {isCashier && !isOwner && !isSuperadmin && <>
            <Link to="/dashboard" className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Sales Dashboard</Link>
            <Link to="/cashier/pos" className={`text-sm font-medium transition-colors ${location.pathname === '/cashier/pos' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>POS</Link>
          </>}

          {!isStaff && <>
            <Link to="/products" className={`text-sm font-medium transition-colors ${location.pathname === '/products' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>Products</Link>
            {user && <Link to="/orders" className={`text-sm font-medium transition-colors ${location.pathname === '/orders' ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>My Orders</Link>}
          </>}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user && !isStaff && <>
            <NotificationDropdown />
            <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">{cartCount}</span>}
            </Button>
          </>}

          {user && isStaff && <NotificationDropdown />}

          {user ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
                <Badge className={`${getRoleBadgeColor(primaryRole)} text-white text-xs`}>{getRoleDisplayName(primaryRole as any)}</Badge>
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setAddressModalOpen(true)}>
                <MapPin className="mr-2 h-4 w-4" />
                {profile?.address ? 'Edit Address' : 'Add Address'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {isSuperadmin && <>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/audit-logs')}><FileText className="mr-2 h-4 w-4" />Audit Logs</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/cleanup')}><Trash2 className="mr-2 h-4 w-4" />Database Cleanup</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>}

              {isOwner && !isSuperadmin && <>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/products/manage')}><Package className="mr-2 h-4 w-4" />Manage Products</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/audit-logs')}><FileText className="mr-2 h-4 w-4" />Audit Logs</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>}

              {isCashier && !isOwner && !isSuperadmin && <>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}><LayoutDashboard className="mr-2 h-4 w-4" />Sales Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/cashier/pos')}><ShoppingBag className="mr-2 h-4 w-4" />POS System</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>}

              {!isStaff && <>
                <DropdownMenuItem onClick={() => navigate('/orders')}><ShoppingBag className="mr-2 h-4 w-4" />My Orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/payments')}><CreditCard className="mr-2 h-4 w-4" />Payment History</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>}

              <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <Button variant="default" size="sm" onClick={() => navigate('/auth/login')}>Sign In</Button>}
        </div>
      </div>

      {user && profile && (
        <EditProfileModal
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          profile={profile}
          userId={user.id}
          currentUserId={user.id}
          userRoles={roles}
          onProfileUpdated={() => refreshProfile()}
        />
      )}

      {user && profile && (
        <AddressModal
          open={addressModalOpen}
          onOpenChange={setAddressModalOpen}
          profile={profile}
          userId={user.id}
          onAddressUpdated={() => refreshProfile()}
        />
      )}
    </header>
  );
}
