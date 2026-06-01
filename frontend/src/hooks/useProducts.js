import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';

export const useProducts = (params) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const response = await getProducts(params);
      return response.data;
    },
    // Keep previous data on screen while fetching new data (great for pagination/search)
    keepPreviousData: true,
  });
};
