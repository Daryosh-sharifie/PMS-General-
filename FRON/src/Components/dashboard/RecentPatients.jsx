import { Users, Eye, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { formatDate, displayPatientAge } from "../../utils/helpers";
import { useLanguage } from "../../i18n/LanguageContext";

export default function RecentPatients({
	patients = [],
	onViewPatient,
	onViewAll,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	return (
		<Card
			dir={isRtl ? "rtl" : "ltr"}
			className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
		>
			<DashboardCardHeader
				title={t("recentPatients")}
				subtitle={t("latestPatientRegistrations")}
				icon={Users}
				iconClass="bg-emerald-50 text-emerald-600"
				onViewAll={onViewAll}
				viewAllLabel={t("viewAll")}
				isRtl={isRtl}
			/>

			<CardContent className="p-5">
				{patients.length === 0 ? (
					<EmptyState
						icon={Users}
						title={t("noRecentPatients")}
						description={t("noRecentPatientsDescription")}
					/>
				) : (
					<div className="space-y-3">
						{patients.map((patient) => (
							<div
								key={patient.id}
								className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50/30 hover:shadow-sm"
							>
								<div className="flex items-center justify-between gap-4">
									<div className="min-w-0 flex-1">
										<div
											className={`flex items-center gap-3 ${
												isRtl ? "flex-row-reverse text-right" : "text-left"
											}`}
										>
											<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
												<Users className="h-5 w-5" />
											</div>

											<div className="min-w-0 flex-1">
												<p className="truncate text-base font-bold text-slate-950">
													{patient.fullname || patient.name || "-"}
												</p>

												<p className="mt-1 truncate text-sm text-slate-500">
													{t("id")}:{" "}
													<span className="ltr-value">{patient.id}</span>
													{patient.fathername
														? ` • ${t("fatherName")}: ${patient.fathername}`
														: ""}
												</p>
											</div>
										</div>

										<p
											className={`mt-2 text-xs font-medium text-slate-500 ${
												isRtl ? "text-right" : "text-left"
											}`}
										>
											{patient.age
												? `${t("age")}: ${displayPatientAge(
														patient.age,
														language
												  )} • `
												: ""}
											{formatDate(patient.createdAt || patient.lastVisit, language)}
										</p>
									</div>

									<ActionButton
										title={t("viewPatient")}
										onClick={() => onViewPatient?.(patient.id)}
									/>
								</div>
							</div>
						))}
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
			className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-emerald-600 hover:text-white"
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