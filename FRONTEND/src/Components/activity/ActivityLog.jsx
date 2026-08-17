import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Activity,
	RefreshCw,
	ChevronLeft,
	ChevronRight,
	FileDown,
	Filter,
	User,
	FileText,
	Users,
	LogIn,
	Pill,
	Trash2,
	ShieldCheck,
	FlaskConical,
	AlertCircle,
	CheckCircle,
	Clock,
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { activityApi } from "../../api/activityApi";
import { Card, CardContent } from "../ui/Card";
import { useLanguage } from "../../i18n/LanguageContext";
import { fixRtlParentheses, isParentheticalSegment, splitParentheticalText } from "../../utils/helpers";

const LIMIT = 30;
const PDF_ROWS_PER_PAGE = 30;

const ACTION_MAP = {
	LOGIN: {
		labelKey: "loginAction",
		color: "border-blue-100 bg-blue-50 text-blue-700",
	},
	CREATE_PATIENT: {
		labelKey: "createPatientAction",
		color: "border-emerald-100 bg-emerald-50 text-emerald-700",
	},
	DELETE_PATIENT: {
		labelKey: "deletePatientAction",
		color: "border-red-100 bg-red-50 text-red-700",
	},
	CREATE_PRESCRIPTION: {
		labelKey: "createPrescriptionAction",
		color: "border-purple-100 bg-purple-50 text-purple-700",
	},
	CREATE_USER: {
		labelKey: "createUserAction",
		color: "border-teal-100 bg-teal-50 text-teal-700",
	},
	UPDATE_USER: {
		labelKey: "updateUserAction",
		color: "border-amber-100 bg-amber-50 text-amber-700",
	},
	DELETE_USER: {
		labelKey: "deleteUserAction",
		color: "border-red-100 bg-red-50 text-red-700",
	},
	CREATE_MEDICINE: {
		labelKey: "createMedicineAction",
		color: "border-emerald-100 bg-emerald-50 text-emerald-700",
	},
	UPDATE_MEDICINE: {
		labelKey: "updateMedicineAction",
		color: "border-amber-100 bg-amber-50 text-amber-700",
	},
	DELETE_MEDICINE: {
		labelKey: "deleteMedicineAction",
		color: "border-red-100 bg-red-50 text-red-700",
	},
	CREATE_LAB_ORDER: {
		labelKey: "createLabOrderAction",
		color: "border-indigo-100 bg-indigo-50 text-indigo-700",
	},
	UPDATE_LAB_ORDER: {
		labelKey: "updateLabOrderAction",
		color: "border-amber-100 bg-amber-50 text-amber-700",
	},
	VERIFY_LAB_RESULT: {
		labelKey: "verifyLabResultAction",
		color: "border-emerald-100 bg-emerald-50 text-emerald-700",
	},
};

const ENTITY_ICONS = {
	Auth: LogIn,
	Patient: Users,
	Prescription: FileText,
	User,
	Medicine: Pill,
	LabOrder: FlaskConical,
	LabReport: FlaskConical,
	LabTest: FlaskConical,
};

const ENTITY_FILTERS = [
	{ value: "", labelKey: "all" },
	{ value: "Auth", labelKey: "auth" },
	{ value: "Patient", labelKey: "patients" },
	{ value: "Prescription", labelKey: "prescriptions" },
	{ value: "User", labelKey: "users" },
	{ value: "Medicine", labelKey: "medicines" },
	{ value: "LabOrder", labelKey: "labReports" },
];

function extractLogsResponse(result) {
	const logs =
		result?.data?.logs ||
		result?.logs ||
		result?.data?.activities ||
		result?.activities ||
		[];

	const totalPages =
		result?.data?.pagination?.totalPages ||
		result?.pagination?.totalPages ||
		result?.totalPages ||
		1;

	const total =
		result?.data?.pagination?.totalRecords ||
		result?.data?.pagination?.total ||
		result?.pagination?.totalRecords ||
		result?.pagination?.total ||
		result?.total ||
		result?.totalRecords ||
		logs.length;

	return {
		logs: Array.isArray(logs) ? logs : [],
		totalPages: Number(totalPages) || 1,
		total: Number(total) || 0,
	};
}

function formatActivityDate(dateStr, language) {
	if (!dateStr) return "-";

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return "-";

	return date.toLocaleString(language === "fa" ? "fa-IR" : "en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getRoleKey(role) {
	const value = String(role || "").toLowerCase();

	const map = {
		admin: "admin",
		doctor: "doctor",
		pharmacist: "pharmacist",
		reciption: "reception",
		reception: "reception",
		labstaff: "labStaff",
	};

	return map[value] || value;
}

function getEntityLabel(entity, t) {
	const value = String(entity || "");

	const map = {
		Auth: "auth",
		Patient: "patients",
		Prescription: "prescriptions",
		User: "users",
		Medicine: "medicines",
		LabOrder: "labReports",
		LabReport: "labReports",
		LabTest: "labTests",
	};

	return t(map[value] || value) || value || "-";
}

function getActionInfo(action) {
	return (
		ACTION_MAP[action] || {
			labelKey: action,
			color: "border-slate-200 bg-slate-50 text-slate-700",
		}
	);
}

const escapeHtml = (value = "") =>
	String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");

function formatDescriptionHtml(text, isRtl) {
	if (!text) return escapeHtml("-");
	if (!isRtl) return escapeHtml(text);

	return splitParentheticalText(text)
		.map((part) => {
			if (isParentheticalSegment(part)) {
				return `<bdo dir="ltr" class="ltr-value" style="direction:ltr;unicode-bidi:isolate;display:inline-block">${escapeHtml(part)}</bdo>`;
			}

			return escapeHtml(part);
		})
		.join("");
}

function descriptionBodyCell(text, isRtl, extra = "") {
	return `<td style="border:1px solid #cbd5e1;padding:6px 5px;text-align:center;vertical-align:middle;font-size:10px;line-height:1.4;color:#111827;background:inherit;${extra}">${formatDescriptionHtml(clipText(text, 55), isRtl)}</td>`;
}

function clipText(value, max = 70) {
	const text = String(value ?? "").trim() || "-";
	if (text.length <= max) return text;
	return `${text.slice(0, max - 1)}…`;
}

function ReportDescription({ text, isRtl }) {
	if (!text) return "-";

	if (!isRtl) return text;

	return (
		<>
			{splitParentheticalText(text).map((part, index) =>
				isParentheticalSegment(part) ? (
					<bdo key={index} dir="ltr" className="ltr-value inline-block">
						{part}
					</bdo>
				) : (
					<span key={index}>{part}</span>
				)
			)}
		</>
	);
}

async function fetchAllActivityLogs(filters) {
	const first = await activityApi.getLogs(1, LIMIT, filters);
	const firstNormalized = extractLogsResponse(first);
	const allLogs = [...firstNormalized.logs];

	for (let pageNum = 2; pageNum <= firstNormalized.totalPages; pageNum += 1) {
		const next = await activityApi.getLogs(pageNum, LIMIT, filters);
		allLogs.push(...extractLogsResponse(next).logs);
	}

	return allLogs;
}

function chunkLogs(logs, size = PDF_ROWS_PER_PAGE) {
	const chunks = [];
	for (let i = 0; i < logs.length; i += size) {
		chunks.push({ logs: logs.slice(i, i + size), startIndex: i });
	}
	return chunks;
}

async function renderPdfPageCanvas({
	pageLogs,
	startIndex,
	pageNumber,
	totalPages,
	totalRecords,
	t,
	language,
	filterLabel,
	generatedAt,
	dateStamp,
}) {
	const isRtl = language === "fa";
	const numberLocale = language === "fa" ? "fa-IR" : "en-US";

	const headerCell = (label) =>
		`<th style="background:#0f3d7a;color:#ffffff;border:1px solid #0b2f5e;padding:7px 5px;font-weight:700;text-align:center;vertical-align:middle;font-size:10px;white-space:nowrap;">${escapeHtml(label)}</th>`;

	const bodyCell = (value, extra = "") =>
		`<td style="border:1px solid #cbd5e1;padding:6px 5px;text-align:center;vertical-align:middle;font-size:10px;line-height:1.4;color:#111827;background:inherit;${extra}">${escapeHtml(value)}</td>`;

	const rows = pageLogs
		.map((log, index) => {
			const actionInfo = getActionInfo(log.action);
			const roleKey = getRoleKey(log.userRole);
			const rowNumber = startIndex + index + 1;
			const rowBg = index % 2 === 0 ? "#ffffff" : "#f1f5f9";

			return `
				<tr style="background-color:${rowBg};">
					${bodyCell(String(rowNumber), "font-weight:700;color:#0f3d7a;")}
					${bodyCell(formatActivityDate(log.createdAt, language))}
					${bodyCell(clipText(t(actionInfo.labelKey), 28), "font-weight:600;")}
					${descriptionBodyCell(log.description || "-", isRtl)}
					${bodyCell(clipText(log.userName || "-", 18), "font-weight:600;")}
					${bodyCell(clipText(roleKey ? t(roleKey) : "-", 16))}
					${bodyCell(clipText(getEntityLabel(log.entity, t), 16))}
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
		color: "#111827",
		padding: "0",
		opacity: "1",
		pointerEvents: "none",
		zIndex: "2147483646",
		fontFamily: "Tahoma, 'Vazirmatn', Arial, Helvetica, sans-serif",
	});

	wrapper.innerHTML = `
		<div style="background-color:#0f3d7a;padding:12px 16px;color:#ffffff;">
			<table style="width:100%;border-collapse:collapse;color:#ffffff;">
				<tr>
					<td style="text-align:${isRtl ? "right" : "left"};vertical-align:middle;color:#ffffff;">
						<div style="font-size:18px;font-weight:800;color:#ffffff;">${escapeHtml(t("activityLogs"))}</div>
						<div style="margin-top:4px;font-size:11px;color:#dbeafe;">
							${escapeHtml(t("reportsPerPdfPage").replace("{count}", String(PDF_ROWS_PER_PAGE)))}
						</div>
					</td>
					<td style="text-align:${isRtl ? "left" : "right"};vertical-align:middle;font-size:11px;line-height:1.6;color:#ffffff;">
						<div style="color:#ffffff;">${escapeHtml(t("totalReports"))}: <b style="color:#ffffff;">${totalRecords.toLocaleString(numberLocale)}</b></div>
						<div style="color:#ffffff;">${escapeHtml(t("filter"))}: <b style="color:#ffffff;">${escapeHtml(filterLabel)}</b></div>
						<div style="color:#ffffff;">${escapeHtml(t("generatedOn"))}: ${escapeHtml(generatedAt)}</div>
					</td>
				</tr>
			</table>
		</div>
		<div style="padding:10px 12px 0;background:#ffffff;">
			<table style="width:100%;border-collapse:collapse;table-layout:fixed;color:#111827;background:#ffffff;">
				<colgroup>
					<col style="width:5%;" />
					<col style="width:14%;" />
					<col style="width:13%;" />
					<col style="width:32%;" />
					<col style="width:12%;" />
					<col style="width:12%;" />
					<col style="width:12%;" />
				</colgroup>
				<thead>
					<tr>
						${headerCell("#")}
						${headerCell(t("dateAndTime"))}
						${headerCell(t("action"))}
						${headerCell(t("description"))}
						${headerCell(t("user"))}
						${headerCell(t("role"))}
						${headerCell(t("entity"))}
					</tr>
				</thead>
				<tbody>${rows}</tbody>
			</table>
		</div>
		<div style="border-top:1px solid #cbd5e1;margin-top:10px;padding:12px 14px 28px;font-size:10px;color:#334155;background:#ffffff;">
			<table style="width:100%;border-collapse:collapse;color:#334155;">
				<tr>
					<td style="text-align:${isRtl ? "right" : "left"};color:#334155;padding-bottom:6px;">${escapeHtml(t("activityLogs"))} • ${escapeHtml(dateStamp)}</td>
					<td style="text-align:${isRtl ? "left" : "right"};font-weight:700;color:#0f3d7a;padding-bottom:6px;">
						${escapeHtml(t("pdfPage"))} ${pageNumber.toLocaleString(numberLocale)} ${escapeHtml(t("pdfOf"))} ${totalPages.toLocaleString(numberLocale)}
						• ${pageLogs.length.toLocaleString(numberLocale)} ${escapeHtml(t("reportsOnPage"))}
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
					cloned.style.color = "#111827";
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

async function downloadLogsAsPdf({ logs, t, language, filterLabel, total }) {
	if (!logs.length) {
		throw new Error(t("noActivityLogsFound"));
	}

	const generatedAt = formatActivityDate(new Date().toISOString(), language);
	const dateStamp = new Date().toISOString().slice(0, 10);
	const chunks = chunkLogs(logs, PDF_ROWS_PER_PAGE);
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
		const { logs: pageLogs, startIndex } = chunks[i];
		const canvas = await renderPdfPageCanvas({
			pageLogs,
			startIndex,
			pageNumber: i + 1,
			totalPages: pdfPages,
			totalRecords: total,
			t,
			language,
			filterLabel,
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

		// Keep content inside printable area so the last row and footer stay fully visible
		pdf.addImage(imgData, "JPEG", xOffset, yOffset, finalWidth, Math.min(finalHeight, contentHeight));
	}

	pdf.save(`reports-${dateStamp}.pdf`);
	return pdfPages;
}

export default function ActivityLog() {
	const { t, language } = useLanguage();

	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [entityFilter, setEntityFilter] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [exporting, setExporting] = useState(false);

	const numberLocale = language === "fa" ? "fa-IR" : "en-US";
	const isRtl = language === "fa";
	const startFlex = { justifyContent: "flex-start" };

	const currentFilterLabel = useMemo(() => {
		const filter = ENTITY_FILTERS.find((item) => item.value === entityFilter);
		return filter ? t(filter.labelKey) : t("all");
	}, [entityFilter, t]);

	const fetchLogs = useCallback(async () => {
		try {
			setLoading(true);
			setError("");

			const filters = {};
			if (entityFilter) filters.entity = entityFilter;

			const result = await activityApi.getLogs(page, LIMIT, filters);
			const normalized = extractLogsResponse(result);

			setLogs(normalized.logs);
			setTotalPages(normalized.totalPages);
			setTotal(normalized.total);
		} catch (err) {
			setError(err.message || t("failedToLoadActivityLogs"));
			setLogs([]);
			setTotalPages(1);
			setTotal(0);
		} finally {
			setLoading(false);
		}
	}, [page, entityFilter, t]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const handleFilterChange = (value) => {
		setEntityFilter(value);
		setPage(1);
	};

	const handleExportPdf = async () => {
		try {
			setExporting(true);
			setError("");
			setSuccess("");

			const filters = {};
			if (entityFilter) filters.entity = entityFilter;

			const exportLogs = await fetchAllActivityLogs(filters);
			const finalLogs = exportLogs.length ? exportLogs : logs;

			if (!finalLogs.length) {
				throw new Error(t("noActivityLogsFound"));
			}

			const pagesCreated = await downloadLogsAsPdf({
				logs: finalLogs,
				t,
				language,
				filterLabel: currentFilterLabel,
				total: finalLogs.length,
			});

			setSuccess(
				fixRtlParentheses(
					t("pdfExportedSuccessfully")
						.replace("{pages}", String(pagesCreated))
						.replace("{count}", String(finalLogs.length)),
					isRtl
				)
			);
			setTimeout(() => setSuccess(""), 4000);
		} catch (err) {
			setError(err.message || t("failedToLoadActivityLogs"));
		} finally {
			setExporting(false);
		}
	};

	const handleDeleteAll = async () => {
		try {
			setDeleting(true);
			setError("");
			setSuccess("");

			await activityApi.deleteAll();

			setLogs([]);
			setTotal(0);
			setTotalPages(1);
			setPage(1);
			setShowDeleteModal(false);
			setSuccess(t("activityLogsDeletedSuccessfully"));

			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			setError(err.message || t("failedToDeleteActivityLogs"));
		} finally {
			setDeleting(false);
		}
	};

	const goToPage = (nextPage) => {
		setPage(Math.max(1, Math.min(nextPage, totalPages)));
	};

	const pages = useMemo(() => {
		return Array.from({ length: totalPages }, (_, index) => index + 1).filter(
			(item) =>
				item === 1 ||
				item === totalPages ||
				(item >= page - 1 && item <= page + 1)
		);
	}, [page, totalPages]);

	return (
		<div className="space-y-6 p-4 md:p-6">
			<DeleteAllModal
				open={showDeleteModal}
				deleting={deleting}
				onCancel={() => setShowDeleteModal(false)}
				onConfirm={handleDeleteAll}
				t={t}
			/>

			<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20 modern-icon-badge transition-all">
							<Activity className="h-6 w-6 gentle-header-activity" />
						</div>
						<div>
							<h2 className="text-2xl font-bold text-slate-950">{t("activityLogs")}</h2>
							<p className="mt-1 text-sm text-slate-500">
								{t("total")}: {total.toLocaleString(numberLocale)} {t("eventsRecorded")}
							</p>
							<p className="text-xs text-slate-400">
								{t("filter")}: {currentFilterLabel} • {t("reportsPerPdfPage").replace("{count}", String(PDF_ROWS_PER_PAGE))}
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={handleExportPdf}
							disabled={exporting || loading || total === 0}
							className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<FileDown className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
							{exporting ? t("exportingPdf") : t("exportPdf")}
						</button>

						<button
							type="button"
							onClick={fetchLogs}
							disabled={loading}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							{t("refresh")}
						</button>

						<button
							type="button"
							onClick={() => setShowDeleteModal(true)}
							disabled={deleting || total === 0}
							className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
						>
							<Trash2 className={`h-4 w-4 ${deleting ? "animate-pulse" : ""}`} />
							{t("deleteAll")}
						</button>
					</div>
				</div>
			</div>

			<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardContent className="p-4">
					<div
						dir={isRtl ? "rtl" : "ltr"}
						className="flex flex-wrap items-center gap-2"
						style={startFlex}
					>
						<div
							className={`flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500 ${isRtl ? "flex-row-reverse" : "flex-row"
								}`}
						>
							<Filter className="h-4 w-4" />
							<span>{t("filter")}</span>
						</div>

						{ENTITY_FILTERS.map((filter) => (
							<button
								key={filter.value}
								type="button"
								onClick={() => handleFilterChange(filter.value)}
								className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${entityFilter === filter.value
										? "bg-blue-600 text-white shadow-sm"
										: "bg-slate-100 text-slate-700 hover:bg-slate-200"
									}`}
							>
								{t(filter.labelKey)}
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			{error && (
				<Message
					type="error"
					icon={AlertCircle}
					text={error}
				/>
			)}

			{success && (
				<Message
					type="success"
					icon={CheckCircle}
					text={success}
				/>
			)}

			<Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardContent className="p-0">
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead className="border-b border-slate-200 bg-slate-50">
								<tr>
									<Th>{t("dateAndTime")}</Th>
									<Th>{t("action")}</Th>
									<Th>{t("description")}</Th>
									<Th>{t("user")}</Th>
									<Th>{t("role")}</Th>
									<Th>{t("entity")}</Th>
								</tr>
							</thead>

							<tbody className="divide-y divide-slate-100">
								{loading ? (
									<tr>
										<td colSpan={6} className="py-16 text-center text-slate-400">
											<RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
											{t("loadingActivityLogs")}
										</td>
									</tr>
								) : logs.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-16 text-center text-slate-400">
											<Activity className="mx-auto mb-2 h-12 w-12 text-slate-300" />
											<p className="font-semibold">{t("noActivityLogsFound")}</p>
											<p className="mt-1 text-sm">{t("activityLogsWillAppearHere")}</p>
										</td>
									</tr>
								) : (
									logs.map((log) => {
										const actionInfo = getActionInfo(log.action);
										const EntityIcon = ENTITY_ICONS[log.entity] || Activity;
										const roleKey = getRoleKey(log.userRole);

										return (
											<tr key={log.id} className="transition hover:bg-slate-50">
												<td className="whitespace-nowrap px-4 py-4 text-center align-middle text-sm text-slate-500">
													{formatActivityDate(log.createdAt, language)}
												</td>

												<td className="px-4 py-4 text-center align-middle">
													<span
														className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${actionInfo.color}`}
													>
														<EntityIcon className="h-3.5 w-3.5" />
														{t(actionInfo.labelKey)}
													</span>
												</td>

												<td className="max-w-md px-4 py-4 text-center align-middle text-sm text-slate-800">
													<ReportDescription text={log.description || "-"} isRtl={isRtl} />
												</td>

												<td className="px-4 py-4 text-center align-middle text-sm font-semibold text-slate-900">
													{log.userName || "-"}
												</td>

												<td className="px-4 py-4 text-center align-middle">
													<span className="inline-flex items-center justify-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
														<ShieldCheck className="h-3 w-3" />
														{roleKey ? t(roleKey) : "-"}
													</span>
												</td>

												<td className="px-4 py-4 text-center align-middle text-xs font-semibold text-slate-500">
													{getEntityLabel(log.entity, t)}
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<button
						type="button"
						onClick={() => goToPage(page - 1)}
						disabled={page === 1 || loading}
						className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronLeft className="h-4 w-4" />
					</button>

					<div className="flex items-center gap-1">
						{pages.map((item, index) => {
							const previous = pages[index - 1];
							const showDots = previous && item - previous > 1;

							return (
								<span key={item} className="flex items-center gap-1">
									{showDots && <span className="px-2 text-slate-400">...</span>}
									<button
										type="button"
										onClick={() => goToPage(item)}
										className={`min-w-[2rem] rounded-lg px-3 py-1 text-sm font-semibold ${page === item
												? "bg-blue-600 text-white"
												: "border border-slate-300 text-slate-700 hover:bg-slate-50"
											}`}
									>
										{item.toLocaleString(numberLocale)}
									</button>
								</span>
							);
						})}
					</div>

					<button
						type="button"
						onClick={() => goToPage(page + 1)}
						disabled={page === totalPages || loading}
						className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
					>
						<ChevronRight className="h-4 w-4" />
					</button>
				</div>
			)}
		</div>
	);
}

function Th({ children }) {
	return (
		<th className="px-4 py-3 text-center align-middle text-xs font-bold uppercase tracking-wide text-slate-500">
			{children}
		</th>
	);
}

function Message({ type, icon: Icon, text }) {
	const classes =
		type === "success"
			? "border-green-200 bg-green-50 text-green-800"
			: "border-red-200 bg-red-50 text-red-800";

	return (
		<div className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${classes}`}>
			<Icon className="h-5 w-5" />
			<span>{text}</span>
		</div>
	);
}

function DeleteAllModal({ open, deleting, onCancel, onConfirm, t }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
			<div className="w-full max-w-sm rounded-2xl bg-white p-6 text-right shadow-2xl" dir="rtl">
				<h3 className="text-lg font-bold text-slate-950">{t("deleteAllActivityLogs")}</h3>
				<p className="mt-2 text-sm leading-6 text-slate-500">
					{t("deleteAllActivityLogsConfirm")}
				</p>

				<div className="mt-6 flex justify-start gap-3">
					<button
						type="button"
						onClick={onConfirm}
						disabled={deleting}
						className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{deleting ? t("processing") : t("yesDelete")}
					</button>

					<button
						type="button"
						onClick={onCancel}
						disabled={deleting}
						className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
					>
						{t("cancel")}
					</button>
				</div>
			</div>
		</div>
	);
}