import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	BarChart3,
	Users,
	FileText,
	Syringe,
	PackageCheck,
	XCircle,
	Search,
	Eye,
	Trash2,
	Filter,
	Stethoscope,
	ChevronLeft,
	ChevronRight,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Loader2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import Loader from "../ui/Loader";
import Message from "../ui/Message";
import { inputClasses, buttonPrimary, buttonGhost } from "../../constants/styles";
import { formatDate, getStatusColor, getStatusLabel } from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";
import useStore from "../../store/useStore";
import { prescriptionApi } from "../../api/prescriptionApi";

const ITEMS_PER_PAGE = 20;

const PERIOD_FILTERS = [
	{ value: "all", labelKey: "all" },
	{ value: "today", labelKey: "today" },
	{ value: "week", labelKey: "thisWeek" },
	{ value: "month", labelKey: "thisMonth" },
];

const STATUS_OPTIONS = [
	{ value: "all", labelKey: "allStatuses" },
	{ value: "pending", labelKey: "pending" },
	{ value: "verified", labelKey: "verified" },
	{ value: "dispensed", labelKey: "dispensed" },
	{ value: "rejected", labelKey: "rejected" },
];

function getDateRange(period) {
	if (period === "all") return { startDate: null, endDate: null };

	const now = new Date();
	const end = new Date(now);
	end.setHours(23, 59, 59, 999);

	if (period === "today") {
		const start = new Date(now);
		start.setHours(0, 0, 0, 0);
		return { startDate: start.toISOString(), endDate: end.toISOString() };
	}

	if (period === "week") {
		const start = new Date(now);
		start.setDate(now.getDate() - 7);
		start.setHours(0, 0, 0, 0);
		return { startDate: start.toISOString(), endDate: end.toISOString() };
	}

	if (period === "month") {
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		start.setHours(0, 0, 0, 0);
		return { startDate: start.toISOString(), endDate: end.toISOString() };
	}

	return { startDate: null, endDate: null };
}

function escapeHtml(str = "") {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function chunkList(list, size = 25) {
	const chunks = [];
	for (let i = 0; i < list.length; i += size) {
		chunks.push({
			items: list.slice(i, i + size),
			startIndex: i,
		});
	}
	return chunks;
}

async function renderPrescriptionsPdfPageCanvas({
	pageItems,
	startIndex,
	pageNumber,
	totalPages,
	totalRecords,
	t,
	language,
	doctorName,
	generatedAt,
	dateStamp,
}) {
	const isRtl = language === "fa";
	const numberLocale = isRtl ? "fa-IR" : "en-US";

	const headerCell = (label) =>
		`<th style="background:#1e1b4b;color:#ffffff;border:1px solid #312e81;padding:8px 6px;font-weight:700;text-align:center;vertical-align:middle;font-size:11px;white-space:nowrap;">${escapeHtml(label)}</th>`;

	const bodyCell = (value, extra = "") =>
		`<td style="border:1px solid #cbd5e1;padding:7px 6px;text-align:center;vertical-align:middle;font-size:10px;line-height:1.4;color:#1e293b;background:inherit;${extra}">${escapeHtml(value)}</td>`;

	const rows = pageItems
		.map((pres, index) => {
			const rowNumber = startIndex + index + 1;
			const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
			const presNo = pres.prescriptionNo || pres.id || "-";
			const patientName = pres.patientName || pres.patient?.fullname || "-";
			const docName = pres.doctorName || pres.doctor?.name || "-";
			const dateStr = formatDate(pres.date || pres.createdAt, language);
			const diagnosis = pres.diagnosis || "-";
			const statusStr = getStatusLabel(pres.status, t);

			return `
				<tr style="background-color:${rowBg};">
					${bodyCell(String(rowNumber), "font-weight:700;color:#4338ca;")}
					${bodyCell(presNo, "font-weight:700;color:#1e1b4b;")}
					${bodyCell(patientName, "font-weight:600;")}
					${bodyCell(docName, "font-weight:600;")}
					${bodyCell(dateStr)}
					${bodyCell(diagnosis)}
					${bodyCell(statusStr, "font-weight:600;")}
				</tr>
			`;
		})
		.join("");

	const wrapper = document.createElement("div");
	wrapper.setAttribute("dir", isRtl ? "rtl" : "ltr");
	wrapper.setAttribute("data-pdf-export", "true");
	Object.assign(wrapper.style, {
		position: "fixed",
		left: "0",
		top: "0",
		width: "1100px",
		background: "#ffffff",
		color: "#0f172a",
		padding: "0",
		opacity: "1",
		pointerEvents: "none",
		zIndex: "2147483646",
		fontFamily: "Tahoma, 'Vazirmatn', Arial, Helvetica, sans-serif",
	});

	const filterInfo = doctorName
		? `${isRtl ? "داکتر" : "Doctor"}: ${doctorName}`
		: t("allDoctors");

	wrapper.innerHTML = `
		<div style="background-color:#312e81;padding:14px 18px;color:#ffffff;">
			<table style="width:100%;border-collapse:collapse;color:#ffffff;">
				<tr>
					<td style="text-align:${isRtl ? "right" : "left"};vertical-align:middle;color:#ffffff;">
						<div style="font-size:20px;font-weight:800;color:#ffffff;">${escapeHtml(t("detailedReportHeader"))}</div>
						<div style="margin-top:4px;font-size:11px;color:#e0e7ff;">
							${escapeHtml(t("systemReportSubHeader"))}
						</div>
					</td>
					<td style="text-align:${isRtl ? "left" : "right"};vertical-align:middle;font-size:11px;line-height:1.6;color:#ffffff;">
						<div style="color:#ffffff;">${escapeHtml(t("totalReportsCount"))} <b style="color:#ffffff;">${totalRecords.toLocaleString(numberLocale)}</b></div>
						<div style="color:#ffffff;">${escapeHtml(t("doctorFilter"))} <b style="color:#ffffff;">${escapeHtml(filterInfo)}</b></div>
						<div style="color:#ffffff;">${escapeHtml(t("dateGenerated"))} ${escapeHtml(generatedAt)}</div>
					</td>
				</tr>
			</table>
		</div>
		<div style="padding:12px 14px 0;background:#ffffff;">
			<table style="width:100%;border-collapse:collapse;table-layout:fixed;color:#0f172a;background:#ffffff;">
				<colgroup>
					<col style="width:6%;" />
					<col style="width:16%;" />
					<col style="width:20%;" />
					<col style="width:18%;" />
					<col style="width:14%;" />
					<col style="width:16%;" />
					<col style="width:10%;" />
				</colgroup>
				<thead>
					<tr>
						${headerCell("#")}
						${headerCell(t("prescriptionNo"))}
						${headerCell(t("patient"))}
						${headerCell(t("doctor"))}
						${headerCell(t("registeredDate"))}
						${headerCell(t("diagnosis"))}
						${headerCell(t("status"))}
					</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		</div>
		<div style="border-top:1px solid #cbd5e1;margin-top:12px;padding:12px 16px 28px;font-size:11px;color:#475569;background:#ffffff;">
			<table style="width:100%;border-collapse:collapse;color:#475569;">
				<tr>
					<td style="text-align:${isRtl ? "right" : "left"};color:#475569;">${escapeHtml(t("prescriptionReportsDoc"))} • ${escapeHtml(dateStamp)}</td>
					<td style="text-align:${isRtl ? "left" : "right"};font-weight:700;color:#312e81;">
						${isRtl ? `صفحه ${pageNumber.toLocaleString(numberLocale)} از ${totalPages.toLocaleString(numberLocale)}` : `Page ${pageNumber} of ${totalPages}`}
						• ${isRtl ? `${pageItems.length.toLocaleString(numberLocale)} نسخه در این صفحه` : `${pageItems.length} prescriptions on this page`}
					</td>
				</tr>
			</table>
		</div>
		<div style="height:18px;background:#ffffff;"></div>
	`;

	document.body.appendChild(wrapper);

	try {
		if (document.fonts?.ready) {
			await document.fonts.ready;
		}
		await new Promise((resolve) => setTimeout(resolve, 200));

		const canvas = await html2canvas(wrapper, {
			scale: 2,
			useCORS: true,
			allowTaint: true,
			backgroundColor: "#ffffff",
			logging: false,
			foreignObjectRendering: false,
			width: wrapper.scrollWidth,
			height: wrapper.scrollHeight,
			windowWidth: wrapper.scrollWidth,
			windowHeight: wrapper.scrollHeight,
			onclone: (clonedDoc) => {
				const cloned = clonedDoc.querySelector('[data-pdf-export="true"]');
				if (cloned) {
					cloned.style.opacity = "1";
					cloned.style.visibility = "visible";
					cloned.style.color = "#0f172a";
				}
			},
		});

		if (!canvas.width || !canvas.height) {
			throw new Error("Failed to render PDF content");
		}

		return canvas;
	} finally {
		document.body.removeChild(wrapper);
	}
}

async function downloadPrescriptionReportsAsPdf({ prescriptions, t, language, doctorName, total }) {
	if (!prescriptions || !prescriptions.length) {
		throw new Error(t("noPrescriptionsToExport"));
	}

	const generatedAt = formatDate(new Date().toISOString(), language);
	const dateStamp = new Date().toISOString().slice(0, 10);
	const chunks = chunkList(prescriptions, 25);
	const pdfPages = chunks.length;

	const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
	const pageWidth = pdf.internal.pageSize.getWidth();
	const pageHeight = pdf.internal.pageSize.getHeight();
	const marginX = 6;
	const marginTop = 5;
	const marginBottom = 16;
	const contentWidth = pageWidth - marginX * 2;
	const contentHeight = pageHeight - marginTop - marginBottom;

	for (let i = 0; i < chunks.length; i += 1) {
		const { items: pageItems, startIndex } = chunks[i];
		const canvas = await renderPrescriptionsPdfPageCanvas({
			pageItems,
			startIndex,
			pageNumber: i + 1,
			totalPages: pdfPages,
			totalRecords: total,
			t,
			language,
			doctorName,
			generatedAt,
			dateStamp,
		});

		if (i > 0) pdf.addPage();

		const imgWidth = contentWidth;
		const imgHeight = (canvas.height * imgWidth) / canvas.width;
		const scale = imgHeight > contentHeight ? contentHeight / imgHeight : 1;
		const finalWidth = imgWidth * scale;
		const finalHeight = imgHeight * scale;
		const xOffset = marginX + (contentWidth - finalWidth) / 2;
		const yOffset = marginTop;
		const imgData = canvas.toDataURL("image/jpeg", 0.94);

		pdf.addImage(imgData, "JPEG", xOffset, yOffset, finalWidth, Math.min(finalHeight, contentHeight));
	}

	pdf.save(`prescription-reports-${dateStamp}.pdf`);
	return pdfPages;
}

export default function ReportsPage({ currentUser, onViewPrescription }) {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const {
		prescriptions,
		prescriptionsLoading,
		prescriptionsError,
		fetchPrescriptions,
		removePrescription,
		prescriptionsTotalPages,
		prescriptionsTotalRecords,
		users,
		fetchUsers,
	} = useStore();

	const userRole = String(currentUser?.role || "").toLowerCase();
	const isAdmin = userRole === "admin";
	const isDoctor = userRole === "doctor";
	const canDelete = isAdmin;

	const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
		return searchParams.get("doctorId") || "all";
	});
	const [selectedPeriod, setSelectedPeriod] = useState("all");
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [actionMessage, setActionMessage] = useState("");
	const [exportingPdf, setExportingPdf] = useState(false);

	useEffect(() => {
		const paramDoctorId = searchParams.get("doctorId");
		if (paramDoctorId) {
			setSelectedDoctorId(paramDoctorId);
		}
	}, [searchParams]);

	const handleDoctorChange = (docId) => {
		setSelectedDoctorId(docId);
		setCurrentPage(1);
		if (docId && docId !== "all") {
			setSearchParams({ doctorId: docId }, { replace: true });
		} else {
			setSearchParams({}, { replace: true });
		}
	};

	const doctors = useMemo(() => {
		return (Array.isArray(users) ? users : []).filter(
			(user) => String(user.role || "").toLowerCase() === "doctor"
		);
	}, [users]);

	useEffect(() => {
		if (fetchUsers && (!users || users.length === 0)) {
			fetchUsers().catch(() => {});
		}
	}, [fetchUsers, users]);

	const loadReportsData = useCallback(() => {
		const { startDate, endDate } = getDateRange(selectedPeriod);

		const filters = {
			...(searchQuery.trim() && { search: searchQuery.trim() }),
			...(statusFilter !== "all" && { status: statusFilter.toUpperCase() }),
			...(selectedDoctorId !== "all" && { doctorId: selectedDoctorId }),
			...(startDate && { startDate }),
			...(endDate && { endDate }),
		};

		fetchPrescriptions(currentPage, ITEMS_PER_PAGE, filters);
	}, [
		currentPage,
		searchQuery,
		statusFilter,
		selectedDoctorId,
		selectedPeriod,
		fetchPrescriptions,
	]);

	useEffect(() => {
		loadReportsData();
	}, [loadReportsData]);

	const handleDeletePrescription = async (id, presNo) => {
		if (!canDelete) {
			alert(t("onlyAdminCanDeleteReports"));
			return;
		}

		const confirmMsg = t("confirmDeletePrescription").replace("{no}", presNo || id);
		if (!window.confirm(confirmMsg)) return;

		try {
			await removePrescription(id);
			setActionMessage(t("prescriptionDeletedSuccess").replace("{no}", presNo || id));
			setTimeout(() => setActionMessage(""), 3000);
			loadReportsData();
		} catch (err) {
			alert(`${t("errorDeletingPrescription")} ${err.message}`);
		}
	};

	const handleView = (id) => {
		if (onViewPrescription) {
			onViewPrescription(id, selectedDoctorId);
		} else {
			navigate(`/prescriptions/${id}?from=reports&doctorId=${selectedDoctorId}`);
		}
	};

	// Calculate doctor stats summary including all registered doctors and filtering by selectedDoctorId
	const doctorPerformanceSummary = useMemo(() => {
		const map = {};

		// Initialize all registered doctors with 0 default counts (0 0 0 0 0)
		(doctors || []).forEach((doc) => {
			const docKey = String(doc.id);
			map[docKey] = {
				id: docKey,
				name: doc.name || t("doctor"),
				email: doc.email || "",
				totalPrescriptions: 0,
				dispensed: 0,
				pending: 0,
				rejected: 0,
				patients: new Set(),
			};
		});

		// Populate metrics from loaded prescriptions
		(prescriptions || []).forEach((pres) => {
			const docId = String(pres.doctorId || pres.doctor?.id || "");
			if (!docId) return;

			if (!map[docId]) {
				map[docId] = {
					id: docId,
					name: pres.doctorName || pres.doctor?.name || t("doctor"),
					email: pres.doctor?.email || "",
					totalPrescriptions: 0,
					dispensed: 0,
					pending: 0,
					rejected: 0,
					patients: new Set(),
				};
			}

			map[docId].totalPrescriptions += 1;
			if (pres.patientId || pres.patientName) {
				map[docId].patients.add(pres.patientId || pres.patientName);
			}

			const st = String(pres.status || "").toLowerCase();
			if (st === "dispensed") map[docId].dispensed += 1;
			else if (st === "pending" || st === "verified") map[docId].pending += 1;
			else if (st === "rejected") map[docId].rejected += 1;
		});

		const list = Object.values(map);

		// When a doctor filter is selected, show ONLY that specific doctor's summary row
		if (selectedDoctorId !== "all") {
			return list.filter((item) => String(item.id) === String(selectedDoctorId));
		}

		return list;
	}, [doctors, prescriptions, selectedDoctorId]);

	// Filter prescriptions for the detailed reports table when a doctor is selected
	const displayedPrescriptions = useMemo(() => {
		if (selectedDoctorId === "all") return prescriptions || [];
		return (prescriptions || []).filter((pres) => {
			const docId = String(pres.doctorId || pres.doctor?.id || "");
			return docId === String(selectedDoctorId);
		});
	}, [prescriptions, selectedDoctorId]);

	const totalPages = Math.max(Number(prescriptionsTotalPages || 1), 1);

	const handleExportPdf = async () => {
		if (!displayedPrescriptions || displayedPrescriptions.length === 0) {
			alert(t("noPrescriptionsToExport"));
			return;
		}

		try {
			setExportingPdf(true);
			const docObj = doctors.find((d) => String(d.id) === String(selectedDoctorId));
			const doctorName = selectedDoctorId !== "all" ? docObj?.name || "" : "";
			const pagesCreated = await downloadPrescriptionReportsAsPdf({
				prescriptions: displayedPrescriptions,
				t,
				language,
				doctorName,
				total: displayedPrescriptions.length,
			});

			setActionMessage(
				t("pdfExportSuccess")
					.replace("{pages}", pagesCreated)
					.replace("{total}", displayedPrescriptions.length)
			);
			setTimeout(() => setActionMessage(""), 4000);
		} catch (err) {
			console.error("PDF Export error:", err);
			alert(`${t("errorCreatingPdf")} ${err.message}`);
		} finally {
			setExportingPdf(false);
		}
	};

	return (
		<div className="space-y-6 p-3 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
			{/* Page Header */}
			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-3.5">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
							<BarChart3 className="h-6 w-6" />
						</div>

						<div>
							<h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
								{t("reports")}
							</h1>
							<p className="mt-1 text-xs text-slate-500 sm:text-sm">
								{isAdmin
									? t("reportsSubtitleAdmin")
									: t("reportsSubtitleDoctor")}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onClick={handleExportPdf}
							disabled={exportingPdf || displayedPrescriptions.length === 0}
							className={`${buttonPrimary} gap-2 px-4 py-2.5 text-xs font-bold sm:text-sm disabled:cursor-not-allowed disabled:opacity-50`}
						>
							{exportingPdf ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									<span>{t("exportingPdf")}</span>
								</>
							) : (
								<>
									<Download className="h-4 w-4" />
									<span>{t("exportPdf")}</span>
								</>
							)}
						</button>

						{isDoctor && (
							<div className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-800">
								<Stethoscope className="h-4 w-4 text-blue-600 shrink-0" />
								<span>{t("exclusiveDoctorReport")}: {currentUser?.name}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{actionMessage && (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
					{actionMessage}
				</div>
			)}

			{/* Filter Controls Card */}
			<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
				<CardContent className="p-4 sm:p-5">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
						{/* Doctor Filter (Visible to Admin) */}
						{isAdmin && (
							<div className="w-full lg:w-60">
								<label className="mb-1 block text-xs font-bold text-slate-600">
									{t("doctorFilter")}
								</label>
								<select
									value={selectedDoctorId}
									onChange={(e) => handleDoctorChange(e.target.value)}
									className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-sm"
								>
									<option value="all">{t("allDoctors")}</option>
									{doctors.map((doc) => (
										<option key={doc.id} value={doc.id}>
											{doc.name} {doc.email ? `(${doc.email})` : ""}
										</option>
									))}
								</select>
							</div>
						)}

						{/* Period Filter */}
						<div className="w-full lg:w-48">
							<label className="mb-1 block text-xs font-bold text-slate-600">
								{t("period")}
							</label>
							<select
								value={selectedPeriod}
								onChange={(e) => {
									setSelectedPeriod(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-sm"
							>
								{PERIOD_FILTERS.map((period) => (
									<option key={period.value} value={period.value}>
										{t(period.labelKey)}
									</option>
								))}
							</select>
						</div>

						{/* Status Filter */}
						<div className="w-full lg:w-48">
							<label className="mb-1 block text-xs font-bold text-slate-600">
								{t("prescriptionStatus")}
							</label>
							<select
								value={statusFilter}
								onChange={(e) => {
									setStatusFilter(e.target.value);
									setCurrentPage(1);
								}}
								className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-sm"
							>
								{STATUS_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{t(option.labelKey)}
									</option>
								))}
							</select>
						</div>

						{/* Search Input */}
						<div className="flex-1">
							<label className="mb-1 block text-xs font-bold text-slate-600">
								{t("search")}
							</label>
							<div className="relative">
								<input
									className={`${inputClasses} ${
										isRtl ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"
									} text-xs sm:text-sm`}
									placeholder={t("searchPlaceholderReports")}
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setCurrentPage(1);
									}}
								/>
								<Search
									className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
										isRtl ? "right-3" : "left-3"
									}`}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Doctor Activity Aggregation Section (Admin View) */}
			{isAdmin && doctorPerformanceSummary.length > 0 && (
				<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
					<CardHeader className="border-b border-slate-100 p-5">
						<div className="flex items-center gap-2">
							<Stethoscope className="h-5 w-5 text-indigo-600" />
							<h2 className="text-lg font-bold text-slate-900">
								{t("doctorPerformanceSummary")}
							</h2>
						</div>
					</CardHeader>

					<CardContent className="p-0">
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
									<tr>
										<th className={`px-4 py-3 ${isRtl ? "text-right" : "text-left"}`}>{t("doctor")}</th>
										<th className="px-4 py-3 text-center">{t("totalPrescriptions")}</th>
										<th className="px-4 py-3 text-center">{t("totalPatients")}</th>
										<th className="px-4 py-3 text-center">{t("dispensed")}</th>
										<th className="px-4 py-3 text-center">{t("pending")}</th>
										<th className="px-4 py-3 text-center">{t("rejected")}</th>
										<th className="px-4 py-3 text-center">{t("actions")}</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-100 text-sm">
									{doctorPerformanceSummary.map((doc) => (
										<tr key={doc.id} className="hover:bg-slate-50/80 transition">
											<td className={`px-4 py-3.5 ${isRtl ? "text-right" : "text-left"} font-bold text-slate-900`}>
												{doc.name}
												{doc.email && (
													<span className="block text-xs font-normal text-slate-500">
														{doc.email}
													</span>
												)}
											</td>

											<td className="px-4 py-3.5 text-center font-bold text-indigo-600">
												{doc.totalPrescriptions}
											</td>

											<td className="px-4 py-3.5 text-center text-slate-700">
												{doc.patients.size}
											</td>

											<td className="px-4 py-3.5 text-center font-semibold text-emerald-600">
												{doc.dispensed}
											</td>

											<td className="px-4 py-3.5 text-center text-amber-600">
												{doc.pending}
											</td>

											<td className="px-4 py-3.5 text-center text-red-600">
												{doc.rejected}
											</td>

											<td className="px-4 py-3.5 text-center">
												<button
													type="button"
													onClick={() => handleDoctorChange(doc.id)}
													className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
												>
													<Filter className="h-3.5 w-3.5" />
													{t("filterThisDoctor")}
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Main Prescription Reports Table */}
			<Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
				<CardHeader className="border-b border-slate-100 p-5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-indigo-600" />
							<h2 className="text-lg font-bold text-slate-900">
								{t("detailedPrescriptionReports")}
							</h2>
						</div>

						<span className="text-xs font-semibold text-slate-500">
							{t("totalCount")}: {displayedPrescriptions.length}
						</span>
					</div>
				</CardHeader>

				<CardContent className="p-0">
					{prescriptionsLoading ? (
						<Loader message={t("loadingReports")} size="md" fullHeight />
					) : prescriptionsError ? (
						<Message
							type="error"
							title={t("errorLoadingReports")}
							description={prescriptionsError}
							fullHeight
						/>
					) : displayedPrescriptions.length === 0 ? (
						<div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
							<div className="mb-3 rounded-2xl bg-slate-50 p-4 text-slate-400">
								<FileText className="h-8 w-8" />
							</div>
							<p className="font-bold text-slate-700">{t("noReportsFound")}</p>
							<p className="mt-1 text-sm text-slate-500">
								{t("noReportsFoundDesc")}
							</p>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600">
									<tr>
										<th className={`px-4 py-3 ${isRtl ? "text-right" : "text-left"}`}>{t("prescriptionNo")}</th>
										<th className={`px-4 py-3 ${isRtl ? "text-right" : "text-left"}`}>{t("patient")}</th>
										<th className={`px-4 py-3 ${isRtl ? "text-right" : "text-left"}`}>{t("doctor")}</th>
										<th className="px-4 py-3 text-center">{t("registeredDate")}</th>
										<th className={`px-4 py-3 ${isRtl ? "text-right" : "text-left"}`}>{t("diagnosis")}</th>
										<th className="px-4 py-3 text-center">{t("status")}</th>
										<th className="px-4 py-3 text-center">{t("actions")}</th>
									</tr>
								</thead>

								<tbody className="divide-y divide-slate-100 text-sm">
									{displayedPrescriptions.map((prescription) => (
										<tr key={prescription.id} className="hover:bg-slate-50/80 transition">
											<td className={`px-4 py-4 ${isRtl ? "text-right" : "text-left"} font-bold text-indigo-700`}>
												{prescription.prescriptionNo || prescription.id}
											</td>

											<td className={`px-4 py-4 ${isRtl ? "text-right" : "text-left"} font-semibold text-slate-900`}>
												{prescription.patientName || prescription.patient?.fullname || "-"}
											</td>

											<td className={`px-4 py-4 ${isRtl ? "text-right" : "text-left"} text-slate-700 font-medium`}>
												{prescription.doctorName || prescription.doctor?.name || "-"}
											</td>

											<td className="px-4 py-4 text-center text-slate-600">
												{formatDate(prescription.date || prescription.createdAt, language)}
											</td>

											<td className={`px-4 py-4 ${isRtl ? "text-right" : "text-left"} text-slate-700`}>
												{prescription.diagnosis || "-"}
											</td>

											<td className="px-4 py-4 text-center">
												<Badge className={getStatusColor(prescription.status)}>
													{getStatusLabel(prescription.status, t)}
												</Badge>
											</td>

											<td className="px-4 py-4 text-center">
												<div className="flex items-center justify-center gap-1.5">
													<button
														type="button"
														className={`${buttonGhost} px-2 py-1`}
														onClick={() => handleView(prescription.id)}
														title={t("viewPrescription")}
													>
														<Eye className="h-4 w-4" />
													</button>

													{/* Deletion button rendered ONLY for Admin role */}
													{canDelete && (
														<button
															type="button"
															className={`${buttonGhost} px-2 py-1 text-red-500 hover:bg-red-50 hover:text-red-700`}
															onClick={() =>
																handleDeletePrescription(
																	prescription.id,
																	prescription.prescriptionNo
																)
															}
															title={t("deletePrescriptionAdmin")}
														>
															<Trash2 className="h-4 w-4" />
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
					<button
						type="button"
						disabled={currentPage <= 1}
						onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
						className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
					>
						{isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
						{t("previous")}
					</button>

					<span className="text-xs font-semibold text-slate-600">
						{isRtl ? `صفحه ${currentPage} از ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
					</span>

					<button
						type="button"
						disabled={currentPage >= totalPages}
						onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
						className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
					>
						{t("next")}
						{isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
					</button>
				</div>
			)}
		</div>
	);
}
