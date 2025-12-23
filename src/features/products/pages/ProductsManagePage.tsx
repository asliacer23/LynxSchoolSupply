import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Edit2, Trash2, Archive, RotateCcw, MoreVertical, Package } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getAllProducts, deleteProduct, archiveProduct, unarchiveProduct } from '../services/products.service';
import { ProductForm } from '../components/ProductForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Product Card Component - Active Product
interface ProductCardProps {
  product: any;
  onEdit: () => void;
  onArchive: () => void;
  isArchiving: boolean;
}

function ProductCard({ product, onEdit, onArchive, isArchiving }: ProductCardProps) {
  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4 sm:p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{product.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onArchive}
                  disabled={isArchiving}
                  className="cursor-pointer text-orange-600"
                >
                  {isArchiving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
              <p className="text-xs text-muted-foreground font-medium">Price</p>
              <p className="text-sm sm:text-base font-bold text-primary">₱{product.price.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
              <p className="text-xs text-muted-foreground font-medium">Stock</p>
              <p className={`text-sm sm:text-base font-bold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {product.stock}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
              <p className="text-xs text-muted-foreground font-medium">Status</p>
              <p className="text-xs sm:text-sm font-semibold">
                {product.is_active ? '🟢 Active' : '⚫ Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Action Button */}
        <Button
          variant="outline"
          className="w-full mt-4 sm:hidden flex items-center justify-center gap-2"
          onClick={onEdit}
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}

// Archived Product Card Component
interface ArchivedProductCardProps {
  product: any;
  onRestore: () => void;
  onDelete: () => void;
  isRestoring: boolean;
}

function ArchivedProductCard({ product, onRestore, onDelete, isRestoring }: ArchivedProductCardProps) {
  return (
    <Card className="h-full overflow-hidden opacity-75 hover:opacity-100 transition-opacity">
      <CardContent className="p-4 sm:p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{product.name}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onRestore} disabled={isRestoring} className="cursor-pointer text-green-600">
                  {isRestoring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.description}
          </p>

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
              <p className="text-xs text-muted-foreground font-medium">Price</p>
              <p className="text-sm sm:text-base font-bold">₱{product.price.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
              <p className="text-xs text-muted-foreground font-medium">Stock</p>
              <p className="text-sm sm:text-base font-bold">{product.stock}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-2 sm:p-3">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Status</p>
              <p className="text-xs sm:text-sm font-semibold text-orange-600 dark:text-orange-400">Archived</p>
            </div>
          </div>
        </div>

        {/* Mobile Action Button */}
        <Button
          variant="outline"
          className="w-full mt-4 sm:hidden flex items-center justify-center gap-2"
          onClick={onRestore}
        >
          <RotateCcw className="h-4 w-4" />
          Restore
        </Button>
      </CardContent>
    </Card>
  );
}

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
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
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
    <div className="w-full min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Manage Products</h1>
              <p className="text-sm text-muted-foreground mt-1">Add, edit, or manage your product inventory</p>
            </div>
            <Sheet open={showForm} onOpenChange={setShowForm}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowForm(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full sm:w-full md:max-w-2xl overflow-y-auto"
              >
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-xl">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </SheetTitle>
                </SheetHeader>
                <div className="pr-6">
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              <Package className="h-4 w-4 mr-2 hidden sm:inline" />
              <span>Active ({activeProducts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs sm:text-sm">
              <Archive className="h-4 w-4 mr-2 hidden sm:inline" />
              <span>Archived ({archivedProducts.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Active Products Tab */}
          <TabsContent value="active" className="space-y-3 sm:space-y-4 mt-6">
            {activeProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-base sm:text-lg font-medium">No active products found</p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">Get started by creating your first product</p>
                <Button
                  onClick={() => setShowForm(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Create First Product
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                {activeProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => {
                      setEditingProduct(product.id);
                      setShowForm(true);
                    }}
                    onArchive={() => archiveProductMutation.mutate(product.id)}
                    isArchiving={archiveProductMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Archived Products Tab */}
          <TabsContent value="archived" className="space-y-3 sm:space-y-4 mt-6">
            {archivedProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-base sm:text-lg font-medium">No archived products</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                {archivedProducts.map(product => (
                  <ArchivedProductCard
                    key={product.id}
                    product={product}
                    onRestore={() => unarchiveProductMutation.mutate(product.id)}
                    onDelete={() => {
                      setProductHasOrders(false);
                      setDeleteId(product.id);
                    }}
                    isRestoring={unarchiveProductMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            {productHasOrders ? (
              <>
                <AlertDialogTitle>Cannot Delete Product</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3 mt-4">
                  <p className="text-sm">
                    This product has been used in orders and cannot be deleted due to database constraints.
                  </p>
                  <p className="font-semibold text-foreground text-sm">
                    Would you like to archive it instead? Archived products will be hidden from customers but sales history will be preserved.
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
