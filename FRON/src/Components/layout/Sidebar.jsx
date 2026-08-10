import {
	Hospital,
	Home,
	Users,
	FileText,
	Settings,
	UserCircle,
	LogOut,
	Syringe,
	Activity,
	UserCog,
	FlaskConical,
} from "lucide-react";
import { buttonPrimary } from "../../constants/styles";
import { APP_SETTINGS_BASE } from "../../api/appSettingApi";
import { useNavigate, useLocation } from "react-router-dom";
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

export default function Sidebar({ currentUser, onLogout, hospitalSettings }) {
	const navigate = useNavigate();
	const location = useLocation();
	const { t, language } = useLanguage();

	const isRtl = language === "fa";
	const currentPath = location.pathname;
	const userRole = String(currentUser?.role || "").toLowerCase();

	const navigation = [
		{ id: "dashboard", label: t("dashboard"), icon: Home },
		{ id: "patients", label: t("patients"), icon: Users },
		{
			id: "prescriptions",
			label: t("prescriptions"),
			icon: FileText,
			hideForRoles: ["pharmacist"],
		},
		{ id: "medicines", label: t("medicines"), icon: Syringe },
		{ id: "lab-reports", label: t("labReports"), icon: FlaskConical },
		{ id: "users", label: t("users"), icon: UserCog, adminOnly: true },
		{ id: "activity", label: t("activity"), icon: Activity, adminOnly: true },
		{ id: "settings", label: t("settings"), icon: Settings },
	];

	const go = (id) => {
		const path = id === "dashboard" ? "/dashboard" : `/${id}`;
		navigate(path);
	};

	const getCurrentPageId = () => {
		if (currentPath.startsWith("/patients") || currentPath.includes("patient")) {
			return "patients";
		}

		if (
			currentPath.startsWith("/prescriptions") ||
			currentPath.includes("prescription")
		) {
			return "prescriptions";
		}

		if (currentPath.startsWith("/medicines")) return "medicines";
		if (currentPath.startsWith("/lab-reports")) return "lab-reports";
		if (currentPath.startsWith("/settings")) return "settings";
		if (currentPath.startsWith("/users")) return "users";
		if (currentPath.startsWith("/activity")) return "activity";

		return "dashboard";
	};

	const currentPageId = getCurrentPageId();

	const visibleNavigation = navigation.filter((item) => {
		if (item.adminOnly && userRole !== "admin") return false;
		if (item.hideForRoles?.includes(userRole)) return false;
		return true;
	});

	return (
		<aside
			dir={isRtl ? "rtl" : "ltr"}
			className={`flex h-screen w-72 shrink-0 flex-col bg-white print:hidden ${
				isRtl ? "border-l border-slate-200" : "border-r border-slate-200"
			}`}
		>
			<div className="border-b border-slate-200 p-5">
				<div className={`flex items-center gap-3 ${isRtl ? "justify-end text-right" : "justify-start text-left"}`}>
					<div className="min-w-0 flex-1">
						<h1 className="truncate text-lg font-bold text-slate-950">
							{hospitalSettings?.hospitalName ||
								hospitalSettings?.name ||
								t("hospital")}
						</h1>
						<p className="mt-1 text-xs font-medium text-slate-500">
							{t("prescriptionManagementSystem")}
						</p>
					</div>

					<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-700">
						{hospitalSettings?.logoPreview || hospitalSettings?.logo ? (
							<img
								src={hospitalSettings.logoPreview || resolveAsset(hospitalSettings.logo)}
								alt={t("hospitalLogo")}
								className="h-full w-full object-contain p-2"
							/>
						) : (
							<Hospital className="h-6 w-6" />
						)}
					</div>
				</div>
			</div>

			<nav className="flex-1 space-y-1 overflow-y-auto p-4">
				{visibleNavigation.map((item) => {
					const Icon = item.icon;
					const isActive = currentPageId === item.id;

					return (
						<button
							key={item.id}
							type="button"
							onClick={() => go(item.id)}
							className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
								isActive
									? "bg-blue-50 text-blue-700"
									: "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
							} ${isRtl ? "flex-row-reverse text-right" : "text-left"}`}
						>
							<Icon className="h-5 w-5 shrink-0" />
							<span className="min-w-0 flex-1 truncate">{item.label}</span>
						</button>
					);
				})}
			</nav>

			<div className="border-t border-slate-200 p-4">
				<div
					className={`mb-4 flex items-center gap-3 ${
						isRtl ? "flex-row-reverse text-right" : "text-left"
					}`}
				>
					{currentUser?.photoPreview || currentUser?.avatar ? (
						<div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-blue-100">
							<img
								src={resolveAsset(currentUser.photoPreview || currentUser.avatar)}
								alt={t("profilePhoto")}
								className="h-full w-full object-cover"
							/>
						</div>
					) : (
						<div className="shrink-0 rounded-full bg-blue-100 p-2">
							<UserCircle className="h-6 w-6 text-blue-700" />
						</div>
					)}

					<div className="min-w-0 flex-1 leading-tight">
						<p className="truncate text-sm font-bold text-slate-950">
							{currentUser?.name || "-"}
						</p>
						<p className="mt-0.5 text-xs text-slate-500">
							{t(getRoleKey(currentUser?.role))}
						</p>
					</div>
				</div>

				<button
					type="button"
					className={`${buttonPrimary} w-full justify-center`}
					onClick={onLogout}
				>
					<LogOut className={`${isRtl ? "ml-2" : "mr-2"} h-4 w-4`} />
					{t("logout")}
				</button>
			</div>
		</aside>
	);
}