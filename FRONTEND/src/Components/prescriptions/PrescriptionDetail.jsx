import {
	Download,
	PackageCheck,
	XCircle,
	FileText,
	User,
	Pencil,
} from "lucide-react";
import { useState } from "react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import {
	buttonPrimary,
	buttonSecondary,
	buttonGhost,
} from "../../constants/styles";
import { getStatusColor, formatDate } from "../../utils/helpers";
import { printPrescription } from "./PrescriptionPrint";
import PrescriptionLabResultsPanel from "./PrescriptionLabResultsPanel";
import { useLanguage } from "../../i18n/LanguageContext";

export default function PrescriptionDetail({
	prescription,
	patient,
	hospitalSettings,
	currentUser,
	onBack,
	onDispense,
	onReject,
	onViewPatient,
	onEdit,
}) {
	const { t } = useLanguage();

	const [rejectReason, setRejectReason] = useState("");
	const [showRejectPopup, setShowRejectPopup] = useState(false);
	const [printing, setPrinting] = useState(false);

	if (!prescription) return null;

	const canEdit =
		onEdit &&
		(currentUser?.role === "admin" || currentUser?.role === "doctor") &&
		prescription.status?.toLowerCase() !== "dispensed";

	const getTranslatedStatus = (status) => {
		const normalized = String(status || "").toUpperCase();

		const keys = {
			PENDING: "pending",
			VERIFIED: "verified",
			DISPENSED: "dispensed",
			REJECTED: "rejected",
			REQUESTED: "requested",
			IN_PROGRESS: "inProgress",
			COMPLETED: "completed",
			CANCELLED: "cancelled",
		};

		return t(keys[normalized] || normalized.toLowerCase()) || status || "-";
	};

	const handleRejectConfirm = async () => {
		if (!rejectReason.trim()) {
			alert(t("enterRejectReason"));
			return;
		}

		await onReject(prescription.id, rejectReason.trim());
		setRejectReason("");
		setShowRejectPopup(false);
	};

	const formatDose = (dosage) => {
		if (!dosage) return "-";

		let value = String(dosage).trim();

		// Fix any spaced out units like "m g" -> "mg"
		value = value.replace(/\bm\s+g\b/gi, "mg");
		value = value.replace(/\bm\s+l\b/gi, "ml");
		value = value.replace(/\bm\s+c\s+g\b/gi, "mcg");

		return value;
	};

	const translateForm = (value) => {
		if (!value) return "-";

		const text = String(value).trim();

		const faToEn = {
			کپسول: "Capsule",
			قرص: "Tablet",
			شربت: "Syrup",
			تزریقی: "Injection",
			پماد: "Ointment",
			قطره: "Drops",
		};

		const enToFa = {
			capsule: "کپسول",
			tablet: "قرص",
			syrup: "شربت",
			injection: "تزریقی",
			ointment: "پماد",
			drops: "قطره",
		};

		const hasPersian = /[\u0600-\u06FF]/.test(text);

		if (hasPersian) {
			const en = faToEn[text] || text;
			return `${text} / ${en}`;
		}

		const lower = text.toLowerCase();
		const fa = enToFa[lower] || text;

		return `${fa} / ${text}`;
	};

	const formatFrequency = (frequency) => {
		if (!frequency) return "-";

		const match = String(frequency).match(/(\d+)\s*x\s*(\d+)/i);

		if (match) {
			const first = match[1];
			const second = match[2];
			return `${second} بار در روز / ${first} × ${second}`;
		}

		return String(frequency);
	};

	const buildFormattedMedicines = () => {
		const pickBySubstring = (obj, substrings) => {
			if (!obj) return "";

			for (const key of Object.keys(obj)) {
				const lower = key.toLowerCase();

				if (substrings.some((substring) => lower.includes(substring))) {
					const value = obj[key];

					if (
						value !== undefined &&
						value !== null &&
						String(value).trim() !== ""
					) {
						return value;
					}
				}
			}

			return "";
		};

		return (prescription.medicines || []).map((medicine) => ({
			name:
				medicine.name ??
				medicine.medicineName ??
				medicine.genericName ??
				pickBySubstring(medicine, ["name", "drug"]),
			companyName: medicine.companyName ?? medicine.brandName ?? "",
			dosage:
				medicine.dosage ??
				medicine.dose ??
				medicine.dos ??
				medicine.dosageText ??
				pickBySubstring(medicine, ["dos", "dose", "strength"]),
			frequency:
				medicine.frequency ??
				medicine.freq ??
				medicine.frequencyPerDay ??
				medicine.frequencyText ??
				pickBySubstring(medicine, ["freq"]),
			route:
				medicine.route ??
				medicine.method ??
				medicine.routeName ??
				medicine.type ??
				pickBySubstring(medicine, ["route", "method", "type"]),
			type:
				medicine.type ??
				medicine.form ??
				medicine.drugType ??
				medicine.medicineType ??
				medicine.typeName ??
				medicine.route ??
				medicine.method ??
				medicine.routeName ??
				pickBySubstring(medicine, ["type", "form", "route"]),
			amount:
				medicine.amount ??
				medicine.quantity ??
				medicine.qty ??
				pickBySubstring(medicine, ["amount", "qty", "quantity"]),
			mealTiming: medicine.mealTiming ?? pickBySubstring(medicine, ["meal", "food"]),
			instructions: medicine.instructions ?? "",
			duration: medicine.duration ?? "",
		}));
	};

	const buildPrescriptionPrintData = () => ({
		...prescription,

		prescriptionNo:
			prescription.prescriptionNo ||
			prescription.prescriptionNumber ||
			prescription.id ||
			"",

		patientName:
			prescription.patientName ||
			prescription.patient?.fullname ||
			patient?.fullname ||
			patient?.name ||
			"",

		patientFathername:
			prescription.patientFathername ||
			prescription.patient?.fathername ||
			prescription.patient?.fatherName ||
			patient?.fathername ||
			patient?.fatherName ||
			"",

		patientGender:
			prescription.patientGender ||
			prescription.patient?.gender ||
			patient?.gender ||
			"",

		patientAge:
			prescription.patientAge ||
			prescription.patient?.age ||
			patient?.age ||
			"",

		date: prescription.date || prescription.createdAt || "",

		doctorName:
			prescription.doctorName ||
			prescription.doctor?.name ||
			currentUser?.name ||
			"",

		bloodPressure: prescription.bloodPressure || "",
		respiratoryRate: prescription.respiratoryRate || "",
		pulseRate: prescription.pulseRate || "",
		temperature: prescription.temperature || "",
		heartRate: prescription.heartRate || "",
		spo2: prescription.spo2 || "",
		clc: prescription.clc || "",
		pastHistory: prescription.pastHistory || "",
		investigation: prescription.investigation || "",
		impression: prescription.impression || "",
		drugHistory: prescription.drugHistory || "",
		notes: prescription.notes || "",
		instructions: prescription.instructions || "",
		diagnosis: prescription.diagnosis || "",
	});

	const handlePrint = async () => {
		try {
			setPrinting(true);

			printPrescription({
				prescriptionData: buildPrescriptionPrintData(),
				patientData: patient,
				hospitalSettings,
				currentUser: {
					...currentUser,
					name:
						prescription.doctorName ||
						prescription.doctor?.name ||
						currentUser?.name ||
						"",
				},
				medicines: buildFormattedMedicines(),
				labTests: (prescription.labOrders || []).flatMap((order) =>
					(order.items || []).map((item) => item.labTest).filter(Boolean)
				),
			});
		} finally {
			setPrinting(false);
		}
	};

	return (
		<div className="space-y-6 p-3 sm:p-6 md:p-8">
			<div className="flex items-center justify-between gap-4">
				<button type="button" className={buttonGhost} onClick={onBack}>
					← {t("back")}
				</button>

				<div className="text-right">
					<h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
						{prescription.prescriptionNo || prescription.id}
					</h2>
					<p className="mt-1 text-xs text-gray-600 sm:text-sm">{t("prescriptionDetails")}</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Card>
						<CardHeader>
							<div className="flex flex-wrap items-center justify-between gap-2">
								<Badge className={getStatusColor(prescription.status)}>
									{getTranslatedStatus(prescription.status)}
								</Badge>

								<h3 className="text-lg font-semibold text-gray-900">
									{t("prescriptionInformation")}
								</h3>
							</div>
						</CardHeader>

						<CardContent className="space-y-6">
							<div className="border-t border-gray-100 pt-6">
								<h3 className="mb-4 text-right text-lg font-semibold text-gray-900">
									{t("patientDetails")}
								</h3>

								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
									<InfoItem
										label={t("patientName")}
										value={prescription.patientName || patient?.fullname || "-"}
									/>

									<InfoItem
										label={t("fatherName")}
										value={
											prescription.patientFathername ||
											patient?.fathername ||
											patient?.fatherName ||
											"-"
										}
									/>

									<InfoItem
										label={t("doctorName")}
										value={prescription.doctorName || "-"}
									/>

									<InfoItem
										label={t("issueDate")}
										value={formatDate(prescription.date)}
									/>

									<InfoItem
										label={t("gender")}
										value={prescription.patientGender || patient?.gender || "-"}
									/>

									<InfoItem
										label={t("age")}
										value={prescription.patientAge || patient?.age || "-"}
									/>

									{prescription.diagnosis && (
										<InfoItem
											label={t("diagnosis")}
											value={prescription.diagnosis}
										/>
									)}
								</div>
							</div>

							<div className="border-t pt-6">
								<p className="mb-4 text-right font-medium text-gray-900">
									{t("vitalSigns")}
								</p>

								<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
									{[
										["bloodPressure", "bloodPressure"],
										["respiratoryRate", "respiratoryRate"],
										["pulseRate", "pulseRate"],
										["temperature", "temperature"],
										["heartRate", "heartRate"],
										["spo2", "spo2"],
										["clc", "clc"],
										["pastHistory", "pastHistory"],
										["investigation", "investigation"],
										["impression", "impression"],
										["drugHistory", "drugHistory"],
										["notes", "notes"],
										["instructions", "instructions"],
									].map(([field, labelKey]) =>
										prescription[field] ? (
											<InfoItem
												key={field}
												label={t(labelKey)}
												value={prescription[field]}
											/>
										) : null
									)}
								</div>
							</div>

							<div className="border-t pt-6">
								<div className="mb-4 flex items-center justify-between">
									<p className="text-lg font-semibold text-gray-900">
										{t("prescribedMedications")}
									</p>

									<div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
										{prescription.medicines?.length || 0} {t("items")}
									</div>
								</div>

								<div className="w-full overflow-x-auto">
									<div className="min-w-[900px]">
										<div
											className="normal-dir-table mb-2 grid rounded-lg bg-gray-100 p-3 text-sm font-bold text-gray-700"
											style={{
												gridTemplateColumns: "50px 2fr 1fr 1fr 80px 2fr",
											}}
										>
											<div className="text-center">#</div>
											<div>{t("medication")}</div>
											<div>{t("dose")}</div>
											<div>{t("frequency")}</div>
											<div className="text-center">{t("qty")}</div>
											<div>{t("instructions")}</div>
										</div>

										<div className="space-y-2">
											{(prescription.medicines || []).map((medicine, index) => (
												<div
													key={index}
													className="normal-dir-table grid items-center rounded-lg border border-gray-200 bg-white p-3 text-sm transition hover:shadow-sm"
													style={{
														gridTemplateColumns: "50px 2fr 1fr 1fr 80px 2fr",
													}}
												>
													<div className="text-center text-gray-500">{index + 1}</div>

													<div className="flex flex-col">
														<span className="font-semibold text-gray-900">
															{medicine.name || "-"}
														</span>

														{medicine.companyName && (
															<span className="text-xs text-gray-500">
																{medicine.companyName}
															</span>
														)}

														<span className="text-xs text-gray-400">
															{translateForm(medicine.type || medicine.route || "")}
														</span>
													</div>

													<div className="text-gray-900 font-medium" dir="ltr">
														{formatDose(medicine.dosage)}
													</div>

													<div className="text-gray-900">
														{formatFrequency(medicine.frequency)}
													</div>

													<div className="text-center text-gray-900">
														{medicine.amount ?? "-"}
													</div>

													<div
														className="truncate text-gray-600"
														title={medicine.instructions}
													>
														{medicine.instructions || "-"}
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<PrescriptionLabResultsPanel prescriptionId={prescription.id} />
				</div>

				<Card className="max-h-[680px]">
					<CardHeader>
						<h3 className="text-right text-lg font-semibold text-gray-900">
							{t("operations")}
						</h3>
					</CardHeader>

					<CardContent className="space-y-3">
						{canEdit && (
							<button
								type="button"
								className={`${buttonSecondary} w-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100`}
								onClick={() => onEdit(prescription.id)}
							>
								<Pencil className="mr-2 h-4 w-4" />
								{t("editPrescription")}
							</button>
						)}

						{prescription.status !== "dispensed" && (
							<button
								type="button"
								className={`${buttonPrimary} w-full`}
								onClick={() => onDispense(prescription.id)}
							>
								<PackageCheck className="mr-2 h-4 w-4" />
								{t("markDispensed")}
							</button>
						)}

						{prescription.status !== "rejected" && (
							<button
								type="button"
								className={`${buttonPrimary} w-full bg-red-600 hover:bg-red-700 focus:ring-red-500`}
								onClick={() => setShowRejectPopup(true)}
							>
								<XCircle className="mr-2 h-4 w-4" />
								{t("rejectPrescription")}
							</button>
						)}

						{prescription.status === "rejected" &&
							prescription.rejectionReason && (
								<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
									<p className="font-medium">{t("rejectReason")}:</p>
									<p className="mt-1">{prescription.rejectionReason}</p>
								</div>
							)}

						<button
							type="button"
							className={`${buttonSecondary} w-full cursor-not-allowed opacity-50`}
							disabled
						>
							<Download className="mr-2 h-4 w-4" />
							{t("downloadPdf")}
						</button>

						<button
							type="button"
							className={`${buttonSecondary} w-full`}
							onClick={handlePrint}
							disabled={printing}
						>
							<FileText className="mr-2 h-4 w-4" />
							{printing ? t("processing") : t("printPrescription")}
						</button>
					</CardContent>

					{patient && (
						<CardContent>
							<div className="space-y-3 text-sm">
								<button
									type="button"
									className={`${buttonGhost} w-full justify-start`}
									onClick={() => onViewPatient(patient.id)}
								>
									<User className="mr-2 h-4 w-4" />
									{t("viewFullProfile")}
								</button>

								{patient.allergies && patient.allergies !== "None" && (
									<div className="mt-2 rounded border border-red-200 bg-red-50 p-2 text-right text-xs text-red-800">
										{patient.allergies}{" "}
										<span className="font-medium">: {t("allergies")}</span>
									</div>
								)}
							</div>
						</CardContent>
					)}
				</Card>
			</div>

			{showRejectPopup && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="w-80 space-y-4 rounded-xl bg-white p-5 shadow-xl" dir="rtl">
						<h3 className="text-base font-semibold text-gray-900">
							{t("rejectReason")}
						</h3>

						<textarea
							autoFocus
							rows={3}
							className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-right text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
							placeholder={t("enterRejectReason")}
							value={rejectReason}
							onChange={(event) => setRejectReason(event.target.value)}
						/>

						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setShowRejectPopup(false);
									setRejectReason("");
								}}
								className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
							>
								{t("cancel")}
							</button>

							<button
								type="button"
								onClick={handleRejectConfirm}
								className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
							>
								{t("confirmReject")}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function InfoItem({ label, value }) {
	return (
		<div>
			<p className="text-right text-sm text-gray-600">{label}</p>
			<p className="text-right font-medium text-gray-900">{value || "-"}</p>
		</div>
	);
}