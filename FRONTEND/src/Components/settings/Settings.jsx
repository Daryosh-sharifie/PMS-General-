import { useMemo, useState } from "react";
import {
	AlertCircle,
	CheckCircle,
	Download,
	Lock,
	Shield,
	User,
	Keyboard,
	Settings as SettingsIcon,
	DatabaseBackup,
	UploadCloud,
	X,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { inputClasses, buttonPrimary, buttonSecondary } from "../../constants/styles";
import { userApi } from "../../api/userApi";
import { getMe, updatePassword } from "../../api/authApi";
import { APP_SETTINGS_BASE } from "../../api/appSettingApi";
import AppSettings from "./AppSettings";
import ShortcutsTab from "./ShortcutsTab";
import { backupApi } from "../../api/backupApi";
import { useLanguage } from "../../i18n/LanguageContext";

function resolveAsset(src) {
	if (!src) return "";

	if (
		src.startsWith("http://") ||
		src.startsWith("https://") ||
		src.startsWith("data:")
	) {
		return src;
	}

	const needsSlash = src.startsWith("/") ? "" : "/";
	return `${APP_SETTINGS_BASE}${needsSlash}${src}`;
}

function getRoleKey(role) {
	const value = String(role || "").toLowerCase();

	const map = {
		admin: "admin",
		doctor: "doctor",
		pharmacist: "pharmacist",
		reciption: "reception",
		reception: "reception",
		labstaff: "labStaff",
	};

	return map[value] || value || "notAssigned";
}

function validatePhoto(file, t) {
	if (!file) return "";

	const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
	const maxSize = 2 * 1024 * 1024;

	if (!allowedTypes.includes(file.type)) return t("invalidProfilePhotoFormat");
	if (file.size > maxSize) return t("profilePhotoTooLarge");

	return "";
}

function directionClasses(isRtl) {
	return {
		text: isRtl ? "text-right" : "text-left",
		buttonRow: isRtl ? "flex-row-reverse" : "flex-row",
		iconMargin: isRtl ? "ml-2" : "mr-2",
	};
}

function startFlexStyle() {
	return {
		justifyContent: "flex-start",
	};
}

export default function Settings({
	currentUser,
	onSaveProfile,
	onUpdatePassword,
}) {
	const { t, language } = useLanguage();
	const isRtl = language === "fa";
	const dir = directionClasses(isRtl);

	const isAdmin = getRoleKey(currentUser?.role) === "admin";

	const [activeTab, setActiveTab] = useState("profile");

	const [profileSettings, setProfileSettings] = useState({
		name: currentUser?.name || "",
		email: currentUser?.email || "",
		phone: currentUser?.phone || "",
		photo: null,
		photoPreview: currentUser?.photoPreview || currentUser?.avatar || "",
	});

	const [securitySettings, setSecuritySettings] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [message, setMessage] = useState(null);
	const [profileSaving, setProfileSaving] = useState(false);
	const [passwordSaving, setPasswordSaving] = useState(false);

	const tabs = useMemo(() => {
		const baseTabs = [
			{
				id: "profile",
				label: t("profileInformation"),
				icon: User,
			},
			{
				id: "security",
				label: t("security"),
				icon: Lock,
			},
			{
				id: "shortcuts",
				label: t("shortcuts"),
				icon: Keyboard,
			},
		];

		if (isAdmin) {
			baseTabs.push({
				id: "backup",
				label: t("backup"),
				icon: DatabaseBackup,
			});

			baseTabs.push({
				id: "admin",
				label: t("systemSettings"),
				icon: SettingsIcon,
			});
		}

		return baseTabs;
	}, [isAdmin, t]);

	const showMessage = (text, type = "success") => {
		setMessage({ text, type });
		setTimeout(() => setMessage(null), 3500);
	};

	const updateProfileField = (field, value) => {
		setProfileSettings((prev) => ({ ...prev, [field]: value }));
		setMessage(null);
	};

	const updateSecurityField = (field, value) => {
		setSecuritySettings((prev) => ({ ...prev, [field]: value }));
		setMessage(null);
	};

	const handlePhotoChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const validationError = validatePhoto(file, t);

		if (validationError) {
			showMessage(validationError, "error");
			event.target.value = "";
			return;
		}

		const reader = new FileReader();

		reader.onloadend = () => {
			setProfileSettings((prev) => ({
				...prev,
				photo: file,
				photoPreview: reader.result,
			}));
		};

		reader.readAsDataURL(file);
		event.target.value = "";
	};

	const handleSaveProfile = async () => {
		if (!profileSettings.name.trim()) {
			showMessage(t("nameRequired"), "error");
			return;
		}

		if (!profileSettings.email.trim()) {
			showMessage(t("emailRequired"), "error");
			return;
		}

		try {
			setProfileSaving(true);

			const updatedUser = await userApi.updateUser(
				currentUser?.id,
				{
					name: profileSettings.name.trim(),
					email: profileSettings.email.trim(),
					phone: profileSettings.phone.trim(),
				},
				profileSettings.photo || null
			);

			let refreshed = null;

			try {
				refreshed = await getMe();
			} catch {
				refreshed = null;
			}

			const effectiveUser =
				refreshed ||
				updatedUser || {
					...currentUser,
					name: profileSettings.name.trim(),
					email: profileSettings.email.trim(),
					phone: profileSettings.phone.trim(),
				};

			localStorage.setItem("user", JSON.stringify(effectiveUser));

			if (effectiveUser.avatar && !profileSettings.photo) {
				setProfileSettings((prev) => ({
					...prev,
					photoPreview: effectiveUser.avatar,
				}));
			}

			onSaveProfile?.(effectiveUser);
			showMessage(t("profileSavedSuccessfully"), "success");
		} catch (err) {
			showMessage(err.message || t("failedToSaveProfile"), "error");
		} finally {
			setProfileSaving(false);
		}
	};

	const handleSavePassword = async () => {
		if (
			!securitySettings.currentPassword ||
			!securitySettings.newPassword ||
			!securitySettings.confirmPassword
		) {
			showMessage(t("fillAllPasswordFields"), "error");
			return;
		}

		if (securitySettings.newPassword !== securitySettings.confirmPassword) {
			showMessage(t("passwordsDoNotMatch"), "error");
			return;
		}

		if (securitySettings.newPassword.length < 8) {
			showMessage(t("passwordMinLength"), "error");
			return;
		}

		try {
			setPasswordSaving(true);

			await updatePassword(
				securitySettings.currentPassword,
				securitySettings.newPassword,
				securitySettings.confirmPassword
			);

			setSecuritySettings({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});

			showMessage(t("passwordUpdatedSuccessfully"), "success");

			try {
				const refreshed = await getMe();
				if (refreshed) localStorage.setItem("user", JSON.stringify(refreshed));
			} catch {
				// no-op
			}

			onUpdatePassword?.({ ...currentUser });
		} catch (err) {
			showMessage(err.message || t("failedToUpdatePassword"), "error");
		} finally {
			setPasswordSaving(false);
		}
	};

	return (
		<div dir={isRtl ? "rtl" : "ltr"} className="space-y-6 p-4 md:p-6">
			<div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
				<div
					className="flex items-center gap-3"
					style={startFlexStyle()}
				>
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20 modern-icon-badge transition-all">
						<SettingsIcon className="h-6 w-6 gentle-header-settings" />
					</div>

					<div className={dir.text}>
						<h2 className="text-3xl font-bold text-slate-950">
							{t("settings")}
						</h2>
						<p className="mt-1 text-sm text-slate-500">
							{t("settingsSubtitle")}
						</p>
					</div>
				</div>
			</div>

			{message && <Message type={message.type} text={message.text} isRtl={isRtl} />}

			<Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
				<CardContent className="p-3">
					<div
						className="flex flex-wrap gap-2"
						style={startFlexStyle()}
					>
						{tabs.map((tab) => {
							const Icon = tab.icon;

							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => setActiveTab(tab.id)}
									className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === tab.id
											? "bg-blue-600 text-white shadow-sm"
											: "bg-slate-50 text-slate-600 hover:bg-slate-100"
										} ${dir.buttonRow}`}
								>
									<Icon className="h-4 w-4" />
									{tab.label}
								</button>
							);
						})}
					</div>
				</CardContent>
			</Card>

			{activeTab === "admin" && isAdmin && <AppSettings />}

			{activeTab === "profile" && (
				<ProfileTab
					profileSettings={profileSettings}
					setProfileSettings={setProfileSettings}
					currentUser={currentUser}
					profileSaving={profileSaving}
					updateProfileField={updateProfileField}
					handlePhotoChange={handlePhotoChange}
					handleSaveProfile={handleSaveProfile}
					t={t}
					isRtl={isRtl}
				/>
			)}

			{activeTab === "security" && (
				<SecurityTab
					securitySettings={securitySettings}
					passwordSaving={passwordSaving}
					updateSecurityField={updateSecurityField}
					handleSavePassword={handleSavePassword}
					t={t}
					isRtl={isRtl}
				/>
			)}

			{activeTab === "shortcuts" && (
				<ShortcutsTab showMessage={showMessage} />
			)}

			{activeTab === "backup" && isAdmin && (
				<BackupTab showMessage={showMessage} t={t} isRtl={isRtl} />
			)}
		</div>
	);
}

function ProfileTab({
	profileSettings,
	setProfileSettings,
	currentUser,
	profileSaving,
	updateProfileField,
	handlePhotoChange,
	handleSaveProfile,
	t,
	isRtl,
}) {
	const roleKey = getRoleKey(currentUser?.role);
	const dir = directionClasses(isRtl);

	return (
		<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
			<CardHeader className="border-b border-slate-100 px-6 py-5">
				<div className={dir.text}>
					<h3 className="text-xl font-bold text-slate-950">
						{t("profileInformation")}
					</h3>
					<p className="mt-1 text-sm text-slate-500">
						{t("profileInformationSubtitle")}
					</p>
				</div>
			</CardHeader>

			<CardContent className="space-y-8 p-6">
				<div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
					<div
						className="flex flex-col items-center gap-5 md:flex-row"
						style={{
							justifyContent: "flex-start",
						}}
					>
						<div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white p-1 shadow-sm">
							{profileSettings.photoPreview ? (
								<img
									src={resolveAsset(profileSettings.photoPreview)}
									alt={t("profilePhoto")}
									className="h-full w-full rounded-full object-cover"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center rounded-full bg-slate-50 text-slate-400">
									<User className="h-8 w-8" />
								</div>
							)}
						</div>

						<div className={`${dir.text} md:min-w-[230px]`}>
							<p className="font-bold text-slate-950">
								{t("profilePhoto")}
							</p>
							<p className="mt-1 text-xs text-slate-500">
								{t("profilePhotoHint")}
							</p>
						</div>

						<div className="flex flex-col gap-2">
							<label className={`${buttonSecondary} cursor-pointer justify-center`}>
								<UploadCloud className={`${dir.iconMargin} h-4 w-4`} />
								{t("addPhoto")}
								<input
									type="file"
									accept="image/jpeg,image/png,image/gif,image/webp"
									onChange={handlePhotoChange}
									className="hidden"
								/>
							</label>

							{profileSettings.photoPreview && (
								<button
									type="button"
									className={buttonSecondary}
									onClick={() =>
										setProfileSettings((prev) => ({
											...prev,
											photo: null,
											photoPreview: "",
										}))
									}
								>
									<X className={`${dir.iconMargin} h-4 w-4`} />
									{t("removePhoto")}
								</button>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					<FormInput
						label={t("fullName")}
						value={profileSettings.name}
						placeholder={t("fullNamePlaceholder")}
						onChange={(value) => updateProfileField("name", value)}
						isRtl={isRtl}
					/>

					<FormInput
						label={t("email")}
						type="email"
						value={profileSettings.email}
						placeholder="doctor@hospital.com"
						onChange={(value) => updateProfileField("email", value)}
						isRtl={isRtl}
						forceLtrValue
					/>

					<FormInput
						label={t("phone")}
						type="tel"
						value={profileSettings.phone}
						placeholder={t("phonePlaceholder")}
						onChange={(value) => updateProfileField("phone", value)}
						isRtl={isRtl}
						forceLtrValue
					/>

					<FormInput
						label={t("role")}
						value={t(roleKey)}
						readOnly
						onChange={() => { }}
						isRtl={isRtl}
					/>
				</div>

				<div
					className="flex"
					style={startFlexStyle()}
				>
					<button
						type="button"
						className={`${buttonPrimary} justify-center disabled:cursor-not-allowed disabled:opacity-60`}
						onClick={handleSaveProfile}
						disabled={profileSaving}
					>
						{profileSaving ? (
							<span className={`${dir.iconMargin} h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent`} />
						) : (
							<User className={`${dir.iconMargin} h-4 w-4`} />
						)}
						{profileSaving ? t("saving") : t("saveChanges")}
					</button>
				</div>
			</CardContent>
		</Card>
	);
}

function SecurityTab({
	securitySettings,
	passwordSaving,
	updateSecurityField,
	handleSavePassword,
	t,
	isRtl,
}) {
	const dir = directionClasses(isRtl);

	return (
		<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
			<CardHeader className="border-b border-slate-100 px-6 py-5">
				<div className={dir.text}>
					<h3 className="text-xl font-bold text-slate-950">{t("security")}</h3>
					<p className="mt-1 text-sm text-slate-500">
						{t("securitySubtitle")}
					</p>
				</div>
			</CardHeader>

			<CardContent className="space-y-6 p-6">
				<div className="grid grid-cols-1 gap-5 md:grid-cols-3">
					<FormInput
						label={t("currentPassword")}
						type="password"
						value={securitySettings.currentPassword}
						onChange={(value) => updateSecurityField("currentPassword", value)}
						isRtl={isRtl}
					/>

					<FormInput
						label={t("newPassword")}
						type="password"
						value={securitySettings.newPassword}
						onChange={(value) => updateSecurityField("newPassword", value)}
						isRtl={isRtl}
					/>

					<FormInput
						label={t("confirmNewPassword")}
						type="password"
						value={securitySettings.confirmPassword}
						onChange={(value) => updateSecurityField("confirmPassword", value)}
						isRtl={isRtl}
					/>
				</div>

				<div className={`rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 ${dir.text}`}>
					{t("passwordSecurityHint")}
				</div>

				<div className="flex" style={startFlexStyle()}>
					<button
						type="button"
						className={`${buttonSecondary} justify-center disabled:cursor-not-allowed disabled:opacity-60`}
						onClick={handleSavePassword}
						disabled={passwordSaving}
					>
						{passwordSaving ? (
							<span className={`${dir.iconMargin} h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent`} />
						) : (
							<Shield className={`${dir.iconMargin} h-4 w-4`} />
						)}
						{passwordSaving ? t("processing") : t("updatePassword")}
					</button>
				</div>
			</CardContent>
		</Card>
	);
}

function BackupTab({ showMessage, t, isRtl }) {
	const dir = directionClasses(isRtl);

	const [loading, setLoading] = useState({});
	const [restoreFile, setRestoreFile] = useState(null);
	const [restoreLoading, setRestoreLoading] = useState(false);
	const [restoreResult, setRestoreResult] = useState(null);
	const [confirmRestore, setConfirmRestore] = useState(false);

	const backupItems = [
		{
			key: "full",
			label: t("fullBackup"),
			desc: t("fullBackupDescription"),
			fn: backupApi.downloadFullBackup,
			success: t("fullBackupDownloaded"),
			accent: "bg-blue-50 text-blue-700",
		},
		{
			key: "patients",
			label: t("patientsBackup"),
			desc: t("patientsBackupDescription"),
			fn: backupApi.downloadPatientsBackup,
			success: t("patientsBackupDownloaded"),
			accent: "bg-emerald-50 text-emerald-700",
		},
		{
			key: "prescriptions",
			label: t("prescriptionsBackup"),
			desc: t("prescriptionsBackupDescription"),
			fn: backupApi.downloadPrescriptionsBackup,
			success: t("prescriptionsBackupDownloaded"),
			accent: "bg-purple-50 text-purple-700",
		},
		{
			key: "medicines",
			label: t("medicinesBackup"),
			desc: t("medicinesBackupDescription"),
			fn: backupApi.downloadMedicinesBackup,
			success: t("medicinesBackupDownloaded"),
			accent: "bg-orange-50 text-orange-700",
		},
	];

	const runBackup = async (key, fn, successMsg) => {
		try {
			setLoading((prev) => ({ ...prev, [key]: true }));
			await fn();
			showMessage?.(successMsg, "success");
		} catch (err) {
			showMessage?.(err.message || t("failedToDownloadBackup"), "error");
		} finally {
			setLoading((prev) => ({ ...prev, [key]: false }));
		}
	};

	const handleRestore = async () => {
		if (!restoreFile) return;

		try {
			setRestoreLoading(true);
			setRestoreResult(null);

			const result = await backupApi.restoreFromFile(restoreFile);

			setRestoreResult({
				ok: true,
				msg: result.message || t("restoreCompletedSuccessfully"),
				details: result.results || null,
			});

			showMessage?.(result.message || t("restoreCompletedSuccessfully"), "success");
			setConfirmRestore(false);
		} catch (err) {
			setRestoreResult({
				ok: false,
				msg: err.message || t("failedToRestoreBackup"),
			});

			showMessage?.(err.message || t("failedToRestoreBackup"), "error");
		} finally {
			setRestoreLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{confirmRestore && (
				<ConfirmModal
					title={t("restoreBackup")}
					description={t("restoreBackupConfirm")}
					confirmLabel={restoreLoading ? t("processing") : t("restoreData")}
					cancelLabel={t("cancel")}
					loading={restoreLoading}
					onCancel={() => setConfirmRestore(false)}
					onConfirm={handleRestore}
					isRtl={isRtl}
				/>
			)}

			<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
				<CardHeader className="border-b border-slate-100 px-6 py-5">
					<div className={dir.text}>
						<h3 className="text-xl font-bold text-slate-950">
							{t("downloadBackup")}
						</h3>
						<p className="mt-1 text-sm text-slate-500">
							{t("downloadBackupSubtitle")}
						</p>
					</div>
				</CardHeader>

				<CardContent className="grid gap-4 p-6 md:grid-cols-2">
					{backupItems.map((item) => (
						<div
							key={item.key}
							className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-100 hover:bg-blue-50/20 sm:flex-row sm:items-center sm:justify-between"
							dir={isRtl ? "rtl" : "ltr"}
						>
							<div className={`${dir.text} min-w-0 flex-1`}>
								<p className="font-bold text-slate-950">{item.label}</p>
								<p className="mt-1 text-xs text-slate-500">{item.desc}</p>
							</div>

							<div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:flex ${item.accent}`}>
								<DatabaseBackup className="h-5 w-5" />
							</div>

							<button
								type="button"
								disabled={loading[item.key]}
								onClick={() => runBackup(item.key, item.fn, item.success)}
								className={`${buttonPrimary} shrink-0 justify-center disabled:cursor-not-allowed disabled:opacity-60`}
							>
								<Download className={`${dir.iconMargin} h-4 w-4`} />
								{loading[item.key] ? t("downloading") : t("download")}
							</button>
						</div>
					))}
				</CardContent>
			</Card>

			<Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
				<CardHeader className="border-b border-slate-100 px-6 py-5">
					<div className={dir.text}>
						<h3 className="text-xl font-bold text-slate-950">
							{t("restoreBackup")}
						</h3>
						<p className="mt-1 text-sm text-slate-500">
							{t("restoreBackupSubtitle")}
						</p>
					</div>
				</CardHeader>

				<CardContent className="space-y-5 p-6">
					<div className="flex flex-col gap-3 md:flex-row md:items-center">
						<label className="flex-1 cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
							<input
								type="file"
								accept=".json,application/json"
								className="hidden"
								onChange={(event) => {
									setRestoreFile(event.target.files?.[0] || null);
									setRestoreResult(null);
								}}
							/>

							{restoreFile ? (
								<span className="text-sm font-bold text-blue-700">
									{restoreFile.name}
								</span>
							) : (
								<span className="text-sm font-semibold text-slate-500">
									{t("chooseJsonBackupFile")}
								</span>
							)}
						</label>

						{restoreFile && (
							<button
								type="button"
								onClick={() => {
									setRestoreFile(null);
									setRestoreResult(null);
								}}
								className={buttonSecondary}
							>
								<X className={`${dir.iconMargin} h-4 w-4`} />
								{t("remove")}
							</button>
						)}
					</div>

					{restoreResult && (
						<div
							className={`rounded-xl border p-4 text-sm ${restoreResult.ok
									? "border-green-200 bg-green-50 text-green-800"
									: "border-red-200 bg-red-50 text-red-800"
								} ${dir.text}`}
						>
							<p className="font-bold">{restoreResult.msg}</p>

							{restoreResult.ok && restoreResult.details && (
								<ul className="mt-2 list-inside list-disc space-y-1 text-xs">
									{Object.entries(restoreResult.details).map(([key, value]) => (
										<li key={key}>
											{key}: {value} {t("records")}
										</li>
									))}
								</ul>
							)}
						</div>
					)}

					<div className="flex" style={startFlexStyle()}>
						<button
							type="button"
							disabled={!restoreFile || restoreLoading}
							onClick={() => setConfirmRestore(true)}
							className={`${buttonPrimary} justify-center disabled:cursor-not-allowed disabled:opacity-60`}
						>
							{restoreLoading ? t("processing") : t("restoreData")}
						</button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function FormInput({
	label,
	value,
	onChange,
	type = "text",
	placeholder = "",
	readOnly = false,
	isRtl,
	forceLtrValue = false,
}) {
	const dir = directionClasses(isRtl);

	return (
		<div>
			<label className={`mb-1.5 block text-xs font-bold text-slate-700 ${dir.text}`}>
				{label}
			</label>
			<input
				type={type}
				className={`${inputClasses} w-full ${forceLtrValue ? "ltr-value text-left" : dir.text
					} ${readOnly ? "bg-slate-100 text-slate-500" : ""}`}
				value={value || ""}
				placeholder={placeholder}
				onChange={(event) => onChange(event.target.value)}
				readOnly={readOnly}
				dir={forceLtrValue ? "ltr" : isRtl ? "rtl" : "ltr"}
			/>
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

function ConfirmModal({
	title,
	description,
	confirmLabel,
	cancelLabel,
	loading,
	onCancel,
	onConfirm,
	isRtl,
}) {
	const dir = directionClasses(isRtl);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
			<div
				className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ${dir.text}`}
				dir={isRtl ? "rtl" : "ltr"}
			>
				<h3 className="text-lg font-bold text-slate-950">{title}</h3>
				<p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>

				<div className="mt-6 flex gap-3" style={startFlexStyle()}>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{confirmLabel}
					</button>

					<button
						type="button"
						onClick={onCancel}
						disabled={loading}
						className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
					>
						{cancelLabel}
					</button>
				</div>
			</div>
		</div>
	);
}