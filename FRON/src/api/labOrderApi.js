const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/lab-orders`;

const authHeaders = () => ({
	"Content-Type": "application/json",
	Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const safeJson = async (response) => {
	const text = await response.text();
	if (!text) return {};

	try {
		return JSON.parse(text);
	} catch {
		return { message: text };
	}
};

const normalizeId = (value) => {
	const rawId = typeof value === "object" && value !== null ? value.id : value;
	const id = Number(rawId);
	return Number.isFinite(id) && id > 0 ? id : null;
};

const normalizeTestIds = (testIds = []) => {
	const ids = (Array.isArray(testIds) ? testIds : [])
		.map(normalizeId)
		.filter(Boolean);

	return [...new Set(ids)];
};

const requestJson = async (url, options, fallbackMessage) => {
	const response = await fetch(url, options);
	const result = await safeJson(response);

	if (!response.ok) {
		const message =
			result?.message ||
			result?.error ||
			result?.errors?.[0]?.message ||
			fallbackMessage;

		const error = new Error(message);
		error.status = response.status;
		error.result = result;
		throw error;
	}

	return result;
};

export const labOrderApi = {
	createLabOrder: async ({ patientId, prescriptionId, testIds, notes }) => {
		const cleanPatientId = normalizeId(patientId);
		const cleanPrescriptionId = normalizeId(prescriptionId);
		const cleanTestIds = normalizeTestIds(testIds);

		if (!cleanPatientId) {
			throw new Error("Patient ID is missing for lab request.");
		}

		if (!cleanPrescriptionId) {
			throw new Error("Prescription ID is missing for lab request.");
		}

		if (cleanTestIds.length === 0) {
			throw new Error("Please select at least one valid lab test.");
		}

		const payload = {
			patientId: cleanPatientId,
			prescriptionId: cleanPrescriptionId,
			testIds: cleanTestIds,
			notes: notes || "",
		};

		try {
			return await requestJson(
				`${API_URL}/create`,
				{
					method: "POST",
					headers: authHeaders(),
					body: JSON.stringify(payload),
				},
				"Failed to create lab request"
			);
		} catch (error) {
			if (error.status === 404 || error.status === 405) {
				return requestJson(
					API_URL,
					{
						method: "POST",
						headers: authHeaders(),
						body: JSON.stringify(payload),
					},
					"Failed to create lab request"
				);
			}

			throw error;
		}
	},

	getAllLabOrders: async (page = 1, limit = 50, filters = {}) => {
		const params = new URLSearchParams({
			page,
			limit,
			...(filters.status && { status: filters.status }),
			...(filters.search && { search: filters.search }),
			...(filters.patientId && { patientId: filters.patientId }),
			...(filters.prescriptionId && { prescriptionId: filters.prescriptionId }),
		});

		try {
			return await requestJson(
				`${API_URL}/get-all-orders?${params}`,
				{
					method: "GET",
					headers: authHeaders(),
				},
				"Failed to fetch lab orders"
			);
		} catch (error) {
			if (error.status === 404 || error.status === 405) {
				return requestJson(
					`${API_URL}?${params}`,
					{
						method: "GET",
						headers: authHeaders(),
					},
					"Failed to fetch lab orders"
				);
			}

			throw error;
		}
	},

	getLabOrderById: async (id) => {
		const cleanId = normalizeId(id);
		if (!cleanId) throw new Error("Invalid lab order ID.");

		try {
			return await requestJson(
				`${API_URL}/get-order/${cleanId}`,
				{
					method: "GET",
					headers: authHeaders(),
				},
				"Failed to fetch lab order"
			);
		} catch (error) {
			if (error.status === 404 || error.status === 405) {
				return requestJson(
					`${API_URL}/${cleanId}`,
					{
						method: "GET",
						headers: authHeaders(),
					},
					"Failed to fetch lab order"
				);
			}

			throw error;
		}
	},

	getPatientLabOrders: async (patientId) => {
		const cleanPatientId = normalizeId(patientId);
		if (!cleanPatientId) throw new Error("Invalid patient ID.");

		return requestJson(
			`${API_URL}/patient/${cleanPatientId}`,
			{
				method: "GET",
				headers: authHeaders(),
			},
			"Failed to fetch patient lab orders"
		);
	},

	getPrescriptionLabOrders: async (prescriptionId) => {
		const cleanPrescriptionId = normalizeId(prescriptionId);
		if (!cleanPrescriptionId) throw new Error("Invalid prescription ID.");

		return requestJson(
			`${API_URL}/prescription/${cleanPrescriptionId}`,
			{
				method: "GET",
				headers: authHeaders(),
			},
			"Failed to fetch prescription lab orders"
		);
	},
};