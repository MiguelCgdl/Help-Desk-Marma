import axios from 'axios';
import { API_URL } from '../config';

const companyApi = axios.create({ baseURL: API_URL });

companyApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('companyToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default companyApi;
