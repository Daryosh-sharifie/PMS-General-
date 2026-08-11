import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { COMMON_MEDICINES_FRONTEND } from "../../constants/commonMedicines";
import medicineApi from "../../api/medicineApi";

const TYPE_MAP = {
	"قرص": "Tablet",
	"کپسول": "Capsule",
	"سیروپ": "Syrup",
	"انجکشن": "Injection",
	"قطره": "Drops",
	"مرهم": "Ointment",
	"پماد": "Paste",
	"ویال": "Vial",
	"شیاف": "Suppository",
	"اسپری": "Spray",
	"انفوزیون": "Infusion",
	"محلول": "Solution",
	"پودر": "Powder",
};

const MEAL_MAP = {
	"قبل از غذا": "Before Food",
	"بعد از غذا": "After Food",
	"بدون توجه به غذا": "Anytime",
	"با غذا": "With Food",
};

export default function MedicineSearchInput({
	medicineIndex,
	medicine = {},
	onMedicineChange,
}) {
	const [searchQuery, setSearchQuery] = useState(medicine?.name || "");
	const [filteredMedicines, setFilteredMedicines] = useState([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const dropdownRef = useRef(null);
	const searchTimeoutRef = useRef(null);

	const activeType = medicine?.type || "";

	const getLocalMatches = (query, type = "") => {
		const normalized = query.trim().toLowerCase();
		let results = COMMON_MEDICINES_FRONTEND;

		if (normalized) {
			results = results.filter((med) => {
				const haystack = [
					med.genericName,
					med.name,
					med.companyName,
					med.type,
					med.dosage,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				return haystack.includes(normalized);
			});
		}

		if (type) {
			results = results.filter(
				(med) => (med.type || "").toLowerCase() === type.toLowerCase()
			);
		}

		return results;
	};

	useEffect(() => {
		const next = medicine?.name || "";
		if (next !== searchQuery) {
			setSearchQuery(next);
			setShowDropdown(false);
			setFilteredMedicines([]);
		}
	}, [medicine?.name]);

	useEffect(() => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}

		searchTimeoutRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const response = await medicineApi.getAllMedicines(
					1,
					30,
					searchQuery,
					activeType
				);
				const dbMedicines = response?.data?.medicines || [];

				if (dbMedicines.length > 0) {
					setFilteredMedicines(dbMedicines);
				} else {
					setFilteredMedicines(getLocalMatches(searchQuery, activeType));
				}
			} catch {
				setFilteredMedicines(getLocalMatches(searchQuery, activeType));
			} finally {
				setIsSearching(false);
			}
		}, 300);

		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, [searchQuery, activeType]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target)
			) {
				setShowDropdown(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelectMedicine = (selectedMedicine) => {
		const fieldsToTry = {
			name: [
				"genericName",
				"generic_name",
				"name",
				"brandName",
				"brand_name",
			],
			dosage: [
				"dosage",
				"dosageForm",
				"dosage_form",
				"strength",
				"dose",
			],
			frequency: ["frequency", "freq", "doseFrequency", "dose_frequency"],
			type: ["type", "form", "dosageForm"],
			route: ["route", "administrationRoute", "type"],
			companyName: ["companyName", "company_name", "manufacturer"],
			mealTiming: ["mealTiming", "meal_timing", "meal"],
		};

		const values = {};
		for (const [fieldName, possibleKeys] of Object.entries(fieldsToTry)) {
			for (const key of possibleKeys) {
				if (selectedMedicine[key]) {
					values[fieldName] = selectedMedicine[key];
					break;
				}
			}
		}

		if (values.type) values.type = TYPE_MAP[values.type] || values.type;
		if (values.mealTiming)
			values.mealTiming = MEAL_MAP[values.mealTiming] || values.mealTiming;

		onMedicineChange(medicineIndex, values);

		setSearchQuery(values.name || "");
		setShowDropdown(false);
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setSearchQuery(value);
		setShowDropdown(true);
		onMedicineChange(medicineIndex, "name", value);
	};

	const handleKeyDown = (e) => {
		if (e.key === "Tab") {
			const medicineRow = e.target.closest(".grid");
			if (medicineRow) {
				e.preventDefault();

				const allFields = Array.from(
					medicineRow.querySelectorAll("input, select")
				);
				const currentIndex = allFields.indexOf(e.target);

				if (e.shiftKey) {
					if (currentIndex < allFields.length - 1) {
						allFields[currentIndex + 1].focus();
					} else {
						const prevRow = medicineRow.previousElementSibling;
						if (prevRow && prevRow.classList.contains("grid")) {
							const fields =
								prevRow.querySelectorAll("input, select");
							fields[0]?.focus();
						}
					}
				} else {
					if (currentIndex > 0) {
						allFields[currentIndex - 1].focus();
					} else {
						const nextRow = medicineRow.nextElementSibling;
						if (nextRow && nextRow.classList.contains("grid")) {
							const fields =
								nextRow.querySelectorAll("input, select");
							fields[fields.length - 1]?.focus();
						}
					}
				}
			}
		}
	};

	return (
		<div className="relative h-full w-full" ref={dropdownRef}>
			<div className="flex h-full items-center">
				<div className="relative h-full flex-1">
					<Search className="absolute left-0.5 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-500" />
					<input
						type="text"
						className="h-full w-full pl-5 text-left border border-blue-500 rounded-lg text-sm bg-white/80 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300 focus:border-blue-500 transition"
						value={searchQuery}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={() => setShowDropdown(true)}
					/>
				</div>
			</div>

			{showDropdown && isSearching && (
				<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-blue-200 rounded-lg shadow-xl z-50 px-3 py-3 text-sm text-gray-500 text-center">
					در حال جستجو...
				</div>
			)}

			{showDropdown &&
				!isSearching &&
				filteredMedicines.length > 0 && (
					<div className="absolute top-full left-0 w-[350px] mt-2 bg-white border border-blue-200 rounded-xl shadow-2xl z-50 max-h-[280px] overflow-y-auto backdrop-blur">
						{filteredMedicines.map((med, idx) => (
							<button
								key={med.id || idx}
								type="button"
								onClick={() => handleSelectMedicine(med)}
								className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm transition-colors text-gray-800"
							>
								<div className="flex justify-between items-start gap-2">
									<div className="flex-1">
										<p className="font-semibold text-gray-900 break-words">
											{med.genericName}
										</p>
										<p className="text-xs text-gray-600 mt-1 break-words">
											{med.companyName} • {med.type} •{" "}
											{med.dosage}
										</p>
										<p className="text-[11px] text-blue-600 mt-1 break-words">
											{med.frequency} •{" "}
											{med.mealTiming}
										</p>
									</div>
								</div>
							</button>
						))}

						{filteredMedicines.length > 5 && (
							<div className="px-3 py-2 text-xs text-gray-500 text-center border-t border-gray-100 bg-gray-50">
								برای داروهای بیشتر اسکرول کنید
							</div>
						)}
					</div>
				)}

			{showDropdown &&
				!isSearching &&
				(searchQuery || activeType) &&
				filteredMedicines.length === 0 && (
					<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-red-200 rounded-lg shadow-xl z-50 px-3 py-3 text-sm text-gray-600 text-center">
						داروی مطابق یافت نشد
					</div>
				)}
		</div>
	);
}