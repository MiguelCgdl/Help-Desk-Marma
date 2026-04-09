import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api', // Gracias al proxy en Vite
    headers: { 'Content-Type': 'application/json' },
});

export default apiClient;