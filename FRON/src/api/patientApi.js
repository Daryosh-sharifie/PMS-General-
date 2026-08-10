const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/patients`;

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

const handleResponse = async (response, fallbackMessage) => {
	const result = await safeJson(response);

	if (!response.ok) {
		throw new Error(result.message || fallbackMessage);
	}

	return result;
};

const normalizePatient = (patient = {}) => ({
	...patient,
	id: Number(patient.id),
	name: patient.fullname || patient.name || "",
	fullname: patient.fullname || patient.name || "",
	fathername: patient.fathername || "",
	age: String(patient.age ?? ""),
	bloodGroup: patient.bloodGroup || "",
	gender: patient.gender || "",
	email: patient.email || "",
	phone: String(patient.phone ?? ""),
	address: patient.address || "",
	knownallergies: patient.knownallergies || "",
	allergies: patient.knownallergies || "None",
	lastVisit: patient.createdAt
		? new Date(patient.createdAt).toISOString().split("T")[0]
		: undefined,
});

const normalizePatientsResponse = (result) => {
	if (Array.isArray(result?.data?.patients)) {
		result.data.patients = result.data.patients.map(normalizePatient);
	}

	if (result?.data?.patient) {
		result.data.patient = normalizePatient(result.data.patient);
	}

	return result;
};

const buildPatientPayload = (data = {}) => ({
	fullname: String(data.fullname || data.name || "").trim(),
	fathername: String(data.fathername || "").trim(),
	age: String(data.age ?? "").trim() || "0",
	bloodGroup: String(data.bloodGroup || "").trim(),
	gender: String(data.gender || "").trim(),
	email: String(data.email || "").trim(),
	phone: String(data.phone ?? "").trim(),
	address: String(data.address || "").trim(),
	knownallergies: String(data.knownallergies || data.allergies || "").trim(),
});

export const patientApi = {
	getAllPatients: async (page = 1, limit = 10, searchOrFilters = "") => {
		const isFiltersObject =
			typeof searchOrFilters === "object" && searchOrFilters !== null;

		const search = isFiltersObject
			? String(searchOrFilters.search || "").trim()
			: String(searchOrFilters || "").trim();

		const params = new URLSearchParams({
			page: String(page),
			limit: String(limit),
		});

		if (search) params.append("search", search);

		if (isFiltersObject) {
			if (searchOrFilters.startDate) {
				params.append("startDate", searchOrFilters.startDate);
			}

			if (searchOrFilters.endDate) {
				params.append("endDate", searchOrFilters.endDate);
			}
		}

		const response = await fetch(`${API_URL}?${params}`, {
			method: "GET",
			headers: authHeaders(),
		});

		const result = await handleResponse(response, "Failed to fetch patients");
		return normalizePatientsResponse(result);
	},

	getPatient: async (id) => {
		const response = await fetch(`${API_URL}/${id}`, {
			method: "GET",
			headers: authHeaders(),
		});

		const result = await handleResponse(response, "Failed to fetch patient");
		return normalizePatientsResponse(result);
	},

	createPatient: async (data) => {
		const payload = buildPatientPayload(data);

		const response = await fetch(API_URL, {
			method: "POST",
			headers: authHeaders(),
			body: JSON.stringify(payload),
		});

		const result = await handleResponse(response, "Failed to create patient");
		return normalizePatientsResponse(result);
	},

	updatePatient: async (id, data) => {
		const payload = buildPatientPayload(data);

		const response = await fetch(`${API_URL}/${id}`, {
			method: "PATCH",
			headers: authHeaders(),
			body: JSON.stringify(payload),
		});

		const result = await handleResponse(response, "Failed to update patient");
		return normalizePatientsResponse(result);
	},

	deletePatient: async (id) => {
		const response = await fetch(`${API_URL}/${id}`, {
			method: "DELETE",
			headers: authHeaders(),
		});

		if (!response.ok) {
			const result = await safeJson(response);
			throw new Error(result.message || "Failed to delete patient");
		}

		if (response.status === 204) return { status: "success" };

		return safeJson(response);
	},

	searchPatients: async (searchTerm = "", limit = 20) => {
		const params = new URLSearchParams({
			page: "1",
			limit: String(limit),
		});

		const search = String(searchTerm || "").trim();
		if (search) params.append("search", search);

		const response = await fetch(`${API_URL}?${params}`, {
			method: "GET",
			headers: authHeaders(),
		});

		const result = await handleResponse(response, "Failed to search patients");
		return normalizePatientsResponse(result);
	},

	getLatestPatients: async (limit = 10) => {
		const params = new URLSearchParams({
			page: "1",
			limit: String(limit),
			sortBy: "createdAt",
			sortOrder: "desc",
		});

		const response = await fetch(`${API_URL}?${params}`, {
			method: "GET",
			headers: authHeaders(),
		});

		const result = await handleResponse(response, "Failed to fetch latest patients");
		return normalizePatientsResponse(result);
	},

	getPatientWithPrescriptions: async (id) => {
		const response = await fetch(`${API_URL}/${id}/prescriptions`, {
			method: "GET",
			headers: authHeaders(),
		});

		const result = await handleResponse(
			response,
			"Failed to fetch patient with prescriptions"
		);

		if (result?.data?.patient) {
			return normalizePatient(result.data.patient);
		}

		return result;
	},
};