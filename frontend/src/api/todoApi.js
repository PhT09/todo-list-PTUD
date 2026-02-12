import axios from 'axios';

// Create AXIOS instance with Base URL
// Vite Proxy will forward '/api' to 'http://127.0.0.1:8000/api'
const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const todoApi = {
    getAll: (params) => apiClient.get('/todos', { params }),

    create: (data) => apiClient.post('/todos', data),

    update: (id, data) => apiClient.patch(`/todos/${id}`, data),

    delete: (id) => apiClient.delete(`/todos/${id}`),
};
