import {
	Search,
	Plus,
	Edit2,
	Trash2,
	ChevronLeft,
	ChevronRight,
	Filter,
	Download,
	Pill,
	Tags,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import { inputClasses, buttonPrimary, buttonGhost } from "../../constants/styles";
import { useLanguage } from "../../i18n/LanguageContext";

const ITEMS_PER_PAGE = 20;

export default function MedicineList({
	medicines,
	categories = [],
	searchTerm,
	setSearchTerm,
	categoryFilter = "",
	setCategoryFilter,
	currentPage,
	setCurrentPage,
	totalPages,
	totalRecords = 0,
	onAddMedicine,
	onEditMedicine,
	onDeleteMedicine,
	onBackup,
	onManageCategories,
	loading = false,
}) {
	const { t } = useLanguage();
	const [deleteConfirm, setDeleteConfirm] = useState(null);

	const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

	const confirmDelete = async () => {
		if (!deleteConfirm) return;
		await onDeleteMedicine(deleteConfirm);
		setDeleteConfirm(null);
	};

	const columns = [
		{ key: "actions", label: t("actions"), align: "center" },
		{ key: "mealTiming", label: t("mealTiming"), align: "center" },
		{ key: "frequency", label: t("frequency"), align: "center" },
		{ key: "dosage", label: t("dosage"), align: "center" },
		{ key: "genericName", label: t("genericName"), align: "right" },
		{ key: "companyName", label: t("companyName"), align: "right" },
		{ key: "type", label: t("medicineType"), align: "right" },
		{ key: "no", label: "#", align: "center" },
	];

	return (
		<div className="space-y-5 p-3 sm:p-6">
			<DeleteModal
				open={Boolean(deleteConfirm)}
				onCancel={() => setDeleteConfirm(null)}
				onConfirm={confirmDelete}
				t={t}
			/>

			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 sm:h-12 sm:w-12">
						<Pill className="h-5 w-5 sm:h-6 sm:w-6" />
					</div>
					<div className="text-right">
						<h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t("medicineManagement")}</h2>
						<p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
							{totalRecords > 0
								? `${t("total")}: ${totalRecords} ${t("medicinesCount")}`
								: t("manageMedicineInventory")}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{onManageCategories && (
						<button
							type="button"
							onClick={onManageCategories}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
							title={t("manageCategories")}
						>
							<Tags className="h-4 w-4" />
							{t("manageCategories")}
						</button>
					)}

					{onBackup && (
						<button
							type="button"
							onClick={onBackup}
							className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-4 sm:text-sm"
							title={t("downloadBackup")}
						>
							<Download className="h-4 w-4" />
							{t("backup")}
						</button>
					)}

					<button type="button" onClick={onAddMedicine} className={`${buttonPrimary} text-xs sm:text-sm`}>
						<Plus className="mr-2 h-4 w-4" />
						{t("addMedicine")}
					</button>
				</div>
			</div>

			<Card className="rounded-2xl border border-slate-200 shadow-sm">
				<CardContent className="space-y-4 p-4">
					<div dir="rtl" className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="flex w-full items-center gap-2 sm:w-72">
							<Filter className="h-4 w-4 shrink-0 text-slate-500" />
							<select
								value={categoryFilter}
								onChange={(e) => setCategoryFilter(e.target.value)}
								className={`${inputClasses} cursor-pointer`}
							>
								<option value="">{t("all")} — {t("category")}</option>
								{categories.map((category) => (
									<option key={category.id} value={category.name}>
										{category.name}
									</option>
								))}
							</select>
						</div>

						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<input
								className={`${inputClasses} pl-10 text-right`}
								placeholder={t("searchMedicinePlaceholder")}
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
				<CardContent className="p-0">
					{loading ? (
						<EmptyState loading title={t("loadingMedicines")} />
					) : medicines.length === 0 ? (
						<EmptyState title={t("noMedicinesFound")} />
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<thead className="border-b border-slate-200 bg-slate-50">
										<tr>
											{columns.map((column) => (
												<th
													key={column.key}
													className={`px-4 py-3 text-${column.align} text-xs font-bold uppercase tracking-wide text-slate-500`}
												>
													{column.label}
												</th>
											))}
										</tr>
									</thead>

									<tbody className="divide-y divide-slate-100 text-right">
										{medicines.map((medicine, index) => (
											<tr key={medicine.id} className="transition hover:bg-slate-50">
												<td className="px-4 py-4 text-center">
													<div className="flex justify-center gap-2">
														<button
															type="button"
															className={`${buttonGhost} px-2 py-1`}
															onClick={() => onEditMedicine(medicine)}
															title={t("edit")}
														>
															<Edit2 className="h-4 w-4" />
														</button>
														<button
															type="button"
															className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
															onClick={() => setDeleteConfirm(medicine.id)}
															title={t("delete")}
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</div>
												</td>

												<td className="px-4 py-4 text-center">
													<Badge className="border-blue-200 bg-blue-50 text-blue-800">
														{medicine.mealTiming || "-"}
													</Badge>
												</td>
												<td className="px-4 py-4 text-center text-slate-800">
													{medicine.frequency || "-"}
												</td>
												<td className="px-4 py-4 text-center text-slate-800">
													{medicine.dosage || "-"}
												</td>
												<td className="px-4 py-4 font-semibold text-slate-900">
													{medicine.genericName || "-"}
												</td>
												<td className="px-4 py-4 text-slate-700">
													{medicine.companyName || "-"}
												</td>
												<td className="px-4 py-4">
													<Badge className="border-slate-200 bg-slate-100 text-slate-700">
														{medicine.category?.name || medicine.type || "-"}
													</Badge>
												</td>
												<td className="px-4 py-4 text-center text-sm text-slate-500">
													{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								goToPage={goToPage}
							/>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function EmptyState({ loading = false, title }) {
	return (
		<div className="p-10 text-center text-slate-500">
			{loading && (
				<div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
			)}
			<p className="font-medium">{title}</p>
		</div>
	);
}

function Pagination({ currentPage, totalPages, goToPage }) {
	if (totalPages <= 1) return null;

	const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

	return (
		<div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4">
			<button
				type="button"
				onClick={() => goToPage(currentPage - 1)}
				disabled={currentPage === 1}
				className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
			>
				<ChevronLeft className="h-5 w-5" />
			</button>

			<div className="flex items-center gap-1">
				{pages.map((page) => (
					<button
						key={page}
						type="button"
						onClick={() => goToPage(page)}
						className={`h-8 w-8 rounded-lg text-sm font-semibold transition ${
							currentPage === page
								? "bg-blue-600 text-white"
								: "text-slate-700 hover:bg-slate-200"
						}`}
					>
						{page}
					</button>
				))}
			</div>

			<button
				type="button"
				onClick={() => goToPage(currentPage + 1)}
				disabled={currentPage === totalPages}
				className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
			>
				<ChevronRight className="h-5 w-5" />
			</button>
		</div>
	);
}

function DeleteModal({ open, onCancel, onConfirm, t }) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
			<Card className="w-full max-w-sm bg-white shadow-2xl">
				<CardContent className="space-y-5 p-6 text-right">
					<div>
						<h3 className="text-lg font-bold text-slate-900">{t("deleteMedicine")}</h3>
						<p className="mt-1 text-sm text-slate-500">{t("deleteMedicineConfirm")}</p>
					</div>

					<div className="flex justify-start gap-3">
						<button
							type="button"
							onClick={onConfirm}
							className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
						>
							{t("delete")}
						</button>
						<button
							type="button"
							onClick={onCancel}
							className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
						>
							{t("cancel")}
						</button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}