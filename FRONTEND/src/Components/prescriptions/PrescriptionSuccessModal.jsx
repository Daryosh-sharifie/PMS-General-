import { useEffect } from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import { matchesShortcut, getShortcutById } from '../../utils/shortcutManager';

export default function PrescriptionSuccessModal({ prescription, onClose, hospitalSettings, currentUser }) {
	if (!prescription) return null;

	const handlePrint = () => {
		window.print();
	};

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (matchesShortcut(e, getShortcutById("printPrescription"))) {
				e.preventDefault();
				handlePrint();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
			<div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto print-only-modal">
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-3 sm:p-6 flex items-center justify-between sticky top-0">
					<div className="flex items-center gap-2 sm:gap-3">
						<CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" />
						<div>
							<h2 className="text-lg sm:text-2xl font-bold">نسخه با موفقیت ثبت شد</h2>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-white hover:bg-blue-700 p-2 rounded transition"
					>
						<X className="h-5 w-5 sm:h-6 sm:w-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
					{/* Prescription Number - Prominent Display */}
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-600 rounded-lg p-4 sm:p-6 text-center">
						<p className="text-xs sm:text-sm text-gray-600 mb-2">شماره نسخه</p>
						<p className="text-3xl sm:text-4xl font-black text-blue-700 tracking-wider">
							{prescription.prescriptionNo}
						</p>
						<p className="text-xs text-gray-500 mt-2">
							برای یافتن نسخه در دواخانه از این شماره استفاده کنید
							<br />
						</p>
					</div>

					{/* Doctor Info */}
					<div className="grid grid-cols-2 gap-2 sm:gap-4">
						<div className="border rounded p-2 sm:p-4">
							<label className="text-xs font-semibold text-gray-600 block text-right">داکتر</label>
							<p className="font-bold text-xs sm:text-sm text-gray-900 text-right mt-1">
								{prescription.doctor?.name || currentUser?.name || 'نام داکتر'}
							</p>
						</div>
						<div className="border rounded p-2 sm:p-4">
							<label className="text-xs font-semibold text-gray-600 block text-right">تاریخ</label>
							<p className="font-bold text-xs sm:text-sm text-gray-900 text-right mt-1">
								{new Date(prescription.createdAt || new Date()).toLocaleDateString('fa-IR')}
							</p>
						</div>
					</div>

					{/* Patient Info */}
					<div className="border-2 border-gray-300 rounded p-2 sm:p-4">
						<h4 className="font-bold text-xs sm:text-sm text-gray-800 text-right mb-2">اطلاعات مریض</h4>
						<div className="space-y-1 text-xs sm:text-sm">
							<div className="flex justify-between">
								<span className="font-semibold text-gray-900">نام مریض:</span>
								<span className="text-gray-700">{prescription.patientName}</span>
							</div>
							<div className="flex justify-between">
								<span className="font-semibold text-gray-900">نام پدر:</span>
								<span className="text-gray-700">{prescription.patient?.fathername || ''}</span>
							</div>
							<div className="flex justify-between">
								<span className="font-semibold text-gray-900">شناسه:</span>
								<span className="text-gray-700">ID: {prescription.patientId}</span>
							</div>
						</div>
					</div>

					{/* Important Notice */}
					<div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4 text-right">
						<p className="font-bold text-xs sm:text-sm text-yellow-900 mb-1">⚠️ توجه مهم</p>
						<p className="text-xs text-yellow-800">
							مریض باید این شماره نسخه را به دواخانه تسلیم دهد تا مسول بتواند نسخه را پیدا کند
						</p>
					</div>
				</div>

				{/* Footer - Actions */}
				<div className="bg-gray-50 p-3 sm:p-6 flex gap-2 sm:gap-3 justify-center border-t sticky bottom-0 print:hidden flex-wrap">
					<button
						onClick={handlePrint}
						className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded text-sm sm:text-base transition transform hover:scale-105"
					>
						<Printer className="h-4 w-4 sm:h-5 sm:w-5" />
						چاپ
					</button>
					<button
						onClick={onClose}
						className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 sm:py-3 sm:px-8 rounded text-sm sm:text-base transition"
					>
						بستن
					</button>
				</div>

				{/* Print Styles */}
				<style>{`
					@media print {
						/* Only print modal content */
						body * {
							visibility: hidden !important;
						}
						.print-only-modal, .print-only-modal * {
							visibility: visible !important;
						}
						.print-only-modal {
							position: absolute !important;
							left: 0 !important;
							top: 0 !important;
							width: 100% !important;
						}

						body {
							margin: 0;
							padding: 0;
						}
						.fixed {
							position: static !important;
						}
						.bg-black.bg-opacity-50 {
							background: none !important;
						}
						.rounded-lg {
							border-radius: 0 !important;
						}
						.shadow-2xl {
							box-shadow: none !important;
						}
						.max-w-2xl {
							max-width: 100% !important;
						}
						.max-h-\\[90vh\\] {
							max-height: none !important;
						}
						.overflow-y-auto {
							overflow: visible !important;
						}
						.sticky {
							position: relative !important;
						}
						.z-\\[9999\\] {
							z-index: auto !important;
						}
						
						/* Adjust for small papers */
						p {
							margin: 0 !important;
							line-height: 1.2 !important;
						}
						div {
							page-break-inside: avoid;
						}
						
						/* Padding optimization for small paper */
						.p-3 {
							padding: 6px !important;
						}
						.p-4 {
							padding: 8px !important;
						}
						.gap-2 {
							gap: 4px !important;
						}
						.gap-3 {
							gap: 6px !important;
						}
						.mb-2 {
							margin-bottom: 4px !important;
						}
						.mt-1 {
							margin-top: 2px !important;
						}
						.mt-2 {
							margin-top: 4px !important;
						}
						.space-y-1 > * + * {
							margin-top: 2px !important;
						}
						.space-y-2 > * + * {
							margin-top: 4px !important;
						}
						.space-y-3 > * + * {
							margin-top: 6px !important;
						}
						
						/* Text sizing for print */
						.text-xs {
							font-size: 9px !important;
						}
						.text-sm {
							font-size: 11px !important;
						}
						.text-base {
							font-size: 12px !important;
						}
						.text-lg {
							font-size: 13px !important;
						}
						.text-3xl {
							font-size: 24px !important;
							line-height: 1.2 !important;
						}
						.text-4xl {
							font-size: 28px !important;
							line-height: 1.2 !important;
						}
						
						/* Border adjustments */
						.border {
							border: 0.5px solid !important;
						}
						.border-2 {
							border: 1px solid !important;
						}
						.border-4 {
							border: 2px solid !important;
						}
						.border-l-4 {
							border-left: 2px solid !important;
						}
					}
				`}</style>
			</div>
		</div>
	);
}

