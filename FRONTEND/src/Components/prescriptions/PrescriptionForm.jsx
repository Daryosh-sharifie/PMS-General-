import { CheckCircle, Printer } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useStore from "../../store/useStore.jsx";
import { printPrescription } from "./PrescriptionPrint";
import { labOrderApi } from "../../api/labOrderApi";
import { labOrderItemApi } from "../../api/labOrderItemApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { matchesShortcut, getShortcutById, formatShortcut } from "../../utils/shortcutManager";

import PrescriptionTopBar from "./PrescriptionTopBar";
import PatientSelector from "./PatientSelector";
import MedicineTable from "./MedicineTable";
import ClinicalPanel from "./ClinicalPanel";
import PageControls from "./PageControls";
import PrescriptionLabSection from "./PrescriptionLabSection";

import { usePrescriptionPatients } from "./usePrescriptionPatients";
import { useLabTestSelector } from "./useLabTestSelector";

const emptyClinicalFields = {
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
};

const emptyMedicine = {
	name: "",
	dosage: "",
	frequency: "",
	route: "",
	type: "",
	amount: "",
	companyName: "",
	mealTiming: "",
	instructions: "",
	duration: "",
};

const hasValue = (value) =>
	value !== undefined && value !== null && String(value).trim() !== "";

const normalizeId = (value) => {
	const rawId = typeof value === "object" && value !== null ? value.id : value;
	const id = Number(rawId);
	return Number.isFinite(id) && id > 0 ? id : null;
};

const normalizeMedicine = (medicine = {}) => ({
	name: medicine.name || medicine.medicineName || medicine.genericName || "",
	dosage: medicine.dosage || medicine.dose || "",
	frequency: medicine.frequency || medicine.freq || "",
	route: medicine.route || medicine.type || medicine.method || "",
	type: medicine.type || medicine.route || medicine.form || "",
	amount: medicine.amount ?? medicine.quantity ?? medicine.qty ?? "",
	companyName: medicine.companyName || medicine.brandName || "",
	mealTiming: medicine.mealTiming || "",
	instructions: medicine.instructions || "",
	duration: medicine.duration || "",
});

const normalizePages = (pages) => {
	if (!Array.isArray(pages) || pages.length === 0) {
		return [{ id: 1, medicines: [] }];
	}

	return pages.map((page, index) => ({
		id: page.id || index + 1,
		medicines: Array.isArray(page.medicines)
			? page.medicines.map(normalizeMedicine)
			: [],
	}));
};

const medicineHasValue = (medicine = {}) =>
	Boolean(
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

const cleanPrescriptionForSubmit = (form = {}, medicines = []) => ({
	patientId: form.patientId || "",
	patientName: form.patientName || "",
	diagnosis: form.diagnosis || "",

	notes: form.notes || "",
	instructions: form.instructions || "",
	pastHistory: form.pastHistory || "",
	investigation: form.investigation || "",
	impression: form.impression || "",
	drugHistory: form.drugHistory || "",

	bloodPressure: form.bloodPressure || "",
	respiratoryRate: form.respiratoryRate || "",
	pulseRate: form.pulseRate || "",
	temperature: form.temperature || "",
	heartRate: form.heartRate || "",
	spo2: form.spo2 || "",
	clc: form.clc || "",

	medicines,
});

const extractPrescriptionId = (saved, fallbackForm) => {
	return (
		normalizeId(saved?.id) ||
		normalizeId(saved?.data?.id) ||
		normalizeId(saved?.prescription?.id) ||
		normalizeId(saved?.data?.prescription?.id) ||
		normalizeId(saved?.data?.data?.prescription?.id) ||
		normalizeId(fallbackForm?.id) ||
		null
	);
};

const getErrorMessage = (error, fallback) => {
	return error?.message || error?.result?.message || fallback;
};

export default function PrescriptionForm({
	mode = "create",
	prescriptionForm,
	setPrescriptionForm,
	patients,
	initialPages,
	initialPrescriptionNo,
	initialLabTestIds = [],
	initialLabTests = [],
	onSubmit,
	onCancel,
	onEditSuccess,
	currentUser,
	hospitalSettings,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";
	const isEditMode = mode === "edit";

	const [showSuccess, setShowSuccess] = useState(false);
	const [pages, setPages] = useState(() => normalizePages(initialPages));
	const [currentPageId, setCurrentPageId] = useState(1);
	const [prescriptionNo, setPrescriptionNo] = useState(initialPrescriptionNo || null);

	const [saving, setSaving] = useState(false);
	const [printFontBoost, setPrintFontBoost] = useState(0);

	const justSaved = useRef(false);

	const prescriptions = useStore((state) => state.prescriptions);
	const resetPrescriptionForm = useStore((state) => state.resetPrescriptionForm);
	const updatePrescriptionForm = useStore((state) => state.updatePrescriptionForm);
	const fetchPrescriptions = useStore((state) => state.fetchPrescriptions);

	const patientSelector = usePrescriptionPatients(patients, prescriptionForm);
	const labSelector = useLabTestSelector(initialLabTestIds, initialLabTests);

	const { selectedPatient } = patientSelector;
	const {
		selectedLabTestIds,
		selectedLabTests,
		removedLabOrderItemIds,
		setLabRequestError,
		resetLabTests,
	} = labSelector;

	const currentPage = pages.find((page) => page.id === currentPageId) || pages[0];

	useEffect(() => {
		if (!initialPages) return;

		const normalized = normalizePages(initialPages);
		setPages(normalized);
		setCurrentPageId(normalized[0]?.id || 1);
	}, [initialPages]);

	useEffect(() => {
		if (initialPrescriptionNo) {
			setPrescriptionNo(initialPrescriptionNo);
		}
	}, [initialPrescriptionNo]);

	useEffect(() => {
		if (isEditMode || initialPrescriptionNo) return;

		const numbers = (prescriptions || [])
			.map((prescription) => {
				const no = prescription.prescriptionNo || prescription.id || "";
				const match = no.toString().match(/(\d+)$/);
				return match ? parseInt(match[1], 10) : 0;
			})
			.filter((number) => !Number.isNaN(number));

		const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

		setPrescriptionNo(
			`RX-${new Date().getFullYear()}-${String(nextNumber).padStart(3, "0")}`
		);
	}, [prescriptions, isEditMode, initialPrescriptionNo]);

	const resetClinicalState = useCallback(() => {
		if (isEditMode) return;

		resetPrescriptionForm();
		setPages([{ id: 1, medicines: [] }]);
		setCurrentPageId(1);
		resetLabTests();
		setLabRequestError("");
	}, [isEditMode, resetLabTests, resetPrescriptionForm, setLabRequestError]);

	const applyPatientSelection = useCallback(
		(patient) => {
			resetClinicalState();

			updatePrescriptionForm({
				...emptyClinicalFields,
				patientId: String(patient.id),
				patientName: patient.name || patient.fullname || "",
				patientGender: patient.gender || "",
				patientAge: patient.age || "",
				patientFathername: patient.fathername || patient.fatherName || "",
			});
		},
		[resetClinicalState, updatePrescriptionForm]
	);

	const cleanSelectedLabTestIds = useMemo(() => {
		const ids = (Array.isArray(selectedLabTestIds) ? selectedLabTestIds : [])
			.map(normalizeId)
			.filter(Boolean);

		return [...new Set(ids)];
	}, [selectedLabTestIds]);

	const cleanInitialLabTestIds = useMemo(() => {
		const ids = (Array.isArray(initialLabTestIds) ? initialLabTestIds : [])
			.map(normalizeId)
			.filter(Boolean);

		return [...new Set(ids)];
	}, [initialLabTestIds]);

	const labTestIdsForSave = useMemo(() => {
		if (!isEditMode) return cleanSelectedLabTestIds;

		const existingIds = new Set(cleanInitialLabTestIds.map(Number));
		return cleanSelectedLabTestIds.filter((id) => !existingIds.has(Number(id)));
	}, [cleanInitialLabTestIds, cleanSelectedLabTestIds, isEditMode]);

	const hasUnsavedChanges = useMemo(() => {
		const formHasData = Object.values(prescriptionForm || {}).some(hasValue);
		const medicinesHaveData = pages.some((page) =>
			(page.medicines || []).some((medicine) =>
				Object.values(medicine || {}).some(hasValue)
			)
		);

		return formHasData || medicinesHaveData || cleanSelectedLabTestIds.length > 0;
	}, [prescriptionForm, pages, cleanSelectedLabTestIds]);

	const handleAddPage = () => {
		const maxPageId = pages.length ? Math.max(...pages.map((page) => page.id)) : 0;
		const newPageId = maxPageId + 1;
		setPages([...pages, { id: newPageId, medicines: [] }]);
		setCurrentPageId(newPageId);
	};

	const handleRemovePage = (pageId) => {
		if (pages.length <= 1) return;

		const updatedPages = pages.filter((page) => page.id !== pageId);
		setPages(updatedPages);

		if (currentPageId === pageId) {
			setCurrentPageId(updatedPages[0]?.id || 1);
		}
	};

	const allMedicines = () =>
		pages
			.flatMap((page) => page.medicines || [])
			.map(normalizeMedicine)
			.filter(medicineHasValue);

	const buildPrescriptionData = () =>
		cleanPrescriptionForSubmit(prescriptionForm, allMedicines());

	const handlePrint = useCallback(() => {
		const prescriptionData = {
			prescriptionNo: prescriptionNo || t("generating"),
			id: prescriptionNo || t("generating"),
			patientName: prescriptionForm.patientName || selectedPatient?.name || "",
			patientFathername:
				prescriptionForm.patientFathername || selectedPatient?.fathername || "",
			patientGender: prescriptionForm.patientGender || selectedPatient?.gender || "",
			patientAge: prescriptionForm.patientAge || selectedPatient?.age || "",
			instructions: prescriptionForm.instructions || "",
			bloodPressure: prescriptionForm.bloodPressure || "",
			pulseRate: prescriptionForm.pulseRate || "",
			temperature: prescriptionForm.temperature || "",
			spo2: prescriptionForm.spo2 || "",
			clc: prescriptionForm.clc || "",
			pastHistory: prescriptionForm.pastHistory || "",
			investigation: prescriptionForm.investigation || "",
			impression: prescriptionForm.impression || "",
			drugHistory: prescriptionForm.drugHistory || "",
			date: prescriptionForm.dateJalali || new Date().toISOString(),
			doctorName: currentUser?.name || "Doctor Name",
		};

		printPrescription({
			prescriptionData,
			patientData: selectedPatient,
			hospitalSettings,
			currentUser,
			medicines: currentPage?.medicines || [],
			labTests: selectedLabTests,
			fontBoost: printFontBoost,
		});
	}, [
		currentPage,
		prescriptionNo,
		prescriptionForm,
		selectedPatient,
		hospitalSettings,
		currentUser,
		t,
		selectedLabTests,
	]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (matchesShortcut(e, getShortcutById("printPrescription"))) {
				e.preventDefault();
				handlePrint();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handlePrint]);

	const createLabRequestAfterSave = async (prescriptionId, finalPrescriptionData) => {
		if (labTestIdsForSave.length === 0) return { ok: true };

		if (!prescriptionId) {
			return {
				ok: false,
				message: t("prescriptionIdMissingAfterSave"),
			};
		}

		try {
			await labOrderApi.createLabOrder({
				patientId: Number(finalPrescriptionData.patientId),
				prescriptionId: Number(prescriptionId),
				testIds: labTestIdsForSave,
				notes: finalPrescriptionData.investigation || "",
			});

			return { ok: true };
		} catch (error) {
			console.error("Lab request creation failed:", error);
			return {
				ok: false,
				message: getErrorMessage(error, t("failedToCreateLabRequest")),
			};
		}
	};

	const cancelRemovedLabItems = async () => {
		const itemIds = [
			...new Set(
				(Array.isArray(removedLabOrderItemIds) ? removedLabOrderItemIds : [])
					.map(normalizeId)
					.filter(Boolean)
			),
		];

		if (itemIds.length === 0) return { ok: true };

		try {
			await Promise.all(itemIds.map((itemId) => labOrderItemApi.cancelLabResult(itemId)));
			return { ok: true };
		} catch (error) {
			console.error("Lab item cancellation failed:", error);
			return {
				ok: false,
				message: getErrorMessage(error, t("failedToRemoveLabTest")),
			};
		}
	};

	const finishSuccessfulSave = ({ labFailed = false } = {}) => {
		justSaved.current = true;
		setShowSuccess(true);

		if (!labFailed) {
			resetLabTests();
		}

		fetchPrescriptions?.().catch(() => {});

		setTimeout(() => {
			setShowSuccess(false);

			if (isEditMode) {
				onEditSuccess?.();
			} else {
				setPages([{ id: 1, medicines: [] }]);
				onCancel?.();
			}
		}, labFailed ? 1400 : 900);
	};

	const handleSave = async () => {
		if (!prescriptionForm.patientId) {
			alert(t("selectPatientFirst"));
			return false;
		}

		try {
			setSaving(true);
			setLabRequestError("");

			const finalPrescriptionData = buildPrescriptionData();
			setPrescriptionForm(finalPrescriptionData);

			const saved = await onSubmit(finalPrescriptionData);
			const prescriptionId = extractPrescriptionId(saved, prescriptionForm);

			const labResult = await createLabRequestAfterSave(
				prescriptionId,
				finalPrescriptionData
			);

			const removeLabResult = await cancelRemovedLabItems();

			if (!removeLabResult.ok) {
				setLabRequestError(removeLabResult.message);
				alert(
					`${t("prescriptionSavedSuccessfully")}\n${removeLabResult.message}`
				);
				finishSuccessfulSave({ labFailed: true });
				return true;
			}

			if (!labResult.ok) {
				setLabRequestError(labResult.message);
				alert(
					`${t("prescriptionSavedSuccessfully")}\n${labResult.message}`
				);
				finishSuccessfulSave({ labFailed: true });
				return true;
			}

			finishSuccessfulSave();
			return true;
		} catch (error) {
			console.error("Error submitting prescription:", error);
			const message = getErrorMessage(error, t("failedToSavePrescription"));
			setLabRequestError(message);
			alert(message);
			return false;
		} finally {
			setSaving(false);
		}
	};

	const handleBack = async () => {
		if (isEditMode) {
			onCancel?.();
			return;
		}

		if (justSaved.current || !hasUnsavedChanges) {
			onCancel?.();
			return;
		}

		const shouldSave = window.confirm(t("savePrescriptionBeforeLeaving"));

		if (shouldSave) {
			const saved = await handleSave();
			if (saved) onCancel?.();
			return;
		}

		onCancel?.();
	};

	const handleMedicineChange = (index, fieldOrObj, value) => {
		const updates =
			typeof fieldOrObj === "string" ? { [fieldOrObj]: value } : fieldOrObj;

		const updatedMedicines = [...(currentPage?.medicines || [])];

		if (!updatedMedicines[index]) {
			updatedMedicines[index] = { ...emptyMedicine };
		}

		updatedMedicines[index] = {
			...updatedMedicines[index],
			...updates,
		};

		setPages((prev) =>
			prev.map((page) =>
				page.id === currentPageId
					? { ...page, medicines: updatedMedicines }
					: page
			)
		);
	};

	const handleMedicineRowKeyDown = (event) => {
		if (event.key !== "Tab") return;

		event.preventDefault();

		const row = event.target.closest(".medicine-row");
		if (!row) return;

		const fields = Array.from(row.querySelectorAll("input, select"));
		const currentIndex = fields.indexOf(event.target);
		const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;

		if (fields[nextIndex]) fields[nextIndex].focus();
	};

	return (
		<div
			dir={isRtl ? "rtl" : "ltr"}
			className="mx-auto my-2 w-full max-w-7xl rounded-2xl bg-slate-50 p-2.5 text-gray-900 shadow-xl ring-1 ring-slate-200 sm:my-6 sm:p-4"
		>
			<PrescriptionTopBar
				onBack={handleBack}
				title={isEditMode ? t("editPrescription") : t("newPrescription")}
			/>

			{showSuccess && (
				<div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800 print:hidden">
					<CheckCircle className="h-5 w-5" />
					<span className="font-semibold">
						{isEditMode
							? t("prescriptionUpdatedSuccessfully")
							: t("prescriptionSavedSuccessfully")}
					</span>
				</div>
			)}

			{pages.map((page) => (
				<div
					key={page.id}
					className={`${currentPageId === page.id ? "" : "hidden"} print:block`}
				>
					<PatientSelector
						{...patientSelector}
						prescriptionForm={prescriptionForm}
						setPrescriptionForm={setPrescriptionForm}
						onSelectPatient={applyPatientSelection}
						onClearPatientSelection={resetClinicalState}
					/>

					<div className="mt-5">
						<PrescriptionLabSection
							prescriptionForm={prescriptionForm}
							setPrescriptionForm={setPrescriptionForm}
							selectedPatient={selectedPatient || prescriptionForm.patientId}
							labSelector={{
								...labSelector,
								selectedLabTestIds: cleanSelectedLabTestIds,
								selectedLabTests,
							}}
						/>
					</div>

					<div className="mt-5 grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12">
						<div className="flex h-full xl:col-span-8">
							<MedicineTable
								prescriptionNo={prescriptionNo}
								currentPage={currentPage}
								handleMedicineChange={handleMedicineChange}
								handleMedicineRowKeyDown={handleMedicineRowKeyDown}
								prescriptionForm={prescriptionForm}
								setPrescriptionForm={setPrescriptionForm}
							/>
						</div>

						<div className="flex h-full xl:col-span-4">
							<ClinicalPanel
								prescriptionForm={prescriptionForm}
								setPrescriptionForm={setPrescriptionForm}
								selectedPatient={selectedPatient || prescriptionForm.patientId}
								onPrint={handlePrint}
								onSave={handleSave}
								saving={saving}
								printFontBoost={printFontBoost}
								setPrintFontBoost={setPrintFontBoost}
							/>
						</div>
					</div>
				</div>
			))}

			<PageControls
				pages={pages}
				currentPageId={currentPageId}
				setCurrentPageId={setCurrentPageId}
				handleAddPage={handleAddPage}
				handleRemovePage={handleRemovePage}
			/>

			{/* Shortcut Print Hint at Bottom of Prescription */}
			<div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-600 shadow-2xs print:hidden">
				<Printer className="h-4 w-4 text-blue-600 shrink-0" />
				<span>
					{isRtl
						? `برای چاپ نسخه: ${formatShortcut(getShortcutById("printPrescription")) || "Ctrl + Space"}`
						: `For printing prescription: ${formatShortcut(getShortcutById("printPrescription")) || "Ctrl + Space"}`}
				</span>
			</div>
		</div>
	);
}
