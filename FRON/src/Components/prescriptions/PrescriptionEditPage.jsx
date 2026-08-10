import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PrescriptionForm from "./PrescriptionForm";
import useStore from "../../store/useStore";
import { useLanguage } from "../../i18n/LanguageContext";
import { labOrderApi } from "../../api/labOrderApi";

const EMPTY_FORM = {
	id: "",
	patientId: "",
	patientName: "",
	patientFathername: "",
	patientGender: "",
	patientAge: "",
	diagnosis: "",
	notes: "",
	instructions: "",
	pastHistory: "",
	investigation: "",
	impression: "",
	drugHistory: "",
	bloodPressure: "",
	respiratoryRate: "",
	pulseRate: "",
	temperature: "",
	heartRate: "",
	spo2: "",
	clc: "",
	dateJalali: "",
};

const normalizeMedicine = (medicine = {}) => ({
	name: medicine.name || medicine.medicineName || medicine.genericName || "",
	dosage: medicine.dosage || medicine.dose || "",
	frequency: medicine.frequency || medicine.freq || "",
	route: medicine.route || medicine.method || medicine.type || "",
	type: medicine.type || medicine.form || medicine.route || "",
	amount: medicine.amount ?? medicine.quantity ?? medicine.qty ?? "",
	companyName: medicine.companyName || medicine.brandName || "",
	mealTiming: medicine.mealTiming || "",
	instructions: medicine.instructions || "",
	duration: medicine.duration || "",
});

function mapPrescriptionToForm(prescription) {
	return {
		...EMPTY_FORM,
		id: prescription.id || "",
		patientId: String(prescription.patientId || prescription.patient?.id || ""),
		patientName:
			prescription.patientName ||
			prescription.patient?.fullname ||
			prescription.patient?.name ||
			"",
		patientFathername:
			prescription.patient?.fathername ||
			prescription.patient?.fatherName ||
			"",
		patientGender: prescription.patient?.gender || "",
		patientAge: prescription.patient?.age || "",
		diagnosis: prescription.diagnosis || "",
		notes: prescription.notes || "",
		instructions: prescription.instructions || "",
		pastHistory: prescription.pastHistory || "",
		investigation: prescription.investigation || "",
		impression: prescription.impression || "",
		drugHistory: prescription.drugHistory || "",
		bloodPressure: prescription.bloodPressure || "",
		respiratoryRate: prescription.respiratoryRate || "",
		pulseRate: prescription.pulseRate || "",
		temperature: prescription.temperature || "",
		heartRate: prescription.heartRate || "",
		spo2: prescription.spo2 || "",
		clc: prescription.clc || "",
		dateJalali: prescription.date || "",
	};
}

function mapMedicinesToPages(medicines = []) {
	const normalizedMedicines = Array.isArray(medicines)
		? medicines.map(normalizeMedicine)
		: [];

	return [
		{
			id: 1,
			medicines: normalizedMedicines,
		},
	];
}

function mapLabOrdersToTestIds(labOrders = []) {
	return [
		...new Set(
			(Array.isArray(labOrders) ? labOrders : [])
				.flatMap((order) => order.items || [])
				.map((item) => item.labTestId || item.testId || item.labTest?.id || item.test?.id)
				.filter(Boolean)
				.map(Number)
		),
	];
}

function mapLabOrdersToTests(labOrders = []) {
	return (Array.isArray(labOrders) ? labOrders : [])
		.flatMap((order) => order.items || [])
		.map((item) => {
			const id = item.labTestId || item.testId || item.labTest?.id || item.test?.id;
			if (!id) return null;

			return {
				id,
				labOrderItemId: item.id,
				status: item.status,
				name:
					item.testNameSnapshot ||
					item.labTest?.name ||
					item.test?.name ||
					"Unnamed Test",
				category:
					item.categorySnapshot ||
					item.labTest?.category ||
					item.test?.category ||
					"",
			};
		})
		.filter(Boolean);
}

function extractLabOrders(response) {
	if (Array.isArray(response?.data)) return response.data;
	if (Array.isArray(response?.data?.orders)) return response.data.orders;
	if (Array.isArray(response?.orders)) return response.orders;
	if (Array.isArray(response?.data?.labOrders)) return response.data.labOrders;
	return [];
}

function buildUpdatePayload(formData) {
	return {
		patientName: formData.patientName || "",
		diagnosis: formData.diagnosis || "",

		notes: formData.notes || "",
		instructions: formData.instructions || "",
		pastHistory: formData.pastHistory || "",
		investigation: formData.investigation || "",
		impression: formData.impression || "",
		drugHistory: formData.drugHistory || "",

		bloodPressure: formData.bloodPressure || "",
		respiratoryRate: formData.respiratoryRate || "",
		pulseRate: formData.pulseRate || "",
		temperature: formData.temperature || "",
		heartRate: formData.heartRate || "",
		spo2: formData.spo2 || "",
		clc: formData.clc || "",

		medicines: (formData.medicines || [])
			.map((medicine) => ({
				name: medicine.name || "",
				dosage: medicine.dosage || "",
				frequency: medicine.frequency || "",
				route: medicine.route || medicine.type || "",
				type: medicine.type || medicine.route || "",
				amount: Number(medicine.amount) || 0,
				mealTiming: medicine.mealTiming || "",
				instructions: medicine.instructions || "",
				duration: medicine.duration || "",
			}))
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
			),
	};
}

export default function PrescriptionEditPage({ hospitalSettings, currentUser }) {
	const { id } = useParams();
	const navigate = useNavigate();
	const { t } = useLanguage();

	const patients = useStore((state) => state.patients);
	const getPrescriptionById = useStore((state) => state.getPrescriptionById);
	const updatePrescription = useStore((state) => state.updatePrescription);

	const [prescriptionForm, setPrescriptionForm] = useState(null);
	const [initialPages, setInitialPages] = useState(null);
	const [initialPrescriptionNo, setInitialPrescriptionNo] = useState("");
	const [initialLabTestIds, setInitialLabTestIds] = useState([]);
	const [initialLabTests, setInitialLabTests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const loadPrescription = useCallback(async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError("");

			const data = await getPrescriptionById(id);

			if (!data) {
				setError(t("prescriptionNotFound"));
				return;
			}

			if (String(data.status || "").toLowerCase() === "dispensed") {
				setError(t("dispensedPrescriptionCannotBeEdited"));
				return;
			}

			let labOrders = Array.isArray(data.labOrders) ? data.labOrders : [];

			if (labOrders.length === 0) {
				try {
					const labOrderResponse = await labOrderApi.getPrescriptionLabOrders(id);
					labOrders = extractLabOrders(labOrderResponse);
				} catch (labErr) {
					console.error("Failed to fetch prescription lab orders:", labErr);
				}
			}

			setPrescriptionForm(mapPrescriptionToForm(data));
			setInitialPages(mapMedicinesToPages(data.medicines || []));
			setInitialPrescriptionNo(data.prescriptionNo || String(data.id));
			setInitialLabTestIds(mapLabOrdersToTestIds(labOrders));
			setInitialLabTests(mapLabOrdersToTests(labOrders));
		} catch (err) {
			setError(err?.message || t("failedToLoadPrescriptionDetails"));
		} finally {
			setLoading(false);
		}
	}, [getPrescriptionById, id, t]);

	useEffect(() => {
		loadPrescription();
	}, [loadPrescription]);

	const handleUpdate = async (formData) => {
		return updatePrescription(id, buildUpdatePayload(formData));
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-slate-700">
				{t("loadingPrescriptionDetails")}
			</div>
		);
	}

	if (error || !prescriptionForm || !initialPages) {
		return (
			<div className="flex h-screen flex-col items-center justify-center space-y-3 text-center">
				<p className="text-lg font-semibold text-gray-800">
					{error || t("prescriptionNotFound")}
				</p>

				<button
					type="button"
					className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
					onClick={() => navigate(`/prescriptions/${id}`)}
				>
					{t("back")}
				</button>
			</div>
		);
	}

	return (
		<PrescriptionForm
			mode="edit"
			prescriptionForm={prescriptionForm}
			setPrescriptionForm={setPrescriptionForm}
			patients={patients}
			initialPages={initialPages}
			initialPrescriptionNo={initialPrescriptionNo}
			initialLabTestIds={initialLabTestIds}
			initialLabTests={initialLabTests}
			onSubmit={handleUpdate}
			onCancel={() => navigate(`/prescriptions/${id}`)}
			onEditSuccess={() => navigate(`/prescriptions/${id}`)}
			currentUser={currentUser}
			hospitalSettings={hospitalSettings}
		/>
	);
}
