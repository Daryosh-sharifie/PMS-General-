import { useState, useEffect } from "react";
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
	BarChart3,
	Menu,
	X,
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightClose,
	PanelRightOpen,
} from "lucide-react";
import { buttonPrimary } from "../../constants/styles";
import { APP_SETTINGS_BASE } from "../../api/appSettingApi";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import FullScreenButton from "./FullScreenButton";

import { getShortcutTooltip } from "../../utils/shortcutManager";

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

	const [isCollapsed, setIsCollapsed] = useState(() => {
		return localStorage.getItem("sidebar_collapsed") === "true";
	});
	const [isMobileOpen, setIsMobileOpen] = useState(false);

	useEffect(() => {
		localStorage.setItem("sidebar_collapsed", isCollapsed ? "true" : "false");
	}, [isCollapsed]);

	// Close mobile menu on route change
	useEffect(() => {
		setIsMobileOpen(false);
	}, [location.pathname]);

	const toggleCollapse = () => {
		setIsCollapsed((prev) => !prev);
	};

	const navigation = [
		{ id: "dashboard", label: t("dashboard"), icon: Home },
		{ id: "patients", label: t("patients"), icon: Users, shortcutId: "addPatient" },
		{
			id: "prescriptions",
			label: t("prescriptions"),
			icon: FileText,
			shortcutId: "createPrescription",
			hideForRoles: ["pharmacist"],
		},
		{ id: "medicines", label: t("medicines"), icon: Syringe },
		{ id: "lab-reports", label: t("labReports"), icon: FlaskConical, shortcutId: "laboratory" },
		{ id: "reports", label: t("reports"), icon: BarChart3, shortcutId: "reports" },
		{ id: "users", label: t("users"), icon: UserCog, adminOnly: true },
		{ id: "activity", label: t("activity"), icon: Activity, adminOnly: true },
		{ id: "settings", label: t("settings"), icon: Settings },
	];

	const go = (id) => {
		const path = id === "dashboard" ? "/dashboard" : `/${id}`;
		navigate(path);
		setIsMobileOpen(false);
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
		if (currentPath.startsWith("/reports")) return "reports";
		if (currentPath.startsWith("/settings")) return "settings";
		if (currentPath.startsWith("/users")) return "users";
		if (currentPath.startsWith("/activity")) return "activity";

		return "dashboard";
	};

	const currentPageId = getCurrentPageId();

	const getGentleMotionClass = (id) => {
		switch (id) {
			case "dashboard": return "gentle-header-dashboard";
			case "patients": return "gentle-header-patients";
			case "prescriptions": return "gentle-header-prescriptions";
			case "medicines": return "gentle-header-medicines";
			case "lab-reports": return "gentle-header-lab";
			case "reports": return "gentle-header-reports";
			case "users": return "gentle-header-users";
			case "activity": return "gentle-header-activity";
			case "settings": return "gentle-header-settings";
			default: return "gentle-header-dashboard";
		}
	};

	const visibleNavigation = navigation.filter((item) => {
		if (item.adminOnly && userRole !== "admin") return false;
		if (item.hideForRoles?.includes(userRole)) return false;
		return true;
	});

	return (
		<>
			{/* Mobile Top Header Bar with Hamburger Button */}
			<div
				dir={isRtl ? "rtl" : "ltr"}
				className="flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 print:hidden md:hidden"
			>
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setIsMobileOpen(true)}
						className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
						aria-label="Open menu"
					>
						<Menu className="h-6 w-6" />
					</button>

					<div className="flex items-center gap-2">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-700">
							{hospitalSettings?.logoPreview || hospitalSettings?.logo ? (
								<img
									src={hospitalSettings.logoPreview || resolveAsset(hospitalSettings.logo)}
									alt={t("hospitalLogo")}
									className="h-full w-full object-contain p-1"
								/>
							) : (
								<Hospital className="h-5 w-5" />
							)}
						</div>
						<h1 className="max-w-[180px] truncate text-base font-bold text-slate-950">
							{hospitalSettings?.hospitalName ||
								hospitalSettings?.name ||
								t("hospital")}
						</h1>
					</div>
				</div>

				<FullScreenButton variant="compact" />
			</div>

			{/* Mobile Drawer Overlay Backdrop */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs print:hidden md:hidden"
					onClick={() => setIsMobileOpen(false)}
				/>
			)}

			{/* Sidebar Container */}
			<aside
				dir={isRtl ? "rtl" : "ltr"}
				className={`fixed top-0 z-50 flex h-full flex-col border-slate-200 bg-white transition-all duration-300 print:hidden md:static md:z-auto ${isRtl ? "border-l" : "border-r"
					} ${isCollapsed ? "w-20" : "w-64"} ${isMobileOpen
						? "left-0 right-0 w-64 shadow-2xl"
						: "max-md:-translate-x-full md:translate-x-0"
					}`}
			>
				{/* Desktop Header / Logo */}
				<div className="hidden h-20 items-center border-b border-slate-200 px-4 md:flex">
					<div
						className={`flex w-full items-center gap-3 ${isCollapsed
							? "justify-center"
							: isRtl
								? "flex-row-reverse text-right"
								: "text-left"
							}`}
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-700">
							{hospitalSettings?.logoPreview || hospitalSettings?.logo ? (
								<img
									src={hospitalSettings.logoPreview || resolveAsset(hospitalSettings.logo)}
									alt={t("hospitalLogo")}
									className="h-full w-full object-contain p-1"
								/>
							) : (
								<Hospital className="h-6 w-6" />
							)}
						</div>

						{!isCollapsed && (
							<div className="min-w-0 flex-1">
								<h1 className="truncate text-base font-bold text-slate-950">
									{hospitalSettings?.hospitalName ||
										hospitalSettings?.name ||
										t("hospital")}
								</h1>
								<p className="mt-0.5 truncate text-xs font-medium text-slate-500">
									{t("prescriptionManagementSystem")}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Navigation Links */}
				<nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
					{visibleNavigation.map((item) => {
						const Icon = item.icon;
						const isActive = currentPageId === item.id;
						const showText = !isCollapsed || isMobileOpen;

						return (
							<button
								key={item.id}
								type="button"
								onClick={() => go(item.id)}
								title={!showText ? item.label : undefined}
								className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 active:scale-95 ${isActive
									? "bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-100 font-bold"
									: "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
									} ${!showText
										? "justify-center"
										: isRtl
											? "flex-row-reverse text-right"
											: "text-left"
									}`}
							>
								<div className="flex h-5 w-5 shrink-0 items-center justify-center">
									<Icon
										key={isActive ? `active-${item.id}` : `inactive-${item.id}`}
										className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
											isActive
												? `${getGentleMotionClass(item.id)} text-blue-700`
												: "group-hover:scale-125 group-hover:rotate-6 text-slate-500 group-hover:text-slate-900"
										}`}
									/>
								</div>
								{showText && (
									<span className="min-w-0 flex-1 truncate">{item.label}</span>
								)}
							</button>
						);
					})}
				</nav>

				{/* Sidebar Footer (FullScreen, User Profile & Logout) */}
				<div className="border-t border-slate-200 p-3">
					<div className="mb-3">
						<FullScreenButton variant="sidebar" showLabel={!isCollapsed || isMobileOpen} />
					</div>
					<div
						className={`mb-3 flex items-center gap-3 ${!isCollapsed || isMobileOpen
							? isRtl
								? "flex-row-reverse text-right"
								: "text-left"
							: "justify-center"
							}`}
					>
						{currentUser?.photoPreview || currentUser?.avatar ? (
							<div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-blue-100">
								<img
									src={resolveAsset(currentUser.photoPreview || currentUser.avatar)}
									alt={t("profilePhoto")}
									className="h-full w-full object-cover"
								/>
							</div>
						) : (
							<div className="shrink-0 rounded-full bg-blue-100 p-2 text-blue-700">
								<UserCircle className="h-5 w-5" />
							</div>
						)}

						{(!isCollapsed || isMobileOpen) && (
							<div className="min-w-0 flex-1 leading-tight">
								<p className="truncate text-sm font-bold text-slate-950">
									{currentUser?.name || "-"}
								</p>
								<p className="mt-0.5 text-xs text-slate-500">
									{t(getRoleKey(currentUser?.role))}
								</p>
							</div>
						)}
					</div>

					<button
						type="button"
						className={`${buttonPrimary} w-full ${!isCollapsed || isMobileOpen ? "justify-center" : "justify-center px-0 py-2.5"
							}`}
						onClick={onLogout}
						title={isCollapsed && !isMobileOpen ? t("logout") : undefined}
					>
						<LogOut className={`${!isCollapsed || isMobileOpen ? (isRtl ? "ml-2" : "mr-2") : ""} h-4 w-4`} />
						{(!isCollapsed || isMobileOpen) && t("logout")}
					</button>
				</div>
			</aside>
		</>
	);
}

