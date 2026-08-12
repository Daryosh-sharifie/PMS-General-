import {
	Users,
	FileText,
	Syringe,
	PackageCheck,
	XCircle,
	Filter,
	Loader2,
	FlaskConical,
	Activity,
	ChevronDown,
	Check,
} from "lucide-react";
import StatCard from "./StatCard";
import RecentPrescriptions from "./RecentPrescriptions";
import RecentPatients from "./RecentPatients";
import RecentLabReports from "./RecentLabReports";
import DashboardCharts from "./DashboardCharts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { prescriptionApi } from "../../api/prescriptionApi";
import { patientApi } from "../../api/patientApi";
import medicineApi from "../../api/medicineApi";
import { labOrderApi } from "../../api/labOrderApi";
import { useLanguage } from "../../i18n/LanguageContext";
import LanguageSwitcher from "../layout/LanguageSwitcher";

const PERIOD_FILTERS = [
	{ value: "today", labelKey: "today" },
	{ value: "week", labelKey: "thisWeek" },
	{ value: "month", labelKey: "thisMonth" },
	{ value: "all", labelKey: "all" },
];

function toDateKey(date) {
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return "";

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function getWeekStartSaturday(date = new Date()) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);

	const daysSinceSaturday = (d.getDay() + 1) % 7;
	d.setDate(d.getDate() - daysSinceSaturday);

	return d;
}

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
		const start = getWeekStartSaturday(now);
		return { startDate: start.toISOString(), endDate: end.toISOString() };
	}

	if (period === "month") {
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		start.setHours(0, 0, 0, 0);
		return { startDate: start.toISOString(), endDate: end.toISOString() };
	}

	return { startDate: null, endDate: null };
}

function getWeekdayLabels(language) {
	return language === "fa"
		? ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"]
		: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
}

function getChartTitle(period, t) {
	if (period === "today") return t("todayPrescriptions");
	if (period === "month") return t("monthlyPrescriptions");
	if (period === "all") return t("currentWeekPrescriptions");
	return t("weeklyPrescriptions");
}

function buildWeeklyStats(prescriptions, language, t) {
	const labels = getWeekdayLabels(language);
	const weekStart = getWeekStartSaturday();
	const days = [];

	for (let index = 0; index < 7; index += 1) {
		const date = new Date(weekStart);
		date.setDate(weekStart.getDate() + index);

		days.push({
			key: toDateKey(date),
			label: labels[index],
			count: 0,
		});
	}

	prescriptions.forEach((prescription) => {
		const key = toDateKey(prescription.date || prescription.createdAt);
		const day = days.find((item) => item.key === key);
		if (day) day.count += 1;
	});

	const displayDays = language === "fa" ? [...days].reverse() : days;

	return {
		labels: displayDays.map((day) => day.label),
		counts: displayDays.map((day) => day.count),
		title: t("weeklyPrescriptions"),
	};
}

function buildMonthlyStats(prescriptions, language, t) {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const days = Array.from({ length: daysInMonth }, (_, index) => {
		const date = new Date(year, month, index + 1);

		return {
			key: toDateKey(date),
			label: String(index + 1),
			count: 0,
		};
	});

	prescriptions.forEach((prescription) => {
		const key = toDateKey(prescription.date || prescription.createdAt);
		const day = days.find((item) => item.key === key);
		if (day) day.count += 1;
	});

	const displayDays = language === "fa" ? [...days].reverse() : days;

	return {
		labels: displayDays.map((day) => day.label),
		counts: displayDays.map((day) => day.count),
		title: t("monthlyPrescriptions"),
	};
}

function buildChartStats(prescriptions, period, language, t) {
	if (period === "today") {
		return {
			labels: [t("today")],
			counts: [prescriptions.length],
			title: t("todayPrescriptions"),
		};
	}

	if (period === "month") {
		return buildMonthlyStats(prescriptions, language, t);
	}

	return {
		...buildWeeklyStats(prescriptions, language, t),
		title: getChartTitle(period, t),
	};
}

function extractList(response, keys = []) {
	for (const key of keys) {
		const value = key.split(".").reduce((acc, part) => acc?.[part], response);
		if (Array.isArray(value)) return value;
	}

	if (Array.isArray(response)) return response;
	if (Array.isArray(response?.data)) return response.data;

	return [];
}

function extractTotal(response, fallbackList = []) {
	return (
		response?.pagination?.totalRecords ??
		response?.pagination?.total ??
		response?.data?.pagination?.totalRecords ??
		response?.data?.pagination?.total ??
		response?.totalCount ??
		response?.totalRecords ??
		response?.data?.totalCount ??
		response?.data?.totalRecords ??
		fallbackList.length ??
		0
	);
}

function getStatusCounts(prescriptions) {
	return prescriptions.reduce(
		(acc, prescription) => {
			const status = String(prescription.status || "").toLowerCase();
			if (status === "pending") acc.pending += 1;
			if (status === "verified") acc.verified += 1;
			if (status === "dispensed") acc.dispensed += 1;
			if (status === "rejected") acc.rejected += 1;
			return acc;
		},
		{ pending: 0, verified: 0, dispensed: 0, rejected: 0 }
	);
}

export default function Dashboard({
	onViewPrescription,
	onViewPatient,
	onViewLabReport,
	onNavigate,
	currentUser,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const navigate = useNavigate();

	const goToModule = useCallback(
		(module, extra) => {
			if (onNavigate) {
				onNavigate(module, extra);
				return;
			}

			const routeMap = {
				dashboard: "/dashboard",
				patients: "/patients",
				prescriptions: "/prescriptions",
				medicines: "/medicines",
				labReports: "/lab-reports",
			};

			let target = routeMap[module] || "/dashboard";
			if (extra && typeof extra === "object") {
				const search = new URLSearchParams(extra).toString();
				if (search) target += `?${search}`;
			}

			navigate(target);
		},
		[navigate, onNavigate]
	);

	const viewLabReport = useCallback(
		(id) => {
			if (!id) return;

			if (onViewLabReport) {
				onViewLabReport(id);
				return;
			}

			navigate(`/lab-reports/${id}`);
		},
		[navigate, onViewLabReport]
	);

	const [periodFilter, setPeriodFilter] = useState("all");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const filterRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (filterRef.current && !filterRef.current.contains(event.target)) {
				setIsFilterOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [recentPrescriptions, setRecentPrescriptions] = useState([]);
	const [recentPatients, setRecentPatients] = useState([]);
	const [recentLabReports, setRecentLabReports] = useState([]);

	const [stats, setStats] = useState({
		totalPatients: 0,
		totalPrescriptions: 0,
		totalMedicines: 0,
		totalLabReports: 0,
		dispensed: 0,
		rejected: 0,
	});

	const [chartData, setChartData] = useState({
		weeklyLabels: [],
		weeklyCounts: [],
		chartTitle: "",
		statusCounts: { pending: 0, verified: 0, dispensed: 0, rejected: 0 },
	});

	const dateRange = useMemo(() => getDateRange(periodFilter), [periodFilter]);

	const formatValue = useCallback(
		(value) => Number(value || 0).toLocaleString(language === "fa" ? "fa-IR" : "en-US"),
		[language]
	);

	const periodTrend = useMemo(() => {
		const map = {
			today: t("registeredToday"),
			week: t("registeredThisWeek"),
			month: t("registeredThisMonth"),
			all: t("registeredInSystem"),
		};

		return map[periodFilter] || map.all;
	}, [periodFilter, t]);

	const loadDashboardData = useCallback(async () => {
		setLoading(true);
		setError("");

		const filters = {};
		if (dateRange.startDate) filters.startDate = dateRange.startDate;
		if (dateRange.endDate) filters.endDate = dateRange.endDate;

		try {
			const [
				patientsResponse,
				prescriptionsResponse,
				medicinesResponse,
				labOrdersResponse,
				chartPrescriptionsResponse,
				recentPrescriptionsResponse,
				recentPatientsResponse,
				recentLabReportsResponse,
			] = await Promise.all([
				patientApi.getAllPatients(1, 1, filters),
				prescriptionApi.getAllPrescriptions(1, 1, filters),
				medicineApi.getAllMedicines(1, 1, "", "", filters),
				labOrderApi.getAllLabOrders
					? labOrderApi.getAllLabOrders(1, 1, filters)
					: Promise.resolve({ data: [] }),
				prescriptionApi.getAllPrescriptions(1, 500, filters),
				prescriptionApi.getAllPrescriptions(1, 8, filters),
				patientApi.getAllPatients(1, 8, filters),
				labOrderApi.getAllLabOrders
					? labOrderApi.getAllLabOrders(1, 8, filters)
					: Promise.resolve({ data: [] }),
			]);

			const chartPrescriptions = extractList(chartPrescriptionsResponse, [
				"data.prescriptions",
				"prescriptions",
			]);

			const recentPrescriptionList = extractList(recentPrescriptionsResponse, [
				"data.prescriptions",
				"prescriptions",
			]);

			const recentPatientList = extractList(recentPatientsResponse, [
				"data.patients",
				"patients",
			]);

			const recentLabList = extractList(recentLabReportsResponse, [
				"data.orders",
				"data.labOrders",
				"data",
				"orders",
				"labOrders",
			]);

			const statusCounts = getStatusCounts(chartPrescriptions);
			const chart = buildChartStats(chartPrescriptions, periodFilter, language, t);

			setStats({
				totalPatients: extractTotal(patientsResponse),
				totalPrescriptions: extractTotal(prescriptionsResponse),
				totalMedicines: extractTotal(medicinesResponse),
				totalLabReports: extractTotal(labOrdersResponse),
				dispensed: statusCounts.dispensed,
				rejected: statusCounts.rejected,
			});

			setChartData({
				weeklyLabels: chart.labels,
				weeklyCounts: chart.counts,
				chartTitle: chart.title,
				statusCounts,
			});

			setRecentPrescriptions(recentPrescriptionList);
			setRecentPatients(recentPatientList);
			setRecentLabReports(recentLabList);
		} catch (err) {
			console.error("Failed to fetch dashboard data:", err);
			setError(err.message || t("failedToLoadDashboard"));
		} finally {
			setLoading(false);
		}
	}, [dateRange.startDate, dateRange.endDate, language, periodFilter, t]);

	useEffect(() => {
		loadDashboardData();
	}, [loadDashboardData]);

	return (
		<div className="space-y-5 p-3 text-right sm:p-6">
			<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
					<div className="text-right">
						<div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
							<Activity className="h-3.5 w-3.5" />
							{t("liveOverview")}
						</div>

						<h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
							{t("dashboard")}
						</h2>

						<p className="mt-1 text-xs text-slate-500 sm:text-sm">
							{currentUser?.name
								? `${t("welcomeBack")}, ${currentUser.name}`
								: t("dashboardSubtitle")}
						</p>
					</div>
					
					<div className="flex items-center gap-2">
						<LanguageSwitcher />

						<div className="relative shrink-0" ref={filterRef}>
							<button
								type="button"
								onClick={() => setIsFilterOpen((prev) => !prev)}
								className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:px-4 sm:text-sm"
							>
								<Filter className="h-4 w-4 text-blue-600" />
								<span>
									{t(
										(PERIOD_FILTERS.find((f) => f.value === periodFilter) || PERIOD_FILTERS[0]).labelKey
									)}
								</span>
								<ChevronDown
									className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
										isFilterOpen ? "rotate-180" : ""
									}`}
								/>
							</button>

							{isFilterOpen && (
								<div
									className={`absolute top-full z-30 mt-2 w-44 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 ${
										isRtl ? "left-0" : "right-0"
									}`}
								>
									{PERIOD_FILTERS.map((filter) => {
										const isSelected = periodFilter === filter.value;
										return (
											<button
												key={filter.value}
												type="button"
												onClick={() => {
													setPeriodFilter(filter.value);
													setIsFilterOpen(false);
												}}
												className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
													isSelected
														? "bg-blue-50 text-blue-700 font-bold"
														: "text-slate-700 hover:bg-slate-50"
												}`}
											>
												<span>{t(filter.labelKey)}</span>
												{isSelected && <Check className="h-4 w-4 text-blue-600" />}
											</button>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{error && (
				<div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
					{error}
				</div>
			)}

			{loading && (
				<div className="flex items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-semibold text-slate-500 shadow-sm">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>{t("loadingDashboard")}</span>
				</div>
			)}

			<div
				className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-6 ${
					loading ? "pointer-events-none opacity-50" : ""
				}`}
			>
				<StatCard
					icon={Users}
					title={t("patients")}
					value={formatValue(stats.totalPatients)}
					trend={periodTrend}
					iconColor="text-blue-600"
					accent="bg-blue-50"
					onClick={() => goToModule("patients")}
				/>

				<StatCard
					icon={FileText}
					title={t("prescriptions")}
					value={formatValue(stats.totalPrescriptions)}
					trend={periodTrend}
					iconColor="text-emerald-600"
					accent="bg-emerald-50"
					onClick={() => goToModule("prescriptions")}
				/>

				<StatCard
					icon={FlaskConical}
					title={t("labReports")}
					value={formatValue(stats.totalLabReports)}
					trend={periodTrend}
					iconColor="text-indigo-600"
					accent="bg-indigo-50"
					onClick={() => goToModule("labReports")}
				/>

				<StatCard
					icon={Syringe}
					title={periodFilter === "all" ? t("totalMedicines") : t("newMedicines")}
					value={formatValue(stats.totalMedicines)}
					trend={periodFilter === "all" ? t("medicineInventory") : periodTrend}
					iconColor="text-purple-600"
					accent="bg-purple-50"
					onClick={() => goToModule("medicines")}
				/>

				<StatCard
					icon={PackageCheck}
					title={t("dispensed")}
					value={formatValue(stats.dispensed)}
					trend={periodTrend}
					iconColor="text-sky-600"
					accent="bg-sky-50"
					onClick={() => goToModule("prescriptions", { status: "dispensed" })}
				/>

				<StatCard
					icon={XCircle}
					title={t("rejected")}
					value={formatValue(stats.rejected)}
					trend={periodTrend}
					iconColor="text-red-600"
					accent="bg-red-50"
					onClick={() => goToModule("prescriptions", { status: "rejected" })}
				/>
			</div>

			<div className={loading ? "pointer-events-none opacity-50" : ""}>
				<DashboardCharts
					weeklyLabels={chartData.weeklyLabels}
					weeklyCounts={chartData.weeklyCounts}
					chartTitle={chartData.chartTitle}
					statusCounts={chartData.statusCounts}
				/>
			</div>

			<div
				className={`grid grid-cols-1 items-start gap-6 xl:grid-cols-3 ${
					loading ? "pointer-events-none opacity-50" : ""
				}`}
			>
				<RecentPrescriptions
					prescriptions={recentPrescriptions}
					onViewPrescription={onViewPrescription}
					onViewAll={() => onNavigate?.("prescriptions")}
				/>

				<RecentLabReports
					labReports={recentLabReports}
					onViewLabReport={viewLabReport}
					onViewAll={() => goToModule("labReports")}
				/>

				<RecentPatients
					patients={recentPatients}
					onViewPatient={onViewPatient}
					onViewAll={() => onNavigate?.("patients")}
				/>
			</div>
		</div>
	);
}