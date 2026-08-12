import {
	Search,
	Plus,
	Eye,
	ChevronLeft,
	ChevronRight,
	ChevronDown,
	Info,
	Download,
	FileText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../ui/Card";
import { inputClasses, buttonPrimary, buttonGhost } from "../../constants/styles";
import { getStatusColor, formatDate, getStatusLabel } from "../../utils/helpers";
import useStore from "../../store/useStore.jsx";
import { prescriptionApi } from "../../api/prescriptionApi";
import { backupApi } from "../../api/backupApi";
import Loader from "../ui/Loader";
import Message from "../ui/Message";
import { useLanguage } from "../../i18n/LanguageContext";

const ITEMS_PER_PAGE = 20;

const STATUS_OPTIONS = [
	{ value: "all", labelKey: "allStatuses" },
	{ value: "pending", labelKey: "pending" },
	{ value: "verified", labelKey: "verified" },
	{ value: "dispensed", labelKey: "dispensed" },
	{ value: "rejected", labelKey: "rejected" },
];

function normalizeStatus(status) {
	return String(status || "").toLowerCase();
}

function getFatherName(prescription) {
	return (
		prescription?.patientFathername ||
		prescription?.patient?.fathername ||
		prescription?.patient?.fatherName ||
		prescription?.patient?.father_name ||
		""
	);
}

export default function PrescriptionList({
	onCreatePrescription,
	onViewPrescription,
	currentUser,
}) {
	const { t, language } = useLanguage();

	const {
		prescriptions,
		prescriptionsLoading,
		prescriptionsError,
		fetchPrescriptions,
		removePrescription,
		prescriptionsTotalPages,
		prescriptionsTotalRecords,
	} = useStore();

	const [prescriptionSearch, setPrescriptionSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const [rejectPopup, setRejectPopup] = useState(null);
	const [viewReason, setViewReason] = useState(null);
	const [backupLoading, setBackupLoading] = useState(false);

	const hasPrescriptions = Array.isArray(prescriptions) && prescriptions.length > 0;
	const totalPages = Math.max(Number(prescriptionsTotalPages || 1), 1);

	const isFiltered = prescriptionSearch.trim() !== "" || statusFilter !== "all";

	const canCreate =
		currentUser?.role === "admin" || currentUser?.role === "doctor";

	const canBackup = currentUser?.role === "admin";

	const pageNumbers = useMemo(() => {
		return Array.from({ length: totalPages }, (_, index) => index + 1).filter(
			(page) =>
				page === 1 ||
				page === totalPages ||
				(page >= currentPage - 1 && page <= currentPage + 1)
		);
	}, [currentPage, totalPages]);

	useEffect(() => {
		const filters = {
			...(prescriptionSearch.trim() && {
				search: prescriptionSearch.trim(),
			}),
			...(statusFilter !== "all" && {
				status: statusFilter.toUpperCase(),
			}),
		};

		fetchPrescriptions(currentPage, ITEMS_PER_PAGE, filters);
	}, [currentPage, prescriptionSearch, statusFilter, fetchPrescriptions]);

	const handleBackup = async () => {
		try {
			setBackupLoading(true);
			await backupApi.downloadPrescriptionsBackup();
		} catch (error) {
			alert(error.message || t("backupFailed"));
		} finally {
			setBackupLoading(false);
		}
	};

	const handleSearchChange = (value) => {
		setPrescriptionSearch(value);
		setCurrentPage(1);
	};

	const handleStatusChange = (value) => {
		setStatusFilter(value);
		setCurrentPage(1);
	};

	const goToPage = (page) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const handleDeletePrescription = async (prescriptionId) => {
		if (!window.confirm(t("deletePrescriptionConfirm"))) return;

		try {
			await removePrescription(prescriptionId);
			await fetchPrescriptions(currentPage, ITEMS_PER_PAGE);
		} catch (error) {
			alert(`${t("failedToDeletePrescription")}: ${error.message}`);
		}
	};

	const updatePrescriptionStatus = async (id, status, rejectionReason = null) => {
		try {
			await prescriptionApi.updatePrescriptionStatus(
				id,
				status.toUpperCase(),
				rejectionReason
			);
			await fetchPrescriptions(currentPage, ITEMS_PER_PAGE);
		} catch (error) {
			console.error(error);
			alert(`${t("failedToUpdatePrescriptionStatus")}: ${error.message}`);
		}
	};

	const handleRejectConfirm = async () => {
		if (!rejectPopup?.reason?.trim()) {
			alert(t("enterRejectReason"));
			return;
		}

		await updatePrescriptionStatus(
			rejectPopup.id,
			"rejected",
			rejectPopup.reason.trim()
		);

		setRejectPopup(null);
	};

	return (
		<div className="space-y-5 p-3 sm:p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
						<FileText className="h-5 w-5 sm:h-6 sm:w-6" />
					</div>

					<div>
						<h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
							{t("prescriptions")}
						</h2>
						<p className="mt-0.5 text-xs text-blue-600 sm:text-sm">
							{prescriptionsTotalRecords > 0
								? `${t("total")}: ${prescriptionsTotalRecords} ${t("prescriptionsCount")}`
								: t("managePrescriptionsSubtitle")}
						</p>
					</div>
				</div>
				
				<div className="flex flex-wrap items-center gap-2">
					{canBackup && (
						<button
							type="button"
							onClick={handleBackup}
							disabled={backupLoading}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
							title={t("downloadPrescriptionsBackup")}
						>
							<Download className="h-4 w-4" />
							{backupLoading ? t("downloading") : t("backup")}
						</button>
					)}
				</div>
			</div>

			<Card className="rounded-2xl border border-slate-200 shadow-sm">
				<CardContent className="p-3 sm:p-4">
					<div className="flex flex-col gap-2.5 sm:flex-row">
						<select
							value={statusFilter}
							onChange={(e) => handleStatusChange(e.target.value)}
							className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 sm:text-sm"
						>
							{STATUS_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{t(option.labelKey)}
								</option>
							))}
						</select>

						<div className="relative flex-1">
							<input
								className={`${inputClasses} pl-10 text-right text-xs sm:text-sm`}
								placeholder={t("searchPrescriptionsPlaceholder")}
								value={prescriptionSearch}
								onChange={(e) => handleSearchChange(e.target.value)}
							/>
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						</div>

						{canCreate && (
							<button
								type="button"
								onClick={onCreatePrescription}
								className={`${buttonPrimary} justify-center text-xs sm:text-sm`}
							>
								<Plus className="mr-2 h-4 w-4" />
								{t("createPrescription")}
							</button>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
				<CardContent className="p-0">
					{prescriptionsLoading ? (
						<Loader message={t("loadingPrescriptions")} size="md" fullHeight />
					) : prescriptionsError ? (
						<Message
							type="error"
							title={t("failedToLoadPrescriptions")}
							description={prescriptionsError}
							fullHeight
						/>
					) : !hasPrescriptions ? (
						<Message
							type="empty"
							title={
								isFiltered
									? t("noPrescriptionsMatched")
									: t("noPrescriptionsYet")
							}
							description={
								isFiltered
									? t("tryChangingSearchOrStatus")
									: t("createPrescriptionToStart")
							}
							fullHeight
							action={
								!isFiltered && canCreate ? (
									<button
										type="button"
										onClick={onCreatePrescription}
										className={buttonPrimary}
									>
										<Plus className="mr-2 h-4 w-4" />
										{t("createPrescription")}
									</button>
								) : null
							}
						/>
					) : (
						<div className="overflow-x-auto touch-pan-x pb-2">
							<table className="min-w-full">
								<thead className="border-b border-slate-200 bg-slate-50">
									<tr>
										<Th>{t("actions")}</Th>
										<Th>{t("status")}</Th>
										<Th>{t("diagnosis")}</Th>
										<Th>{t("date")}</Th>
										<Th>{t("doctorName")}</Th>
										<Th>{t("patientName")}</Th>
										<Th align="right">{t("prescriptionNumber")}</Th>
										<Th>#</Th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-100">
									{prescriptions.map((prescription, index) => {
										const normalizedStatus = normalizeStatus(prescription.status);
										const fatherName = getFatherName(prescription);

										return (
											<tr
												key={prescription.id}
												className="transition hover:bg-slate-50"
											>
												<td className="px-4 py-4 text-center">
													<div className="flex items-center justify-center gap-2">
														<button
															type="button"
															className={`${buttonGhost} px-2 py-1`}
															onClick={() => onViewPrescription(prescription.id)}
															title={t("viewPrescription")}
														>
															<Eye className="h-4 w-4" />
														</button>
													</div>
												</td>

												<td className="px-4 py-4 text-center">
													<div className="flex items-center justify-center gap-1">
														<div className="group relative inline-block">
															<button
																type="button"
																className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold ${getStatusColor(
																	prescription.status
																)}`}
															>
																<span>{getStatusLabel(prescription.status, t)}</span>
																<ChevronDown className="h-3 w-3" />
															</button>

															<div className="invisible absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
																<button
																	type="button"
																	onClick={() =>
																		updatePrescriptionStatus(
																			prescription.id,
																			"dispensed"
																		)
																	}
																	className="block w-full px-4 py-2 text-right text-sm hover:bg-slate-50"
																>
																	{t("dispensed")}
																</button>

																<button
																	type="button"
																	onClick={() =>
																		setRejectPopup({
																			id: prescription.id,
																			reason: "",
																		})
																	}
																	className="block w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50"
																>
																	{t("rejected")}
																</button>
															</div>
														</div>

														{normalizedStatus === "rejected" && (
															<button
																type="button"
																title={t("rejectReason")}
																onClick={() =>
																	setViewReason(
																		prescription.rejectionReason ||
																			t("noRejectReason")
																	)
																}
																className="text-red-500 hover:text-red-700"
															>
																<Info className="h-4 w-4" />
															</button>
														)}
													</div>
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													{prescription.diagnosis || "-"}
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													{formatDate(prescription.date, language)}
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													{prescription.doctorName || "-"}
												</td>

												<td className="px-4 py-4 text-center text-slate-800">
													<div className="font-semibold text-slate-900">
														{prescription.patientName || "-"}
													</div>

													{fatherName && (
														<div className="text-xs text-slate-500">
															{t("fatherName")}: {fatherName}
														</div>
													)}

													{normalizedStatus === "rejected" &&
														prescription.rejectionReason && (
															<div className="mt-1 text-xs font-semibold text-red-600">
																{t("rejectReason")}:{" "}
																{prescription.rejectionReason}
															</div>
														)}
												</td>

												<td className="px-4 py-4 text-right font-semibold text-blue-700">
													{prescription.prescriptionNo || prescription.id}
												</td>

												<td className="px-4 py-4 text-center text-sm text-slate-500">
													{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{!prescriptionsLoading &&
				!prescriptionsError &&
				hasPrescriptions &&
				totalPages > 1 && (
					<div className="flex items-center justify-center">
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
								className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<ChevronLeft className="h-4 w-4" />
							</button>

							<div className="flex items-center gap-1">
								{pageNumbers.map((page, index) => {
									const previous = pageNumbers[index - 1];
									const showDots = previous && page - previous > 1;

									return (
										<span key={page} className="flex items-center gap-1">
											{showDots && (
												<span className="px-2 text-slate-400">...</span>
											)}
											<button
												type="button"
												onClick={() => goToPage(page)}
												className={`min-w-[2rem] rounded-lg px-3 py-1 text-sm font-semibold ${
													currentPage === page
														? "bg-blue-600 text-white"
														: "border border-slate-300 text-slate-700 hover:bg-slate-50"
												}`}
											>
												{page}
											</button>
										</span>
									);
								})}
							</div>

							<button
								type="button"
								onClick={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<ChevronRight className="h-4 w-4" />
							</button>
						</div>
					</div>
				)}

			{viewReason && (
				<ReasonModal
					title={t("rejectReason")}
					reason={viewReason}
					onClose={() => setViewReason(null)}
					t={t}
				/>
			)}

			{rejectPopup && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-5 shadow-xl" dir="rtl">
						<h3 className="text-base font-semibold text-slate-900">
							{t("rejectReason")}
						</h3>

						<textarea
							autoFocus
							rows={3}
							className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-right text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
							placeholder={t("enterRejectReason")}
							value={rejectPopup.reason}
							onChange={(e) =>
								setRejectPopup((prev) => ({
									...prev,
									reason: e.target.value,
								}))
							}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleRejectConfirm();
								}
							}}
						/>

						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setRejectPopup(null)}
								className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
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

function Th({ children, align = "center" }) {
	return (
		<th
			className={`px-4 py-3 text-${align} text-xs font-bold uppercase tracking-wide text-slate-500`}
		>
			{children}
		</th>
	);
}

function ReasonModal({ title, reason, onClose, t }) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-sm space-y-3 rounded-xl bg-white p-5 text-right shadow-xl"
				dir="rtl"
				onClick={(e) => e.stopPropagation()}
			>
				<h3 className="text-base font-semibold text-red-600">{title}</h3>

				<p className="text-sm leading-relaxed text-slate-800">{reason}</p>

				<div className="flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
					>
						{t("close")}
					</button>
				</div>
			</div>
		</div>
	);
}