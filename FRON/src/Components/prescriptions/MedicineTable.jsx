import { useEffect, useState } from "react";
import MedicineSearchInput from "./MedicineSearchInput";
import { FREQUENCY_OPTIONS, MEDICINE_TYPES } from "./prescriptionForm.constants";
import { useLanguage } from "../../i18n/LanguageContext";
import medicineCategoryApi from "../../api/medicineCategoryApi";
import {
	medicineFrequencyApi,
	medicineMealTimingApi,
} from "../../api/medicineLookupApi";

const mergeOptions = (defaults, fetched, extra) => {
	const merged = [...defaults];

	for (const item of fetched) {
		const name = typeof item === "string" ? item : item?.name;
		if (name && !merged.includes(name)) merged.push(name);
	}

	if (extra && !merged.includes(extra)) merged.push(extra);

	return merged;
};

export default function MedicineTable({
	prescriptionNo,
	currentPage,
	handleMedicineChange,
	handleMedicineRowKeyDown,
	prescriptionForm,
	setPrescriptionForm,
}) {
	const { t } = useLanguage();

	const [categories, setCategories] = useState([]);
	const [frequencies, setFrequencies] = useState([]);
	const [mealTimings, setMealTimings] = useState([]);

	useEffect(() => {
		let active = true;

		medicineCategoryApi
			.getAllCategories()
			.then((data) => active && setCategories(data))
			.catch(() => {});

		medicineFrequencyApi
			.getAll()
			.then((data) => active && setFrequencies(data))
			.catch(() => {});

		medicineMealTimingApi
			.getAll()
			.then((data) => active && setMealTimings(data))
			.catch(() => {});

		return () => {
			active = false;
		};
	}, []);

	const defaultMealOptions = [
		{ value: "Before Food", label: t("beforeFood") },
		{ value: "After Food", label: t("afterFood") },
		{ value: "With Food", label: t("withFood") },
		{ value: "Anytime", label: t("anytime") },
	];

	const buildMealOptions = (currentValue) => {
		const options = [...defaultMealOptions];

		for (const item of mealTimings) {
			const name = typeof item === "string" ? item : item?.name;
			if (name && !options.some((option) => option.value === name)) {
				options.push({ value: name, label: name });
			}
		}

		if (currentValue && !options.some((option) => option.value === currentValue)) {
			options.push({ value: currentValue, label: currentValue });
		}

		return options;
	};

	return (
		<section
			dir="rtl"
			className="flex h-full w-full flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5"
		>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
				<div>
					<p className="text-sm font-bold text-blue-700">{t("rxMedicines")}</p>
					<p className="text-xs leading-5 text-slate-500">{t("enterMedicineRows")}</p>
				</div>

				<div className="flex items-center gap-2">
					<span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 sm:hidden">
						↔ {t("scrollTable") || "Scroll table"}
					</span>
					<span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
						{prescriptionNo || t("generating")}
					</span>
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-x-auto pb-2 touch-pan-x">
				<div className="flex h-full min-w-[720px] sm:min-w-[760px] flex-col">
					<div className="mb-3 grid shrink-0 grid-cols-12 gap-2 rounded-xl bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700">
						<span className="col-span-2 text-center">{t("mealTiming")}</span>
						<span className="col-span-1 text-center">{t("frequency")}</span>
						<span className="col-span-2 text-center">{t("dose")}</span>
						<span className="col-span-1 text-center">{t("qty")}</span>
						<span className="col-span-3 text-center">{t("medicineName")}</span>
						<span className="col-span-2 text-center">{t("type")}</span>
						<span className="col-span-1 text-center">{t("no")}</span>
					</div>

					<div className="flex min-h-0 flex-1 flex-col gap-2">
						{Array.from({ length: 10 }).map((_, index) => {
							const medicine = currentPage?.medicines?.[index] || {};

							return (
								<div
									key={index}
									className="medicine-row grid min-h-0 flex-1 grid-cols-12 gap-2"
								>
									<select
										className="col-span-2 h-full min-h-[2.25rem] rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.mealTiming || ""}
										onChange={(event) =>
											handleMedicineChange(index, "mealTiming", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
									>
										<option value=""></option>
										{buildMealOptions(medicine.mealTiming).map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>

									<select
										className="col-span-1 h-full min-h-[2.25rem] rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.frequency || ""}
										onChange={(event) =>
											handleMedicineChange(index, "frequency", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
									>
										<option value=""></option>
										{mergeOptions(
											FREQUENCY_OPTIONS,
											frequencies,
											medicine.frequency
										).map((frequency) => (
											<option key={frequency} value={frequency}>
												{frequency}
											</option>
										))}
									</select>

									<input
										type="text"
										className="col-span-2 h-full min-h-[2.25rem] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.dosage || ""}
										onChange={(event) =>
											handleMedicineChange(index, "dosage", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
										placeholder={t("dose")}
									/>

									<input
										type="text"
										className="col-span-1 h-full min-h-[2.25rem] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.amount || ""}
										onChange={(event) =>
											handleMedicineChange(index, "amount", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
										placeholder={t("qty")}
									/>

									<div className="col-span-3 flex h-full min-h-[2.25rem]" data-field="name">
										<MedicineSearchInput
											medicineIndex={index}
											medicine={medicine}
											onMedicineChange={handleMedicineChange}
										/>
									</div>

									<select
										className="col-span-2 h-full min-h-[2.25rem] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.type || medicine.route || ""}
										onChange={(event) => {
											handleMedicineChange(index, {
												type: event.target.value,
												route: event.target.value,
											});
										}}
										onKeyDown={handleMedicineRowKeyDown}
									>
										<option value=""></option>
										{mergeOptions(
											MEDICINE_TYPES,
											categories,
											medicine.type || medicine.route
										).map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>

									<div className="col-span-1 flex h-full min-h-[2.25rem] items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-500">
										{index + 1}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="mt-4 shrink-0">
				<p className="mb-2 text-left text-xs font-semibold text-slate-700">
					{t("instructions")}
				</p>
				<textarea
					className="h-16 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs outline-none focus:border-blue-400 focus:bg-white"
					value={prescriptionForm.instructions || ""}
					onChange={(event) =>
						setPrescriptionForm({
							...prescriptionForm,
							instructions: event.target.value,
						})
					}
				/>
			</div>
		</section>
	);
}
