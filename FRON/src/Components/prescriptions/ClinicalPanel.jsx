import { HeartPulse, Printer, Save, Type } from "lucide-react";
import { VITAL_SIGN_FIELDS } from "./prescriptionForm.constants";
import { useLanguage } from "../../i18n/LanguageContext";

const VITAL_TRANSLATION_KEYS = {
	bloodPressure: "bloodPressure",
	respiratoryRate: "respiratoryRate",
	pulseRate: "pulseRate",
	temperature: "temperature",
	heartRate: "heartRate",
	spo2: "spo2",
	clc: "clc",
};

export default function ClinicalPanel({
	prescriptionForm,
	setPrescriptionForm,
	selectedPatient,
	onPrint,
	onSave,
	saving = false,
	printFontBoost = 0,
	setPrintFontBoost = () => {},
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const updateField = (field, value) => {
		setPrescriptionForm({
			...prescriptionForm,
			[field]: value,
		});
	};

	if (!selectedPatient) {
		return (
			<aside className="rounded-2xl border border-dashed border-blue-100 bg-white p-6 shadow-sm">
				<div className="flex min-h-[240px] items-center justify-center text-center">
					<div className="max-w-sm space-y-2">
						<p className="text-base font-semibold text-slate-800">
							{t("selectPatientFirstToBegin")}
						</p>
						<p className="text-sm text-slate-500">
							{t("clinicalPanelAppearsAfterPatient")}
						</p>
					</div>
				</div>
			</aside>
		);
	}

	return (
		<aside
			dir={isRtl ? "rtl" : "ltr"}
			className="flex h-full w-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5"
		>
			<div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
				<div>
					<p className="text-sm font-bold text-blue-700">
						{t("clinicalPanel")}
					</p>
					<p className="text-xs leading-5 text-slate-500">
						{t("clinicalPanelSubtitle")}
					</p>
				</div>

				<span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
					{t("patientSelected")}
				</span>
			</div>

			<div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
				<section className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
					<div className="mb-3 flex items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<span className="rounded-lg bg-white p-1.5 text-blue-700 shadow-sm">
								<HeartPulse className="h-4 w-4" />
							</span>
							<div>
								<h3 className="text-xs font-bold text-slate-800">
									{t("vitalsForThisVisit")}
								</h3>
								<p className="text-[10px] text-slate-500">
									{t("vitalsForThisVisitSubtitle")}
								</p>
							</div>
						</div>
						<span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-blue-700">
							{t("vitalSigns")}
						</span>
					</div>

					<div className="grid grid-cols-2 gap-2" dir="ltr">
						{VITAL_SIGN_FIELDS.map((field) => (
							<div key={field.key}>
								<label className="mb-1 block text-left text-[10px] font-semibold text-slate-500">
									{t(VITAL_TRANSLATION_KEYS[field.key] || field.key)}
								</label>
								<input
									type="text"
									className="w-full rounded-lg border border-blue-100 bg-white p-2 text-left text-xs outline-none transition focus:border-blue-400"
									placeholder={field.placeholder || ""}
									value={prescriptionForm[field.key] || ""}
									onChange={(event) => updateField(field.key, event.target.value)}
								/>
							</div>
						))}
					</div>
				</section>

				<Field
					label={t("clc")}
					value={prescriptionForm.clc || ""}
					onChange={(value) => updateField("clc", value)}
				/>

				<Field
					label={t("pastHistory")}
					value={prescriptionForm.pastHistory || ""}
					onChange={(value) => updateField("pastHistory", value)}
				/>

				<Field
					label={t("investigation")}
					value={prescriptionForm.investigation || ""}
					onChange={(value) => updateField("investigation", value)}
				/>

				<Field
					label={t("impression")}
					value={prescriptionForm.impression || ""}
					onChange={(value) => updateField("impression", value)}
				/>
			</div>

			<div className="mt-6 shrink-0 flex flex-col gap-3 print:hidden sm:flex-row sm:justify-center">
				<div className="relative">
					<Type className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
					<select
						value={printFontBoost}
						onChange={(event) => setPrintFontBoost(Number(event.target.value))}
						className={`appearance-none rounded-xl border py-2 pl-9 pr-8 text-xs font-semibold outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
							printFontBoost > 0
								? "border-blue-300 bg-blue-50 text-blue-700"
								: "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
						}`}
						aria-label={t("font")}
					>
						<option value={0}>{t("font")}</option>
						{[1, 2, 3, 4, 5].map((size) => (
							<option key={size} value={size}>
								{size}px
							</option>
						))}
					</select>
				</div>

				<button
					type="button"
					onClick={onPrint}
					className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
				>
					<Printer className="h-4 w-4" />
					{t("print")}
				</button>

				<button
					type="button"
					onClick={onSave}
					disabled={saving}
					className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
				>
					<Save className="h-4 w-4" />
					{saving ? t("saving") : t("save")}
				</button>
			</div>
		</aside>
	);
}

function Field({ label, value, onChange }) {
	return (
		<div>
			<label className="mb-1 block text-xs font-semibold text-slate-700">
				{label}
			</label>
			<textarea
				className="h-16 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
}
