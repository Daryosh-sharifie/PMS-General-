import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "../ui/Card";

export default function StatCard({
	icon: Icon,
	title,
	value,
	trend,
	iconColor = "text-blue-600",
	accent = "bg-blue-50",
	onClick,
}) {
	const Wrapper = onClick ? "button" : "div";

	return (
		<Card
			className={`group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
				onClick ? "cursor-pointer" : ""
			}`}
		>
			<Wrapper
				type={onClick ? "button" : undefined}
				onClick={onClick}
				className="w-full text-left"
			>
				<CardContent className="p-5">
					<div className="flex items-start justify-between gap-3">
						<div
							className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}
						>
							<Icon className={`h-6 w-6 ${iconColor}`} />
						</div>

						{onClick && (
							<div className="rounded-full bg-slate-50 p-1 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600">
								<ArrowUpRight className="h-4 w-4" />
							</div>
						)}
					</div>

					<div className="mt-5">
						<p className="text-sm font-semibold text-slate-500">{title}</p>
						<p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
							{value}
						</p>
						{trend && (
							<p className="mt-2 line-clamp-1 text-xs font-medium text-slate-500">
								{trend}
							</p>
						)}
					</div>
				</CardContent>
			</Wrapper>
		</Card>
	);
}