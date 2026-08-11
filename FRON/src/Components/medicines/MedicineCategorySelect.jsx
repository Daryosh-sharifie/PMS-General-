import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import medicineCategoryApi from "../../api/medicineCategoryApi";

const ADD_NEW_VALUE = "__add_new__";

const fieldClass =
	"w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50";

export default function MedicineCategorySelect({
	value,
	onChange,
	error,
	t,
	categories: externalCategories,
	onCategoriesChange,
}) {
	const [categories, setCategories] = useState(externalCategories || []);
	const [loading, setLoading] = useState(false);
	const [showAddNew, setShowAddNew] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [addError, setAddError] = useState("");
	const [adding, setAdding] = useState(false);

	const syncCategories = (list) => {
		setCategories(list);
		onCategoriesChange?.(list);
	};

	const loadCategories = async () => {
		try {
			setLoading(true);
			const list = await medicineCategoryApi.getAllCategories();
			syncCategories(list);
		} catch {
			syncCategories([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (externalCategories?.length) {
			setCategories(externalCategories);
			return;
		}
		loadCategories();
	}, [externalCategories]);

	useEffect(() => {
		if (!value || categories.length === 0) return;
		const exists = categories.some((category) => String(category.id) === String(value));
		if (!exists) loadCategories();
	}, [value, categories.length]);

	const handleSelectChange = (selectedValue) => {
		if (selectedValue === ADD_NEW_VALUE) {
			setShowAddNew(true);
			setNewCategoryName("");
			setAddError("");
			return;
		}
		setShowAddNew(false);
		onChange(selectedValue);
	};

	const handleAddCategory = async () => {
		const name = newCategoryName.trim();
		if (!name) {
			setAddError(t("fieldRequired"));
			return;
		}

		try {
			setAdding(true);
			setAddError("");
			const created = await medicineCategoryApi.createCategory(name);
			const list = await medicineCategoryApi.getAllCategories();
			syncCategories(list);
			onChange(String(created.id));
			setShowAddNew(false);
			setNewCategoryName("");
		} catch (err) {
			setAddError(err.message || t("failedToSaveCategory"));
		} finally {
			setAdding(false);
		}
	};

	return (
		<div className="space-y-3">
			<select
				value={showAddNew ? ADD_NEW_VALUE : value || ""}
				onChange={(e) => handleSelectChange(e.target.value)}
				disabled={loading}
				className={`${fieldClass} ${error ? "border-red-300 ring-red-50" : ""}`}
			>
				<option value="">{loading ? t("loadingCategories") : t("selectOption")}</option>
				<option value={ADD_NEW_VALUE}>{t("addNewCategory")}</option>
				{categories.map((category) => (
					<option key={category.id} value={String(category.id)}>
						{category.name}
					</option>
				))}
			</select>

			{showAddNew && (
				<div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
					<label className="mb-1.5 block text-right text-xs font-bold text-slate-700">
						{t("newCategoryName")}
					</label>
					<div className="flex flex-col gap-2 sm:flex-row">
						<input
							type="text"
							value={newCategoryName}
							onChange={(e) => {
								setNewCategoryName(e.target.value);
								if (addError) setAddError("");
							}}
							placeholder={t("newCategoryPlaceholder")}
							className={`${fieldClass} flex-1 text-right bg-white`}
							onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
						/>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={handleAddCategory}
								disabled={adding}
								className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
							>
								{adding ? (
									<span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								) : (
									<>
										<Save className="ml-1 h-4 w-4" />
										{t("save")}
									</>
								)}
							</button>
							<button
								type="button"
								onClick={() => {
									setShowAddNew(false);
									setNewCategoryName("");
									setAddError("");
								}}
								className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
							>
								<X className="ml-1 h-4 w-4" />
								{t("cancel")}
							</button>
						</div>
					</div>
					{addError && (
						<p className="mt-2 text-right text-xs font-medium text-red-600">{addError}</p>
					)}
				</div>
			)}

			{error && <p className="text-right text-xs font-medium text-red-600">{error}</p>}
		</div>
	);
}
