import {
	Save,
	Upload,
	AlertCircle,
	CheckCircle,
	Building2,
	Phone,
	MapPin,
	ImageIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import useStore from "../../store/useStore.jsx";
import { buttonPrimary, buttonSecondary, inputClasses } from "../../constants/styles";
import { APP_SETTINGS_BASE } from "../../api/appSettingApi";
import { useLanguage } from "../../i18n/LanguageContext";

function resolveLogo(logoPath) {
	if (!logoPath) return null;

	const normalized = String(logoPath).replace(/\\/g, "/");

	if (
		normalized.startsWith("http://") ||
		normalized.startsWith("https://") ||
		normalized.startsWith("data:")
	) {
		return normalized;
	}

	const base = APP_SETTINGS_BASE || "";
	const needsSlash = normalized.startsWith("/") ? "" : "/";

	return `${base}${needsSlash}${normalized}`;
}

function validateLogo(file, t) {
	if (!file) return "";

	const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
	const maxSize = 5 * 1024 * 1024;

	if (!allowedTypes.includes(file.type)) {
		return t("invalidLogoFormat");
	}

	if (file.size > maxSize) {
		return t("logoFileTooLarge");
	}

	return "";
}

function directionClasses(isRtl) {
	return {
		text: isRtl ? "text-right" : "text-left",
		justifyStart: isRtl ? "justify-end" : "justify-start",
		row: isRtl ? "flex-row-reverse" : "flex-row",
		iconStartMargin: isRtl ? "ml-2" : "mr-2",
		inputIcon: isRtl ? "right-3" : "left-3",
		inputPadding: isRtl ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left",
		textareaPadding: isRtl ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left",
	};
}

export default function AppSettings() {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";
	const dir = directionClasses(isRtl);

	const {
		appSetting,
		getAppSetting,
		updateAppSetting,
		uploadLogo,
	} = useStore();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const [logoPreview, setLogoPreview] = useState(resolveLogo(appSetting?.logo));

	const [formData, setFormData] = useState({
		hospitalName: appSetting?.hospitalName || "",
		phone1: appSetting?.phone1 || "",
		phone2: appSetting?.phone2 || "",
		address: appSetting?.address || "",
	});

	useEffect(() => {
		let active = true;

		const loadSettings = async () => {
			try {
				setLoading(true);
				setError("");

				await getAppSetting();
			} catch (err) {
				if (active) setError(err.message || t("failedToLoadSettings"));
			} finally {
				if (active) setLoading(false);
			}
		};

		loadSettings();

		return () => {
			active = false;
		};
	}, [getAppSetting, t]);

	useEffect(() => {
		if (!appSetting) return;

		setFormData({
			hospitalName: appSetting.hospitalName || "",
			phone1: appSetting.phone1 || "",
			phone2: appSetting.phone2 || "",
			address: appSetting.address || "",
		});

		setLogoPreview(resolveLogo(appSetting.logo));
	}, [appSetting]);

	const updateField = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		setError("");
		setSuccess("");
	};

	const handleLogoChange = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const validationError = validateLogo(file, t);

		if (validationError) {
			setError(validationError);
			event.target.value = "";
			return;
		}

		const reader = new FileReader();

		reader.onload = (readerEvent) => {
			setLogoPreview(readerEvent.target?.result || null);
		};

		reader.readAsDataURL(file);

		try {
			setSaving(true);
			setError("");
			setSuccess("");

			await uploadLogo(file);

			setSuccess(t("logoUploadedSuccessfully"));
			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			setError(err.message || t("failedToUploadLogo"));
			setLogoPreview(resolveLogo(appSetting?.logo));
		} finally {
			setSaving(false);
			event.target.value = "";
		}
	};

	const handleSave = async (event) => {
		event.preventDefault();

		if (!formData.hospitalName.trim()) {
			setError(t("hospitalNameRequired"));
			return;
		}

		if (!formData.phone1.trim()) {
			setError(t("primaryPhoneRequired"));
			return;
		}

		if (!formData.address.trim()) {
			setError(t("addressRequired"));
			return;
		}

		try {
			setSaving(true);
			setError("");
			setSuccess("");

			await updateAppSetting({
				hospitalName: formData.hospitalName.trim(),
				phone1: formData.phone1.trim(),
				phone2: formData.phone2.trim(),
				address: formData.address.trim(),
			});

			setSuccess(t("settingsSavedSuccessfully"));
			setTimeout(() => setSuccess(""), 3000);
		} catch (err) {
			setError(err.message || t("failedToSaveSettings"));
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className={`flex min-h-96 items-center justify-center text-sm font-semibold text-slate-500 ${isRtl ? "flex-row-reverse" : ""}`}>
				<div className={`${dir.iconStartMargin} h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent`} />
				{t("loadingSettings")}
			</div>
		);
	}

	return (
		<div dir={isRtl ? "rtl" : "ltr"} className="space-y-6">
			{error && <Message type="error" text={error} isRtl={isRtl} />}
			{success && <Message type="success" text={success} isRtl={isRtl} />}

			<form onSubmit={handleSave} className="space-y-6">
				<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
					<div className={`mb-6 flex items-center gap-3 ${dir.row} ${dir.justifyStart} ${dir.text}`}>
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
							<ImageIcon className="h-6 w-6" />
						</div>

						<div>
							<h3 className="text-xl font-bold text-slate-950">
								{t("hospitalBranding")}
							</h3>
							<p className="mt-1 text-sm text-slate-500">
								{t("hospitalBrandingSubtitle")}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
						<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
							<div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
								{logoPreview ? (
									<img
										src={logoPreview}
										alt={t("hospitalLogo")}
										className="h-full w-full object-contain p-3"
									/>
								) : (
									<div className="flex flex-col items-center gap-2 text-slate-400">
										<Building2 className="h-10 w-10" />
										<span className="text-xs font-semibold">
											{t("noLogo")}
										</span>
									</div>
								)}
							</div>

							<label
								className={`${buttonSecondary} mt-5 inline-flex cursor-pointer items-center justify-center gap-2`}
							>
								<Upload className="h-4 w-4" />
								{saving ? t("uploading") : t("uploadLogo")}
								<input
									type="file"
									accept="image/jpeg,image/png,image/gif,image/webp"
									onChange={handleLogoChange}
									disabled={saving}
									className="hidden"
								/>
							</label>

							<p className="mt-3 text-xs leading-5 text-slate-500">
								{t("logoUploadHint")}
							</p>
						</div>

						<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
							<FormInput
								label={t("hospitalName")}
								value={formData.hospitalName}
								required
								placeholder={t("hospitalNamePlaceholder")}
								onChange={(value) => updateField("hospitalName", value)}
								icon={Building2}
								isRtl={isRtl}
							/>

							<FormInput
								label={t("primaryPhone")}
								value={formData.phone1}
								required
								placeholder={t("primaryPhonePlaceholder")}
								onChange={(value) => updateField("phone1", value)}
								icon={Phone}
								isRtl={isRtl}
								forceLtrValue
							/>

							<FormInput
								label={t("secondaryPhone")}
								value={formData.phone2}
								placeholder={t("secondaryPhonePlaceholder")}
								onChange={(value) => updateField("phone2", value)}
								icon={Phone}
								isRtl={isRtl}
								forceLtrValue
							/>

							<div className="md:col-span-2">
								<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${dir.text}`}>
									{t("address")} <span className="text-red-500">*</span>
								</label>

								<div className="relative">
									<MapPin className={`absolute ${dir.inputIcon} top-3.5 h-4 w-4 text-slate-400`} />
									<textarea
										className={`${inputClasses} min-h-28 w-full resize-none ${dir.textareaPadding}`}
										value={formData.address}
										onChange={(event) =>
											updateField("address", event.target.value)
										}
										placeholder={t("hospitalAddressPlaceholder")}
										required
										dir={isRtl ? "rtl" : "ltr"}
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				<div className={`flex ${dir.justifyStart}`}>
					<button
						type="submit"
						disabled={saving}
						className={`${buttonPrimary} justify-center disabled:cursor-not-allowed disabled:opacity-60`}
					>
						{saving ? (
							<span className={`${dir.iconStartMargin} h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent`} />
						) : (
							<Save className={`${dir.iconStartMargin} h-4 w-4`} />
						)}
						{saving ? t("saving") : t("saveSettings")}
					</button>
				</div>
			</form>
		</div>
	);
}

function FormInput({
	label,
	value,
	onChange,
	placeholder = "",
	required = false,
	icon: Icon,
	isRtl,
	forceLtrValue = false,
}) {
	const dir = directionClasses(isRtl);

	const paddingClasses = forceLtrValue
		? Icon
			? "ltr-value pl-10 pr-10 text-left"
			: "ltr-value pl-3.5 pr-3.5 text-left"
		: dir.inputPadding;

	return (
		<div>
			<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${dir.text}`}>
				{label} {required && <span className="text-red-500">*</span>}
			</label>

			<div className="relative">
				{Icon && (
					<Icon className={`absolute ${dir.inputIcon} top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none z-10`} />
				)}
				<input
					type="text"
					className={`${inputClasses} w-full ${paddingClasses}`}
					value={value || ""}
					placeholder={placeholder}
					onChange={(event) => onChange(event.target.value)}
					required={required}
					dir={forceLtrValue ? "ltr" : isRtl ? "rtl" : "ltr"}
				/>
			</div>
		</div>
	);
}

function Message({ type, text, isRtl }) {
	const Icon = type === "success" ? CheckCircle : AlertCircle;

	const classes =
		type === "success"
			? "border-green-200 bg-green-50 text-green-800"
			: "border-red-200 bg-red-50 text-red-800";

	return (
		<div
			className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${classes} ${isRtl ? "flex-row-reverse text-right" : "text-left"
				}`}
		>
			<Icon className="h-5 w-5" />
			<span>{text}</span>
		</div>
	);
}