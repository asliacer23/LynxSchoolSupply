import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Edit2, Trash2, Archive, RotateCcw } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getAllProducts, deleteProduct, archiveProduct, unarchiveProduct } from '../services/products.service';
import { ProductForm } from '../components/ProductForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function ProductsManagePage() {
  const { user, roles, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [productHasOrders, setProductHasOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin())) {
      navigate('/');
    }
  }, [user, authLoading, isAdmin, navigate]);

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => getAllProducts(roles),
    enabled: !!user && isAdmin(),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id, roles, user?.id),
    onSuccess: () => {
      toast({
        title: 'Product deleted',
        description: 'The product has been successfully deleted.',
      });
      refetch();
      setDeleteId(null);
      setProductHasOrders(false);
    },
    onError: (error: any) => {
      const errorMsg = error.message || 'Failed to delete product';
      if (errorMsg.includes('Cannot delete') || errorMsg.includes('has been used in orders')) {
        setProductHasOrders(true);
      }
      toast({
        variant: 'destructive',
        title: 'Cannot Delete',
        description: errorMsg,
      });
    },
  });

  const archiveProductMutation = useMutation({
    mutationFn: (id: string) => archiveProduct(id, roles, user?.id),
    onSuccess: () => {
      toast({
        title: 'Product archived',
        description: 'The product has been archived and hidden from customers.',
      });
      refetch();
      setDeleteId(null);
      setProductHasOrders(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to archive product',
      });
    },
  });

  const unarchiveProductMutation = useMutation({
    mutationFn: (id: string) => unarchiveProduct(id, roles, user?.id),
    onSuccess: () => {
      toast({
        title: 'Product restored',
        description: 'The product has been restored and is now visible to customers.',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to restore product',
      });
    },
  });

  const products = productsData?.data ?? [];
  const activeProducts = products.filter(p => !p.is_archived);
  const archivedProducts = products.filter(p => p.is_archived);

  if (authLoading || isLoading) {
    return (
      <div className="container py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Products</h1>
        <Button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              productId={editingProduct}
              onSuccess={() => {
                setShowForm(false);
                setEditingProduct(null);
                refetch();
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active Products ({activeProducts.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived Products ({archivedProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {activeProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No active products found</p>
              <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
                Create First Product
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {activeProducts.map(product => (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        <div className="flex items-center gap-6 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">₱{product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <p className="text-lg font-semibold">{product.stock}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className="text-sm font-medium">
                              {product.is_active ? '✅ Active' : '❌ Inactive'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(product.id);
                            setShowForm(true);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => archiveProductMutation.mutate(product.id)}
                          className="flex items-center gap-2"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="space-y-4 mt-6">
          {archivedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No archived products</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {archivedProducts.map(product => (
                <Card key={product.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                        <div className="flex items-center gap-6 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="text-lg font-semibold">₱{product.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <p className="text-lg font-semibold">{product.stock}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                              <Archive className="h-4 w-4" />
                              Archived
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unarchiveProductMutation.mutate(product.id)}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setProductHasOrders(false);
                            setDeleteId(product.id);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {productHasOrders ? (
              <>
                <AlertDialogTitle>Cannot Delete Product</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3 mt-3">
                  <p>
                    This product has been used in orders and cannot be deleted due to database constraints.
                  </p>
                  <p className="font-semibold text-foreground">
                    Would you like to archive it instead? Archived products will be hidden from customers but the sales history will be preserved.
                  </p>
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this product? This action cannot be undone.
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {productHasOrders ? (
              <AlertDialogAction
                onClick={() => deleteId && archiveProductMutation.mutate(deleteId)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Archive Instead
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={() => deleteId && deleteProductMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
