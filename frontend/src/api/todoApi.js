import axios from 'axios';

// Create AXIOS instance with Base URL
const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const PRIORITY_OPTIONS = [
    { value: 'Priority', label: 'Ưu tiên', color: '#ef4444' },
    { value: 'Important', label: 'Quan trọng', color: '#f97316' },
    { value: 'Necessary', label: 'Cần thiết', color: '#3b82f6' },
    { value: 'Normal', label: 'Bình thường', color: '#94a3b8' },
];

export const getPriorityColor = (priority) => {
    const opt = PRIORITY_OPTIONS.find(p => p.value === priority);
    return opt ? opt.color : '#94a3b8';
};

export const getPriorityLabel = (priority) => {
    const opt = PRIORITY_OPTIONS.find(p => p.value === priority);
    return opt ? opt.label : 'Bình thường';
};

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

    // Smart Endpoints
    getOverdue: () => apiClient.get('/todos/overdue'),

    getToday: () => apiClient.get('/todos/today'),

    // Trash Management
    getTrash: () => apiClient.get('/todos/trash'),

    restore: (id) => apiClient.post(`/todos/${id}/restore`),

    permanentDelete: (id) => apiClient.delete(`/todos/${id}/permanent`),

    // ─── Analytics ───
    getAnalyticsStats: (params) => apiClient.get('/analytics/stats', { params }),
};
