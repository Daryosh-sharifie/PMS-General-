import MedicineSearchInput from "./MedicineSearchInput";
import { FREQUENCY_OPTIONS, MEDICINE_TYPES } from "./prescriptionForm.constants";
import { useLanguage } from "../../i18n/LanguageContext";

export default function MedicineTable({
	prescriptionNo,
	currentPage,
	handleMedicineChange,
	handleMedicineRowKeyDown,
	prescriptionForm,
	setPrescriptionForm,
}) {
	const { t } = useLanguage();

	const mealOptions = [
		{ value: "Before Food", label: t("beforeFood") },
		{ value: "After Food", label: t("afterFood") },
		{ value: "With Food", label: t("withFood") },
		{ value: "Anytime", label: t("anytime") },
	];

	return (
		<section
			dir="rtl"
			className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4"
		>
			<div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-bold text-blue-700">{t("rxMedicines")}</p>
					<p className="text-xs text-slate-500">{t("enterMedicineRows")}</p>
				</div>

				<span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
					{prescriptionNo || t("generating")}
				</span>
			</div>

			<div className="overflow-x-auto">
				<div className="min-w-[760px]">
					<div className="mb-3 grid grid-cols-12 gap-2 rounded-xl bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700">
						<span className="col-span-2 text-center">{t("mealTiming")}</span>
						<span className="col-span-1 text-center">{t("frequency")}</span>
						<span className="col-span-2 text-center">{t("dose")}</span>
						<span className="col-span-1 text-center">{t("qty")}</span>
						<span className="col-span-3 text-center">{t("medicineName")}</span>
						<span className="col-span-2 text-center">{t("type")}</span>
						<span className="col-span-1 text-center">{t("no")}</span>
					</div>

					<div className="space-y-2">
						{Array.from({ length: 12 }).map((_, index) => {
							const medicine = currentPage?.medicines?.[index] || {};

							return (
								<div key={index} className="medicine-row grid grid-cols-12 gap-2">
									<select
										className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.mealTiming || ""}
										onChange={(event) =>
											handleMedicineChange(index, "mealTiming", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
									>
										<option value=""></option>
										{mealOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>

									<select
										className="col-span-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.frequency || ""}
										onChange={(event) =>
											handleMedicineChange(index, "frequency", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
									>
										<option value=""></option>
										{FREQUENCY_OPTIONS.map((frequency) => (
											<option key={frequency} value={frequency}>
												{frequency}
											</option>
										))}
									</select>

									<input
										type="text"
										className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.dosage || ""}
										onChange={(event) =>
											handleMedicineChange(index, "dosage", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
										placeholder={t("dose")}
									/>

									<input
										type="text"
										className="col-span-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
										value={medicine.amount || ""}
										onChange={(event) =>
											handleMedicineChange(index, "amount", event.target.value)
										}
										onKeyDown={handleMedicineRowKeyDown}
										placeholder={t("qty")}
									/>

									<div className="col-span-3" data-field="name">
										<MedicineSearchInput
											medicineIndex={index}
											medicine={medicine}
											onMedicineChange={handleMedicineChange}
										/>
									</div>

									<select
										className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-400 focus:bg-white"
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
										{MEDICINE_TYPES.map((type) => (
											<option key={type} value={type}>
												{type}
											</option>
										))}
									</select>

									<div className="col-span-1 flex items-center justify-center rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-500">
										{index + 1}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="mt-4">
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
