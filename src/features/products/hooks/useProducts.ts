import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getProducts, getProduct, getCategories, searchProducts } from '../services/products.service';

export function useProducts(categoryId?: string) {
  const { roles } = useAuth();
  
  return useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => getProducts(categoryId, roles),
    refetchOnWindowFocus: true,
    staleTime: 60000, // Consider data fresh for 60 seconds
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
    staleTime: 60000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    refetchOnWindowFocus: false,
    staleTime: 300000, // Categories don't change often
  });
}

export function useProductSearch(query: string) {
  const { roles } = useAuth();
  
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => searchProducts(query, roles),
    enabled: query.length > 0,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });
}
