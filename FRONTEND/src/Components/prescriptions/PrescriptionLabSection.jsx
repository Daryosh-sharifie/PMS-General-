import { FlaskConical } from "lucide-react";
import LabInvestigationSelector from "./LabInvestigationSelector";
import { useLanguage } from "../../i18n/LanguageContext";

export default function PrescriptionLabSection({
	prescriptionForm,
	setPrescriptionForm,
	selectedPatient,
	labSelector,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	if (!selectedPatient) return null;

	return (
		<section
			dir={isRtl ? "rtl" : "ltr"}
			className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5"
		>
			<div className="mb-3 flex flex-col gap-3 border-b border-slate-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-start gap-3">
					<div className="rounded-xl bg-blue-50 p-2 text-blue-700">
						<FlaskConical className="h-5 w-5" />
					</div>
					<div>
						<h3 className="text-start text-sm font-bold text-slate-900">
							{t("labRequestsSection")}
						</h3>
						<p className="text-start text-xs leading-5 text-slate-500">
							{t("labRequestsSectionSubtitle")}
						</p>
					</div>
				</div>
			</div>

			<LabInvestigationSelector {...labSelector} />
		</section>
	);
}
