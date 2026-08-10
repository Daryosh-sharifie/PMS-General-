const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1/medicines`;

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

const medicineApi = {
  // Get all medicines with pagination and search
  getAllMedicines: async (page = 1, limit = 10, search = "", type = "", dateFilters = {}) => {
    const params = new URLSearchParams({ page, limit, search });
    if (type) params.append('type', type);
    if (dateFilters.startDate) params.append('startDate', dateFilters.startDate);
    if (dateFilters.endDate) params.append('endDate', dateFilters.endDate);
    const response = await fetch(`${API_BASE_URL}?${params}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch medicines');
    return data;
  },

  // Get single medicine by ID
  getMedicineById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch medicine');
    return data;
  },

  // Create new medicine
  createMedicine: async (medicineData) => {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(medicineData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create medicine');
    return data;
  },

  // Update medicine
  updateMedicine: async (id, medicineData) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(medicineData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update medicine');
    return data;
  },

  // Delete medicine
  deleteMedicine: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete medicine');
    return data;
  },

  // Search medicines
  searchMedicines: async (query) => {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${API_BASE_URL}/search?${params}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to search medicines');
    return data;
  },
};

export default medicineApi;

