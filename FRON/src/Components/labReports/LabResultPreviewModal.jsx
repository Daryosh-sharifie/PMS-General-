import LabReportPrintView from "./LabReportPrintView";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LabResultPreviewModal({ open, order, onClose }) {
	const { t } = useLanguage();

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 print:hidden">
			<div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							{t("close")}
						</button>
					</div>

					<div className="text-right">
						<h2 className="text-lg font-bold text-slate-900">
							{t("labReportPreview")}
						</h2>
						<p className="text-xs text-slate-500">
							{t("compactPrintableReportView")}
						</p>
					</div>
				</div>

				<div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
					<div className="mx-auto rounded-xl bg-white p-4 shadow-sm">
						<LabReportPrintView order={order} mode="screen" />
					</div>
				</div>
			</div>
		</div>
	);
}