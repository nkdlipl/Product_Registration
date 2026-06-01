import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookedSales, createBookedSale, updateBookedSale, deleteBookedSale, getBookASaleOptions } from '../api/bookASale';

export const useSales = (params) => {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: async () => {
      const response = await getBookedSales(params);
      return response;
    },
    keepPreviousData: true,
  });
};

export const useSaleOptions = () => {
  return useQuery({
    queryKey: ['saleOptions'],
    queryFn: async () => {
      const response = await getBookASaleOptions();
      return response.data;
    },
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBookedSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateBookedSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBookedSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
};
