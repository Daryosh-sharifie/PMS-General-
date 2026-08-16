import {
	Search,
	Plus,
	Eye,
	Trash2,
	ChevronLeft,
	ChevronRight,
	Download,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import { inputClasses, buttonPrimary, buttonGhost } from "../../constants/styles";
import { formatDate, displayPatientAge } from "../../utils/helpers";
import useStore from "../../store/useStore.jsx";
import { backupApi } from "../../api/backupApi";
import { useLanguage } from "../../i18n/LanguageContext";
import { getShortcutTooltip } from "../../utils/shortcutManager";

const ITEMS_PER_PAGE = 20;

function getGenderLabel(gender, t) {
	const normalized = String(gender || "").toLowerCase();

	if (normalized === "male") return t("male");
	if (normalized === "female") return t("female");

	return gender || "-";
}

function alignClass(align = "center") {
	const map = {
		left: "text-left",
		center: "text-center",
		right: "text-right",
	};

	return map[align] || "text-center";
}

export default function PatientList({ onAddPatient, onViewPatient }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const {
		patients,
		patientsLoading,
		patientsError,
		fetchPatients,
		removePatient,
		patientsTotalPages,
		patientsTotalRecords,
	} = useStore();

	const [patientSearch, setPatientSearch] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [backupLoading, setBackupLoading] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			fetchPatients(currentPage, ITEMS_PER_PAGE, patientSearch);
		}, 250);

		return () => clearTimeout(timer);
	}, [currentPage, patientSearch, fetchPatients]);

	const goToPage = (page) => {
		setCurrentPage(Math.max(1, Math.min(page, patientsTotalPages || 1)));
	};

	const handleSearchChange = (value) => {
		setPatientSearch(value);
		setCurrentPage(1);
	};

	const handleBackup = async () => {
		try {
			setBackupLoading(true);
			await backupApi.downloadPatientsBackup();
		} catch (error) {
			alert(error.message || t("backupFailed"));
		} finally {
			setBackupLoading(false);
		}
	};

	const confirmDelete = async () => {
		if (!deleteConfirm) return;

		try {
			await removePatient(deleteConfirm);
			setDeleteConfirm(null);
			await fetchPatients(currentPage, ITEMS_PER_PAGE, patientSearch);
		} catch (error) {
			setDeleteConfirm(null);
			alert(`${t("failedToDeletePatient")}: ${error.message}`);
		}
	};

	return (
		<div dir={isRtl ? "rtl" : "ltr"} className="space-y-5 p-3 sm:p-6">
			<DeleteModal
				open={Boolean(deleteConfirm)}
				onCancel={() => setDeleteConfirm(null)}
				onConfirm={confirmDelete}
				t={t}
				isRtl={isRtl}
			/>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
						<Users className="h-5 w-5 sm:h-6 sm:w-6" />
					</div>

					<div className={isRtl ? "text-right" : "text-left"}>
						<h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
							{t("patients")}
						</h2>
						<p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
							{patientsTotalRecords > 0
								? `${t("total")}: ${Number(patientsTotalRecords).toLocaleString(
										isRtl ? "fa-IR" : "en-US"
								  )} ${t("patientsCount")}`
								: t("managePatientsSubtitle")}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						type="button"
						onClick={handleBackup}
						disabled={backupLoading}
						className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
						title={t("downloadPatientsBackup")}
					>
						<Download className="h-4 w-4" />
						{backupLoading ? t("downloading") : t("backup")}
					</button>

					<button
						type="button"
						onClick={onAddPatient}
						title={getShortcutTooltip("addPatient", t("addPatient"), language)}
						className={`${buttonPrimary} text-xs sm:text-sm`}
					>
						<Plus className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
						{t("addPatient")}
					</button>
				</div>
			</div>

			<Card className="rounded-2xl border border-slate-200 shadow-sm">
				<CardContent className="p-3 sm:p-4">
					<div className="relative">
						<Search
							className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
								isRtl ? "right-3" : "left-3"
							}`}
						/>

						<input
							className={`${inputClasses} ${
								isRtl ? "pr-10 text-right" : "pl-10 text-left"
							}`}
							placeholder={t("searchPatientsPlaceholder")}
							value={patientSearch}
							onChange={(event) => handleSearchChange(event.target.value)}
							dir={isRtl ? "rtl" : "ltr"}
						/>
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
				<CardContent className="p-0">
					{patientsLoading ? (
						<EmptyState title={t("loadingPatients")} loading />
					) : patientsError ? (
						<EmptyState title={`${t("error")}: ${patientsError}`} error />
					) : patients.length === 0 ? (
						<EmptyState title={t("noPatientsFound")} />
					) : (
						<>
							<div className="overflow-x-auto touch-pan-x pb-2">
								<table
									dir={isRtl ? "rtl" : "ltr"}
									className="normal-dir-table w-full min-w-[980px] table-fixed"
								>
									<colgroup>
										<col className="w-[7%]" />
										<col className="w-[22%]" />
										<col className="w-[10%]" />
										<col className="w-[10%]" />
										<col className="w-[14%]" />
										<col className="w-[10%]" />
										<col className="w-[14%]" />
										<col className="w-[13%]" />
									</colgroup>

									<thead className="border-b border-slate-200 bg-slate-50">
										<tr>
											<Th>#</Th>
											<Th align={isRtl ? "right" : "left"}>
												{t("patientName")}
											</Th>
											<Th>{t("age")}</Th>
											<Th>{t("gender")}</Th>
											<Th>{t("contact")}</Th>
											<Th>{t("bloodGroup")}</Th>
											<Th>{t("lastVisit")}</Th>
											<Th>{t("actions")}</Th>
										</tr>
									</thead>

									<tbody className="divide-y divide-slate-100">
										{patients.map((patient) => (
											<tr key={patient.id} className="transition hover:bg-slate-50">
												<td className="px-4 py-4 text-center text-sm font-bold text-slate-700">
													{patient.id}
												</td>

												<td className="px-4 py-4">
													<div className={isRtl ? "text-right" : "text-left"}>
														<p className="font-semibold text-slate-900">
															{patient.name || patient.fullname || "-"}
														</p>
														<p className="text-sm text-slate-500">
															{patient.email || "-"}
														</p>
													</div>
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													{displayPatientAge(patient.age, language) || "-"}
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													{getGenderLabel(patient.gender, t)}
												</td>

												<td className="ltr-value px-4 py-4 text-center text-slate-800">
													{patient.phone || "-"}
												</td>

												<td className="px-4 py-4 text-center">
													<Badge className="border-red-100 bg-red-50 text-red-700">
														{patient.bloodGroup || "-"}
													</Badge>
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													{patient.lastVisit
														? formatDate(patient.lastVisit, language)
														: "-"}
												</td>

												<td className="px-4 py-4 text-center">
													<div className="flex items-center justify-center gap-2">
														<button
															type="button"
															className={`${buttonGhost} px-2 py-1`}
															onClick={() => onViewPatient(patient.id)}
															title={t("viewPatient")}
														>
															<Eye className="h-4 w-4" />
														</button>

														<button
															type="button"
															className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
															onClick={() => setDeleteConfirm(patient.id)}
															title={t("deletePatient")}
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<Pagination
								currentPage={currentPage}
								totalPages={patientsTotalPages}
								goToPage={goToPage}
								isRtl={isRtl}
							/>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Th({ children, align = "center" }) {
	return (
		<th
			className={`px-4 py-3 ${alignClass(
				align
			)} text-xs font-bold uppercase tracking-wide text-slate-500`}
		>
			{children}
		</th>
	);
}

function EmptyState({ title, loading = false, error = false }) {
	return (
		<div className={`p-10 text-center ${error ? "text-red-500" : "text-slate-500"}`}>
			{loading && (
				<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
			)}
			<p className="font-medium">{title}</p>
		</div>
	);
}

function Pagination({ currentPage, totalPages = 1, goToPage, isRtl }) {
	if (totalPages <= 1) return null;

	const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
		(page) =>
			page === 1 ||
			page === totalPages ||
			(page >= currentPage - 1 && page <= currentPage + 1)
	);

	const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
	const NextIcon = isRtl ? ChevronLeft : ChevronRight;

	return (
		<div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4">
			<button
				type="button"
				onClick={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
				className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
			>
				<PreviousIcon className="h-5 w-5" />
			</button>

			<div className="flex items-center gap-1">
				{pages.map((page, index) => {
					const previous = pages[index - 1];
					const showDots = previous && page - previous > 1;

					return (
						<span key={page} className="flex items-center gap-1">
							{showDots && <span className="px-2 text-slate-400">...</span>}

							<button
								type="button"
								onClick={() => goToPage(page)}
								className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold transition ${
									currentPage === page
										? "bg-blue-600 text-white"
										: "text-slate-700 hover:bg-slate-200"
								}`}
							>
								{Number(page).toLocaleString(isRtl ? "fa-IR" : "en-US")}
							</button>
						</span>
					);
				})}
			</div>

			<button
				type="button"
				onClick={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
			>
				<NextIcon className="h-5 w-5" />
			</button>
		</div>
	);
}

function DeleteModal({ open, onCancel, onConfirm, t, isRtl }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
			<div
				className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ${
					isRtl ? "text-right" : "text-left"
				}`}
				dir={isRtl ? "rtl" : "ltr"}
			>
				<h3 className="mb-2 text-lg font-bold text-slate-900">
					{t("deletePatient")}
				</h3>

				<p className="mb-6 text-sm text-slate-500">
					{t("deletePatientConfirm")}
				</p>

				<div className="flex gap-3">
					<button
						type="button"
						onClick={onConfirm}
						className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
					>
						{t("yesDelete")}
					</button>

					<button
						type="button"
						onClick={onCancel}
						className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
					>
						{t("cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}