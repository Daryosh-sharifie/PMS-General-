import { useEffect, useState, useCallback } from "react";
import MedicineList from "./MedicineList";
import MedicineForm from "./MedicineForm";
import MedicineCategoryManager from "./MedicineCategoryManager";
import medicineApi from "../../api/medicineApi";
import medicineCategoryApi from "../../api/medicineCategoryApi";
import { backupApi } from "../../api/backupApi";
import { useLanguage } from "../../i18n/LanguageContext";

const ITEMS_PER_PAGE = 20;

function extractMedicineResponse(response) {
	if (response?.data?.medicines) {
		return {
			medicines: response.data.medicines,
			pagination: response.data.pagination,
		};
	}

	if (response?.medicines) {
		return {
			medicines: response.medicines,
			pagination: response.pagination,
		};
	}

	if (Array.isArray(response)) {
		return {
			medicines: response,
			pagination: {
				totalPages: 1,
				totalRecords: response.length,
			},
		};
	}

	return {
		medicines: [],
		pagination: {
			totalPages: 1,
			totalRecords: 0,
		},
	};
}

export default function MedicineManagement() {
	const { t } = useLanguage();

	const [view, setView] = useState("list");
	const [selectedMedicine, setSelectedMedicine] = useState(null);
	const [medicines, setMedicines] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalRecords, setTotalRecords] = useState(0);
	const [categories, setCategories] = useState([]);
	const [showCategoryManager, setShowCategoryManager] = useState(false);

	const fetchCategories = useCallback(async () => {
		try {
			const list = await medicineCategoryApi.getAllCategories();
			setCategories(list);
			return list;
		} catch {
			setCategories([]);
			return [];
		}
	}, []);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const resolveMedicineCategoryId = (medicine, categoryList = categories) => {
		if (medicine?.categoryId) return String(medicine.categoryId);
		if (medicine?.category?.id) return String(medicine.category.id);
		if (medicine?.type) {
			const match = categoryList.find((category) => category.name === medicine.type);
			if (match) return String(match.id);
		}
		return "";
	};

	const fetchMedicines = useCallback(
		async (page = currentPage, search = searchTerm, type = categoryFilter) => {
			try {
				setLoading(true);
				setError("");

				const response = await medicineApi.getAllMedicines(
					page,
					ITEMS_PER_PAGE,
					search,
					type
				);

				const { medicines: list, pagination } = extractMedicineResponse(response);

				setMedicines(list);
				setTotalPages(pagination?.totalPages || 1);
				setTotalRecords(pagination?.totalRecords ?? list.length);
			} catch (err) {
				setError(err.response?.data?.message || err.message || t("failedToLoadMedicines"));
			} finally {
				setLoading(false);
			}
		},
		[currentPage, searchTerm, categoryFilter, t]
	);

	useEffect(() => {
		fetchMedicines(currentPage, searchTerm, categoryFilter);
	}, [currentPage, searchTerm, categoryFilter, fetchMedicines]);

	const openForm = async (medicine = null) => {
		const categoryList = categories.length ? categories : await fetchCategories();
		if (medicine) {
			setSelectedMedicine({
				...medicine,
				categoryId: resolveMedicineCategoryId(medicine, categoryList),
			});
		} else {
			setSelectedMedicine(null);
		}
		setView("form");
		setError("");
	};

	const closeForm = () => {
		setSelectedMedicine(null);
		setView("list");
	};

	const handleDeleteMedicine = async (id) => {
		try {
			setLoading(true);
			await medicineApi.deleteMedicine(id);
			await fetchMedicines(currentPage, searchTerm, categoryFilter);
		} catch (err) {
			setError(err.response?.data?.message || err.message || t("failedToDeleteMedicine"));
		} finally {
			setLoading(false);
		}
	};

	const handleSubmitMedicine = async (formData) => {
		try {
			setLoading(true);
			setError("");

			const payload = {
				categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
				companyName: formData.companyName,
				genericName: formData.genericName,
				dosage: formData.dosage,
				frequency: formData.frequency,
				mealTiming: formData.mealTiming,
			};

			if (selectedMedicine?.id) {
				await medicineApi.updateMedicine(selectedMedicine.id, payload);
			} else {
				await medicineApi.createMedicine(payload);
			}

			await fetchMedicines(currentPage, searchTerm, categoryFilter);
			closeForm();
		} catch (err) {
			setError(err.response?.data?.message || err.message || t("failedToSaveMedicine"));
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const handleBackup = async () => {
		try {
			await backupApi.downloadMedicinesBackup();
		} catch (err) {
			alert(err.message || t("backupFailed"));
		}
	};

	const handleSearchChange = (term) => {
		setSearchTerm(term);
		setCurrentPage(1);
	};

	const handleCategoryChange = (type) => {
		setCategoryFilter(type);
		setCurrentPage(1);
	};

	return (
		<>
			{error && (
				<div className="mx-4 mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 md:mx-6">
					<span className="text-sm font-medium">{error}</span>
					<button
						type="button"
						onClick={() => setError("")}
						className="text-lg font-bold text-red-600 hover:text-red-800"
					>
						×
					</button>
				</div>
			)}

			{view === "list" ? (
				<MedicineList
					medicines={medicines}
					categories={categories}
					searchTerm={searchTerm}
					setSearchTerm={handleSearchChange}
					categoryFilter={categoryFilter}
					setCategoryFilter={handleCategoryChange}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
					totalPages={totalPages}
					totalRecords={totalRecords}
					onAddMedicine={() => openForm()}
					onEditMedicine={openForm}
					onDeleteMedicine={handleDeleteMedicine}
					onBackup={handleBackup}
					onManageCategories={() => setShowCategoryManager(true)}
					loading={loading}
				/>
			) : (
				<MedicineForm
					initialData={selectedMedicine}
					onSubmit={handleSubmitMedicine}
					onCancel={closeForm}
					loading={loading}
					categories={categories}
					onCategoriesChange={setCategories}
				/>
			)}

			<MedicineCategoryManager
				open={showCategoryManager}
				onClose={() => setShowCategoryManager(false)}
				onCategoriesChange={setCategories}
				t={t}
			/>
		</>
	);
}