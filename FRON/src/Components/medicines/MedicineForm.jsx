import { useMemo, useState } from "react";
import { Save, X, Pill } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { buttonPrimary, buttonSecondary } from "../../constants/styles";
import { useLanguage } from "../../i18n/LanguageContext";

const MEDICINE_TYPES = [
	"Tablet",
	"Capsule",
	"Syrup",
	"Injection",
	"Drops",
	"Ointment",
	"Paste",
	"Vial",
	"Suppository",
	"Inhaler",
	"Infusion",
	"Solution",
	"Serum",
	"Powder",
	"Granules",
	"Lozenge",
	"Spray",
	"Patch",
	"Other",
];

const FREQUENCY_OPTIONS = [
	"1x1",
	"1x2",
	"1x3",
	"1x4",
	"2x1",
	"2x2",
	"2x3",
	"3x1",
	"3x2",
	"3x3",
	"SOS",
	"PRN",
	"Q4H",
	"Q6H",
	"Q8H",
	"Q12H",
	"Q16H",
	"Q24H",
];

const EMPTY_FORM = {
	type: "",
	companyName: "",
	genericName: "",
	dosage: "",
	frequency: "",
	mealTiming: "",
};

const fieldClass =
	"w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50";

export default function MedicineForm({ onCancel, onSubmit, initialData, loading: parentLoading = false }) {
	const { t } = useLanguage();

	const [formData, setFormData] = useState({
		...EMPTY_FORM,
		...initialData,
	});

	const [errors, setErrors] = useState({});
	const [localLoading, setLocalLoading] = useState(false);

	const loading = parentLoading || localLoading;
	const isEdit = Boolean(initialData?.id);

	const mealTimingOptions = useMemo(
		() => [
			{ value: "Before Food", label: t("beforeFood") },
			{ value: "After Food", label: t("afterFood") },
			{ value: "With Food", label: t("withFood") },
			{ value: "Anytime", label: t("anytime") },
		],
		[t]
	);

	const fields = [
		{
			name: "type",
			label: t("medicineType"),
			type: "select",
			required: true,
			options: MEDICINE_TYPES.map((value) => ({ value, label: value })),
		},
		{
			name: "companyName",
			label: t("companyName"),
			type: "text",
			placeholder: t("companyNamePlaceholder"),
		},
		{
			name: "genericName",
			label: t("genericName"),
			type: "text",
			required: true,
			placeholder: t("genericNamePlaceholder"),
		},
		{
			name: "dosage",
			label: t("dosage"),
			type: "text",
			required: true,
			placeholder: "500mg, 30ml",
		},
		{
			name: "frequency",
			label: t("frequency"),
			type: "select",
			required: true,
			options: FREQUENCY_OPTIONS.map((value) => ({ value, label: value })),
		},
		{
			name: "mealTiming",
			label: t("mealTiming"),
			type: "select",
			required: true,
			options: mealTimingOptions,
		},
	];

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
	};

	const validateForm = () => {
		const nextErrors = {};

		fields.forEach((field) => {
			if (field.required && !String(formData[field.name] || "").trim()) {
				nextErrors[field.name] = t("fieldRequired");
			}
		});

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			setLocalLoading(true);
			await onSubmit(formData);
		} finally {
			setLocalLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 px-4 py-8">
			<Card className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
				<CardContent className="p-0">
					<form onSubmit={handleSubmit} className="space-y-8 p-6 md:p-8" dir="rtl">
						<div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
									<Pill className="h-6 w-6" />
								</div>
								<div>
									<h2 className="text-2xl font-bold text-slate-900">
										{isEdit ? t("editMedicine") : t("addNewMedicine")}
									</h2>
									<p className="mt-1 text-sm text-slate-500">
										{t("medicineFormSubtitle")}
									</p>
								</div>
							</div>

							<span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
								{isEdit ? t("editMode") : t("newRecord")}
							</span>
						</div>

						<div className="grid gap-6 lg:grid-cols-2">
							<Section title={t("medicineInformation")} description={t("medicineInformationHint")}>
								{fields.slice(0, 4).map((field) => (
									<FormField
										key={field.name}
										field={field}
										value={formData[field.name]}
										error={errors[field.name]}
										onChange={updateField}
										t={t}
									/>
								))}
							</Section>

							<Section title={t("consumptionInformation")} description={t("consumptionInformationHint")}>
								{fields.slice(4).map((field) => (
									<FormField
										key={field.name}
										field={field}
										value={formData[field.name]}
										error={errors[field.name]}
										onChange={updateField}
										t={t}
									/>
								))}
							</Section>
						</div>

						<div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={onCancel}
								disabled={loading}
								className={`${buttonSecondary} justify-center disabled:cursor-not-allowed disabled:opacity-50`}
							>
								<X className="mr-2 h-4 w-4" />
								{t("cancel")}
							</button>

							<button
								type="submit"
								disabled={loading}
								className={`${buttonPrimary} justify-center disabled:cursor-not-allowed disabled:opacity-50`}
							>
								{loading ? (
									<span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								) : (
									<Save className="mr-2 h-4 w-4" />
								)}
								{loading ? t("saving") : isEdit ? t("updateMedicine") : t("addMedicine")}
							</button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

function Section({ title, description, children }) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
			<div className="mb-5">
				<h3 className="text-right text-sm font-bold text-slate-900">{title}</h3>
				<p className="mt-1 text-right text-xs text-slate-500">{description}</p>
			</div>
			<div className="grid gap-4">{children}</div>
		</section>
	);
}

function FormField({ field, value, error, onChange, t }) {
	return (
		<div>
			<label className="mb-1.5 block text-right text-xs font-bold text-slate-700">
				{field.label}
				{field.required && <span className="mr-1 text-red-500">*</span>}
			</label>

			{field.type === "select" ? (
				<select
					value={value || ""}
					onChange={(e) => onChange(field.name, e.target.value)}
					className={`${fieldClass} ${error ? "border-red-300 ring-red-50" : ""}`}
				>
					<option value="">{t("selectOption")}</option>
					{field.options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			) : (
				<input
					type="text"
					value={value || ""}
					onChange={(e) => onChange(field.name, e.target.value)}
					placeholder={field.placeholder}
					className={`${fieldClass} ${error ? "border-red-300 ring-red-50" : ""}`}
				/>
			)}

			{error && <p className="mt-1 text-right text-xs font-medium text-red-600">{error}</p>}
		</div>
	);
}