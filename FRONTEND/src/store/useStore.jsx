import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { patientApi } from '../api/patientApi';
import { prescriptionApi } from '../api/prescriptionApi';
import * as authApi from '../api/authApi';
import { appSettingApi } from '../api/appSettingApi';
import { userApi } from '../api/userApi';

const useStore = create(
	persist(
		(set, get) => ({
			// Authentication
			isAuthenticated: false,
			authLoading: false,
			authError: null,
			setIsAuthenticated: (value) => set({ isAuthenticated: value }),

			// Login action
			login: async (email, password) => {
				set({ authLoading: true, authError: null });

				try {
					const result = await authApi.login(email, password);
					const user = result.data.user;

					set({
						isAuthenticated: true,
						currentUser: {
							id: user.id,
							name: user.name,
							email: user.email,
							role: user.role ? user.role.toLowerCase() : "",
							phone: user.phone || "",
							avatar: user.avatar || null,
							photo: null,
							photoPreview: user.avatar || null,
						},
						authLoading: false,
					});

					return result;
				} catch (error) {
					set({
						authError: error.message,
						authLoading: false,
						isAuthenticated: false,
					});

					throw error;
				}
			},

			// Signup action
			signup: async (name, email, password, passwordConfirm) => {
				set({ authLoading: true, authError: null });
				try {
					const result = await authApi.signup(name, email, password, passwordConfirm);
					const user = result.data.user;
					set({
						isAuthenticated: true,
						currentUser: {
							id: user.id,
							name: user.name,
							email: user.email,
							role: user.role ? user.role.toLowerCase() : "",
							phone: user.phone || "",
							avatar: user.avatar || null,
							photo: null,
							photoPreview: user.avatar || null
						},
						authLoading: false
					});
					return result;
				} catch (error) {
					set({ 
						authError: error.message,
						authLoading: false,
						isAuthenticated: false
					});
					throw error;
				}
			},

			// Logout action
			logout: async () => {
				try {
					await authApi.logout();
					set({
						isAuthenticated: false,
						currentUser: {
							name: "",
							role: "",
							email: "",
							phone: "",
							avatar: null,
							photo: null,
							photoPreview: null
						},
						authError: null
					});
				} catch (error) {
					set({
						isAuthenticated: false,
						currentUser: {
							name: "",
							role: "",
							email: "",
							phone: "",
							avatar: null,
							photo: null,
							photoPreview: null
						}
					});
				}
			},

			// Get current user from token
			checkAuth: async () => {
				try {
					const user = await authApi.getMe();
					if (!user) {
						set({
							isAuthenticated: false,
							currentUser: {
								name: "",
								role: "",
								email: "",
								phone: "",
								avatar: null,
								photo: null,
								photoPreview: null
							}
						});
						return false;
					}
					set((state) => {
						const stored = (()=>{ try { return JSON.parse(localStorage.getItem('user')||'null'); } catch { return null; } })();
						const avatar = user.avatar || stored?.avatar || state.currentUser?.avatar || null;
						return {
							isAuthenticated: true,
							currentUser: {
								id: user.id,
								name: user.name,
								email: user.email,
								role: user.role ? user.role.toLowerCase() : "",
								phone: user.phone || "",
								avatar,
								photo: null,
								photoPreview: avatar
							}
						};
					});
					return true;
				} catch (error) {
					set({
						isAuthenticated: false,
						currentUser: {
							name: "",
							role: "",
							email: "",
							phone: "",
							photo: null,
							photoPreview: null
						}
					});
					return false;
				}
			},

			// Current User
			currentUser: {
				name: "",
				role: "",
				email: "",
				phone: "",
				avatar: null,
				photo: null,
				photoPreview: null
			},
			setCurrentUser: (user) => set({ currentUser: user }),
			updateCurrentUser: (updates) => set((state) => ({
				currentUser: { ...state.currentUser, ...updates }
			})),

			// Users / Doctors
			users: [],
			fetchUsers: async () => {
				const response = await userApi.getAllUsers();
				const usersList = Array.isArray(response) ? response : response.data || [];
				set({ users: usersList });
				return usersList;
			},
			addUser: (user) => set((state) => ({
				users: [...state.users, { ...user, id: state.users.length ? Math.max(...state.users.map(u => u.id)) + 1 : 1, createdAt: new Date().toISOString() }]
			})),
			createUser: async (userData, avatarFile = null) => {
				const newUser = await userApi.createUser(userData, avatarFile);
				set((state) => ({
					users: [...state.users, { ...newUser, createdAt: new Date().toISOString() }]
				}));
				return newUser;
			},
			updateUser: (id, updates) => set((state) => ({
				users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
			})),
			updateUserAPI: async (id, userData, avatarFile = null) => {
				const updatedUser = await userApi.updateUser(id, userData, avatarFile);
				set((state) => ({
					users: state.users.map(u => u.id === id ? { ...u, ...updatedUser } : u)
				}));
				return updatedUser;
			},
			removeUser: (id) => set((state) => ({
				users: state.users.filter(u => u.id !== id)
			})),
			deleteUser: async (id) => {
				try {
					await userApi.deleteUser(id);
					set((state) => ({
						users: state.users.filter(u => u.id !== id)
					}));
				} catch (error) {
					throw error;
				}
			},

		// Hospital Settings
		hospitalSettings: {
			name: "Hospital Name",
			logo: null,
			logoPreview: null
		},
		setHospitalSettings: (settings) => {
			set({ hospitalSettings: settings });
		},
		updateHospitalSettings: (updates) => set((state) => ({
			hospitalSettings: { ...state.hospitalSettings, ...updates }
		})),

		// AppSettings (from backend)
		appSetting: {
			id: null,
			hospitalName: "",
			logo: null,
			phone1: "",
			phone2: "",
			address: "",
			createdAt: null,
			updatedAt: null
		},
		getAppSetting: async () => {
			try {
				const response = await appSettingApi.getAppSetting();
				if (response.status === 'success') {
					const setting = response.data.appSetting;
					set({
						appSetting: {
							id: setting.id,
							hospitalName: setting.hospitalName,
							logo: setting.logo,
							phone1: setting.phone1,
							phone2: setting.phone2 || '',
							address: setting.address,
							createdAt: setting.createdAt,
							updatedAt: setting.updatedAt
						}
					});
					return response.data.appSetting;
				}
			} catch (error) {
				throw error;
			}
		},

		updateAppSetting: async (data) => {
			try {
				const response = await appSettingApi.updateAppSetting(data);
				if (response.status === 'success') {
					const setting = response.data.appSetting;
					set({
						appSetting: {
							id: setting.id,
							hospitalName: setting.hospitalName,
							logo: setting.logo,
							phone1: setting.phone1,
							phone2: setting.phone2 || '',
							address: setting.address,
							createdAt: setting.createdAt,
							updatedAt: setting.updatedAt
						}
					});
					return response.data.appSetting;
				}
			} catch (error) {
				throw error;
			}
		},

		uploadLogo: async (file) => {
			try {
				const response = await appSettingApi.uploadLogo(file);
				if (response.status === 'success') {
					const setting = response.data.appSetting;
					set({
						appSetting: {
							id: setting.id,
							hospitalName: setting.hospitalName,
							logo: setting.logo,
							phone1: setting.phone1,
							phone2: setting.phone2 || '',
							address: setting.address,
							createdAt: setting.createdAt,
							updatedAt: setting.updatedAt
						}
					});
					return response.data.appSetting;
				}
			} catch (error) {
				throw error;
			}
		},

		// Current Page
			currentPage: "dashboard",
			setCurrentPage: (page) => set({ currentPage: page }),

			// Selected IDs
			selectedPatientId: null,
			setSelectedPatientId: (id) => set({ selectedPatientId: id }),
			selectedPrescriptionId: null,
			setSelectedPrescriptionId: (id) => set({ selectedPrescriptionId: id }),

			// Patients
			patients: [],
			patientsLoading: false,
			patientsError: null,
			patientsPage: 1,
			patientsTotalPages: 1,
			patientsTotalRecords: 0,
			
			fetchPatients: async (page = 1, limit = 10, search = '') => {
				set({ patientsLoading: true, patientsError: null });
				try {
					const response = await patientApi.getAllPatients(page, limit, search);
					if (response.status === 'success') {
						const allPatients = response.data.patients.map(p => ({
							id: p.id,
							name: p.fullname,
							fullname: p.fullname,
							age: p.age,
							gender: p.gender,
							phone: p.phone ? p.phone.toString() : "",
							email: p.email,
							address: p.address,
							bloodGroup: p.bloodGroup,
							allergies: p.knownallergies || "None",
							knownallergies: p.knownallergies,
							lastVisit: new Date(p.createdAt).toISOString().split('T')[0],
							createdAt: p.createdAt,
							createdBy: p.createdBy
						}));
						// Show all patients to all authenticated roles
						set({
							patients: allPatients,
							patientsPage: response.pagination?.currentPage ?? page,
							patientsTotalPages: response.pagination?.totalPages ?? 1,
							patientsTotalRecords: response.pagination?.totalRecords ?? allPatients.length
						});
					}
				} catch (error) {
					set({ patientsError: error.message });
				} finally {
					set({ patientsLoading: false });
				}
			},

			getPatientById: async (id) => {
				try {
					const response = await patientApi.getPatient(id);
					if (response.status === 'success') {
						const p = response.data.patient;
						return {
							id: p.id,
							name: p.fullname,
							fullname: p.fullname,
							age: p.age,
							gender: p.gender,
							phone: p.phone ? p.phone.toString() : "",
							email: p.email,
							address: p.address,
							bloodGroup: p.bloodGroup,
							allergies: p.knownallergies || "None",
							knownallergies: p.knownallergies,
							lastVisit: new Date(p.createdAt).toISOString().split('T')[0],
							createdAt: p.createdAt
						};
					}
				} catch (error) {
				}
			},

			addPatient: async (patient) => {
				try {
					const response = await patientApi.createPatient({
						fullname: patient.fullname || patient.name,
						fathername: patient.fathername,
						age: patient.age,
						bloodGroup: patient.bloodGroup,
						gender: patient.gender,
						email: patient.email,
						phone: patient.phone,
						address: patient.address,
						knownallergies: patient.knownallergies || ''
					});
					if (response.status === 'success') {
						const newPatient = response.data.patient;
						set((state) => ({
							patients: [...state.patients, {
								id: newPatient.id,
								name: newPatient.fullname,
								fullname: newPatient.fullname,
								fathername: newPatient.fathername,
								age: newPatient.age,
								gender: newPatient.gender,
								phone: newPatient.phone ? newPatient.phone.toString() : "",
								email: newPatient.email,
								address: newPatient.address,
								bloodGroup: newPatient.bloodGroup,
								allergies: newPatient.knownallergies || "None",
								knownallergies: newPatient.knownallergies,
								lastVisit: new Date(newPatient.createdAt).toISOString().split('T')[0],
								createdAt: newPatient.createdAt
							}]
						}));
						return response.data.patient;
					}
				} catch (error) {
					throw error;
				}
			},

			updatePatientStore: async (id, updates) => {
				try {
					const response = await patientApi.updatePatient(id, {
						fullname: updates.fullname || updates.name,
						fathername: updates.fathername,
						age: updates.age,
						bloodGroup: updates.bloodGroup,
						gender: updates.gender,
						email: updates.email,
						phone: updates.phone,
						address: updates.address,
						knownallergies: updates.knownallergies || ''
					});
					if (response.status === 'success') {
						const updated = response.data.patient;
						set((state) => ({
							patients: state.patients.map(p => p.id === id ? {
								id: updated.id,
								name: updated.fullname,
								fullname: updated.fullname,
								fathername: updated.fathername,
								age: updated.age,
								gender: updated.gender,
								phone: updated.phone ? updated.phone.toString() : "",
								email: updated.email,
								address: updated.address,
								bloodGroup: updated.bloodGroup,
								allergies: updated.knownallergies || "None",
								knownallergies: updated.knownallergies,
								lastVisit: new Date(updated.createdAt).toISOString().split('T')[0],
								createdAt: updated.createdAt
							} : p)
						}));
						return response.data.patient;
					}
				} catch (error) {
					throw error;
				}
			},

			removePatient: async (id) => {
				try {
					await patientApi.deletePatient(id);
					set((state) => ({
						patients: state.patients.filter(p => p.id !== id)
					}));
				} catch (error) {
					throw error;
				}
			},

			// Prescriptions
			prescriptions: [],
			prescriptionsLoading: false,
			prescriptionsError: null,
			prescriptionsPage: 1,
			prescriptionsTotalPages: 1,
			prescriptionsTotalRecords: 0,
			prescriptionsTotalPending: 0,
			prescriptionsTotalVerified: 0,

			fetchPrescriptions: async (page = 1, limit = 10, filters = {}) => {
				set({ prescriptionsLoading: true, prescriptionsError: null });
				try {
					const response = await prescriptionApi.getAllPrescriptions(page, limit, filters);
					if (response.status === 'success') {
						const currentUser = get().currentUser;
						// Filter prescriptions based on role:
						// - admin: sees all prescriptions
						// - doctor: sees only their created prescriptions
						// - pharmacist: sees all prescriptions (for verification/dispensing)
						const allPrescriptions = response.data.prescriptions.map(p => ({
							id: p.id,
							prescriptionNo: p.prescriptionNo,
							patientId: p.patientId,
							patientName: p.patientName,
							doctorId: p.doctorId,
							doctorName: p.doctor?.name || 'Unknown',
							date: new Date(p.date).toISOString().split('T')[0],
							diagnosis: p.diagnosis,
							symptoms: p.symptoms,
							medicalHistory: p.medicalHistory,
							notes: p.notes,
							instructions: p.instructions,
							// New clinical fields
							pastHistory: p.pastHistory || '',
							investigation: p.investigation || '',
							impression: p.impression || '',
							drugHistory: p.drugHistory || '',
							// Vital signs
							bloodPressure: p.bloodPressure || '',
							respiratoryRate: p.respiratoryRate || '',
							pulseRate: p.pulseRate || '',
							temperature: p.temperature || '',
							heartRate: p.heartRate || '',
							spo2: p.spo2 || '',
							clc: p.clc || '',
							status: p.status.toLowerCase(),
							rejectionReason: p.rejectionReason || null,
							medicines: (p.medicines || []).map((m) => ({ ...m, amount: m?.amount ?? 0 })),
							patient: p.patient,
							doctor: p.doctor,
							createdAt: p.createdAt
						}));
						
						const formattedPrescriptions = (currentUser?.role === 'admin' || currentUser?.role === 'pharmacist') 
							? allPrescriptions 
							: allPrescriptions.filter(p => p.doctorId === currentUser?.id);
						
						set({
							prescriptions: formattedPrescriptions,
							prescriptionsPage: response.currentPage,
							prescriptionsTotalPages: response.totalPages,
							prescriptionsTotalRecords: response.totalCount || formattedPrescriptions.length
						});
					}
				} catch (error) {
					set({ prescriptionsError: error.message });
				} finally {
					set({ prescriptionsLoading: false });
				}
			},

			fetchLastPrescriptions: async () => {
				try {
					const response = await prescriptionApi.getLastPrescriptions();
					if (response.status === 'success') {
						const currentUser = get().currentUser;
						const allPrescriptions = response.data.prescriptions.map(p => ({
							id: p.id,
							prescriptionNo: p.prescriptionNo,
							patientId: p.patientId,
							patientName: p.patientName,
							patientFathername: p.patientFathername || '',
							patientGender: p.patientGender || '',
							patientAge: p.patientAge || '',
							doctorId: p.doctorId,
							doctorName: p.doctor?.name || 'Unknown',
							date: new Date(p.date).toISOString().split('T')[0],
							diagnosis: p.diagnosis,
							symptoms: p.symptoms,
							medicalHistory: p.medicalHistory,
							notes: p.notes,
							instructions: p.instructions,
							// New clinical fields
							pastHistory: p.pastHistory || '',
							investigation: p.investigation || '',
							impression: p.impression || '',
							drugHistory: p.drugHistory || '',
							// Vital signs
							bloodPressure: p.bloodPressure || '',
							respiratoryRate: p.respiratoryRate || '',
							pulseRate: p.pulseRate || '',
							temperature: p.temperature || '',
							heartRate: p.heartRate || '',
							spo2: p.spo2 || '',
							clc: p.clc || '',
							status: p.status.toLowerCase(),
							medicines: (p.medicines || []).map((m) => ({ ...m, amount: m?.amount ?? 0 })),
							labOrders: p.labOrders || [],
							patient: p.patient,
							doctor: p.doctor,
							createdAt: p.createdAt
						}));
						
						const formattedPrescriptions = (currentUser?.role === 'admin' || currentUser?.role === 'pharmacist') 
							? allPrescriptions 
							: allPrescriptions.filter(p => p.doctorId === currentUser?.id);
						
						return formattedPrescriptions;
					}
					return [];
				} catch (error) {
					console.error('Failed to fetch last prescriptions:', error);
					return [];
				}
			},

			getPrescriptionById: async (id) => {
				try {
					const response = await prescriptionApi.getPrescription(id);
					if (response.status === 'success') {
						const p = response.data.prescription;
						return {
							id: p.id,
							prescriptionNo: p.prescriptionNo,
							patientId: p.patientId,
							patientName: p.patientName,
							patientFathername: p.patientFathername || '',
							patientGender: p.patientGender || '',
							patientAge: p.patientAge || '',
							doctorId: p.doctorId,
							doctorName: p.doctor?.name || 'Unknown',
							date: new Date(p.date).toISOString().split('T')[0],
							diagnosis: p.diagnosis,
							symptoms: p.symptoms,
							medicalHistory: p.medicalHistory,
							notes: p.notes,
							instructions: p.instructions,
							// New clinical fields
							pastHistory: p.pastHistory || '',
							investigation: p.investigation || '',
							impression: p.impression || '',
							drugHistory: p.drugHistory || '',
							// Vital signs
							bloodPressure: p.bloodPressure || '',
							respiratoryRate: p.respiratoryRate || '',
							pulseRate: p.pulseRate || '',
							temperature: p.temperature || '',
							heartRate: p.heartRate || '',
							spo2: p.spo2 || '',
							clc: p.clc || '',
							status: p.status.toLowerCase(),
							medicines: (p.medicines || []).map((m) => ({ ...m, amount: m?.amount ?? 0 })),
							labOrders: p.labOrders || [],
							patient: p.patient,
							doctor: p.doctor,
							createdAt: p.createdAt
						};
					}
				} catch (error) {
					console.error("Error fetching prescription:", error);
				}
			},

			addPrescription: async (prescriptionData) => {
				try {
					const response = await prescriptionApi.createPrescription(prescriptionData);
					if (response.status === 'success') {
						const p = response.data.prescription;
						const newPrescription = {
							id: p.id,
							prescriptionNo: p.prescriptionNo,
							patientId: p.patientId,
							patientName: p.patientName,
							patientFathername: p.patientFathername || '',
							patientGender: p.patientGender || '',
							patientAge: p.patientAge || '',
							doctorId: p.doctorId,
							doctorName: p.doctor?.name || 'Unknown',
							date: new Date(p.date).toISOString().split('T')[0],
							diagnosis: p.diagnosis,
							symptoms: p.symptoms,
							medicalHistory: p.medicalHistory,
							notes: p.notes,
							instructions: p.instructions,
							// New clinical fields
							pastHistory: p.pastHistory || '',
							investigation: p.investigation || '',
							impression: p.impression || '',
							drugHistory: p.drugHistory || '',
							// Vital signs
							bloodPressure: p.bloodPressure || '',
							respiratoryRate: p.respiratoryRate || '',
							pulseRate: p.pulseRate || '',
							temperature: p.temperature || '',
							heartRate: p.heartRate || '',
							spo2: p.spo2 || '',
							clc: p.clc || '',
							status: p.status.toLowerCase(),
							medicines: (p.medicines || []).map((m) => ({ ...m, amount: m?.amount ?? 0 })),
							patient: p.patient,
							doctor: p.doctor,
							createdAt: p.createdAt
						};
						set((state) => ({
							prescriptions: [...state.prescriptions, newPrescription]
						}));
						return response.data.prescription;
					}
				} catch (error) {
					throw error;
				}
			},

		updatePrescription: async (id, updates) => {
			try {
				const response = await prescriptionApi.updatePrescription(id, updates);

				const p =
					response?.data?.prescription ||
					response?.prescription ||
					response?.data ||
					response;

				if (!p || !p.id) {
					console.error("Invalid updatePrescription response:", response);
					throw new Error("Prescription updated, but invalid response returned from backend.");
				}

				const mappedPrescription = {
					id: p.id,
					prescriptionNo: p.prescriptionNo,
					patientId: p.patientId,
					patientName: p.patientName || "",
					doctorId: p.doctorId,
					doctorName: p.doctor?.name || "Unknown",
					date: p.date ? new Date(p.date).toISOString().split("T")[0] : "",
					diagnosis: p.diagnosis || "",
					notes: p.notes || "",
					instructions: p.instructions || "",
					pastHistory: p.pastHistory || "",
					investigation: p.investigation || "",
					impression: p.impression || "",
					drugHistory: p.drugHistory || "",
					bloodPressure: p.bloodPressure || "",
					respiratoryRate: p.respiratoryRate || "",
					pulseRate: p.pulseRate || "",
					temperature: p.temperature || "",
					heartRate: p.heartRate || "",
					spo2: p.spo2 || "",
					clc: p.clc || "",
					status: String(p.status || "").toLowerCase(),
					rejectionReason: p.rejectionReason || null,
					medicines: (p.medicines || []).map((medicine) => ({
						id: medicine.id,
						name: medicine.name || "",
						dosage: medicine.dosage || "",
						frequency: medicine.frequency || "",
						route: medicine.route || "",
						type: medicine.type || medicine.route || "",
						duration: medicine.duration || "",
						instructions: medicine.instructions || "",
						amount: medicine.amount ?? 0,
						mealTiming: medicine.mealTiming || "",
					})),
					patient: p.patient,
					doctor: p.doctor,
					createdAt: p.createdAt,
					updatedAt: p.updatedAt,
				};

				set((state) => {
					const exists = state.prescriptions.some(
						(prescription) => String(prescription.id) === String(id)
					);

					return {
						prescriptions: exists
							? state.prescriptions.map((prescription) =>
									String(prescription.id) === String(id)
										? mappedPrescription
										: prescription
							)
							: [mappedPrescription, ...state.prescriptions],
					};
				});

				return p;
			} catch (error) {
				console.error("updatePrescription store error:", error);
				throw error;
			}
		},

			removePrescription: async (id) => {
				try {
					await prescriptionApi.deletePrescription(id);
					set((state) => ({
						prescriptions: state.prescriptions.filter(p => p.id !== id)
					}));
				} catch (error) {
					throw error;
				}
			},

			verifyPrescription: async (id) => {
				try {
					const response = await prescriptionApi.updatePrescriptionStatus(id, 'VERIFIED');
					if (response.status === 'success') {
						const p = response.data.prescription;
						set((state) => ({
							prescriptions: state.prescriptions.map(pr => pr.id === id ? {
								id: p.id,
								prescriptionNo: p.prescriptionNo,
								patientId: p.patientId,
								patientName: p.patientName,
								patientFathername: p.patientFathername || '',
								patientGender: p.patientGender || '',
								patientAge: p.patientAge || '',
								doctorId: p.doctorId,
								doctorName: p.doctor?.name || 'Unknown',
								date: new Date(p.date).toISOString().split('T')[0],
								diagnosis: p.diagnosis,
								symptoms: p.symptoms,
								medicalHistory: p.medicalHistory,
								notes: p.notes,
								instructions: p.instructions,
								// New clinical fields
								pastHistory: p.pastHistory || '',
								investigation: p.investigation || '',
								impression: p.impression || '',
								drugHistory: p.drugHistory || '',
								// Vital signs
								bloodPressure: p.bloodPressure || '',
								respiratoryRate: p.respiratoryRate || '',
								pulseRate: p.pulseRate || '',
								temperature: p.temperature || '',
								heartRate: p.heartRate || '',
								spo2: p.spo2 || '',
								clc: p.clc || '',
								status: p.status.toLowerCase(),
								medicines: (p.medicines || []).map((m) => ({ ...m, amount: m?.amount ?? 0 })),
								patient: p.patient,
								doctor: p.doctor,
								createdAt: p.createdAt
							} : pr)
						}));
						return response.data.prescription;
					}
				} catch (error) {
					throw error;
				}
			},

			dispensePrescription: async (id) => {
				try {
					const response = await prescriptionApi.updatePrescriptionStatus(id, 'DISPENSED');
					if (response.status === 'success') {
						const p = response.data.prescription;
						set((state) => ({
							prescriptions: state.prescriptions.map(pr => pr.id === id ? {
								id: p.id,
								prescriptionNo: p.prescriptionNo,
								patientId: p.patientId,
								patientName: p.patientName,
								patientFathername: p.patientFathername || '',
								patientGender: p.patientGender || '',
								patientAge: p.patientAge || '',
								doctorId: p.doctorId,
								doctorName: p.doctor?.name || 'Unknown',
								date: new Date(p.date).toISOString().split('T')[0],
								diagnosis: p.diagnosis,
								symptoms: p.symptoms,
								medicalHistory: p.medicalHistory,
								notes: p.notes,
								instructions: p.instructions,
								// New clinical fields
								pastHistory: p.pastHistory || '',
								investigation: p.investigation || '',
								impression: p.impression || '',
								drugHistory: p.drugHistory || '',
								// Vital signs
								bloodPressure: p.bloodPressure || '',
								respiratoryRate: p.respiratoryRate || '',
								pulseRate: p.pulseRate || '',
								temperature: p.temperature || '',
								heartRate: p.heartRate || '',
								spo2: p.spo2 || '',
								clc: p.clc || '',
								status: p.status.toLowerCase(),
								medicines: (p.medicines || []).map((m) => ({ ...m, amount: m?.amount ?? 0 })),
								patient: p.patient,
								doctor: p.doctor,
								createdAt: p.createdAt
							} : pr)
						}));
						return response.data.prescription;
					}
				} catch (error) {
					throw error;
				}
			},

			// Forms
			loginForm: { email: "", password: "" },
			setLoginForm: (form) => set({ loginForm: form }),
			updateLoginForm: (updates) => set((state) => ({
				loginForm: { ...state.loginForm, ...updates }
			})),

			patientForm: {
				fullname: "",
				fathername: "",
				age: "",
				gender: "",
				phone: "",
				email: "",
				address: "",
				bloodGroup: "",
				knownallergies: "",
			},
			setPatientForm: (form) => set({ patientForm: form }),
			updatePatientForm: (updates) => set((state) => ({
				patientForm: { ...state.patientForm, ...updates }
			})),
			resetPatientForm: () => set({
				patientForm: {
					fullname: "",
					fathername: "",
					age: "",
					gender: "",
					phone: "",
					email: "",
					address: "",
					bloodGroup: "",
					knownallergies: "",
				}
			}),

			prescriptionForm: {
				patientId: "",
				patientName: "",
				patientFathername: "",
				patientGender: "",
				patientAge: "",
				dateJalali: "",
				diagnosis: "",
				notes: "",
				medicines: [],
				instructions: "",
				pastHistory: "",
				investigation: "",
				impression: "",
				drugHistory: "",
				bloodPressure: "",
				respiratoryRate: "",
				pulseRate: "",
				temperature: "",
				heartRate: "",
				spo2: "",
				clc: "",
			},
		setPrescriptionForm: (form) => set({ prescriptionForm: form }),
		updatePrescriptionForm: (updates) => set((state) => ({
			prescriptionForm: { ...state.prescriptionForm, ...updates }
		})),
		resetPrescriptionForm: () =>
		set({
			prescriptionForm: {
				patientId: "",
				patientName: "",
				patientFathername: "",
				patientGender: "",
				patientAge: "",
				dateJalali: "",
				diagnosis: "",
				notes: "",
				medicines: [],
				instructions: "",
				pastHistory: "",
				investigation: "",
				impression: "",
				drugHistory: "",
				bloodPressure: "",
				respiratoryRate: "",
				pulseRate: "",
				temperature: "",
				heartRate: "",
				spo2: "",
				clc: "",
			},
		}),

		medicineForm: {
			name: "",
			dosage: "",
			frequency: "",
			duration: "",
			instructions: "",
		},
		setMedicineForm: (form) => set({ medicineForm: form }),
		updateMedicineForm: (updates) => set((state) => ({
			medicineForm: { ...state.medicineForm, ...updates }
		})),
		resetMedicineForm: () => set({
			medicineForm: {
				name: "",
				dosage: "",
				frequency: "",
				duration: "",
				instructions: "",
			}
		}),

			// Search and Filters
			patientSearch: "",
			setPatientSearch: (search) => set({ patientSearch: search }),

			prescriptionSearch: "",
			setPrescriptionSearch: (search) => set({ prescriptionSearch: search }),

			statusFilter: "all",
			setStatusFilter: (filter) => set({ statusFilter: filter }),

			// Actions
			updatePassword: (updatedUser) => set((state) => {
				// Update currentUser password
				const newCurrentUser = { ...state.currentUser, ...updatedUser };
				set({ currentUser: newCurrentUser });
				
				// Also update the user in the users list
				const updatedUsers = state.users.map(u => 
					u.id === updatedUser.id ? { ...u, password: updatedUser.password } : u
				);
				return { users: updatedUsers, currentUser: newCurrentUser };
			}),

			createPatient: async () => {
				const state = get();
				try {
					const newPatient = {
						fullname: state.patientForm.fullname,
						fathername: state.patientForm.fathername,
						age: state.patientForm.age,
						bloodGroup: state.patientForm.bloodGroup,
						gender: state.patientForm.gender,
						phone: state.patientForm.phone,
						email: state.patientForm.email,
						address: state.patientForm.address,
						knownallergies: state.patientForm.knownallergies || ''
					};
					await state.addPatient(newPatient);
					state.resetPatientForm();
					state.setCurrentPage("patients");
					// Refresh patients list
					await state.fetchPatients();
					return true;
				} catch (error) {
					return false;
				}
			},

		createPrescription: async (prescriptionData = null) => {
			const state = get();
			const { patients, currentUser } = state;
			const prescriptionForm = prescriptionData || state.prescriptionForm;

			if (!prescriptionForm.patientId) return false;

			const patientId = Number(prescriptionForm.patientId);
			const patient = patients.find((p) => Number(p.id) === patientId);

			const payload = {
				patientId,
				doctorId: Number(currentUser?.id),
				patientName: prescriptionForm.patientName || patient?.name || "Unknown",
				diagnosis: prescriptionForm.diagnosis || "",
				status: "PENDING",

				notes: prescriptionForm.notes || "",
				instructions: prescriptionForm.instructions || "",
				pastHistory: prescriptionForm.pastHistory || "",
				investigation: prescriptionForm.investigation || "",
				impression: prescriptionForm.impression || "",
				drugHistory: prescriptionForm.drugHistory || "",

				bloodPressure: prescriptionForm.bloodPressure || "",
				respiratoryRate: prescriptionForm.respiratoryRate || "",
				pulseRate: prescriptionForm.pulseRate || "",
				temperature: prescriptionForm.temperature || "",
				heartRate: prescriptionForm.heartRate || "",
				spo2: prescriptionForm.spo2 || "",
				clc: prescriptionForm.clc || "",

				medicines: (prescriptionForm.medicines || [])
					.map((medicine) => ({
						name: medicine.name || "",
						dosage: medicine.dosage || "",
						frequency: medicine.frequency || "",
						route: medicine.route || medicine.type || "",
						type: medicine.type || medicine.route || "",
						amount: Number(medicine.amount) || 0,
						mealTiming: medicine.mealTiming || "",
						instructions: medicine.instructions || "",
						duration: medicine.duration || "",
					}))
					.filter(
						(medicine) =>
							medicine.name ||
							medicine.dosage ||
							medicine.frequency ||
							medicine.route ||
							medicine.type ||
							medicine.duration ||
							medicine.instructions ||
							medicine.amount ||
							medicine.mealTiming
					),
			};

			try {
				const createdPrescription = await state.addPrescription(payload);
				return createdPrescription;
			} catch (error) {
				throw error;
			}
		},

		getStats: () => {
			const state = get();
			return {
				totalPatients: state.patients.length,
				totalPrescriptions: state.prescriptions.length,
				pendingPrescriptions: state.prescriptions.filter((p) => p.status === "pending").length,
				verifiedPrescriptions: state.prescriptions.filter((p) => p.status === "verified").length,
			};
		},
	}),
	{
		name: 'hospital-storage',
	}
)
);

export default useStore;


