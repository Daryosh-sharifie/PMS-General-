import { formatAfghanDate } from "../../utils/afghanCalendar";

export function normalizeLabOrder(order) {
	if (!order) return null;

	const items = Array.isArray(order.items) ? order.items : [];
	const patient = order.patient || {};
	const prescription = order.prescription || {};
	const requestedBy = order.requestedBy || {};

	return {
		...order,
		id: order.id,
		labOrderNo: order.labOrderNo || `LAB-${order.id}`,
		status: (order.status || "REQUESTED").toUpperCase(),
		patient,
		prescription,
		requestedBy,
		patientName: patient.fullname || patient.name || order.patientName || "",
		patientFathername: patient.fathername || patient.fatherName || order.patientFathername || "",
		doctorName: requestedBy.name || prescription.doctorName || order.doctorName || "",
		prescriptionNo: prescription.prescriptionNo || order.prescriptionNo || "",
		createdAt: order.createdAt,
		updatedAt: order.updatedAt,
		items: items.map((item) => ({
			...item,
			status: (item.status || "REQUESTED").toUpperCase(),
			templateSnapshot: Array.isArray(item.templateSnapshot)
				? item.templateSnapshot
				: item.templateSnapshot || [],
			manualResults: item.manualResults || {},
		})),
	};
}

export function getLabOrderDisplayName(order) {
	return order?.labOrderNo || `LAB-${order?.id || ""}`;
}

export function getLabOrderTestCount(order) {
	return Array.isArray(order?.items) ? order.items.length : 0;
}

export function getLabOrderCreatedDate(order) {
	return formatAfghanDate(order?.createdAt, { englishDigits: true });
}

export function getLabOrderPatientLabel(order) {
	return order?.patientName || order?.patient?.fullname || order?.patient?.name || "-";
}

export function getLabOrderPrescriptionLabel(order) {
	return order?.prescriptionNo || order?.prescription?.prescriptionNo || "-";
}

export function getLabOrderDoctorLabel(order) {
	return order?.doctorName || order?.requestedBy?.name || "-";
}

export function getLabOrderStatusLabel(order) {
	return order?.status || "REQUESTED";
}