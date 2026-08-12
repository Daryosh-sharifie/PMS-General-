export default function Loader({
	message = "در حال بارگذاری...",
	size = "md",
	fullHeight = false,
}) {
	const sizeClasses = {
		sm: "h-5 w-5 border-2",
		md: "h-8 w-8 border-2",
		lg: "h-10 w-10 border-4",
	};

	return (
		<div
			className={`flex flex-col items-center justify-center gap-3 text-center ${
				fullHeight ? "min-h-[240px]" : "py-10"
			}`}
			dir="rtl"
		>
			<div
				className={`animate-spin rounded-full border-blue-600 border-t-transparent ${
					sizeClasses[size] || sizeClasses.md
				}`}
			/>
			<p className="text-sm text-gray-500">{message}</p>
		</div>
	);
}