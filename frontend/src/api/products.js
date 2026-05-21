import axiosInstance from './axiosInstance';

export const getProducts = (params) => axiosInstance.get('/products', { params });
export const getProductById = (id) => axiosInstance.get(`/products/${id}`);
export const createProduct = (data) => axiosInstance.post('/products', data);
export const updateProduct = (id, data) => axiosInstance.put(`/products/${id}`, data);
export const removeAsset = (id, url, type) => axiosInstance.delete(`/products/${id}/assets`, { data: { url, type } });
export const deleteProduct = (id) => axiosInstance.delete(`/products/${id}`);
export const getBomOptions = () => axiosInstance.get('/products/bom-options');
export const getProductBom = (id) => axiosInstance.get(`/products/${id}/bom`);
export const saveProductBom = (id, items) => axiosInstance.put(`/products/${id}/bom`, { items });

