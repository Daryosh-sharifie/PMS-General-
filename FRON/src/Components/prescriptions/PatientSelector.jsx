import { Calendar, Mail, Phone, Plus, Search, User, X } from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { useLanguage } from "../../i18n/LanguageContext";
import { displayPatientAge, formatDate } from "../../utils/helpers";

function getGenderLabel(gender, t) {
	const value = String(gender || "").toLowerCase();

	if (value === "male") return t("male");
	if (value === "female") return t("female");

	return gender || "-";
}

function getPatientName(patient) {
	return patient?.name || patient?.fullname || "-";
}

function getFatherName(patient) {
	return patient?.fathername || patient?.fatherName || "-";
}

export default function PatientSelector({
	selectedPatient,
	prescriptionForm,
	setPrescriptionForm,
	onSelectPatient,
	onClearPatientSelection,
	patientSearch,
	setPatientSearch,
	showPatientDropdown,
	setShowPatientDropdown,
	filteredPatients = [],
	isSearching,
	onOpenAddPatient,
}) {
	const { t, language } = useLanguage();
	const isFa = language === "fa";

	const selectedName =
		prescriptionForm.patientName || getPatientName(selectedPatient);

	const selectedFatherName =
		prescriptionForm.patientFathername || getFatherName(selectedPatient);

	const selectedGender =
		prescriptionForm.patientGender || selectedPatient?.gender || "";

	const selectedAge =
		prescriptionForm.patientAge || selectedPatient?.age || "";

	if (selectedPatient) {
		return (
			<div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-center">
					<div className="flex items-center gap-3">
						<button
							type="button"
							title={t("changePatient")}
							className="rounded-xl bg-slate-100 p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
							onClick={() => {
								onClearPatientSelection?.();
								setPatientSearch("");
							}}
						>
							<X className="h-4 w-4" />
						</button>

						<div className="rounded-2xl bg-blue-600 p-3 text-white">
							<User className="h-5 w-5" />
						</div>
					</div>

					<div className="grid flex-1 grid-cols-2 gap-3 text-sm md:grid-cols-3 xl:grid-cols-6">
						<Info label={t("id")} value={`#${selectedPatient.id}`} strong />
						<Info label={t("patientName")} value={selectedName} />
						<Info label={t("fatherName")} value={selectedFatherName} />
						<Info label={t("gender")} value={getGenderLabel(selectedGender, t)} />
						<Info
							label={t("age")}
							value={displayPatientAge(selectedAge, language)}
						/>

						<div className="rounded-xl bg-slate-50 p-2">
							<span className="block text-[10px] text-slate-500">
								{t("date")}
							</span>

							<DatePicker
								{...(isFa
									? {
											calendar: persian,
											locale: persian_fa,
									  }
									: {})}
								calendarPosition="bottom-right"
								value={prescriptionForm.dateJalali || ""}
								onChange={(dateObj) => {
									const dateStr = dateObj ? dateObj.format("YYYY/MM/DD") : "";

									setPrescriptionForm({
										...prescriptionForm,
										dateJalali: dateStr,
									});
								}}
								inputClass="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-400"
								placeholder={t("date")}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="hidden rounded-2xl bg-blue-600 p-3 text-white sm:block">
					<User className="h-5 w-5" />
				</div>

				<div className="relative w-full">
					<input
						type="search"
						placeholder={t("searchPatientPlaceholder")}
						className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
						value={patientSearch}
						onChange={(e) => {
							setPatientSearch(e.target.value);
							setShowPatientDropdown(true);
						}}
						onFocus={() => setShowPatientDropdown(true)}
					/>

					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
						<Search className="h-5 w-5" />
					</div>
				</div>

				<button
					type="button"
					onClick={onOpenAddPatient}
					className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
					title={t("addPatient")}
				>
					<Plus className="h-4 w-4" />
					<span className="sm:hidden">{t("addPatient")}</span>
				</button>
			</div>

			{(showPatientDropdown || patientSearch) && (
				<div className="relative z-20 mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
					<div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2">
						<span className="text-sm font-semibold text-slate-700">
							{isSearching
								? t("searching")
								: patientSearch
								? `${t("searchResults")} (${filteredPatients.length})`
								: t("recentPatients")}
						</span>

						<button
							type="button"
							onClick={() => {
								setShowPatientDropdown(false);
								setPatientSearch("");
							}}
							className="text-slate-400 hover:text-slate-700"
							title={t("close")}
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<div className="max-h-80 overflow-y-auto">
						{filteredPatients.length === 0 ? (
							<div className="p-6 text-center text-sm text-slate-500">
								{t("noPatientsFound")}
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{filteredPatients.map((patient) => (
									<button
										key={patient.id}
										type="button"
										className="w-full p-4 text-right transition hover:bg-blue-50"
										onClick={() => {
											onSelectPatient?.(patient);
											setShowPatientDropdown(false);
											setPatientSearch("");
										}}
									>
										<div className="flex items-start gap-3">
											<div className="rounded-xl bg-blue-50 p-2 text-blue-600">
												<User className="h-5 w-5" />
											</div>

											<div className="min-w-0 flex-1">
												<div className="mb-1 flex items-center justify-between gap-3">
													<span className="font-bold text-slate-900">
														{getPatientName(patient)}
													</span>

													<span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
														{t("id")}: {patient.id}
													</span>
												</div>

												<p className="text-xs text-slate-500">
													{t("fatherName")}: {getFatherName(patient)}
												</p>

												<div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
													<span className="flex items-center gap-1">
														<Phone className="h-3 w-3" />
														{patient.phone || "-"}
													</span>

													<span>
														{t("age")}:{" "}
														{displayPatientAge(patient.age, language)}
													</span>

													<span>
														{t("gender")}:{" "}
														{getGenderLabel(patient.gender, t)}
													</span>

													<span className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														{formatDate(patient.lastVisit, language)}
													</span>

													{patient.email && (
														<span className="flex items-center gap-1 truncate sm:col-span-2">
															<Mail className="h-3 w-3" />
															{patient.email}
														</span>
													)}
												</div>
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{showPatientDropdown && (
				<div
					className="fixed inset-0 z-10"
					onClick={() => setShowPatientDropdown(false)}
				/>
			)}
		</div>
	);
}

function Info({ label, value, strong }) {
	return (
		<div className="rounded-xl bg-slate-50 p-2">
			<span className="block text-[10px] text-slate-500">{label}</span>
			<span
				className={
					strong
						? "font-bold text-blue-700"
						: "font-semibold text-slate-900"
				}
			>
				{value || "-"}
			</span>
		</div>
	);
}