import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { useLanguage } from "../../i18n/LanguageContext";

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend
);

const chartFont = { family: "Inter, Vazirmatn, sans-serif" };

export default function DashboardCharts({
	weeklyLabels = [],
	weeklyCounts = [],
	chartTitle,
	statusCounts = {},
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const dispensed = Number(statusCounts.dispensed || 0);
	const rejected = Number(statusCounts.rejected || 0);
	const pending = Number(statusCounts.pending || 0);
	const verified = Number(statusCounts.verified || 0);
	const totalStatus = dispensed + rejected + pending + verified;

	const barData = {
		labels: weeklyLabels,
		datasets: [
			{
				label: t("prescriptions"),
				data: weeklyCounts,
				backgroundColor: "rgba(37, 99, 235, 0.78)",
				borderColor: "rgb(37, 99, 235)",
				borderWidth: 1,
				borderRadius: 10,
				maxBarThickness: 42,
			},
		],
	};

	const doughnutData = {
		labels: [t("pending"), t("verified"), t("dispensed"), t("rejected")],
		datasets: [
			{
				data: [pending, verified, dispensed, rejected],
				backgroundColor: [
					"rgba(245, 158, 11, 0.85)",
					"rgba(16, 185, 129, 0.85)",
					"rgba(37, 99, 235, 0.85)",
					"rgba(239, 68, 68, 0.85)",
				],
				borderColor: "#ffffff",
				borderWidth: 3,
				hoverOffset: 6,
			},
		],
	};

	const barOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: { display: false },
			tooltip: {
				rtl: isRtl,
				bodyFont: chartFont,
				titleFont: chartFont,
				backgroundColor: "rgba(15, 23, 42, 0.92)",
				padding: 12,
				cornerRadius: 10,
			},
		},
		scales: {
			x: {
				ticks: { font: chartFont, color: "#64748b" },
				grid: { display: false },
			},
			y: {
				beginAtZero: true,
				position: isRtl ? "right" : "left",
				ticks: {
					font: chartFont,
					stepSize: 1,
					precision: 0,
					color: "#64748b",
				},
				grid: { color: "rgba(148, 163, 184, 0.16)" },
				border: { display: false },
			},
		},
	};

	const doughnutOptions = {
		responsive: true,
		maintainAspectRatio: false,
		cutout: "68%",
		plugins: {
			legend: {
				position: "bottom",
				rtl: isRtl,
				labels: {
					font: chartFont,
					padding: 18,
					usePointStyle: true,
					boxWidth: 8,
					boxHeight: 8,
					color: "#475569",
				},
			},
			tooltip: {
				rtl: isRtl,
				bodyFont: chartFont,
				titleFont: chartFont,
				backgroundColor: "rgba(15, 23, 42, 0.92)",
				padding: 12,
				cornerRadius: 10,
			},
		},
	};

	return (
		<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
			<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
				<CardHeader className="border-b border-slate-100 px-5 py-4">
					<div className="flex items-center justify-between gap-4">
						<h3 className="text-lg font-bold text-slate-950">
							{chartTitle || t("weeklyPrescriptions")}
						</h3>
						<p className="text-sm font-semibold text-slate-500">
							{t("last7Days")}
						</p>
					</div>
				</CardHeader>
				<CardContent className="p-5">
					<div className="h-80">
						<Bar data={barData} options={barOptions} />
					</div>
				</CardContent>
			</Card>

			<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardHeader className="border-b border-slate-100 px-5 py-4">
					<div className="flex items-start justify-between gap-4">
						<div className="text-right">
							<h3 className="text-lg font-bold text-slate-950">
								{t("prescriptionStatus")}
							</h3>
							<p className="mt-1 text-xs text-slate-500">
								{t("statusBreakdown")}
							</p>
						</div>
						<p className="text-sm font-semibold text-blue-600">
							{totalStatus.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}
						</p>
					</div>
				</CardHeader>
				<CardContent className="p-5">
					<div className="h-80">
						{totalStatus > 0 ? (
							<Doughnut data={doughnutData} options={doughnutOptions} />
						) : (
							<div className="flex h-full items-center justify-center rounded-2xl bg-slate-50 text-sm font-medium text-slate-500">
								{t("noPrescriptionsYet")}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}