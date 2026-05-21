import axiosInstance from './axiosInstance';

export const getBookASaleOptions = async () => {
  const response = await axiosInstance.get('/book-a-sale/options');
  return response.data.data;
};

export const getBookedSales = async (params) => {
  const response = await axiosInstance.get('/book-a-sale', { params });
  return response.data;
};

export const createBookedSale = async (data) => {
  const response = await axiosInstance.post('/book-a-sale', data);
  return response.data;
};

export const deleteBookedSale = async (id) => {
  const response = await axiosInstance.delete(`/book-a-sale/${id}`);
  return response.data;
};

export const updateBookedSale = async (id, data) => {
  const response = await axiosInstance.put(`/book-a-sale/${id}`, data);
  return response.data;
};
