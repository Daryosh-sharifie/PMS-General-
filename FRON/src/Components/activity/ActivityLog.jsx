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

const LIMIT = 30;

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

async function downloadLogsAsPdf({ logs, t, language, filterLabel, total }) {
	if (!logs.length) {
		throw new Error(t("noActivityLogsFound"));
	}

	const isRtl = language === "fa";
	const textAlign = isRtl ? "right" : "left";
	const centerAlign = "center";

	const headerCell = (label) =>
		`<th style="background:#f1f5f9;border:1px solid #cbd5e1;padding:7px 5px;font-weight:800;color:#334155;text-align:${centerAlign};font-size:11px;">${escapeHtml(label)}</th>`;

	const bodyCell = (value, extra = "") =>
		`<td style="border:1px solid #e2e8f0;padding:6px 5px;text-align:${centerAlign};vertical-align:top;font-size:11px;word-break:break-word;${extra}">${escapeHtml(value)}</td>`;

	const rows = logs
		.map((log, index) => {
			const actionInfo = getActionInfo(log.action);
			const roleKey = getRoleKey(log.userRole);

			return `
				<tr>
					${bodyCell(String(index + 1), "font-weight:700;")}
					${bodyCell(formatActivityDate(log.createdAt, language))}
					${bodyCell(t(actionInfo.labelKey))}
					${bodyCell(log.description || "-", `text-align:${textAlign};max-width:280px;`)}
					${bodyCell(log.userName || "-")}
					${bodyCell(roleKey ? t(roleKey) : "-")}
					${bodyCell(getEntityLabel(log.entity, t))}
				</tr>
			`;
		})
		.join("");

	const generatedAt = formatActivityDate(new Date().toISOString(), language);
	const dateStamp = new Date().toISOString().slice(0, 10);

	const wrapper = document.createElement("div");
	wrapper.setAttribute("dir", isRtl ? "rtl" : "ltr");
	wrapper.setAttribute("data-pdf-export", "true");
	Object.assign(wrapper.style, {
		position: "fixed",
		left: "0",
		top: "0",
		width: "1100px",
		background: "#ffffff",
		color: "#1e293b",
		padding: "16px",
		zIndex: "999999",
		fontFamily: "'Vazirmatn', Arial, Helvetica, sans-serif",
	});

	wrapper.innerHTML = `
		<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:14px;">
			<div style="font-size:22px;font-weight:900;color:#1e293b;">${escapeHtml(t("activityLogs"))}</div>
			<div style="font-size:11px;color:#475569;line-height:1.7;text-align:${isRtl ? "left" : "right"};">
				${escapeHtml(t("total"))}: ${escapeHtml(String(total))} ${escapeHtml(t("eventsRecorded"))}<br />
				${escapeHtml(t("filter"))}: ${escapeHtml(filterLabel)}<br />
				${escapeHtml(generatedAt)}
			</div>
		</div>
		<table style="width:100%;border-collapse:collapse;color:#1e293b;">
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
	`;

	document.body.appendChild(wrapper);

	try {
		if (document.fonts?.ready) {
			await document.fonts.ready;
		}

		await new Promise((resolve) => setTimeout(resolve, 150));

		const canvas = await html2canvas(wrapper, {
			scale: 2,
			useCORS: true,
			backgroundColor: "#ffffff",
			logging: false,
			width: wrapper.scrollWidth,
			height: wrapper.scrollHeight,
			windowWidth: wrapper.scrollWidth,
			windowHeight: wrapper.scrollHeight,
		});

		if (!canvas.width || !canvas.height) {
			throw new Error("Failed to render PDF content");
		}

		const pdf = new jsPDF({
			orientation: "landscape",
			unit: "mm",
			format: "a4",
		});

		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const margin = 8;
		const contentWidth = pageWidth - margin * 2;
		const contentHeight = pageHeight - margin * 2;
		const imgWidth = contentWidth;
		const imgHeight = (canvas.height * imgWidth) / canvas.width;

		let heightLeft = imgHeight;
		let position = margin;
		const imgData = canvas.toDataURL("image/jpeg", 0.95);

		pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
		heightLeft -= contentHeight;

		while (heightLeft > 0) {
			position = margin - (imgHeight - heightLeft);
			pdf.addPage();
			pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
			heightLeft -= contentHeight;
		}

		pdf.save(`reports-${dateStamp}.pdf`);
	} finally {
		document.body.removeChild(wrapper);
	}
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

			const filters = {};
			if (entityFilter) filters.entity = entityFilter;

			const result = await activityApi.getLogs(1, 1000, filters);
			const normalized = extractLogsResponse(result);
			const exportLogs = normalized.logs.length ? normalized.logs : logs;

			await downloadLogsAsPdf({
				logs: exportLogs,
				t,
				language,
				filterLabel: currentFilterLabel,
				total: exportLogs.length,
			});
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

			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<div className="flex items-center justify-end gap-3 text-right">
						<div>
							<h2 className="flex items-center justify-end gap-3 text-3xl font-bold text-slate-950">
								{t("activityLogs")}
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
									<Clock className="h-6 w-6" />
								</div>
							</h2>
							<p className="mt-1 text-sm text-slate-500">
								{t("total")}: {total.toLocaleString(numberLocale)}{" "}
								{t("eventsRecorded")} • {t("filter")}: {currentFilterLabel}
							</p>
						</div>

						
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={handleExportPdf}
							disabled={exporting || loading || total === 0}
							className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<FileDown className={`h-4 w-4 ${exporting ? "animate-pulse" : ""}`} />
							{t("exportPdf")}
						</button>

						<button
							type="button"
							onClick={fetchLogs}
							disabled={loading}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							{t("refresh")}
						</button>

						<button
							type="button"
							onClick={() => setShowDeleteModal(true)}
							disabled={deleting || total === 0}
							className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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
							className={`flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500 ${
								isRtl ? "flex-row-reverse" : "flex-row"
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
								className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
									entityFilter === filter.value
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
									<Th align="right">{t("dateAndTime")}</Th>
									<Th>{t("action")}</Th>
									<Th align="right">{t("description")}</Th>
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
												<td className="whitespace-nowrap px-4 py-4 text-right text-sm text-slate-500">
													{formatActivityDate(log.createdAt, language)}
												</td>

												<td className="px-4 py-4 text-center">
													<span
														className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${actionInfo.color}`}
													>
														<EntityIcon className="h-3.5 w-3.5" />
														{t(actionInfo.labelKey)}
													</span>
												</td>

												<td className="max-w-md px-4 py-4 text-right text-sm text-slate-800">
													{log.description || "-"}
												</td>

												<td className="px-4 py-4 text-center text-sm font-semibold text-slate-900">
													{log.userName || "-"}
												</td>

												<td className="px-4 py-4 text-center">
													<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
														<ShieldCheck className="h-3 w-3" />
														{roleKey ? t(roleKey) : "-"}
													</span>
												</td>

												<td className="px-4 py-4 text-center text-xs font-semibold text-slate-500">
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
										className={`min-w-[2rem] rounded-lg px-3 py-1 text-sm font-semibold ${
											page === item
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

function Th({ children, align = "center" }) {
	return (
		<th
			className={`px-4 py-3 text-${align} text-xs font-bold uppercase tracking-wide text-slate-500`}
		>
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