import axiosInstance from './axiosInstance';

export const getCompanies = () => axiosInstance.get('/companies');
export const createCompany = (data) => axiosInstance.post('/companies', data);
export const updateCompany = (id, data) => axiosInstance.put(`/companies/${id}`, data);
export const deleteCompany = (id) => axiosInstance.delete(`/companies/${id}`);

export const getSubCompanies = (companyId) => axiosInstance.get(`/companies/${companyId}/sub`);
export const createSubCompany = (companyId, data) => axiosInstance.post(`/companies/${companyId}/sub`, data);
export const updateSubCompany = (id, data) => axiosInstance.put(`/companies/sub/${id}`, data);
export const deleteSubCompany = (id) => axiosInstance.delete(`/companies/sub/${id}`);
