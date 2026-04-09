import axios from 'axios';

const companyApi = axios.create({ baseURL: 'http://localhost:5001/api' });

companyApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('companyToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default companyApi;
