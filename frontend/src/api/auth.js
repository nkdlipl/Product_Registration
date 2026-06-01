import axiosInstance from './axiosInstance';

export const loginApi = (email, password) => axiosInstance.post('/auth/login', { email, password });
export const refreshApi = () => axiosInstance.post('/auth/refresh');
export const logoutApi = () => axiosInstance.post('/auth/logout');
