import axios from 'axios';

// Base API client configured for the FastAPI backend
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://kiranaiq-fastapi.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
