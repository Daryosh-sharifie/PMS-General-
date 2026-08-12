import {
	Phone,
	Mail,
	MapPin,
	Plus,
	Calendar,
	FileText,
	Eye,
	User,
	Droplet,
	AlertTriangle,
	FlaskConical,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import {
	buttonPrimary,
	buttonSecondary,
	buttonGhost,
} from "../../constants/styles";
import {
	getStatusColor,
	formatDate,
	displayPatientAge,
} from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";
import LabStatusBadge from "../labReports/LabStatusBadge";

function valueOrDash(value) {
	return value !== undefined && value !== null && String(value).trim() !== ""
		? value
		: "-";
}

function getGenderLabel(gender, t) {
	const normalized = String(gender || "").toLowerCase();

	if (normalized === "male") return t("male");
	if (normalized === "female") return t("female");

	return gender || "-";
}

function getPrescriptionStatusLabel(status, t) {
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
}

export default function PatientDetail({
	patient,
	prescriptions = [],
	labOrders = [],
	onBack,
	onCreatePrescription,
	onViewPrescription,
	currentUser,
}) {
	const { t, language } = useLanguage();

	if (!patient) return null;

	const canCreatePrescription =
		currentUser?.role === "admin" || currentUser?.role === "doctor";

	return (
		<div className="space-y-6 p-4 md:p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<button type="button" className={buttonGhost} onClick={onBack}>
					← {t("back")}
				</button>

				<div className="flex items-center justify-end gap-3 text-right">
					<div>
						<h2 className="text-3xl font-bold text-slate-900">
							{patient.name || patient.fullname || "-"}
						</h2>
						<p className="mt-1 text-sm text-slate-500">{t("patientDetails")}</p>
					</div>

					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
						<User className="h-6 w-6" />
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<h3 className="text-right text-lg font-semibold text-slate-900">
							{t("personalInformation")}
						</h3>
					</CardHeader>

					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<InfoTile
								label={t("age")}
								value={displayPatientAge(patient.age, language) || "-"}
							/>
							<InfoTile
								label={t("gender")}
								value={getGenderLabel(patient.gender, t)}
							/>
							<InfoTile
								label={t("bloodGroup")}
								value={
									<Badge className="border-red-100 bg-red-50 text-red-700">
										<Droplet className="mr-1 h-3 w-3" />
										{valueOrDash(patient.bloodGroup)}
									</Badge>
								}
							/>
							<InfoTile
								label={t("lastVisit")}
								value={patient.lastVisit ? formatDate(patient.lastVisit, language) : "-"}
							/>
						</div>

						<div className="grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-3">
							<ContactItem icon={Phone} value={valueOrDash(patient.phone)} />
							<ContactItem icon={Mail} value={valueOrDash(patient.email)} />
							<ContactItem icon={MapPin} value={valueOrDash(patient.address)} />
						</div>

						{patient.allergies && patient.allergies !== "None" && (
							<div className="border-t border-slate-100 pt-5">
								<div className="mb-2 flex items-center justify-end gap-2 text-right">
									<p className="text-sm font-semibold text-slate-700">
										{t("knownAllergies")}
									</p>
									<AlertTriangle className="h-4 w-4 text-red-500" />
								</div>
								<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-right">
									<p className="text-sm font-medium text-red-800">
										{patient.allergies}
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<h3 className="text-right text-lg font-semibold text-slate-900">
							{t("quickActions")}
						</h3>
					</CardHeader>

					<CardContent className="space-y-3">
						{canCreatePrescription && (
							<button
								type="button"
								className={`${buttonPrimary} w-full justify-center`}
								onClick={() => onCreatePrescription?.(patient.id)}
							>
								<Plus className="mr-2 h-4 w-4" />
								{t("newPrescription")}
							</button>
						)}

						<button
							type="button"
							disabled
							className={`${buttonSecondary} w-full cursor-not-allowed justify-center opacity-50`}
						>
							<Calendar className="mr-2 h-4 w-4" />
							{t("scheduleAppointment")}
						</button>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Card>
					<CardHeader>
						<h3 className="text-right text-lg font-semibold text-slate-900">
							{t("prescriptionHistory")}
						</h3>
					</CardHeader>

					<CardContent>
						{prescriptions.length > 0 ? (
							<div className="space-y-3">
								{prescriptions.map((prescription) => (
									<div
										key={prescription.id}
										className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
									>
										<div className="flex items-center gap-2">
											<button
												type="button"
												className={`${buttonGhost} px-2 py-1`}
												onClick={() => onViewPrescription?.(prescription.id)}
												title={t("view")}
											>
												<Eye className="h-4 w-4" />
											</button>

											<Badge className={getStatusColor(prescription.status)}>
												{getPrescriptionStatusLabel(prescription.status, t)}
											</Badge>
										</div>

										<div className="text-right">
											<p className="font-semibold text-slate-900">
												{prescription.prescriptionNo || prescription.id}
											</p>
											<p className="text-sm text-slate-500">
												{valueOrDash(prescription.diagnosis)} •{" "}
												{prescription.date ? formatDate(prescription.date, language) : "-"}
											</p>
										</div>
									</div>
								))}
							</div>
						) : (
							<EmptyState
								icon={FileText}
								title={t("noPrescriptionsForPatient")}
							/>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<h3 className="text-right text-lg font-semibold text-slate-900">
							{t("labReports")}
						</h3>
					</CardHeader>

					<CardContent>
						{labOrders.length > 0 ? (
							<div className="space-y-3">
								{labOrders.map((order) => (
									<div
										key={order.id}
										className="rounded-xl border border-slate-200 bg-white p-4"
									>
										<div className="mb-3 flex items-center justify-between gap-3">
											<LabStatusBadge status={order.status} />
											<div className="text-right">
												<p className="font-semibold text-slate-900">
													{order.labOrderNo || "-"}
												</p>
												<p className="text-xs text-slate-500">
													{order.createdAt ? formatDate(order.createdAt, language) : "-"}
												</p>
											</div>
										</div>

										<div className="flex flex-wrap justify-end gap-2">
											{(order.items || []).slice(0, 4).map((item) => (
												<span
													key={item.id}
													className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
												>
													{item.testNameSnapshot || t("labTest")}
												</span>
											))}
											{(order.items || []).length > 4 && (
												<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
													+{order.items.length - 4}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							<EmptyState icon={FlaskConical} title={t("noLabReportsForPatient")} />
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function InfoTile({ label, value }) {
	return (
		<div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-right">
			<p className="text-xs font-semibold text-slate-500">{label}</p>
			<div className="mt-1 font-semibold text-slate-900">{value}</div>
		</div>
	);
}

function ContactItem({ icon: Icon, value }) {
	return (
		<div className="flex items-center justify-end gap-3 rounded-xl border border-slate-100 bg-white p-3">
			<p className="truncate text-sm font-medium text-slate-800">{value}</p>
			<Icon className="h-4 w-4 shrink-0 text-slate-400" />
		</div>
	);
}

function EmptyState({ icon: Icon, title }) {
	return (
		<div className="py-10 text-center text-slate-500">
			<Icon className="mx-auto mb-3 h-12 w-12 text-slate-300" />
			<p className="text-sm font-medium">{title}</p>
		</div>
	);
}