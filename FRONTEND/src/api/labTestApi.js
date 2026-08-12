import { getApiOrigin } from './baseUrl';

const API_BASE_URL = `${getApiOrigin()}/api/v1/lab`;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const requestJson = async (url, options, fallbackMessage) => {
  const response = await fetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
};

export const labTestApi = {
  // Get all active lab tests
  getLabTests: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.category) query.append("category", params.category);
    if (params.includeInactive) query.append("includeInactive", "true");

    const queryString = query.toString();
    const endpoint = queryString ? `/tests?${queryString}` : "/get-tests";

    return requestJson(
      `${API_BASE_URL}${endpoint}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
      "Failed to fetch lab tests"
    );
  },

  createLabTest: async (labTestData) => {
    return requestJson(
      `${API_BASE_URL}/tests`,
      {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(labTestData),
      },
      "Failed to create lab test"
    );
  },

  updateLabTest: async (id, labTestData) => {
    return requestJson(
      `${API_BASE_URL}/tests/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(labTestData),
      },
      "Failed to update lab test"
    );
  },

  deleteLabTest: async (id) => {
    return requestJson(
      `${API_BASE_URL}/tests/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
      "Failed to delete lab test"
    );
  },
};
