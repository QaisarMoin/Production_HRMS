
import api from '../utils/api';

export const designationService = {
  // Get all designations
  getAll: async () => {
    const response = await api.get('/designations');
    return response.data;
  },

  // Get designation by ID
  getById: async (id) => {
    const response = await api.get(`/designations/${id}`);
    return response.data;
  },

  // Create new designation
  create: async (data) => {
    const response = await api.post('/designations', data);
    return response.data;
  },

  // Update designation
  update: async (id, data) => {
    const response = await api.put(`/designations/${id}`, data);
    return response.data;
  },

  // Delete designation
  delete: async (id) => {
    const response = await api.delete(`/designations/${id}`);
    return response.data;
  },

  // Toggle designation status
  toggleStatus: async (id) => {
    const response = await api.patch(`/designations/${id}/toggle-status`);
    return response.data;
  },

  // Search designations
  search: async (query) => {
    const response = await api.get(`/designations/search?q=${query}`);
    return response.data;
  },
};
