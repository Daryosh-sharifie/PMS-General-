import { useEffect, useMemo, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import { Card, CardContent } from "../ui/Card";

const ADD_NEW_VALUE = "__add_new__";

const fieldClass =
	"w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50";

export default function AddableSelect({
	value,
	onChange,
	error,
	t,
	loadOptions,
	createOption,
	deleteOption,
	protectedValues = [],
	getOptionLabel,
	addTitle,
	newItemLabel,
	newItemPlaceholder,
	deleteTitle,
	deleteConfirmMessage,
}) {
	const [options, setOptions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showAdd, setShowAdd] = useState(false);
	const [draft, setDraft] = useState("");
	const [saving, setSaving] = useState(false);
	const [addError, setAddError] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState("");

	const protectedSet = useMemo(
		() => new Set(protectedValues.map((item) => item.trim().toLowerCase())),
		[protectedValues]
	);

	const fetchOptions = async () => {
		try {
			setLoading(true);
			const list = await loadOptions();
			setOptions(list);
		} catch {
			setOptions([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOptions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const hasValue = !value || options.some((option) => option.name === value);
	const displayOptions = hasValue
		? options
		: [...options, { id: `__current__${value}`, name: value }];

	const labelOf = (option) => (getOptionLabel ? getOptionLabel(option.name) : option.name);

	const isDeletable = (option) => {
		if (!deleteOption || !option) return false;
		if (!option.id || String(option.id).startsWith("__")) return false;
		return !protectedSet.has(String(option.name || "").trim().toLowerCase());
	};

	const selectedOption = displayOptions.find((option) => option.name === value) || null;
	const canDeleteSelected = isDeletable(selectedOption);

	const handleAdd = async () => {
		const name = draft.trim();
		if (!name) {
			setAddError(t("fieldRequired"));
			return;
		}

		try {
			setSaving(true);
			setAddError("");
			const created = await createOption(name);
			await fetchOptions();
			onChange(created.name);
			setShowAdd(false);
			setDraft("");
		} catch (err) {
			setAddError(err.message || t("failedToSaveItem"));
		} finally {
			setSaving(false);
		}
	};

	const closeAdd = () => {
		setShowAdd(false);
		setDraft("");
		setAddError("");
	};

	const handleSelectChange = (selectedValue) => {
		if (selectedValue === ADD_NEW_VALUE) {
			setShowAdd(true);
			setDraft("");
			setAddError("");
			return;
		}
		setShowAdd(false);
		onChange(selectedValue);
	};

	const handleDelete = async () => {
		if (!deleteConfirm || !deleteOption) return;

		try {
			setDeleting(true);
			setDeleteError("");
			await deleteOption(deleteConfirm.id);
			await fetchOptions();

			if (value === deleteConfirm.name) {
				onChange("");
			}

			setDeleteConfirm(null);
		} catch (err) {
			setDeleteError(err.message || t("failedToDeleteItem"));
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="space-y-3">
			<div className="relative">
				<select
					value={showAdd ? ADD_NEW_VALUE : value || ""}
					onChange={(e) => handleSelectChange(e.target.value)}
					disabled={loading}
					className={`${fieldClass} ${canDeleteSelected ? "pr-10" : ""} ${
						error ? "border-red-300 ring-red-50" : ""
					}`}
				>
					<option value="">{loading ? t("loadingOptions") : t("selectOption")}</option>
					<option value={ADD_NEW_VALUE}>+ {addTitle}</option>
					{displayOptions.map((option) => (
						<option key={option.id} value={option.name}>
							{labelOf(option)}
						</option>
					))}
				</select>

				{canDeleteSelected && (
					<button
						type="button"
						onClick={() => {
							setDeleteConfirm(selectedOption);
							setDeleteError("");
						}}
						className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-md p-1.5 text-red-500 hover:bg-red-50"
						title={t("delete")}
					>
						<Trash2 className="h-4 w-4" />
					</button>
				)}
			</div>

			{showAdd && (
				<div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
					<label className="mb-1.5 block text-right text-xs font-bold text-slate-700">
						{newItemLabel}
					</label>
					<div className="flex flex-col gap-2 sm:flex-row">
						<input
							type="text"
							value={draft}
							onChange={(e) => {
								setDraft(e.target.value);
								if (addError) setAddError("");
							}}
							placeholder={newItemPlaceholder}
							className={`${fieldClass} flex-1 bg-white text-right`}
							onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
						/>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={handleAdd}
								disabled={saving}
								className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
							>
								{saving ? (
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
								onClick={closeAdd}
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
			{deleteError && (
				<p className="text-right text-xs font-medium text-red-600">{deleteError}</p>
			)}

			{deleteConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
					<Card className="w-full max-w-sm bg-white shadow-2xl">
						<CardContent className="space-y-5 p-6 text-right">
							<div>
								<h4 className="text-lg font-bold text-slate-900">
									{deleteTitle || t("deleteItem")}
								</h4>
								<p className="mt-1 text-sm text-slate-500">
									{deleteConfirmMessage || t("deleteItemConfirm")}
								</p>
								<p className="mt-2 text-sm font-semibold text-slate-800">
									{labelOf(deleteConfirm)}
								</p>
							</div>
							<div className="flex justify-start gap-3">
								<button
									type="button"
									onClick={handleDelete}
									disabled={deleting}
									className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
								>
									{t("delete")}
								</button>
								<button
									type="button"
									onClick={() => setDeleteConfirm(null)}
									className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
								>
									{t("cancel")}
								</button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
