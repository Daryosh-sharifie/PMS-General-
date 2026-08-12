import { getApiOrigin } from './baseUrl';

const API_URL = `${getApiOrigin()}/api/v1/users`;

export const userApi = {
  // Get all users
  getAllUsers: async () => {
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch users');
    }
    // Backend returns { status, result, data: { users: [...] } }
    return result?.data?.users || result?.data || result;
  },

  // Get a user by id
  getUser: async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch user');
    }
    return result?.data?.user || result;
  },

  // Update a user (admin or self if backend allows)
  // Accepts plain fields and optional avatar file
  updateUser: async (id, fields = {}, avatarFile = null) => {
    const token = localStorage.getItem('token') || '';

    // Use multipart when avatar is present; otherwise JSON
    if (avatarFile) {
      const formData = new FormData();
      Object.entries(fields || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      formData.append('avatar', avatarFile);

      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }
      return result?.data?.user || result;
    } else {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user');
      }
      return result?.data?.user || result;
    }
  },

  // Create a user (admin only) - uses POST /api/v1/users
  createUser: async (fields = {}, avatarFile = null) => {
    const token = localStorage.getItem('token') || '';
    if (avatarFile) {
      const formData = new FormData();
      Object.entries(fields || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
      });
      formData.append('avatar', avatarFile);
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }
      return result?.data?.user || result;
    } else {
      const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }
      return result?.data?.user || result;
    }
  },

  // Delete a user (admin)
  deleteUser: async (id) => {
    const token = localStorage.getItem('token') || '';
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok && response.status !== 204) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete user');
    }
    return { status: 'success' };
  }
};

// Get a user with their prescriptions (doctor view)
export const getUserWithPrescriptions = async (id) => {
  const token = localStorage.getItem('token') || '';
  const response = await fetch(`${API_URL}/${id}/prescriptions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch user prescriptions');
  }
  return result?.data?.user || result;
};


