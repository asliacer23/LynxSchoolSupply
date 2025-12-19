import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, getProduct, getCategories, searchProducts } from './service';

export function useProducts(categoryId?: string) {
  const { roles } = useAuth();
  
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => getProducts(categoryId, roles),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}

export function useProductSearch(query: string) {
  const { roles } = useAuth();
  
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts(query, roles),
    enabled: query.length > 0,
  });
}
