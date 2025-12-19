import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { StatCard } from './components/StatCard';
import { getDashboardStats, getAllProducts } from './service';
import { getAllOrders, updateOrderStatus } from '@/features/orders/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getPrimaryImageUrl } from '@/features/products/service';

export default function AdminDashboardPage() {
  const { user, roles, loading: authLoading, isAdmin, isCashier, isStaff } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!user || !isStaff())) {
      navigate('/');
    }
  }, [user, authLoading, isStaff, navigate]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(roles),
    enabled: !!user && isStaff(),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['all-orders'],
    queryFn: () => getAllOrders(roles),
    enabled: !!user && isStaff(),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['all-products'],
    queryFn: () => getAllProducts(roles),
    enabled: !!user && isAdmin(),
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

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAdmin() ? 'Admin' : 'Cashier'} Overview
        </p>
      </div>

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
        {isAdmin() && (
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockProducts ?? 0}
            icon={AlertTriangle}
            description="Products with stock ≤ 5"
          />
        )}
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          {isAdmin() && <TabsTrigger value="products">Products</TabsTrigger>}
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
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
                        <p className="font-bold">${Number(order.total).toFixed(2)}</p>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin() && (
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
                                ${Number(product.price).toFixed(2)}
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
    </div>
  );
}
