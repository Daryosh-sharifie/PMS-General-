import { useEffect, useState } from "react";
import { Plus, Save, X, Pencil, Trash2, Tags } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { inputClasses, buttonPrimary, buttonSecondary } from "../../constants/styles";
import medicineCategoryApi from "../../api/medicineCategoryApi";

export default function MedicineCategoryManager({ open, onClose, onCategoriesChange, t }) {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [newName, setNewName] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editingName, setEditingName] = useState("");
	const [deleteConfirm, setDeleteConfirm] = useState(null);

	const loadCategories = async () => {
		try {
			setLoading(true);
			setError("");
			const list = await medicineCategoryApi.getAllCategories();
			setCategories(list);
			onCategoriesChange?.(list);
		} catch (err) {
			setError(err.message || t("failedToLoadCategories"));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open) loadCategories();
	}, [open]);

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name) return;

		try {
			setLoading(true);
			setError("");
			await medicineCategoryApi.createCategory(name);
			setNewName("");
			await loadCategories();
		} catch (err) {
			setError(err.message || t("failedToSaveCategory"));
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (id) => {
		const name = editingName.trim();
		if (!name) return;

		try {
			setLoading(true);
			setError("");
			await medicineCategoryApi.updateCategory(id, name);
			setEditingId(null);
			setEditingName("");
			await loadCategories();
		} catch (err) {
			setError(err.message || t("failedToSaveCategory"));
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteConfirm) return;

		try {
			setLoading(true);
			setError("");
			await medicineCategoryApi.deleteCategory(deleteConfirm);
			setDeleteConfirm(null);
			await loadCategories();
		} catch (err) {
			setError(err.message || t("failedToDeleteCategory"));
		} finally {
			setLoading(false);
		}
	};

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
			<Card className="w-full max-w-2xl overflow-hidden bg-white shadow-2xl">
				<CardContent className="space-y-5 p-6" dir="rtl">
					<div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
						<div className="flex items-center gap-3">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
								<Tags className="h-5 w-5" />
							</div>
							<div>
								<h3 className="text-lg font-bold text-slate-900">{t("manageCategories")}</h3>
								<p className="mt-1 text-sm text-slate-500">{t("manageCategoriesHint")}</p>
							</div>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{error}
						</div>
					)}

					<div className="flex flex-col gap-2 sm:flex-row">
						<input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder={t("newCategoryPlaceholder")}
							className={`${inputClasses} flex-1 text-right`}
							onKeyDown={(e) => e.key === "Enter" && handleCreate()}
						/>
						<button
							type="button"
							onClick={handleCreate}
							disabled={loading || !newName.trim()}
							className={`${buttonPrimary} justify-center disabled:cursor-not-allowed disabled:opacity-50`}
						>
							<Plus className="mr-2 h-4 w-4" />
							{t("addCategory")}
						</button>
					</div>

					<div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200">
						{loading && categories.length === 0 ? (
							<div className="p-8 text-center text-sm text-slate-500">{t("loadingCategories")}</div>
						) : categories.length === 0 ? (
							<div className="p-8 text-center text-sm text-slate-500">{t("noCategoriesFound")}</div>
						) : (
							<ul className="divide-y divide-slate-100">
								{categories.map((category) => {
									const isEditing = editingId === category.id;
									const medicineCount = category._count?.medicines ?? 0;

									return (
										<li
											key={category.id}
											className="flex items-center justify-between gap-3 px-4 py-3"
										>
											{isEditing ? (
												<input
													type="text"
													value={editingName}
													onChange={(e) => setEditingName(e.target.value)}
													className={`${inputClasses} flex-1 text-right`}
													onKeyDown={(e) => e.key === "Enter" && handleUpdate(category.id)}
												/>
											) : (
												<div className="min-w-0 flex-1 text-right">
													<p className="font-semibold text-slate-900">{category.name}</p>
													<p className="text-xs text-slate-500">
														{medicineCount} {t("medicinesCount")}
													</p>
												</div>
											)}

											<div className="flex items-center gap-2">
												{isEditing ? (
													<>
														<button
															type="button"
															onClick={() => handleUpdate(category.id)}
															disabled={loading}
															className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
														>
															<Save className="h-4 w-4" />
														</button>
														<button
															type="button"
															onClick={() => {
																setEditingId(null);
																setEditingName("");
															}}
															className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
														>
															<X className="h-4 w-4" />
														</button>
													</>
												) : (
													<>
														<button
															type="button"
															onClick={() => {
																setEditingId(category.id);
																setEditingName(category.name);
															}}
															className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
															title={t("edit")}
														>
															<Pencil className="h-4 w-4" />
														</button>
														<button
															type="button"
															onClick={() => setDeleteConfirm(category.id)}
															className="rounded-lg bg-slate-100 p-2 text-red-600 hover:bg-red-50"
															title={t("delete")}
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</>
												)}
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</div>

					<div className="flex justify-start">
						<button type="button" onClick={onClose} className={buttonSecondary}>
							{t("close")}
						</button>
					</div>
				</CardContent>
			</Card>

			{deleteConfirm && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
					<Card className="w-full max-w-sm bg-white shadow-2xl">
						<CardContent className="space-y-5 p-6 text-right">
							<div>
								<h4 className="text-lg font-bold text-slate-900">{t("deleteCategory")}</h4>
								<p className="mt-1 text-sm text-slate-500">{t("deleteCategoryConfirm")}</p>
							</div>
							<div className="flex justify-start gap-3">
								<button
									type="button"
									onClick={handleDelete}
									disabled={loading}
									className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
