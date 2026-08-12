import { getApiOrigin } from './baseUrl';

const API_URL = `${getApiOrigin()}/api/v1/lab-order-items`;

export const labOrderItemApi = {
  startLabTest: async (id) => {
    const response = await fetch(`${API_URL}/${id}/start`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to start lab test");
    }

    return result;
  },

  saveLabResult: async (id, manualResults, remarks) => {
    const response = await fetch(`${API_URL}/${id}/result`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        manualResults,
        remarks,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save lab result");
    }

    return result;
  },

  verifyLabResult: async (id) => {
    const response = await fetch(`${API_URL}/${id}/verify`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to verify lab result");
    }

    return result;
  },

  cancelLabResult: async (id) => {
    const response = await fetch(`${API_URL}/${id}/cancel`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to cancel lab result");
    }

    return result;
  },
};