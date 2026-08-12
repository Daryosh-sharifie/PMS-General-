import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "../ui/Card";
import LabStatusBadge from "./LabStatusBadge";
import TestTemplateRenderer from "./TestTemplateRenderer";

export default function LabResultForm({ item, onSave, onClose, onStart, onVerify, onCancelItem, saving }) {
	const [manualResults, setManualResults] = useState({});
	const [remarks, setRemarks] = useState("");

	useEffect(() => {
		setManualResults(item?.manualResults || {});
		setRemarks(item?.remarks || "");
	}, [item?.id]);

	if (!item) return null;

	const isLocked = item.status === "VERIFIED" || item.status === "CANCELLED";
	const canSave = item.status === "IN_PROGRESS" || item.status === "COMPLETED" || item.status === "REQUESTED";

	return (
		<Card className="overflow-hidden border-blue-100">
			<CardHeader className="bg-slate-50/80">
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-sm font-semibold text-slate-900">{item.testNameSnapshot}</p>
						<p className="text-xs text-slate-500">Enter or review result values for this test.</p>
					</div>
					<LabStatusBadge status={item.status} type="item" />
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<TestTemplateRenderer
					templateSnapshot={item.templateSnapshot}
					manualResults={manualResults}
					onChange={setManualResults}
					disabled={isLocked}
				/>

				<div>
					<label className="mb-1 block text-sm font-semibold text-slate-700">Remarks</label>
					<textarea
						disabled={isLocked}
						value={remarks}
						onChange={(e) => setRemarks(e.target.value)}
						className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100"
					/>
				</div>

				<div className="flex flex-wrap gap-2">
					{item.status === "REQUESTED" && onStart && (
						<button
							type="button"
							onClick={onStart}
							className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
						>
							Start Test
						</button>
					)}
					{canSave && onSave && (
						<button
							type="button"
							onClick={() => onSave({ manualResults, remarks })}
							disabled={saving || isLocked}
							className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
						>
							{saving ? "Saving..." : "Save Result"}
						</button>
					)}
					{item.status === "COMPLETED" && onVerify && (
						<button
							type="button"
							onClick={onVerify}
							className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
						>
							Verify
						</button>
					)}
					{item.status !== "VERIFIED" && item.status !== "CANCELLED" && onCancelItem && (
						<button
							type="button"
							onClick={onCancelItem}
							className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
						>
							Cancel
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
					>
						Close
					</button>
				</div>
			</CardContent>
		</Card>
	);
}