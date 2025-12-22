import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { canAccess } from '@/lib/authorization';
import { StatCard } from '../components/StatCard';
import { getDashboardStats, getAllProducts, getAllOrders, updateOrderStatus } from '../services/dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getPrimaryImageUrl } from '@/lib/shared-services/imageService';

/**
 * Unified Dashboard Page
 * Shared by all roles (superadmin, owner, cashier)
 * Content and features shown based on role permissions
 */
export default function DashboardPage() {
  const { user, profile, roles, loading: authLoading, isAdmin, isCashier, isStaff } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Authorization check
  useEffect(() => {
    if (!authLoading && (!user || !canAccess(roles, 'view_dashboard'))) {
      navigate('/');
    }
  }, [user, authLoading, roles, navigate]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(roles),
    enabled: !!user && canAccess(roles, 'view_dashboard'),
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => getAllOrders(roles, user?.id),
    enabled: !!user && canAccess(roles, 'view_all_orders'),
  });

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => getAllProducts(roles),
    enabled: !!user && canAccess(roles, 'edit_product'),
  });

  const handleStatusChange = async (orderId: string, status: string) => {
    const { error } = await updateOrderStatus(orderId, status, roles, user?.id);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error.message,
      });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['all-orders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    await refetchOrders();
    await refetchStats();
    toast({
      title: 'Status updated',
      description: 'Order status has been updated.',
    });
  };

  if (authLoading || statsLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const orders = ordersData?.data ?? [];
  const products = productsData?.data ?? [];
  const canViewAllOrders = canAccess(roles, 'view_all_orders');
  const canEditProducts = canAccess(roles, 'edit_product');
  const isSuperadmin = roles.includes('superadmin') && !roles.includes('owner');

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {isSuperadmin ? 'System Administrator' : isAdmin() ? 'Business Owner' : 'Cashier'} Overview
        </p>
      </div>

      {/* Stats Cards - shown to all staff (permissions-based) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={ShoppingCart}
        />
        <StatCard
          title="Total Revenue"
          value={`₱${(stats?.totalRevenue ?? 0).toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={Package}
        />
        {canEditProducts && (
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockProducts ?? 0}
            icon={AlertTriangle}
            description="Products with stock ≤ 5"
          />
        )}
      </div>

      {/* Tabs - shown based on permissions */}
      <Tabs defaultValue={isSuperadmin ? "system" : "orders"} className="space-y-4">
        <TabsList>
          {isSuperadmin && <TabsTrigger value="system">System Overview</TabsTrigger>}
          <TabsTrigger value="orders">Orders</TabsTrigger>
          {canEditProducts && <TabsTrigger value="products">Products</TabsTrigger>}
          {isSuperadmin && <TabsTrigger value="info">System Info</TabsTrigger>}
        </TabsList>

        {/* System Overview Tab - superadmin only */}
        {isSuperadmin && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                    <p className="text-2xl font-bold">{stats?.totalOrders ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">₱{(stats?.totalRevenue ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
                    <p className="text-2xl font-bold">{stats?.pendingOrders ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                    <p className="text-2xl font-bold">{stats?.totalProducts ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Low Stock Items</p>
                    <p className="text-2xl font-bold text-destructive">{stats?.lowStockProducts ?? 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Orders Tab - accessible to all roles with view_all_orders permission */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>
                {canViewAllOrders ? 'All Orders' : 'Your Orders'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 10).map(order => (
                    <div
                      key={order.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold">₱{Number(order.total).toFixed(2)}</p>
                        {canViewAllOrders && (
                          <Select
                            defaultValue={order.status}
                            onValueChange={value => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab - admin only (edit_product permission) */}
        {canEditProducts && (
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Products Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No products yet</p>
                ) : (
                  <div className="space-y-4">
                    {products.map(product => {
                      const imageUrl = getPrimaryImageUrl(product);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={product.name}
                                  className="object-cover w-full h-full rounded"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ₱{Number(product.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={product.stock <= 5 ? 'destructive' : 'secondary'}>
                              Stock: {product.stock}
                            </Badge>
                            <Badge variant={product.is_active ? 'default' : 'secondary'}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* System Info Section - superadmin only */}
      {isSuperadmin && (
        <div className="mt-8 p-6 border rounded-lg bg-muted/30">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Application</p>
              <p className="font-medium">LynxSchoolSupplies</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current User</p>
              <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">User Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium">System Administrator</p>
            </div>
            <div>
              <p className="text-muted-foreground">Permissions</p>
              <p className="font-medium">Full System Access</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Visited</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
