import api from '../utils/api';

export const departmentService = {
  getAll: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/departments', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`/departments/${id}/toggle-status`);
    return response.data;
  },
};