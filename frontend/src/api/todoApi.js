import axios from 'axios';

// Create AXIOS instance with Base URL
const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const todoApi = {
    // ─── Auth ───
    setAuthToken: (token) => {
        if (token) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete apiClient.defaults.headers.common['Authorization'];
        }
    },

    login: (formData) => apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),

    register: (data) => apiClient.post('/auth/register', data),

    getMe: () => apiClient.get('/auth/me'),

    // ─── Todos ───
    getAll: (params) => apiClient.get('/todos', { params }),

    create: (data) => apiClient.post('/todos', data),

    update: (id, data) => apiClient.patch(`/todos/${id}`, data),

    delete: (id) => apiClient.delete(`/todos/${id}`),

    deleteCompleted: () => apiClient.delete('/todos/completed'),
};
