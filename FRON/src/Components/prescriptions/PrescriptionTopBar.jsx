import { Save, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function PrescriptionTopBar({ onBack, title, subtitle }) {
	const { t } = useLanguage();

	return (
		<div className="mb-4 flex flex-col gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 print:hidden sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-center gap-3">
				<div className="rounded-xl bg-blue-50 p-2 text-blue-600">
					<Save className="h-5 w-5" />
				</div>

				<div>
					<h2 className="text-sm font-bold text-slate-900">
						{title || t("prescriptionForm")}
					</h2>
					<p className="text-xs text-slate-500">
						{subtitle || t("prescriptionFormSubtitle")}
					</p>
				</div>
			</div>

			<button
				type="button"
				onClick={onBack}
				className="self-end rounded-xl bg-slate-100 p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:self-auto"
				title={t("close")}
			>
				<X size={20} />
			</button>
		</div>
	);
}