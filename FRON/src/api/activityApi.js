import { getApiOrigin } from './baseUrl';

const API_URL = `${getApiOrigin()}/api/v1/activity`;

export const activityApi = {
  getLogs: async (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams({ page, limit, ...filters });
    const response = await fetch(`${API_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch activity logs');
    }
    return result;
  },

  deleteAll: async () => {
    const response = await fetch(`${API_URL}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete activity logs');
    }
    return result;
  },
};
