import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { patientApi } from "../../api/patientApi";
import PatientDetail from "./PatientDetail";
import { labOrderApi } from "../../api/labOrderApi";
import { useLanguage } from "../../i18n/LanguageContext";

function extractPatient(response) {
	return (
		response?.data?.patient ||
		response?.patient ||
		response?.data ||
		response ||
		null
	);
}

function extractLabOrders(response) {
	if (Array.isArray(response?.data)) return response.data;
	if (Array.isArray(response?.data?.orders)) return response.data.orders;
	if (Array.isArray(response?.orders)) return response.orders;
	if (Array.isArray(response)) return response;
	return [];
}

function normalizePatient(p) {
	if (!p) return null;

	return {
		id: p.id,
		name: p.fullname || p.name || "",
		fullname: p.fullname || p.name || "",
		age: p.age || "",
		gender: p.gender || "",
		phone: p.phone ? String(p.phone) : "",
		email: p.email || "",
		address: p.address || "",
		bloodGroup: p.bloodGroup || "",
		allergies: p.knownallergies || p.allergies || "None",
		knownallergies: p.knownallergies || "",
		lastVisit: p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "",
		createdAt: p.createdAt,
	};
}

function normalizePrescriptions(patientData) {
	const list =
		patientData?.prescription ||
		patientData?.prescriptions ||
		patientData?.data?.prescriptions ||
		[];

	return (Array.isArray(list) ? list : []).map((pr) => ({
		id: pr.id,
		prescriptionNo: pr.prescriptionNo,
		patientId: pr.patientId,
		patientName: pr.patientName,
		doctorId: pr.doctorId,
		doctorName: pr.doctor?.name || pr.doctorName || "Unknown",
		date: pr.date ? new Date(pr.date).toISOString().split("T")[0] : "",
		diagnosis: pr.diagnosis || "",
		symptoms: pr.symptoms || "",
		medicalHistory: pr.medicalHistory || "",
		notes: pr.notes || "",
		instructions: pr.instructions || "",
		status: String(pr.status || "").toLowerCase(),
		medicines: pr.medicines || [],
		patient: pr.patient,
		doctor: pr.doctor,
		createdAt: pr.createdAt,
	}));
}

export default function PatientDetailRoute({
	onBack,
	onCreatePrescription,
	onViewPrescription,
	currentUser,
}) {
	const navigate = useNavigate();
	const { id } = useParams();
	const { t } = useLanguage();

	const [patient, setPatient] = useState(null);
	const [prescriptionsForPatient, setPrescriptionsForPatient] = useState([]);
	const [labOrdersForPatient, setLabOrdersForPatient] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		const load = async () => {
			try {
				setLoading(true);
				setError("");

				const response = await patientApi.getPatientWithPrescriptions(id);
				const patientData = extractPatient(response);

				if (!active) return;

				if (!patientData?.id) {
					setPatient(null);
					setPrescriptionsForPatient([]);
					setError(t("patientNotFound"));
					return;
				}

				setPatient(normalizePatient(patientData));
				setPrescriptionsForPatient(normalizePrescriptions(patientData));

				try {
					const labResponse = await labOrderApi.getPatientLabOrders(id);
					if (active) setLabOrdersForPatient(extractLabOrders(labResponse));
				} catch {
					if (active) setLabOrdersForPatient([]);
				}
			} catch (err) {
				if (active) {
					setPatient(null);
					setError(err.message || t("failedToLoadPatientDetails"));
				}
			} finally {
				if (active) setLoading(false);
			}
		};

		load();

		return () => {
			active = false;
		};
	}, [id, t]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-slate-600">
				{t("loadingPatientDetails")}
			</div>
		);
	}

	if (!patient) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
				<p className="text-lg font-semibold text-slate-800">
					{error || t("patientNotFound")}
				</p>
				<button
					type="button"
					onClick={() => navigate("/patients")}
					className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
				>
					{t("back")}
				</button>
			</div>
		);
	}

	return (
		<PatientDetail
			patient={patient}
			prescriptions={prescriptionsForPatient}
			labOrders={labOrdersForPatient}
			onBack={onBack || (() => navigate("/patients"))}
			onCreatePrescription={onCreatePrescription}
			onViewPrescription={onViewPrescription}
			currentUser={currentUser}
		/>
	);
}