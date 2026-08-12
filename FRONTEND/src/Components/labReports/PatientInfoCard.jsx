import { Card, CardHeader, CardContent } from "../ui/Card";
import { formatAfghanDate } from "../../utils/afghanCalendar";
import { useLanguage } from "../../i18n/LanguageContext";

export default function PatientInfoCard({ order }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	if (!order) return null;

	return (
		<Card>
			<CardHeader>
				<h3 className="text-lg font-semibold text-gray-900">{t("patientInformation")}</h3>
			</CardHeader>
			<CardContent className="grid gap-4 md:grid-cols-2">
				<Info label={t("patient")} value={order.patientName || order.patient?.fullname || "-"} />
				<Info label={t("father")} value={order.patientFathername || order.patient?.fathername || "-"} />
				<Info label={t("doctor")} value={order.doctorName || order.requestedBy?.name || "-"} />
				<Info label={t("labNumber")} value={order.labOrderNo || "-"} />
				<Info label={t("prescriptionNo")} value={order.prescriptionNo || order.prescription?.prescriptionNo || "-"} />
				<Info
					label={t("requestedDate")}
					value={formatAfghanDate(order.createdAt, { englishDigits: !isRtl })}
				/>
			</CardContent>
		</Card>
	);
}

function Info({ label, value }) {
	return (
		<div className="rounded-xl bg-slate-50 p-3">
			<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
		</div>
	);
}