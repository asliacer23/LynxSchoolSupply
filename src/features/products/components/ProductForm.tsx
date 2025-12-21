import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getCategories, getProduct, uploadProductPhoto, createProduct, updateProduct } from '../service';
import { PhotoUpload } from './PhotoUpload';
import type { ProductImage } from '@/types/database';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or higher'),
  stock: z.number().min(0, 'Stock must be 0 or higher').int(),
  category_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  productId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ productId, onSuccess, onCancel }: ProductFormProps) {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProductImage[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category_id: '',
      is_active: true,
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getProduct(productId!),
    enabled: !!productId,
  });

  useEffect(() => {
    if (productData?.data) {
      const product = productData.data;
      form.reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        category_id: product.category_id || '',
        is_active: product.is_active,
      });
      setPhotos(product.images || []);
    }
  }, [productData, form]);

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const productData = {
        name: data.name || '',
        price: data.price ?? 0,
        stock: data.stock ?? 0,
        description: data.description,
        category_id: data.category_id,
        is_active: data.is_active,
      };
      return createProduct(productData, roles, user?.id);
    },
    onSuccess: async (result: any) => {
      const newProductId = result?.data?.id;
      
      if (newProductId && photoFiles.length > 0) {
        // Upload photos for the newly created product
        setCreatedProductId(newProductId);
        try {
          const uploadPromises = photoFiles.map(file => 
            uploadProductPhoto(newProductId, file, user?.id)
          );
          const results = await Promise.all(uploadPromises);
          
          const successfulUploads = results.filter(r => r.data);
          if (successfulUploads.length > 0) {
            toast({
              title: 'Product created with photos',
              description: `Product and ${successfulUploads.length} photo(s) uploaded successfully.`,
            });
          } else {
            toast({
              title: 'Product created',
              description: 'Product created, but photo upload failed. You can add photos later.',
            });
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Photos not uploaded',
            description: 'Product created, but photos failed to upload. You can add them later.',
          });
        }
      } else {
        toast({
          title: 'Product created',
          description: 'The product has been successfully created.',
        });
      }
      
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create product',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const productData = {
        name: data.name || '',
        price: data.price ?? 0,
        stock: data.stock ?? 0,
        description: data.description,
        category_id: data.category_id,
        is_active: data.is_active,
      };
      return updateProduct(productId!, productData, roles, user?.id);
    },
    onSuccess: () => {
      toast({
        title: 'Product updated',
        description: 'The product has been successfully updated.',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update product',
      });
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const categories = categoriesData?.data ?? [];

  async function onSubmit(data: ProductFormData) {
    if (productId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter product description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="mb-0">Active (visible to customers)</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        {productId && (
          <PhotoUpload
            productId={productId}
            existingPhotos={photos}
            onPhotosChange={setPhotos}
            disabled={isLoading}
          />
        )}

        {!productId && (
          <PhotoUpload
            existingPhotos={[]}
            onPreviewFiles={setPhotoFiles}
            previewFiles={photoFiles}
            disabled={isLoading}
          />
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {productId ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
