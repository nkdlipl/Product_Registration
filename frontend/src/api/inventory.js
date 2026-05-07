import axiosInstance from './axiosInstance';

export const getPCBs = (params) => axiosInstance.get('/inventory/pcb', { params });
export const getPCBById = (id) => axiosInstance.get(`/inventory/pcb/${id}`);
export const createPCB = (formData) => axiosInstance.post('/inventory/pcb', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const updatePCB = (id, formData) => axiosInstance.put(`/inventory/pcb/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const deletePCB = (id) => axiosInstance.delete(`/inventory/pcb/${id}`);
