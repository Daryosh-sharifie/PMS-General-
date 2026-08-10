const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/prescriptions`;

const authHeaders = () => ({
	"Content-Type": "application/json",
	Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

const safeJson = async (response) => {
	const text = await response.text();
	return text ? JSON.parse(text) : {};
};

const normalizeMedicine = (medicine = {}) => ({
	name: medicine?.name || "",
	dosage: medicine?.dosage || "",
	frequency: medicine?.frequency || "",
	route: medicine?.route || medicine?.type || "",
	type: medicine?.type || medicine?.route || "",
	duration: medicine?.duration || "",
	instructions: medicine?.instructions || "",
	amount: Number(medicine?.amount) || 0,
	mealTiming: medicine?.mealTiming || "",
});

const buildPrescriptionPayload = (data = {}, isUpdate = false) => {
	const payload = {};

	if (!isUpdate) {
		payload.patientId = Number(data.patientId);
		payload.doctorId = Number(data.doctorId);
		payload.status = data.status || "PENDING";
	}

	const allowedFields = [
		"patientName",
		"diagnosis",
		"status",
		"rejectionReason",
		"pastHistory",
		"investigation",
		"notes",
		"instructions",
		"impression",
		"drugHistory",
		"bloodPressure",
		"respiratoryRate",
		"pulseRate",
		"temperature",
		"heartRate",
		"spo2",
		"clc",
	];

	allowedFields.forEach((field) => {
		if (data[field] !== undefined) {
			payload[field] = data[field];
		}
	});

	if (data.medicines !== undefined) {
		payload.medicines = (data.medicines || [])
			.map(normalizeMedicine)
			.filter(
				(medicine) =>
					medicine.name ||
					medicine.dosage ||
					medicine.frequency ||
					medicine.route ||
					medicine.type ||
					medicine.duration ||
					medicine.instructions ||
					medicine.amount ||
					medicine.mealTiming
			);
	}

	return payload;
};

const handleResponse = async (response, fallbackMessage) => {
	const result = await safeJson(response);

	if (!response.ok) {
		throw new Error(result.message || fallbackMessage);
	}

	return result;
};

export const prescriptionApi = {
	getAllPrescriptions: async (page = 1, limit = 10, filters = {}) => {
		const params = new URLSearchParams({
			page,
			limit,
			...(filters.search && { search: filters.search }),
			...(filters.status && { status: filters.status }),
			...(filters.patientName && { patientName: filters.patientName }),
			...(filters.startDate && { startDate: filters.startDate }),
			...(filters.endDate && { endDate: filters.endDate }),
		});

		const response = await fetch(`${API_URL}?${params}`, {
			method: "GET",
			headers: authHeaders(),
		});

		return handleResponse(response, "Failed to fetch prescriptions");
	},

	getPrescription: async (id) => {
		const response = await fetch(`${API_URL}/${id}`, {
			method: "GET",
			headers: authHeaders(),
		});

		return handleResponse(response, "Failed to fetch prescription");
	},

	getLastPrescriptions: async () => {
		const response = await fetch(`${API_URL}/last`, {
			method: "GET",
			headers: authHeaders(),
		});

		return handleResponse(response, "Failed to fetch recent prescriptions");
	},

	createPrescription: async (data) => {
		const payload = buildPrescriptionPayload(data, false);

		const response = await fetch(API_URL, {
			method: "POST",
			headers: authHeaders(),
			body: JSON.stringify(payload),
		});

		return handleResponse(response, "Failed to create prescription");
	},

	updatePrescription: async (id, data) => {
    const payload = buildPrescriptionPayload(data, true);

    const response = await fetch(`${API_URL}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleResponse(response, "Failed to update prescription");

    return result;
  },

	updatePrescriptionStatus: async (id, status, rejectionReason = null) => {
		const response = await fetch(`${API_URL}/${id}/status`, {
			method: "PATCH",
			headers: authHeaders(),
			body: JSON.stringify({
				status,
				...(rejectionReason && { rejectionReason }),
			}),
		});

		return handleResponse(response, "Failed to update prescription status");
	},

	deletePrescription: async (id) => {
		const response = await fetch(`${API_URL}/${id}`, {
			method: "DELETE",
			headers: authHeaders(),
		});

		if (!response.ok && response.status !== 204) {
			const result = await safeJson(response);
			throw new Error(result.message || "Failed to delete prescription");
		}

		return { status: "success" };
	},
};