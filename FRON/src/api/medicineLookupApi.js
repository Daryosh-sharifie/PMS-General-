const createLookupApi = (resourcePath) => {
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1/${resourcePath}`;

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  });

  const parseError = async (response) => {
    try {
      const data = await response.json();
      return data.message || 'Request failed';
    } catch {
      return 'Request failed';
    }
  };

  return {
    getAll: async () => {
      const response = await fetch(API_BASE_URL, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error(await parseError(response));
      const data = await response.json();
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data)) return data;
      return [];
    },

    create: async (name) => {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error(await parseError(response));
      const data = await response.json();
      return data.data ?? data;
    },

    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await parseError(response));
      const data = await response.json();
      return data.data ?? data;
    },
  };
};

export const medicineFrequencyApi = createLookupApi('medicine-frequencies');
export const medicineMealTimingApi = createLookupApi('medicine-meal-timings');
