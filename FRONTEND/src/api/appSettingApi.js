import { getApiOrigin } from './baseUrl';

const API_URL = `${getApiOrigin()}/api/v1/app-settings`

// Expose base origin for building absolute asset URLs (e.g., /uploads/...)
export const APP_SETTINGS_BASE = API_URL.replace(/\/api\/v1\/app-settings.*/, '');

export const appSettingApi = {
  // Get app settings
  getAppSetting: async () => {
    const response = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch app settings');
    }
    return result;
  },

  // Update app settings (text fields) with fallback create
  updateAppSetting: async (data) => {
    const payload = {
      hospitalName: data.hospitalName,
      phone1: data.phone1,
      phone2: data.phone2 || '',
      address: data.address,
    };

    const doRequest = async (method) => {
      const response = await fetch(`${API_URL}` , {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return { response, result };
    };

    let { response, result } = await doRequest('PATCH');

    // If setting doesn't exist yet, create it
    if (response.status === 404) {
      ({ response, result } = await doRequest('POST'));
    }
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update app settings');
    }
    return result;
  },

  // Upload logo (PATCH with multipart); if missing, fall back to create (POST)
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);

    const doRequest = async (method) => {
      // For POST fallback, ensure required fields exist
      if (method === 'POST') {
        if (!formData.has('hospitalName')) formData.append('hospitalName', 'Hospital');
        if (!formData.has('phone1')) formData.append('phone1', '');
        if (!formData.has('phone2')) formData.append('phone2', '');
        if (!formData.has('address')) formData.append('address', '');
      }

      const response = await fetch(`${API_URL}`, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });

      const contentType = response.headers.get('content-type');
      let result;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          result = await response.json();
        } else {
          const text = await response.text();
          throw new Error('Server error: Invalid response format. Please check the backend.');
        }
      } catch (err) {
        throw new Error('Server error: ' + err.message);
      }

      return { response, result };
    };

    let { response, result } = await doRequest('PATCH');

    // If setting doesn't exist yet, create it with the logo
    if (response.status === 404) {
      ({ response, result } = await doRequest('POST'));
    }
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to upload logo');
    }
    return result;
  }
};

