import { useState } from "react";
import { Card, CardContent } from "../ui/Card";
import {
	inputClasses,
	buttonPrimary,
	buttonSecondary,
} from "../../constants/styles";
import useStore from "../../store/useStore.jsx";
import { X, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { formatPatientAge, parsePatientAge } from "../../utils/helpers";
import AgeInput from "./AgeInput";
import { useLanguage } from "../../i18n/LanguageContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function PatientForm({ onCancel }) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";

	const { patientForm, setPatientForm, createPatient, resetPatientForm } =
		useStore();

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const parsedAge = parsePatientAge(patientForm.age);

	const updateField = (field, value) => {
		setPatientForm({ ...patientForm, [field]: value });
	};

	const handleAgeChange = (value, unit) => {
		setPatientForm({ ...patientForm, age: formatPatientAge(value, unit) });
	};

	const handleCancel = () => {
		resetPatientForm();
		onCancel?.();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			setLoading(true);
			setError("");
			setSuccess(false);

			const result = await createPatient();

			if (!result) {
				setError(t("failedToCreatePatient"));
				return;
			}

			setSuccess(true);
			setTimeout(() => {
				resetPatientForm();
				onCancel?.();
			}, 900);
		} catch (err) {
			setError(err.message || t("failedToCreatePatient"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-slate-50 px-4 py-8">
			<Card className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
				<CardContent className="relative p-6 md:p-8">
					<button
						type="button"
						onClick={handleCancel}
						className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
						title={t("cancel")}
					>
						<X size={22} />
					</button>

					<form onSubmit={handleSubmit} className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
						<div className="flex items-center justify-center border-b border-slate-100 pb-6 text-center">
							<div>
								<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
									<UserPlus className="h-7 w-7" />
								</div>
								<h2 className="text-3xl font-bold text-slate-900">
									{t("addNewPatient")}
								</h2>
								<p className="mt-1 text-sm text-slate-500">
									{t("patientFormSubtitle")}
								</p>
							</div>
						</div>

						{error && (
							<Message type="error" icon={AlertCircle} text={error} />
						)}

						{success && (
							<Message
								type="success"
								icon={CheckCircle}
								text={t("patientCreatedSuccessfully")}
							/>
						)}

						<Section title={t("personalInformation")} isRtl={isRtl}>
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<FormInput
									label={t("fullName")}
									value={patientForm.fullname}
									onChange={(value) => updateField("fullname", value)}
									required
									isRtl={isRtl}
								/>

								<FormInput
									label={t("fatherName")}
									value={patientForm.fathername}
									onChange={(value) => updateField("fathername", value)}
									required
									isRtl={isRtl}
								/>

								<div>
									<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>
										{t("gender")} <span className="text-red-500">*</span>
									</label>
									<select
										className={inputClasses}
										value={patientForm.gender}
										onChange={(e) => updateField("gender", e.target.value)}
										required
									>
										<option value="" disabled>{t("selectGender")}</option>
										<option value="Male">{t("male")}</option>
										<option value="Female">{t("female")}</option>
									</select>
								</div>

								<div>
									<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>
										{t("age")} <span className="text-red-500">*</span>
									</label>
									<AgeInput
										value={parsedAge.value}
										unit={parsedAge.unit}
										onChange={handleAgeChange}
										inputClassName={inputClasses}
										required
									/>
									<p className={`mt-1 text-xs text-slate-500 ${isRtl ? "text-right" : "text-left"}`}>
										{t("ageExample")}
									</p>
								</div>
							</div>
						</Section>

						<Section title={t("medicalInformation")} isRtl={isRtl}>
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<div>
									<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>
										{t("bloodGroup")}
									</label>
									<select
										className={inputClasses}
										value={patientForm.bloodGroup}
										onChange={(e) => updateField("bloodGroup", e.target.value)}
									>
										<option value="">{t("selectBloodGroup")}</option>
										{BLOOD_GROUPS.map((bg) => (
											<option key={bg} value={bg}>
												{bg}
											</option>
										))}
									</select>
								</div>

								<FormInput
									label={t("phone")}
									type="tel"
									value={patientForm.phone}
									onChange={(value) => updateField("phone", value)}
									isRtl={isRtl}
								/>
							</div>
						</Section>

						<Section title={t("knownAllergies")} isRtl={isRtl}>
							<textarea
								className={`${inputClasses} h-24 resize-none`}
								value={patientForm.knownallergies}
								onChange={(e) => updateField("knownallergies", e.target.value)}
								placeholder={t("knownAllergiesPlaceholder")}
							/>
						</Section>

						<div
							dir="ltr"
							className={`flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row ${
								isRtl ? "sm:justify-end" : "sm:justify-start"
							}`}
						>
							<button
								type="button"
								className={`${buttonSecondary} justify-center`}
								onClick={handleCancel}
								disabled={loading}
							>
								{t("cancel")}
							</button>

							<button
								type="submit"
								className={`${buttonPrimary} justify-center disabled:cursor-not-allowed disabled:opacity-60`}
								disabled={loading || success}
							>
								{loading
									? t("processing")
									: success
									? t("success")
									: t("addPatient")}
							</button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

function Section({ title, children, isRtl = true }) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
			<h3 className={`mb-4 text-sm font-bold text-slate-800 ${isRtl ? "text-right" : "text-left"}`}>
				{title}
			</h3>
			{children}
		</section>
	);
}

function FormInput({ label, value, onChange, type = "text", required = false, isRtl = true }) {
	return (
		<div>
			<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<input
				type={type}
				className={inputClasses}
				value={value || ""}
				onChange={(e) => onChange(e.target.value)}
				required={required}
			/>
		</div>
	);
}

function Message({ type, icon: Icon, text }) {
	const classes =
		type === "success"
			? "border-green-200 bg-green-50 text-green-800"
			: "border-red-200 bg-red-50 text-red-800";

	return (
		<div className={`flex items-center gap-2 rounded-xl border p-3 ${classes}`}>
			<Icon className="h-5 w-5" />
			<span className="text-sm font-semibold">{text}</span>
		</div>
	);
}