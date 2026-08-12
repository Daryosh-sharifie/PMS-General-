import { AlertCircle, CheckCircle2, Info, SearchX } from "lucide-react";

export default function Message({
	type = "empty",
	title,
	description,
	action,
	fullHeight = false,
}) {
	const config = {
		empty: {
			icon: SearchX,
			iconClass: "text-gray-400",
			boxClass: "bg-gray-50 border-gray-200",
			titleClass: "text-gray-800",
			defaultTitle: "معلوماتی یافت نشد",
			defaultDescription: "هیچ موردی برای نمایش وجود ندارد.",
		},
		error: {
			icon: AlertCircle,
			iconClass: "text-red-500",
			boxClass: "bg-red-50 border-red-200",
			titleClass: "text-red-700",
			defaultTitle: "خطا رخ داد",
			defaultDescription: "لطفاً دوباره تلاش کنید.",
		},
		success: {
			icon: CheckCircle2,
			iconClass: "text-green-500",
			boxClass: "bg-green-50 border-green-200",
			titleClass: "text-green-700",
			defaultTitle: "عملیات موفق بود",
			defaultDescription: "",
		},
		info: {
			icon: Info,
			iconClass: "text-blue-500",
			boxClass: "bg-blue-50 border-blue-200",
			titleClass: "text-blue-700",
			defaultTitle: "پیام",
			defaultDescription: "",
		},
	};

	const selected = config[type] || config.empty;
	const Icon = selected.icon;

	return (
		<div
			className={`flex items-center justify-center ${
				fullHeight ? "min-h-[240px]" : "py-10"
			}`}
			dir="rtl"
		>
			<div
				className={`w-full max-w-md rounded-2xl border p-6 text-center shadow-sm ${selected.boxClass}`}
			>
				<div className="mb-3 flex justify-center">
					<Icon className={`h-10 w-10 ${selected.iconClass}`} />
				</div>

				<h3 className={`text-base font-semibold ${selected.titleClass}`}>
					{title || selected.defaultTitle}
				</h3>

				{(description || selected.defaultDescription) && (
					<p className="mt-2 text-sm leading-6 text-gray-600">
						{description || selected.defaultDescription}
					</p>
				)}

				{action && <div className="mt-4">{action}</div>}
			</div>
		</div>
	);
}