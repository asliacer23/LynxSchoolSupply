import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Edit2, Trash2, Archive, RotateCcw, ChevronDown, Search, Filter } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

/**
 * Alternative Table-Based Product Management Page
 * Better for power users and desktop users who need to see all products at once
 */
export default function ProductsManagePageTable() {
  const { user, roles, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [productHasOrders, setProductHasOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

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
    staleTime: 30000,
    refetchInterval: 60000,
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

  // Filter products based on search query
  const filteredActive = activeProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredArchived = archivedProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Manage Products</h1>
              <p className="text-sm text-muted-foreground mt-1">Table view for efficient product management</p>
            </div>
            <Sheet open={showForm} onOpenChange={setShowForm}>
              <SheetTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowForm(true);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
                </SheetHeader>
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="active">
                Active ({filteredActive.length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({filteredArchived.length})
              </TabsTrigger>
            </TabsList>

            {/* Search Bar */}
            <div className="w-full sm:w-72 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Active Products Table */}
          <TabsContent value="active">
            {filteredActive.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground font-medium">No products match your search</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground font-medium">No active products</p>
                    <Button
                      onClick={() => setShowForm(true)}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Create First Product
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold">Product Name</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold">Description</TableHead>
                      <TableHead className="font-semibold text-right">Price</TableHead>
                      <TableHead className="font-semibold text-center">Stock</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-right w-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActive.map(product => (
                      <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-semibold">{product.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </TableCell>
                        <TableCell className="font-semibold text-right">₱{product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold ${
                            product.stock > 10
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : product.stock > 0
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <span className="text-sm font-medium">
                            {product.is_active ? '🟢' : '⚫'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingProduct(product.id);
                                  setShowForm(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => archiveProductMutation.mutate(product.id)}
                                disabled={archiveProductMutation.isPending}
                                className="cursor-pointer text-orange-600"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Archived Products Table */}
          <TabsContent value="archived">
            {filteredArchived.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                {searchQuery ? (
                  <>
                    <p className="text-muted-foreground font-medium">No archived products match your search</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground font-medium">No archived products</p>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold">Product Name</TableHead>
                      <TableHead className="hidden sm:table-cell font-semibold">Description</TableHead>
                      <TableHead className="font-semibold text-right">Price</TableHead>
                      <TableHead className="font-semibold text-center">Stock</TableHead>
                      <TableHead className="hidden md:table-cell font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-right w-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="opacity-75">
                    {filteredArchived.map(product => (
                      <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-semibold">{product.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </TableCell>
                        <TableCell className="font-semibold text-right">₱{product.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-semibold">{product.stock}</TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          <span className="text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 px-2 py-1 rounded">
                            Archived
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => unarchiveProductMutation.mutate(product.id)}
                                disabled={unarchiveProductMutation.isPending}
                                className="cursor-pointer text-green-600"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setProductHasOrders(false);
                                  setDeleteId(product.id);
                                }}
                                className="cursor-pointer text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                    This product has been used in orders and cannot be deleted.
                  </p>
                  <p className="font-semibold text-foreground text-sm">
                    Would you like to archive it instead?
                  </p>
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? This action cannot be undone.
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {productHasOrders ? (
              <AlertDialogAction
                onClick={() => deleteId && archiveProductMutation.mutate(deleteId)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Archive Instead
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={() => deleteId && deleteProductMutation.mutate(deleteId)}
                className="bg-destructive hover:bg-destructive/90"
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
