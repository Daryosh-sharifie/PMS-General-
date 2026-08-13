import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PrescriptionDetail from "./PrescriptionDetail";
import useStore from "../../store/useStore";
import { prescriptionApi } from "../../api/prescriptionApi";
import { useLanguage } from "../../i18n/LanguageContext";

export default function PrescriptionDetailPage({ hospitalSettings, currentUser }) {
	const { id } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { t } = useLanguage();

	const from = searchParams.get("from");
	const doctorId = searchParams.get("doctorId");

	const handleBack = () => {
		if (from === "reports") {
			const query = doctorId && doctorId !== "all" ? `?doctorId=${doctorId}` : "";
			navigate(`/reports${query}`);
		} else {
			navigate(-1);
		}
	};

	const getPrescriptionById = useStore((state) => state.getPrescriptionById);
	const getPatientById = useStore((state) => state.getPatientById);
	const dispensePrescription = useStore((state) => state.dispensePrescription);

	const [prescription, setPrescription] = useState(null);
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const loadPrescription = useCallback(async () => {
		if (!id) return;

		setLoading(true);
		setError("");
		setPrescription(null);
		setPatient(null);

		try {
			const data = await getPrescriptionById(id);

			if (!data) {
				setError(t("prescriptionNotFound"));
				setPrescription(null);
				setPatient(null);
				return;
			}

			setPrescription(data);

			if (data.patientId) {
				const patientData = await getPatientById(data.patientId);
				setPatient(patientData || null);
			} else {
				setPatient(null);
			}
		} catch (err) {
			setError(err?.message || t("failedToLoadPrescriptionDetails"));
		} finally {
			setLoading(false);
		}
	}, [getPatientById, getPrescriptionById, id, t]);

	useEffect(() => {
		loadPrescription();
	}, [loadPrescription]);

	const handleDispense = async (prescriptionId) => {
		await dispensePrescription(prescriptionId);
		await loadPrescription();
	};

	const handleReject = async (prescriptionId, reason) => {
		await prescriptionApi.updatePrescriptionStatus(prescriptionId, "REJECTED", reason);
		await loadPrescription();
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-slate-700">
				{t("loadingPrescriptionDetails")}
			</div>
		);
	}

	if (error || !prescription) {
		return (
			<div className="flex h-screen flex-col items-center justify-center space-y-3 text-center">
				<p className="text-lg font-semibold text-gray-800">
					{error || t("prescriptionNotFound")}
				</p>

				<button
					type="button"
					className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
					onClick={handleBack}
				>
					{t("back")}
				</button>
			</div>
		);
	}

	return (
		<PrescriptionDetail
			prescription={prescription}
			patient={patient}
			hospitalSettings={hospitalSettings}
			currentUser={currentUser}
			onBack={handleBack}
			onDispense={handleDispense}
			onReject={handleReject}
			onViewPatient={(patientId) => navigate(`/patients/${patientId}`)}
			onEdit={(prescriptionId) => navigate(`/prescriptions/${prescriptionId}/edit`)}
		/>
	);
}