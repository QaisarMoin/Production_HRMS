
import api from '../utils/api';

export const dashboardService = {
  // Get employee statistics
  getEmployeeStats: async () => {
    const response = await api.get('/dashboard/employee-stats');
    return response.data;
  },

  // Get department wise statistics
  getDepartmentStats: async () => {
    const response = await api.get('/dashboard/department-stats');
    return response.data;
  },

  // Get migrant statistics
  getMigrantStats: async () => {
    const response = await api.get('/dashboard/migrant-stats');
    return response.data;
  },

  // Get workforce insights
  getWorkforceInsights: async (type, month) => {
    const response = await api.get('/dashboard/workforce-insights', {
      params: { type, month }
    });
    return response.data;
  },

  // Get attendance statistics
  getAttendanceStats: async () => {
    const response = await api.get('/dashboard/attendance-stats');
    return response.data;
  },

  // Get calendar events
  getCalendarEvents: async (month, year) => {
    const response = await api.get('/dashboard/calendar-events', {
      params: { month, year }
    });
    return response.data;
  },
};
