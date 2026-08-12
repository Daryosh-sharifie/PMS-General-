import { AlertTriangle, X, MessageCircle, Phone } from 'lucide-react';

export default function ErrorDialog({ error, isOpen, onClose, whatsappNumber = '+93704686405', phoneNumber = '+93766315846' }) {
	if (!isOpen) return null;

	const errorMessage = error?.message || 'Unknown error occurred';

	const handleWhatsApp = () => {
		const message = `سلام، من یک مشکل در سیستم نسخه دیجیتال داشتم:\n\n${errorMessage}`;
		const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
		window.open(whatsappUrl, '_blank');
	};

	const handleCall = () => {
		window.location.href = `tel:${phoneNumber}`;
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
			<div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3 flex-1">
						<AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
						<div>
							<h2 className="text-xl font-bold text-red-600">خطا در سیستم</h2>
							<p className="text-sm text-gray-600">System Error</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Error Message */}
				<div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
					<p className="text-sm text-right text-gray-800 leading-relaxed">
						<span className="font-semibold text-red-700">پیام خطا:</span>
						<br />
						{errorMessage}
					</p>
					<p className="text-xs text-gray-600 text-right">
						<span className="font-semibold">Error Details:</span>
						<br />
						{errorMessage}
					</p>
				</div>

				{/* Instructions */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
					<p className="text-sm font-semibold text-blue-900 text-right">
						اگر این مشکل ادامه یافت لطفاً با ما تماس بگیرید
					</p>
					<p className="text-xs text-blue-700 text-right">
						If this error persists, please contact us
					</p>
				</div>

				{/* Contact Options */}
				<div className="grid grid-cols-2 gap-3">
					<button
						onClick={handleWhatsApp}
						className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105"
					>
						<MessageCircle className="h-5 w-5" />
						<span>واتس‌اپ</span>
					</button>
					<button
						onClick={handleCall}
						className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105"
					>
						<Phone className="h-5 w-5" />
						<span>تلفن</span>
					</button>
				</div>

				{/* Close Button */}
				<button
					onClick={onClose}
					className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition"
				>
					Close
				</button>
			</div>
		</div>
	);
}

