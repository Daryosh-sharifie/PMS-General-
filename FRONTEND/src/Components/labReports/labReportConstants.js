export const LAB_ORDER_STATUS_OPTIONS = [
	{ value: "all", labelKey: "all" },
	{ value: "REQUESTED", labelKey: "requested" },
	{ value: "IN_PROGRESS", labelKey: "inProgress" },
	{ value: "PARTIAL_COMPLETED", labelKey: "partialCompleted" },
	{ value: "COMPLETED", labelKey: "completed" },
	{ value: "VERIFIED", labelKey: "verified" },
	{ value: "CANCELLED", labelKey: "cancelled" },
];

export const LAB_ORDER_STATUS_LABEL_KEYS = {
	REQUESTED: "requested",
	IN_PROGRESS: "inProgress",
	PARTIAL_COMPLETED: "partialCompleted",
	COMPLETED: "completed",
	VERIFIED: "verified",
	CANCELLED: "cancelled",
};

export const LAB_ORDER_STATUS_COLORS = {
	REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
	IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
	PARTIAL_COMPLETED: "bg-indigo-100 text-indigo-800 border-indigo-200",
	COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
	VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
	CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};

export const LAB_ITEM_STATUS_LABEL_KEYS = {
	REQUESTED: "requested",
	IN_PROGRESS: "inProgress",
	COMPLETED: "completed",
	VERIFIED: "verified",
	CANCELLED: "cancelled",
};

export const LAB_ITEM_STATUS_COLORS = {
	REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
	IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
	COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
	VERIFIED: "bg-emerald-100 text-emerald-800 border-emerald-200",
	CANCELLED: "bg-rose-100 text-rose-800 border-rose-200",
};