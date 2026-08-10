import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import Login from "./Components/auth/Login";
import Unauthorized from "./Components/auth/Unauthorized";
import Sidebar from "./Components/layout/Sidebar";
import Dashboard from "./Components/dashboard/Dashboard";

import PatientList from "./Components/patients/PatientList";
import PatientForm from "./Components/patients/PatientForm";
import PatientDetailRoute from "./Components/patients/PatientDetailRoute";

import PrescriptionList from "./Components/prescriptions/PrescriptionList";
import PrescriptionForm from "./Components/prescriptions/PrescriptionForm";
import PrescriptionDetailPage from "./Components/prescriptions/PrescriptionDetailPage";
import PrescriptionEditPage from "./Components/prescriptions/PrescriptionEditPage";

import MedicineManagement from "./Components/medicines/MedicineManagement";
import Settings from "./Components/settings/Settings";

import UserList from "./Components/users/UserList";
import UserForm from "./Components/users/UserForm";
import DoctorPrescriptions from "./Components/users/DoctorPrescriptions";

import ActivityLog from "./Components/activity/ActivityLog";
import { LabReportsPage, LabOrderDetailPage } from "./Components/labReports";

import useStore from "./store/useStore.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleRoute from "./routes/RoleRoute";
import { useErrorHandler } from "./hooks/useErrorHandler.jsx";
import { APP_SETTINGS_BASE } from "./api/appSettingApi";
import { useLanguage } from "./i18n/LanguageContext.jsx";

function resolveAssetUrl(assetPath) {
	if (!assetPath) return null;

	const normalized = String(assetPath).replace(/\\/g, "/");

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

function UserEditWrapper({ updateUserAPI, users = [], fetchUsers }) {
	const { id } = useParams();

	const user = users.find((item) => String(item.id) === String(id));

	if (!user) {
		return (
			<div className="flex min-h-screen items-center justify-center p-6 text-sm font-semibold text-slate-500">
				User not found
			</div>
		);
	}

	return (
		<UserForm
			user={user}
			onUpdateUser={(userId, data) => updateUserAPI(userId, data)}
			onRefetch={fetchUsers}
		/>
	);
}

function App() {
	const navigate = useNavigate();
	const { language } = useLanguage();
	const isRtl = language === "fa";

	const [authChecked, setAuthChecked] = useState(false);

	const socketRef = useRef(null);
	const { ErrorDialog } = useErrorHandler();

	const isAuthenticated = useStore((state) => state.isAuthenticated);
	const currentUser = useStore((state) => state.currentUser);

	const hospitalSettings = useStore((state) => state.hospitalSettings);
	const appSetting = useStore((state) => state.appSetting);
	const getAppSetting = useStore((state) => state.getAppSetting);

	const patients = useStore((state) => state.patients);
	const fetchPatients = useStore((state) => state.fetchPatients);
	const fetchPrescriptions = useStore((state) => state.fetchPrescriptions);

	const logout = useStore((state) => state.logout);
	const checkAuth = useStore((state) => state.checkAuth);

	const createPrescription = useStore((state) => state.createPrescription);
	const prescriptionForm = useStore((state) => state.prescriptionForm);
	const setPrescriptionForm = useStore((state) => state.setPrescriptionForm);
	const resetPrescriptionForm = useStore((state) => state.resetPrescriptionForm);
	const updatePrescriptionForm = useStore((state) => state.updatePrescriptionForm);

	const users = useStore((state) => state.users);
	const fetchUsers = useStore((state) => state.fetchUsers);
	const createUser = useStore((state) => state.createUser);
	const deleteUser = useStore((state) => state.deleteUser);
	const updateUserAPI = useStore((state) => state.updateUserAPI);

	const setCurrentUser = useStore((state) => state.setCurrentUser);
	const setHospitalSettings = useStore((state) => state.setHospitalSettings);

	const hospitalInfo = {
		name: appSetting?.hospitalName || hospitalSettings?.name || "Hospital Name",
		hospitalName:
			appSetting?.hospitalName ||
			hospitalSettings?.hospitalName ||
			hospitalSettings?.name ||
			"Hospital Name",
		logo: resolveAssetUrl(
			appSetting?.logo || hospitalSettings?.logo || hospitalSettings?.logoPreview
		),
		logoPreview: resolveAssetUrl(
			appSetting?.logo || hospitalSettings?.logoPreview || hospitalSettings?.logo
		),
		phone1: appSetting?.phone1 || "",
		phone2: appSetting?.phone2 || "",
		address: appSetting?.address || "",
	};

	useEffect(() => {
		document.documentElement.dir = isRtl ? "rtl" : "ltr";
		document.documentElement.lang = isRtl ? "fa" : "en";
		document.body.dir = isRtl ? "rtl" : "ltr";
	}, [isRtl]);

	useEffect(() => {
		let active = true;

		const initAuth = async () => {
			try {
				await checkAuth();
			} finally {
				if (active) {
					setAuthChecked(true);
				}
			}
		};

		initAuth();

		return () => {
			active = false;
		};
	}, [checkAuth]);

	useEffect(() => {
		if (isAuthenticated && authChecked) {
			getAppSetting().catch(() => {});
		}
	}, [isAuthenticated, authChecked, getAppSetting]);

	useEffect(() => {
		if (isAuthenticated && authChecked) {
			fetchPatients();
			fetchPrescriptions();
			fetchUsers().catch(() => {});
		}
	}, [
		isAuthenticated,
		authChecked,
		fetchPatients,
		fetchPrescriptions,
		fetchUsers,
	]);

	useEffect(() => {
		if (!isAuthenticated || !authChecked || !currentUser?.id) return;

		const socketUrl = import.meta.env.VITE_SOCKET_URL;

		if (!socketUrl) return;

		const socket = io(socketUrl, { withCredentials: true });
		socketRef.current = socket;

		socket.on("connect", () => {
			const role = String(currentUser.role || "").toLowerCase();

			if (role === "doctor") {
				socket.emit("doctor:join", currentUser.id);
			}

			if (role === "pharmacy" || role === "pharmacist") {
				socket.emit("pharmacy:join");
			}
		});

		socket.on("prescription:new", () => {
			fetchPrescriptions();
		});

		socket.on("prescription:status", () => {
			fetchPrescriptions();
		});

		return () => {
			socket.off("prescription:new");
			socket.off("prescription:status");
			socket.disconnect();
			socketRef.current = null;
		};
	}, [isAuthenticated, authChecked, currentUser, fetchPrescriptions]);

	const handleCreatePrescription = async (prescriptionData) => {
		const createdPrescription = await createPrescription(prescriptionData);
		return createdPrescription;
	};

	const handleNavigateModule = (module) => {
		const routeMap = {
			dashboard: "/dashboard",
			patients: "/patients",
			prescriptions: "/prescriptions",
			medicines: "/medicines",
			labReports: "/lab-reports",
			users: "/users",
			activity: "/activity",
			settings: "/settings",
		};

		navigate(routeMap[module] || "/dashboard");
	};

	if (!authChecked) {
		return (
			<div
				dir={isRtl ? "rtl" : "ltr"}
				className="flex h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500"
			>
				{isRtl ? "جاری‌سازی..." : "Loading..."}
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Login hospitalSettings={hospitalInfo} />;
	}

	return (
		<div
			dir={isRtl ? "rtl" : "ltr"}
			data-dir={isRtl ? "rtl" : "ltr"}
			className="app-shell flex h-screen flex-row overflow-hidden bg-gray-50"
		>
			<Sidebar
				currentUser={currentUser}
				onLogout={logout}
				hospitalSettings={hospitalInfo}
			/>

			<main
				dir={isRtl ? "rtl" : "ltr"}
				className="app-main min-w-0 flex-1 overflow-y-auto"
			>
				<div className="min-h-full">
					<Routes>
						<Route path="/unauthorized" element={<Unauthorized />} />

						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard
										onViewPrescription={(id) => navigate(`/prescriptions/${id}`)}
										onViewPatient={(id) => navigate(`/patients/${id}`)}
										onViewLabReport={(id) => navigate(`/lab-reports/${id}`)}
										onNavigate={handleNavigateModule}
										currentUser={currentUser}
									/>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/patients"
							element={
								<ProtectedRoute>
									<PatientList
										onAddPatient={() => navigate("/add-patient")}
										onViewPatient={(id) => navigate(`/patients/${id}`)}
									/>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/add-patient"
							element={
								<ProtectedRoute>
									<PatientForm onCancel={() => navigate("/patients")} />
								</ProtectedRoute>
							}
						/>

						<Route
							path="/patients/:id"
							element={
								<ProtectedRoute>
									<PatientDetailRoute
										onBack={() => navigate("/patients")}
										onCreatePrescription={(patientId) => {
											const patient = patients.find(
												(item) => String(item.id) === String(patientId)
											);

											resetPrescriptionForm();

											updatePrescriptionForm({
												patientId: String(patientId),
												patientName: patient?.name || "",
												patientGender: patient?.gender || "",
												patientAge: patient?.age || "",
												patientFathername: patient?.fathername || "",
											});

											navigate("/create-prescription");
										}}
										onViewPrescription={(id) => navigate(`/prescriptions/${id}`)}
										currentUser={currentUser}
									/>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/users/:id/prescriptions"
							element={
								<RoleRoute allowedRoles={["admin", "doctor", "pharmacist"]}>
									<DoctorPrescriptions
										onViewPrescription={(id) => navigate(`/prescriptions/${id}`)}
									/>
								</RoleRoute>
							}
						/>

						<Route
							path="/prescriptions/:id/edit"
							element={
								<RoleRoute allowedRoles={["admin", "doctor"]}>
									<PrescriptionEditPage
										hospitalSettings={hospitalInfo}
										currentUser={currentUser}
									/>
								</RoleRoute>
							}
						/>

						<Route
							path="/prescriptions/:id"
							element={
								<ProtectedRoute>
									<PrescriptionDetailPage
										hospitalSettings={hospitalInfo}
										currentUser={currentUser}
									/>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/view-prescription/:id"
							element={<Navigate to="/prescriptions/:id" replace />}
						/>

						<Route
							path="/create-prescription"
							element={
								<RoleRoute allowedRoles={["admin", "doctor"]}>
									<PrescriptionForm
										prescriptionForm={prescriptionForm}
										setPrescriptionForm={setPrescriptionForm}
										patients={patients}
										onSubmit={handleCreatePrescription}
										onCancel={() => navigate("/prescriptions")}
										currentUser={currentUser}
										hospitalSettings={hospitalInfo}
									/>
								</RoleRoute>
							}
						/>

						<Route
							path="/prescriptions"
							element={
								<ProtectedRoute>
									<PrescriptionList
										onCreatePrescription={() => {
											resetPrescriptionForm();
											navigate("/create-prescription");
										}}
										onViewPrescription={(id) => navigate(`/prescriptions/${id}`)}
										currentUser={currentUser}
									/>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/medicines"
							element={
								<ProtectedRoute>
									<MedicineManagement />
								</ProtectedRoute>
							}
						/>

						<Route
							path="/lab-reports"
							element={
								<RoleRoute allowedRoles={["admin", "doctor", "pharmacist"]}>
									<LabReportsPage />
								</RoleRoute>
							}
						/>

						<Route
							path="/lab-reports/:id"
							element={
								<RoleRoute allowedRoles={["admin", "doctor", "pharmacist"]}>
									<LabOrderDetailPage />
								</RoleRoute>
							}
						/>

						<Route
							path="/settings"
							element={
								<ProtectedRoute>
									<Settings
										currentUser={currentUser}
										hospitalSettings={hospitalInfo}
										onSaveHospital={setHospitalSettings}
										onSaveProfile={setCurrentUser}
									/>
								</ProtectedRoute>
							}
						/>

						<Route
							path="/users"
							element={
								<RoleRoute allowedRoles={["admin"]}>
									<UserList
										users={users}
										onRemoveUser={deleteUser}
										onRefetch={fetchUsers}
									/>
								</RoleRoute>
							}
						/>

						<Route
							path="/users/add"
							element={
								<RoleRoute allowedRoles={["admin"]}>
									<UserForm onAddUser={createUser} onRefetch={fetchUsers} />
								</RoleRoute>
							}
						/>

						<Route
							path="/users/edit/:id"
							element={
								<RoleRoute allowedRoles={["admin"]}>
									<UserEditWrapper
										updateUserAPI={updateUserAPI}
										users={users}
										fetchUsers={fetchUsers}
									/>
								</RoleRoute>
							}
						/>

						<Route
							path="/activity"
							element={
								<RoleRoute allowedRoles={["admin"]}>
									<ActivityLog />
								</RoleRoute>
							}
						/>

						<Route path="/" element={<Navigate to="/dashboard" replace />} />
					</Routes>
				</div>
			</main>

			<ErrorDialog />
		</div>
	);
}

export default App;