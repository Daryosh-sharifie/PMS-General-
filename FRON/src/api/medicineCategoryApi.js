const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1/medicine-categories`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const extractCategories = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const medicineCategoryApi = {
  getAllCategories: async () => {
    const response = await fetch(API_BASE_URL, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch categories');
    return extractCategories(data);
  },

  createCategory: async (name) => {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create category');
    return data.data ?? data;
  },

  updateCategory: async (id, name) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update category');
    return data.data ?? data;
  },

  deleteCategory: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete category');
    return data;
  },
};

export default medicineCategoryApi;
