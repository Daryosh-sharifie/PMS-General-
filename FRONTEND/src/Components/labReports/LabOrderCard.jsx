import LabStatusBadge from "./LabStatusBadge";
import { formatAfghanDate } from "../../utils/afghanCalendar";
import { getLabOrderDisplayName, getLabOrderPatientLabel, getLabOrderPrescriptionLabel, getLabOrderDoctorLabel, getLabOrderTestCount } from "./labReportHelpers";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LabOrderCard({ order, onOpen }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	if (!order) return null;

	return (
		<div dir={isRtl ? "rtl" : "ltr"} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
			<div className="flex items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="text-sm font-bold text-slate-900">{getLabOrderDisplayName(order)}</p>
					<p className="text-xs text-slate-500">{getLabOrderPatientLabel(order)}</p>
				</div>
				<LabStatusBadge status={order.status} />
			</div>

			<div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-3">
				<Meta label={t("doctor")} value={getLabOrderDoctorLabel(order)} />
				<Meta label={t("prescription")} value={getLabOrderPrescriptionLabel(order)} />
				<Meta label={t("tests")} value={getLabOrderTestCount(order)} />
				<Meta label={t("requestedDate")} value={formatAfghanDate(order.createdAt, { englishDigits: !isRtl })} />
				<Meta label={t("updatedAt") || t("requestedDate")} value={formatAfghanDate(order.updatedAt || order.createdAt, { englishDigits: !isRtl })} />
			</div>

			<div className="mt-4 flex justify-end">
				<button
					type="button"
					onClick={() => onOpen?.(order.id)}
					className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
				>
					{t("open")}
				</button>
			</div>
		</div>
	);
}

function Meta({ label, value }) {
	return (
		<div className="rounded-xl bg-slate-50 p-2">
			<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-1 font-semibold text-slate-900">{value || "-"}</p>
		</div>
	);
}