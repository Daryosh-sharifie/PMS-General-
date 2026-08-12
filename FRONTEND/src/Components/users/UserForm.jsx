import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Shield, X, AlertCircle, CheckCircle, Camera, User } from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { inputClasses, buttonPrimary, buttonSecondary } from "../../constants/styles";
import { useLanguage } from "../../i18n/LanguageContext";
import { APP_SETTINGS_BASE } from "../../api/appSettingApi";

function resolveAsset(src) {
	if (!src) return "";
	if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
		return src;
	}
	const normalizedSrc = src.replace(/\\/g, "/");
	const needsSlash = normalizedSrc.startsWith("/") ? "" : "/";
	return `${APP_SETTINGS_BASE}${needsSlash}${normalizedSrc}`;
}

const ROLE_OPTIONS = [
	{ value: "Doctor", labelKey: "doctor" },
	{ value: "Admin", labelKey: "admin" },
	{ value: "Pharmacist", labelKey: "pharmacist" },
	{ value: "Reciption", labelKey: "reception" },
	{ value: "LabStaff", labelKey: "labStaff" },
];

export default function UserForm({
	onAddUser,
	onUpdateUser,
	onRefetch,
	user,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";
	const isEditMode = Boolean(user?.id);
	const navigate = useNavigate();

	const [form, setForm] = useState({
		name: user?.name || "",
		email: user?.email || "",
		phone: user?.phone || "",
		role: user?.role || "Doctor",
		password: "",
		confirmPassword: "",
	});

	const [avatarFile, setAvatarFile] = useState(null);
	const [photoPreview, setPhotoPreview] = useState(
		user?.avatar ? resolveAsset(user.avatar) : ""
	);

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);

	const title = isEditMode ? t("editUser") : t("addNewUser");

	const subtitle = isEditMode
		? t("editUserSubtitle")
		: t("addUserSubtitle");

	const passwordRequired = !isEditMode;

	const fields = useMemo(
		() => [
			{
				name: "name",
				label: t("fullName"),
				type: "text",
				required: true,
				placeholder: t("fullNamePlaceholder"),
			},
			{
				name: "email",
				label: t("email"),
				type: "email",
				required: true,
				placeholder: "example@hospital.com",
			},
			{
				name: "phone",
				label: t("phone"),
				type: "tel",
				required: false,
				placeholder: t("phonePlaceholder"),
			},
		],
		[t]
	);

	const updateField = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		if (error) setError("");
		if (success) setSuccess("");
	};

	const validateForm = () => {
		if (!form.name.trim()) return t("nameRequired");
		if (!form.email.trim()) return t("emailRequired");

		if (passwordRequired && !form.password) {
			return t("passwordRequired");
		}

		if (passwordRequired && !form.confirmPassword) {
			return t("confirmPasswordRequired");
		}

		if (form.password && form.password.length < 8) {
			return t("passwordMinLength");
		}

		if (form.password && form.password !== form.confirmPassword) {
			return t("passwordsDoNotMatch");
		}

		return "";
	};

	const handlePhotoChange = (event) => {
		const file = event.target.files?.[0];
		if (file) {
			setAvatarFile(file);
			setPhotoPreview(URL.createObjectURL(file));
			if (error) setError("");
			if (success) setSuccess("");
		}
	};

	const submit = async (event) => {
		event.preventDefault();

		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			return;
		}

		const payload = {
			name: form.name.trim(),
			email: form.email.trim(),
			phone: form.phone.trim(),
			role: form.role,
		};

		if (form.password) {
			payload.password = form.password;
		}

		try {
			setLoading(true);
			setError("");
			setSuccess("");

			if (isEditMode) {
				if (!onUpdateUser) {
					throw new Error(t("updateUserHandlerMissing"));
				}
				await onUpdateUser(user.id, payload, avatarFile);
				setSuccess(t("userUpdatedSuccessfully"));
			} else {
				if (!onAddUser) {
					throw new Error(t("addUserHandlerMissing"));
				}
				await onAddUser(payload, avatarFile);
				setSuccess(t("userCreatedSuccessfully"));
			}

			if (onRefetch) await onRefetch();

			setTimeout(() => {
				navigate("/users");
			}, 650);
		} catch (err) {
			setError(err.message || t("failedToSaveUser"));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		navigate("/users");
	};

	return (
		<div className="min-h-screen bg-slate-50 px-4 py-8">
			<Card className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
				<CardContent className="relative p-6 md:p-8">
					<button
						type="button"
						onClick={handleCancel}
						className={`absolute top-4 ${isRtl ? "right-4" : "left-4"} rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-500`}
						title={t("cancel")}
					>
						<X size={22} />
					</button>

					<form onSubmit={submit} className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
						<div className="flex flex-col items-center justify-center border-b border-slate-100 pb-6 text-center">
							<div className="relative mb-4">
								<div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-100 bg-blue-50 text-blue-700 shadow-md">
									{photoPreview ? (
										<img
											src={photoPreview}
											alt="Avatar Preview"
											className="h-full w-full object-cover "
										/>
									) : (
										<User className="h-12 w-12 text-slate-400" />
									)}
								</div>

								<label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700">
									<Camera className="h-4 w-4" />
									<input
										type="file"
										accept="image/*"
										onChange={handlePhotoChange}
										className="hidden"
									/>
								</label>
							</div>

							<div>
								<h2 className="text-3xl font-bold text-slate-950">{title}</h2>
								<p className="mt-1 text-sm text-slate-500">{subtitle}</p>
							</div>
						</div>

						{error && <Message type="error" text={error} />}
						{success && <Message type="success" text={success} />}

						<Section title={t("personalInformation")} isRtl={isRtl}>
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								{fields.map((field) => (
									<FormInput
										key={field.name}
										label={field.label}
										type={field.type}
										value={form[field.name]}
										placeholder={field.placeholder}
										required={field.required}
										isRtl={isRtl}
										onChange={(value) => updateField(field.name, value)}
									/>
								))}

								<div>
									<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>
										{t("role")} <span className="text-red-500">*</span>
									</label>
									<select
										className={inputClasses}
										value={form.role}
										onChange={(event) => updateField("role", event.target.value)}
										required
									>
										{ROLE_OPTIONS.map((role) => (
											<option key={role.value} value={role.value}>
												{t(role.labelKey)}
											</option>
										))}
									</select>
								</div>
							</div>
						</Section>

						<Section title={t("securityAndAccess")} isRtl={isRtl}>
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
								<FormInput
									label={`${t("password")} ${isEditMode ? `(${t("optional")})` : "*"}`}
									type="password"
									value={form.password}
									placeholder={t("passwordPlaceholder")}
									required={passwordRequired}
									isRtl={isRtl}
									onChange={(value) => updateField("password", value)}
								/>

								<FormInput
									label={`${t("confirmPassword")} ${passwordRequired ? "*" : `(${t("optional")})`}`}
									type="password"
									value={form.confirmPassword}
									placeholder={t("confirmPasswordPlaceholder")}
									required={passwordRequired}
									isRtl={isRtl}
									onChange={(value) => updateField("confirmPassword", value)}
								/>
							</div>

							<p className={`mt-3 text-xs text-slate-500 ${isRtl ? "text-right" : "text-left"}`}>
								{isEditMode
									? t("editPasswordHint")
									: t("newPasswordHint")}
							</p>
						</Section>

						<div className={`flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row ${isRtl ? "sm:justify-end" : "sm:justify-start"}`}>
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
								disabled={loading}
							>
								{loading ? (
									<span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
								) : (
									<Save className="mr-2 h-4 w-4" />
								)}
								{loading
									? t("processing")
									: isEditMode
									? t("updateUser")
									: t("addUser")}
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

function FormInput({
	label,
	value,
	onChange,
	type = "text",
	required = false,
	placeholder = "",
	isRtl = true,
}) {
	return (
		<div>
			<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${isRtl ? "text-right" : "text-left"}`}>
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<input
				type={type}
				className={inputClasses}
				value={value || ""}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
				required={required}
			/>
		</div>
	);
}

function Message({ type, text }) {
	const Icon = type === "success" ? CheckCircle : AlertCircle;

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