import {
	Check,
	CheckCircle2,
	Edit3,
	FileText,
	ListChecks,
	Plus,
	Save,
	Search,
	Sparkles,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { labTestApi } from "../../api/labTestApi";
import { useLanguage } from "../../i18n/LanguageContext";

const FIELD_TYPES = [
	{ value: "number", labelKey: "numberInput" },
	{ value: "text", labelKey: "textInput" },
	{ value: "select", labelKey: "dropdownInput" },
	{ value: "textarea", labelKey: "notesInput" },
	{ value: "date", labelKey: "dateInput" },
	{ value: "boolean", labelKey: "yesNoInput" },
];

const COMMON_LAB_TESTS = [
	{
		name: "CBC",
		category: "Hematology",
		description: "Complete blood count",
		fields: [
			{ label: "Hemoglobin", type: "number", unit: "g/dL", referenceRange: "13.5 - 17.5", required: true },
			{ label: "WBC", type: "number", unit: "10^9/L", referenceRange: "4.0 - 11.0", required: true },
			{ label: "RBC", type: "number", unit: "10^12/L", referenceRange: "4.5 - 5.9" },
			{ label: "Platelets", type: "number", unit: "10^9/L", referenceRange: "150 - 450" },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "ESR",
		category: "Hematology",
		description: "Erythrocyte sedimentation rate",
		fields: [
			{ label: "ESR", type: "number", unit: "mm/hr", referenceRange: "0 - 20", required: true },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Blood Group & Rh",
		category: "Hematology",
		description: "Blood grouping and Rh typing",
		fields: [
			{ label: "ABO Group", type: "select", optionsText: "A, B, AB, O", required: true },
			{ label: "Rh Factor", type: "select", optionsText: "Positive, Negative", required: true },
		],
	},
	{
		name: "Blood Glucose",
		category: "Biochemistry",
		description: "Blood sugar test",
		fields: [
			{ label: "Result", type: "number", unit: "mg/dL", referenceRange: "70 - 140", required: true },
			{ label: "Sample Type", type: "select", optionsText: "Fasting, Random, 2 Hours PP", required: true },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "HbA1c",
		category: "Biochemistry",
		description: "Glycated hemoglobin",
		fields: [
			{ label: "HbA1c", type: "number", unit: "%", referenceRange: "4.0 - 5.6", required: true },
			{ label: "Estimated Average Glucose", type: "number", unit: "mg/dL" },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Lipid Profile",
		category: "Biochemistry",
		description: "Cholesterol and triglycerides profile",
		fields: [
			{ label: "Total Cholesterol", type: "number", unit: "mg/dL", referenceRange: "< 200", required: true },
			{ label: "Triglycerides", type: "number", unit: "mg/dL", referenceRange: "< 150", required: true },
			{ label: "HDL Cholesterol", type: "number", unit: "mg/dL", referenceRange: "> 40", required: true },
			{ label: "LDL Cholesterol", type: "number", unit: "mg/dL", referenceRange: "< 100" },
			{ label: "VLDL", type: "number", unit: "mg/dL" },
		],
	},
	{
		name: "LFT",
		category: "Biochemistry",
		description: "Liver function test",
		fields: [
			{ label: "Total Bilirubin", type: "number", unit: "mg/dL", referenceRange: "0.1 - 1.2", required: true },
			{ label: "Direct Bilirubin", type: "number", unit: "mg/dL", referenceRange: "0.0 - 0.3" },
			{ label: "SGPT / ALT", type: "number", unit: "U/L", referenceRange: "7 - 56", required: true },
			{ label: "SGOT / AST", type: "number", unit: "U/L", referenceRange: "10 - 40", required: true },
			{ label: "Alkaline Phosphatase", type: "number", unit: "U/L", referenceRange: "44 - 147" },
			{ label: "Albumin", type: "number", unit: "g/dL", referenceRange: "3.5 - 5.0" },
		],
	},
	{
		name: "RFT",
		category: "Biochemistry",
		description: "Renal function test",
		fields: [
			{ label: "Urea", type: "number", unit: "mg/dL", referenceRange: "15 - 40", required: true },
			{ label: "Creatinine", type: "number", unit: "mg/dL", referenceRange: "0.6 - 1.3", required: true },
			{ label: "Uric Acid", type: "number", unit: "mg/dL", referenceRange: "3.5 - 7.2" },
			{ label: "Sodium", type: "number", unit: "mmol/L", referenceRange: "135 - 145" },
			{ label: "Potassium", type: "number", unit: "mmol/L", referenceRange: "3.5 - 5.1" },
		],
	},
	{
		name: "TFT",
		category: "Endocrinology",
		description: "Thyroid function test",
		fields: [
			{ label: "TSH", type: "number", unit: "uIU/mL", referenceRange: "0.4 - 4.0", required: true },
			{ label: "T3", type: "number", unit: "ng/dL", referenceRange: "80 - 180" },
			{ label: "T4", type: "number", unit: "ug/dL", referenceRange: "5.0 - 12.0" },
		],
	},
	{
		name: "CRP",
		category: "Immunology",
		description: "C-reactive protein",
		fields: [
			{ label: "CRP", type: "number", unit: "mg/L", referenceRange: "< 5", required: true },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Urine Routine",
		category: "Urinalysis",
		description: "Routine urine examination",
		fields: [
			{ label: "Color", type: "text" },
			{ label: "Appearance", type: "select", optionsText: "Clear, Turbid, Slightly Turbid" },
			{ label: "Protein", type: "select", optionsText: "Negative, Trace, +, ++, +++" },
			{ label: "Sugar", type: "select", optionsText: "Negative, Trace, +, ++, +++" },
			{ label: "Pus Cells", type: "text", unit: "/HPF" },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Stool Routine",
		category: "Microscopy",
		description: "Routine stool examination",
		fields: [
			{ label: "Color", type: "text" },
			{ label: "Consistency", type: "select", optionsText: "Formed, Semi-formed, Loose, Watery" },
			{ label: "Mucus", type: "select", optionsText: "Absent, Present" },
			{ label: "Blood", type: "select", optionsText: "Absent, Present" },
			{ label: "Ova / Cyst", type: "text" },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Malaria Test",
		category: "Parasitology",
		description: "Malaria parasite test",
		fields: [
			{ label: "Result", type: "select", optionsText: "Negative, Positive", required: true },
			{ label: "Parasite Type", type: "select", optionsText: "P. falciparum, P. vivax, Mixed, Not seen" },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Widal Test",
		category: "Serology",
		description: "Widal agglutination test",
		fields: [
			{ label: "Salmonella Typhi O", type: "text", referenceRange: "< 1:80" },
			{ label: "Salmonella Typhi H", type: "text", referenceRange: "< 1:80" },
			{ label: "S. Paratyphi AH", type: "text", referenceRange: "< 1:80" },
			{ label: "S. Paratyphi BH", type: "text", referenceRange: "< 1:80" },
			{ label: "Remarks", type: "textarea" },
		],
	},
	{
		name: "Pregnancy Test",
		category: "Serology",
		description: "Urine hCG pregnancy test",
		fields: [
			{ label: "Result", type: "select", optionsText: "Negative, Positive", required: true },
			{ label: "Remarks", type: "textarea" },
		],
	},
];

const TABS = [
	{ id: "common", labelKey: "commonTests", icon: Sparkles },
	{ id: "saved", labelKey: "savedTests", icon: ListChecks },
	{ id: "custom", labelKey: "customTest", icon: FileText },
];

const CATEGORY_KEYS = {
	Hematology: "categoryHematology",
	Biochemistry: "categoryBiochemistry",
	Endocrinology: "categoryEndocrinology",
	Immunology: "categoryImmunology",
	Urinalysis: "categoryUrinalysis",
	Microscopy: "categoryMicroscopy",
	Parasitology: "categoryParasitology",
	Serology: "categorySerology",
};

const emptyField = () => ({
	label: "",
	type: "number",
	unit: "",
	referenceRange: "",
	required: false,
	optionsText: "",
});

const initialForm = () => ({
	name: "",
	category: "",
	description: "",
	resultFields: [emptyField()],
});

export default function AddLabTestModal({ open, onClose, onSubmit, saving = false, error = "" }) {
	const { t, isRtl } = useLanguage();
	const [activeTab, setActiveTab] = useState("common");
	const [form, setForm] = useState(initialForm);
	const [editingTestId, setEditingTestId] = useState(null);
	const [savedTests, setSavedTests] = useState([]);
	const [listLoading, setListLoading] = useState(false);
	const [localError, setLocalError] = useState("");
	const [notice, setNotice] = useState("");
	const [search, setSearch] = useState("");
	const [activeAction, setActiveAction] = useState("");

	useEffect(() => {
		if (!open) return;
		loadSavedTests();
	}, [open]);

	const filteredCommonTests = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return COMMON_LAB_TESTS;
		return COMMON_LAB_TESTS.filter((test) =>
			[test.name, test.category, test.description].some((value) =>
				String(value || "").toLowerCase().includes(query)
			)
		);
	}, [search]);

	const activeSavedTests = useMemo(
		() => savedTests.filter((test) => test?.isActive !== false),
		[savedTests]
	);

	const addedTestNames = useMemo(
		() => new Set(activeSavedTests.map((test) => normalizeTestName(test.name))),
		[activeSavedTests]
	);

	const filteredSavedTests = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return activeSavedTests;
		return activeSavedTests.filter((test) =>
			[test.name, test.category, test.description].some((value) =>
				String(value || "").toLowerCase().includes(query)
			)
		);
	}, [activeSavedTests, search]);

	if (!open) return null;

	async function loadSavedTests() {
		try {
			setListLoading(true);
			const result = await labTestApi.getLabTests({ includeInactive: true });
			setSavedTests(Array.isArray(result.data) ? result.data : []);
		} catch (err) {
			setLocalError(err.message || t("failedToLoadLabTests"));
		} finally {
			setListLoading(false);
		}
	}

	const updateForm = (field, value) => {
		setForm((current) => ({ ...current, [field]: value }));
	};

	const updateField = (index, field, value) => {
		setForm((current) => ({
			...current,
			resultFields: current.resultFields.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: value } : item
			),
		}));
	};

	const addField = () => {
		setForm((current) => ({
			...current,
			resultFields: [...current.resultFields, emptyField()],
		}));
	};

	const removeField = (index) => {
		setForm((current) => ({
			...current,
			resultFields:
				current.resultFields.length === 1
					? [emptyField()]
					: current.resultFields.filter((_, itemIndex) => itemIndex !== index),
		}));
	};

	const resetEditor = () => {
		setForm(initialForm());
		setEditingTestId(null);
	};

	const showNotice = (message) => {
		setNotice(message);
		window.setTimeout(() => setNotice(""), 2500);
	};

	const addCommonTest = async (test) => {
		try {
			setLocalError("");
			setActiveAction(`add-${test.name}`);
			await onSubmit?.(buildPayload(commonTestToForm(test)));
			await loadSavedTests();
			showNotice(`${test.name} ${t("labTestAddedSuffix")}`);
		} catch (err) {
			setLocalError(err.message || t("failedToAddLabTest"));
		} finally {
			setActiveAction("");
		}
	};

	const editSavedTest = (test) => {
		setForm(labTestToForm(test));
		setEditingTestId(test.id);
		setActiveTab("custom");
		setLocalError("");
	};

	const deleteSavedTest = async (test) => {
		if (!window.confirm(`${t("deleteLabTestConfirm")} ${test.name}?`)) return;
		try {
			setLocalError("");
			setActiveAction(`delete-${test.id}`);
			await labTestApi.deleteLabTest(test.id);
			await loadSavedTests();
			showNotice(`${test.name} ${t("labTestRemovedSuffix")}`);
		} catch (err) {
			setLocalError(err.message || t("failedToDeleteLabTest"));
		} finally {
			setActiveAction("");
		}
	};

	const handleClose = () => {
		if (saving || activeAction) return;
		onClose?.();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		try {
			setLocalError("");
			if (editingTestId) {
				setActiveAction(`save-${editingTestId}`);
				await labTestApi.updateLabTest(editingTestId, buildPayload(form));
				showNotice(t("labTestUpdated"));
			} else {
				setActiveAction("save-custom");
				await onSubmit?.(buildPayload(form));
				showNotice(t("labTestCreated"));
			}
			resetEditor();
			await loadSavedTests();
			setActiveTab("saved");
		} catch (err) {
			setLocalError(err.message || t("failedToSaveLabTest"));
		} finally {
			setActiveAction("");
		}
	};

	const visibleError = localError || error;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
			<div
				dir={isRtl ? "rtl" : "ltr"}
				className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
			>
				<div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
					<div className="flex items-start justify-between gap-4">
						<div className={`flex-1 ${isRtl ? "text-right" : "text-left"}`}>
							<div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-blue-700">
								<Sparkles className="h-3.5 w-3.5" />
								{t("labTestManager")}
							</div>
							<h3 className="text-2xl font-bold text-slate-950">{t("addLabTestTitle")}</h3>
							<p className="text-sm text-slate-500">
								{t("addLabTestManagerSubtitle")}
							</p>
						</div>
							<button
							type="button"
							onClick={handleClose}
							className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
							disabled={saving || Boolean(activeAction)}
							aria-label={t("close")}
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex rounded-xl border border-slate-200 bg-white p-1">
							{TABS.map((tab) => {
								const Icon = tab.icon;
								const active = activeTab === tab.id;
								return (
									<button
										key={tab.id}
										type="button"
										onClick={() => {
											setActiveTab(tab.id);
											setLocalError("");
										}}
										className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
											active
												? "bg-blue-600 text-white shadow-sm"
												: "text-slate-600 hover:bg-slate-50"
										}`}
									>
										<Icon className="h-4 w-4" />
										{t(tab.labelKey)}
									</button>
								);
							})}
						</div>

						{activeTab !== "custom" && (
							<div className="relative w-full lg:w-80">
								<Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isRtl ? "right-3" : "left-3"}`} />
								<input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder={t("searchLabTests")}
									className={`h-11 w-full rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
										isRtl ? "pl-3 pr-10 text-right" : "pl-10 pr-3 text-left"
									}`}
								/>
							</div>
						)}
					</div>
				</div>

				<div className="overflow-y-auto px-6 py-5">
					{visibleError && (
						<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
							{visibleError}
						</div>
					)}

					{notice && (
						<div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
							{notice}
						</div>
					)}

					{activeTab === "common" && (
						<CommonTestsPanel
							tests={filteredCommonTests}
			onAdd={addCommonTest}
							addedTestNames={addedTestNames}
							activeAction={activeAction}
							saving={saving}
							t={t}
							isRtl={isRtl}
						/>
					)}

					{activeTab === "saved" && (
						<SavedTestsPanel
							tests={filteredSavedTests}
							loading={listLoading}
							onEdit={editSavedTest}
							onDelete={deleteSavedTest}
							activeAction={activeAction}
							t={t}
							isRtl={isRtl}
						/>
					)}

					{activeTab === "custom" && (
						<CustomTestForm
							form={form}
							editingTestId={editingTestId}
							onCancelEdit={resetEditor}
							onSubmit={handleSubmit}
							updateForm={updateForm}
							updateField={updateField}
							addField={addField}
							removeField={removeField}
							saving={saving || Boolean(activeAction)}
							t={t}
							isRtl={isRtl}
						/>
					)}
				</div>

				<div className="flex justify-end border-t border-slate-200 bg-white px-6 py-4">
					<button
						type="button"
						onClick={handleClose}
						className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
						disabled={saving || Boolean(activeAction)}
					>
						{t("close")}
					</button>
				</div>
			</div>
		</div>
	);
}

function CommonTestsPanel({ tests, onAdd, addedTestNames, activeAction, saving, t, isRtl }) {
	return (
		<div>
			<div className={`mb-4 flex items-end justify-between gap-3 ${isRtl ? "text-right" : "text-left"}`}>
				<div className="flex-1">
					<h4 className="text-base font-bold text-slate-950">{t("readyMadeCommonTests")}</h4>
					<p className="text-sm text-slate-500">{t("readyMadeCommonTestsSubtitle")}</p>
				</div>
				<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
					{tests.length} {t("tests")}
				</span>
			</div>

			<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{tests.map((test) => {
					const actionKey = `add-${test.name}`;
					const isAdded = addedTestNames.has(normalizeTestName(test.name));
					return (
						<div
							key={test.name}
							className={`group rounded-xl border p-4 shadow-sm transition ${
								isAdded
									? "border-emerald-200 bg-emerald-50/60"
									: "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
							} ${
								isRtl ? "text-right" : "text-left"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<div className={`flex items-center gap-2 ${isRtl ? "justify-end" : ""}`}>
										<p className="text-sm font-bold text-slate-950">{test.name}</p>
										{isAdded && (
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
												<CheckCircle2 className="h-3 w-3" />
												{t("added")}
											</span>
										)}
									</div>
									<p className="text-xs font-medium text-blue-700">{getCategoryLabel(test.category, t)}</p>
								</div>
								<button
									type="button"
									onClick={() => onAdd(test)}
									disabled={isAdded || saving || Boolean(activeAction)}
									className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed ${
										isAdded
											? "bg-emerald-100 text-emerald-700"
											: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
									}`}
								>
									{isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
									{isAdded ? t("added") : activeAction === actionKey ? t("adding") : t("add")}
								</button>
							</div>
							<p className={`mt-2 min-h-8 text-xs ${isAdded ? "text-emerald-700" : "text-slate-500"}`}>
								{isAdded ? t("alreadyAvailableForDoctors") : t("commonLabTestCardSubtitle")}
							</p>
							<div className={`mt-3 flex flex-wrap gap-1.5 ${isRtl ? "justify-end" : ""}`}>
								{test.fields.slice(0, 4).map((field) => (
									<span
										key={field.label}
										className={`rounded-full px-2 py-1 text-[11px] font-medium ${
											isAdded ? "bg-white/80 text-emerald-800" : "bg-slate-100 text-slate-600"
										}`}
									>
										{field.label}
									</span>
								))}
								{test.fields.length > 4 && (
									<span className={`rounded-full px-2 py-1 text-[11px] font-bold ${isAdded ? "bg-white/80 text-emerald-800" : "bg-blue-50 text-blue-700"}`}>
										+{test.fields.length - 4}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function SavedTestsPanel({ tests, loading, onEdit, onDelete, activeAction, t, isRtl }) {
	if (loading) {
		return <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">{t("loadingSavedLabTests")}</div>;
	}

	if (tests.length === 0) {
		return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{t("noSavedLabTestsFound")}</div>;
	}

	return (
		<div>
			<div className={`mb-4 flex items-end justify-between gap-3 ${isRtl ? "text-right" : "text-left"}`}>
				<div className="flex-1">
					<h4 className="text-base font-bold text-slate-950">{t("savedLabTests")}</h4>
					<p className="text-sm text-slate-500">{t("savedLabTestsSubtitle")}</p>
				</div>
				<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
					{tests.length} {t("saved")}
				</span>
			</div>

			<div className="overflow-hidden rounded-xl border border-slate-200">
				{tests.map((test) => {
					const fields = Array.isArray(test.resultFields) ? test.resultFields : [];
					return (
						<div
							key={test.id}
							className={`grid gap-3 border-b border-slate-100 p-4 last:border-b-0 lg:grid-cols-[1.2fr_1fr_100px_170px] lg:items-center ${
								isRtl ? "text-right" : "text-left"
							}`}
						>
							<div>
								<div className={`flex items-center gap-2 ${isRtl ? "justify-end" : ""}`}>
									<p className="font-bold text-slate-950">{test.name}</p>
								</div>
								<p className="text-sm text-slate-500">{test.description || t("noDescription")}</p>
							</div>
							<p className="text-sm font-medium text-slate-600">{getCategoryLabel(test.category, t) || t("general")}</p>
							<p className="text-sm text-slate-500">{fields.length} {t("fields")}</p>
							<div className={`flex gap-2 ${isRtl ? "lg:justify-start" : "lg:justify-end"}`}>
								<button
									type="button"
									onClick={() => onEdit(test)}
									className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
								>
									<Edit3 className="h-3.5 w-3.5" />
									{t("edit")}
								</button>
								<button
									type="button"
									onClick={() => onDelete(test)}
									disabled={activeAction === `delete-${test.id}`}
									className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
								>
									<Trash2 className="h-3.5 w-3.5" />
									{activeAction === `delete-${test.id}` ? t("removing") : t("delete")}
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function CustomTestForm({
	form,
	editingTestId,
	onCancelEdit,
	onSubmit,
	updateForm,
	updateField,
	addField,
	removeField,
	saving,
	t,
	isRtl,
}) {
	return (
		<form onSubmit={onSubmit}>
			<div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
				<div className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${isRtl ? "text-right" : "text-left"}`}>
					<div className="flex-1">
						<h4 className="text-base font-bold text-slate-950">
							{editingTestId ? t("editLabTest") : t("createCustomLabTest")}
						</h4>
						<p className="text-sm text-slate-500">
							{t("createCustomLabTestSubtitle")}
						</p>
					</div>
					{editingTestId && (
						<button
							type="button"
							onClick={onCancelEdit}
							className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
						>
							{t("newCustomTest")}
						</button>
					)}
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Input label={t("testName")} required value={form.name} onChange={(value) => updateForm("name", value)} placeholder="CBC" autoFocus isRtl={isRtl} />
				<Input label={t("category")} value={form.category} onChange={(value) => updateForm("category", value)} placeholder="Hematology" isRtl={isRtl} />
				<Input label={t("description")} value={form.description} onChange={(value) => updateForm("description", value)} placeholder={t("completeBloodCount")} isRtl={isRtl} />
			</div>

			<div className={`mt-6 flex items-center justify-between gap-3 ${isRtl ? "text-right" : "text-left"}`}>
				<div className="flex-1">
					<h4 className="text-sm font-bold text-slate-900">{t("resultInputs")}</h4>
					<p className="text-xs text-slate-500">{t("resultInputsSubtitle")}</p>
				</div>
				<button
					type="button"
					onClick={addField}
					className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
				>
					<Plus className="h-4 w-4" />
					{t("addInput")}
				</button>
			</div>

			<div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
				<div className={`hidden grid-cols-[1.4fr_130px_1fr_1fr_90px_44px] gap-3 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 md:grid ${isRtl ? "text-right" : "text-left"}`}>
					<span>{t("resultName")}</span>
					<span>{t("inputType")}</span>
					<span>{t("unit")}</span>
					<span>{t("normalRange")}</span>
					<span>{t("required")}</span>
					<span />
				</div>

				<div className="divide-y divide-slate-100">
					{form.resultFields.map((field, index) => (
						<div key={index} className="grid gap-3 p-4 md:grid-cols-[1.4fr_130px_1fr_1fr_90px_44px]">
							<Input label={t("resultName")} hideLabelOnDesktop required value={field.label} onChange={(value) => updateField(index, "label", value)} placeholder={t("hemoglobin")} isRtl={isRtl} />

							<div>
								<label className={`mb-1 block text-xs font-semibold text-slate-700 md:hidden ${isRtl ? "text-right" : "text-left"}`}>{t("inputType")}</label>
								<select
									required
									value={field.type}
									onChange={(event) => updateField(index, "type", event.target.value)}
									className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
								>
									{FIELD_TYPES.map((type) => (
										<option key={type.value} value={type.value}>{t(type.labelKey)}</option>
									))}
								</select>
							</div>

							<Input label={t("unit")} hideLabelOnDesktop value={field.unit} onChange={(value) => updateField(index, "unit", value)} placeholder="g/dL" isRtl={isRtl} />
							<Input label={t("normalRange")} hideLabelOnDesktop value={field.referenceRange} onChange={(value) => updateField(index, "referenceRange", value)} placeholder="13.5 - 17.5" isRtl={isRtl} />

							<label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
								<input type="checkbox" checked={field.required} onChange={(event) => updateField(index, "required", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
								<span className="md:hidden lg:inline">{t("required")}</span>
							</label>

							<button
								type="button"
								onClick={() => removeField(index)}
								className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
								aria-label={t("removeResultInput")}
							>
								<Trash2 className="h-4 w-4" />
							</button>

							{field.type === "select" && (
								<div className="md:col-span-6">
									<Input label={t("dropdownChoices")} required value={field.optionsText} onChange={(value) => updateField(index, "optionsText", value)} placeholder={t("dropdownChoicesPlaceholder")} isRtl={isRtl} />
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
				<div className="flex items-start gap-2">
					<Check className="mt-0.5 h-4 w-4" />
					<p>{t("savedTemplatesAppearForDoctors")}</p>
				</div>
			</div>

			<div className="mt-5 flex justify-end gap-3">
				<button
					type="submit"
					className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
					disabled={saving}
				>
					<Save className="h-4 w-4" />
					{saving ? t("saving") : editingTestId ? t("updateLabTest") : t("saveCustomTest")}
				</button>
			</div>
		</form>
	);
}

function Input({ label, required, value, onChange, placeholder, autoFocus = false, hideLabelOnDesktop = false, isRtl = false }) {
	return (
		<div>
			<label className={`mb-1 block text-xs font-semibold text-slate-700 ${hideLabelOnDesktop ? "md:hidden" : ""} ${isRtl ? "text-right" : "text-left"}`}>
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<input
				required={required}
				autoFocus={autoFocus}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
					isRtl ? "text-right" : "text-left"
				}`}
			/>
		</div>
	);
}

function commonTestToForm(test) {
	return {
		name: test.name,
		category: test.category,
		description: test.description,
		resultFields: test.fields.map((field) => ({ ...emptyField(), ...field })),
	};
}

function getCategoryLabel(category, t) {
	return CATEGORY_KEYS[category] ? t(CATEGORY_KEYS[category]) : category;
}

function normalizeTestName(name) {
	return String(name || "").trim().toLowerCase();
}

function labTestToForm(test) {
	const resultFields = Array.isArray(test.resultFields) ? test.resultFields : [];
	return {
		name: test.name || "",
		category: test.category || "",
		description: test.description || "",
		resultFields: resultFields.length
			? resultFields.map((field) => ({
					...emptyField(),
					label: field.label || field.name || "",
					type: field.type || "text",
					unit: field.unit || "",
					referenceRange: field.referenceRange || field.normalRange || "",
					required: Boolean(field.required),
					optionsText: Array.isArray(field.options) ? field.options.join(", ") : "",
				}))
			: [emptyField()],
	};
}

function toFieldKey(label, fallbackIndex) {
	const key = label
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	return key || `result_${fallbackIndex + 1}`;
}

function uniqueKey(baseKey, usedKeys) {
	let key = baseKey;
	let counter = 2;

	while (usedKeys.has(key)) {
		key = `${baseKey}_${counter}`;
		counter += 1;
	}

	usedKeys.add(key);
	return key;
}

function buildPayload(form) {
	const usedKeys = new Set();

	return {
		name: form.name.trim(),
		category: form.category.trim() || null,
		description: form.description.trim() || null,
		resultFields: form.resultFields.map((field, index) => {
			const baseKey = toFieldKey(field.label, index);
			const nextField = {
				key: uniqueKey(baseKey, usedKeys),
				label: field.label.trim(),
				type: field.type,
				required: Boolean(field.required),
			};

			if (field.unit.trim()) nextField.unit = field.unit.trim();
			if (field.referenceRange.trim()) nextField.referenceRange = field.referenceRange.trim();
			if (field.type === "select") {
				nextField.options = field.optionsText
					.split(",")
					.map((option) => option.trim())
					.filter(Boolean);
			}

			return nextField;
		}),
	};
}
