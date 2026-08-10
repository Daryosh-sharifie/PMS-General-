import { Clock, CheckCircle, Activity, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import Badge from "../ui/Badge";
import { buttonSecondary, buttonPrimary } from "../../constants/styles";
import { getStatusColor, formatDate } from "../../utils/helpers";
import useStore from "../../store/useStore.jsx";

export default function PharmacyVerification({ onViewPrescription }) {
	const { prescriptions, prescriptionsLoading, fetchPrescriptions, verifyPrescription } = useStore();
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;
	const [search, setSearch] = useState("");

	useEffect(() => {
		// Fetch prescriptions; support searching by prescriptionNo, id, or patientName
		const filters = search ? { search } : {};
		fetchPrescriptions(1, 100, filters);
	}, [fetchPrescriptions, search]);

	const pendingPrescriptions = prescriptions.filter((p) => p.status === "pending");
	const verifiedCount = prescriptions.filter((p) => p.status === "verified").length;
	const dispensedCount = prescriptions.filter((p) => p.status === "dispensed").length;

	// Calculate pagination
	const totalPages = Math.max(1, Math.ceil(pendingPrescriptions.length / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentPrescriptions = pendingPrescriptions.slice(startIndex, endIndex);

	const goToPage = (page) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const handleVerify = async (id) => {
		try {
			await verifyPrescription(id);
			// Refresh prescriptions
			await fetchPrescriptions(1, 100, {});
		} catch (error) {
		}
	};

	return (
		<div className="space-y-6 p-6 md:p-8">
			<div>
				<h2 className="text-3xl font-bold text-gray-900 text-right">تأیید دواخانه</h2>
			</div>

			{/* Search Bar */}
			<div className="relative">
				<input
					type="text"
					className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-right shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
					placeholder="جستجو بر اساس شماره نسخه، شناسه یا نام مریض"
					value={search}
					onChange={(e) => { setCurrentPage(1); setSearch(e.target.value); }}
				/>
				<span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
				
				</span>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card>
					<CardHeader className="flex items-center justify-between">
						<Clock className="h-4 w-4 text-yellow-600" />
						<p className="text-sm font-medium text-gray-600">در انتظار تأیید</p>
					</CardHeader>
					<CardContent>
						<div className="text-2xl text-center font-bold text-gray-900">{pendingPrescriptions.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex items-center justify-between">
						<CheckCircle className="h-4 w-4 text-green-600" />
						<p className="text-sm font-medium text-gray-600">تأیید شده</p>
					</CardHeader>
					<CardContent>
						<div className="text-2xl text-center font-bold text-gray-900">{verifiedCount}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex items-center justify-between">
						<Activity className="h-4 w-4 text-blue-600" />
						<p className="text-sm font-medium text-gray-600">تحویل داده شده امروز</p>
					</CardHeader>
					<CardContent>
						<div className="text-2xl text-center font-bold text-gray-900">{dispensedCount}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<h3 className="text-lg font-semibold text-right text-gray-900">نسخه‌های در انتظار تأیید</h3>
				</CardHeader>
				<CardContent>
					{currentPrescriptions.length > 0 ? (
						<div className="space-y-3">
							{currentPrescriptions.map((prescription) => (
								<div
									key={prescription.id}
									className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
								>
									<div className="mb-3 flex items-center justify-between">
										<Badge className={getStatusColor(prescription.status)}>در انتظار</Badge>
										<div>
											<p className="font-medium text-gray-900">{prescription.prescriptionNo || prescription.id}</p>
											<p className="text-sm text-gray-600">
												{prescription.patientName} • {formatDate(prescription.date)}
											</p>
										</div>
									</div>
									<div className="flex gap-3 justify-end">
										<button
											type="button"
											className={buttonSecondary}
											onClick={() => onViewPrescription(prescription.id)}
										>
											<Eye className="mr-2 h-4 w-4" />
											مشاهده جزئیات
										</button>
										<button
											type="button"
											className={`${buttonPrimary} bg-green-600 hover:bg-green-700 focus:ring-green-500`}
											onClick={() => handleVerify(prescription.id)}
										>
											<CheckCircle className="mr-2 h-4 w-4" />
											تأیید
										</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="py-8 text-center text-gray-500">هیچ نسخه‌ای در انتظار تأیید وجود ندارد</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="mt-6 flex items-center justify-center">
							<div className="flex items-center gap-2">
								<button
									type="button"
									onClick={() => goToPage(currentPage - 1)}
									disabled={currentPage === 1}
									className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<ChevronLeft className="h-4 w-4" />
								</button>
								
								<div className="flex items-center gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
										const showPage =
											page === 1 ||
											page === totalPages ||
											(page >= currentPage - 1 && page <= currentPage + 1);

										if (!showPage) {
											if (page === currentPage - 2 || page === currentPage + 2) {
												return (
													<span key={page} className="px-2 text-gray-500">
														...
													</span>
												);
											}
											return null;
										}

										return (
											<button
												key={page}
												type="button"
												onClick={() => goToPage(page)}
												className={`min-w-[2rem] rounded-lg px-3 py-1 text-sm font-medium ${
													currentPage === page
														? "bg-blue-600 text-white"
														: "border border-gray-300 text-gray-700 hover:bg-gray-50"
												}`}
											>
												{page}
											</button>
										);
									})}
								</div>

								<button
									type="button"
									onClick={() => goToPage(currentPage + 1)}
									disabled={currentPage === totalPages}
									className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

