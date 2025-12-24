import { useEffect, useState } from 'react';
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
import { OrderDetailsModal } from '../../orders/components/OrderDetailsModal';

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
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => getAllOrders(roles, user?.id),
    enabled: !!user && canAccess(roles, 'view_all_orders'),
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 45000, // Refetch every 45 seconds
  });

  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => getAllProducts(roles),
    enabled: !!user && canAccess(roles, 'edit_product'),
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
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
      {/* Desktop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 hidden md:block">
        <TabsList className="flex w-full overflow-x-auto bg-muted p-1 rounded-lg">
          {isSuperadmin && <TabsTrigger value="system" className="whitespace-nowrap">System Overview</TabsTrigger>}
          <TabsTrigger value="orders" className="whitespace-nowrap">Orders</TabsTrigger>
          {canEditProducts && <TabsTrigger value="products" className="whitespace-nowrap">Products</TabsTrigger>}
          {isSuperadmin && <TabsTrigger value="info" className="whitespace-nowrap">System Info</TabsTrigger>}
        </TabsList>

        {/* System Overview Tab - superadmin only */}
        {isSuperadmin && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedOrderId(order.id)}
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

      {/* Mobile Navigation - Dropdown for mobile view */}
      <div className="block md:hidden mb-6">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {isSuperadmin && <SelectItem value="system">System Overview</SelectItem>}
            <SelectItem value="orders">Orders</SelectItem>
            {canEditProducts && <SelectItem value="products">Products</SelectItem>}
            {isSuperadmin && <SelectItem value="info">System Info</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Content View */}
      <div className="block md:hidden space-y-4">
        {/* System Overview - Mobile */}
        {isSuperadmin && activeTab === "system" && (
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-xl font-bold">{stats?.totalOrders ?? 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-xl font-bold">₱{(stats?.totalRevenue ?? 0).toFixed(2)}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Pending Orders</p>
                  <p className="text-xl font-bold">{stats?.pendingOrders ?? 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Products</p>
                  <p className="text-xl font-bold">{stats?.totalProducts ?? 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Low Stock Items</p>
                  <p className="text-xl font-bold text-destructive">{stats?.lowStockProducts ?? 0}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Users</p>
                  <p className="text-xl font-bold">{stats?.totalUsers ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders - Mobile */}
        {activeTab === "orders" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{canViewAllOrders ? 'All Orders' : 'Your Orders'}</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 10).map(order => (
                    <div key={order.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">Order #{order.id.substring(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline">₱{Number(order.total).toFixed(2)}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <Select value={order.status} onValueChange={status => handleStatusChange(order.id, status)}>
                          <SelectTrigger className="w-24 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products - Mobile */}
        {canEditProducts && activeTab === "products" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Products Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No products yet</p>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 10).map(product => {
                    const imageUrl = getPrimaryImageUrl(product);
                    return (
                      <div key={product.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex gap-3">
                          <div className="h-12 w-12 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="object-cover w-full h-full rounded" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">₱{Number(product.price).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
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
        )}

        {/* System Info - Mobile */}
        {isSuperadmin && activeTab === "info" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Application</p>
                  <p className="font-medium text-sm">LynxSchoolSupplies</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Current User</p>
                  <p className="font-medium text-sm">{profile?.full_name || 'Unknown'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">User Email</p>
                  <p className="font-medium text-sm break-all">{user?.email}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium text-sm">System Administrator</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Permissions</p>
                  <p className="font-medium text-sm">Full System Access</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground">Last Visited</p>
                  <p className="font-medium text-sm">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <OrderDetailsModal 
        orderId={selectedOrderId}
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />
    </div>
  );
}
