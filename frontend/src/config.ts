// frontend/src/config.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5001/uploads';
export const BASE_SERVER_URL = UPLOADS_URL.replace('/uploads', '');
