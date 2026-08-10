import { Eye, FlaskConical, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { formatDate } from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";
import LabStatusBadge from "../labReports/LabStatusBadge";

export default function RecentLabReports({
	labReports = [],
	onViewLabReport,
	onViewAll,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const handleViewReport = (report) => {
		const id = report?.id;
		if (!id) return;
		onViewLabReport?.(id, report);
	};

	return (
		<Card
			dir={isRtl ? "rtl" : "ltr"}
			className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
		>
			<DashboardCardHeader
				title={t("recentLabReports")}
				subtitle={t("latestLabActivity")}
				icon={FlaskConical}
				iconClass="bg-indigo-50 text-indigo-600"
				onViewAll={onViewAll}
				viewAllLabel={t("viewAll")}
				isRtl={isRtl}
			/>

			<CardContent className="p-5">
				{labReports.length === 0 ? (
					<EmptyState
						icon={FlaskConical}
						title={t("noRecentLabReports")}
						description={t("noRecentLabReportsDescription")}
					/>
				) : (
					<div className="space-y-3">
						{labReports.map((report) => {
							const patientName =
								report.patient?.fullname ||
								report.patientName ||
								report.patient?.name ||
								"-";

							const testsCount = Array.isArray(report.items)
								? report.items.length
								: Array.isArray(report.labOrderItems)
								? report.labOrderItems.length
								: 0;

							return (
								<div
									key={report.id}
									className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-sm"
								>
									<div className="flex items-center justify-between gap-4">
										<div className="min-w-0 flex-1">
											<div
												className={`flex items-center gap-3 ${
													isRtl ? "flex-row-reverse text-right" : "text-left"
												}`}
											>
												<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
													<FlaskConical className="h-5 w-5" />
												</div>

												<div className="min-w-0 flex-1">
													<p className="truncate text-base font-bold text-slate-950">
														{patientName}
													</p>

													<p className="mt-1 truncate text-sm text-slate-500">
														<span className="ltr-value">
															{report.labOrderNo || report.id}
														</span>
														<span> • </span>
														{formatDate(
															report.createdAt || report.updatedAt,
															language
														)}
													</p>
												</div>
											</div>

											<p
												className={`mt-2 text-xs font-medium text-slate-500 ${
													isRtl ? "text-right" : "text-left"
												}`}
											>
												{t("testsCount")}:{" "}
												{Number(testsCount).toLocaleString(
													isRtl ? "fa-IR" : "en-US"
												)}
											</p>
										</div>

										<div
											className={`flex shrink-0 items-center gap-2 ${
												isRtl ? "flex-row-reverse" : ""
											}`}
										>
											<LabStatusBadge status={report.status} />

											<ActionButton
												title={t("viewReport")}
												onClick={() => handleViewReport(report)}
											/>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function DashboardCardHeader({
	title,
	subtitle,
	icon: Icon,
	iconClass,
	onViewAll,
	viewAllLabel,
	isRtl,
}) {
	const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

	return (
		<CardHeader className="border-b border-slate-100 px-5 py-4">
			<div className="flex items-center justify-between gap-4">
				<div
					className={`flex min-w-0 items-center gap-3 ${
						isRtl ? "flex-row-reverse text-right" : "text-left"
					}`}
				>
					<div
						className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
					>
						<Icon className="h-5 w-5" />
					</div>

					<div className="min-w-0">
						<h3 className="truncate text-lg font-bold text-slate-950">
							{title}
						</h3>
						<p className="mt-1 truncate text-xs text-slate-500">{subtitle}</p>
					</div>
				</div>

				{onViewAll && (
					<button
						type="button"
						onClick={onViewAll}
						className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50 hover:text-blue-700 ${
							isRtl ? "flex-row-reverse" : ""
						}`}
					>
						{viewAllLabel}
						<ArrowIcon className="h-4 w-4" />
					</button>
				)}
			</div>
		</CardHeader>
	);
}

function ActionButton({ title, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-indigo-600 hover:text-white"
		>
			<Eye className="h-4 w-4" />
		</button>
	);
}

function EmptyState({ icon: Icon, title, description }) {
	return (
		<div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center">
			<div className="mb-3 rounded-2xl bg-white p-3 text-slate-400 shadow-sm">
				<Icon className="h-6 w-6" />
			</div>
			<p className="font-bold text-slate-700">{title}</p>
			<p className="mt-1 max-w-xs text-sm text-slate-500">{description}</p>
		</div>
	);
}