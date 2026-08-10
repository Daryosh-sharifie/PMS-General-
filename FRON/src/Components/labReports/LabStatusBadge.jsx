import Badge from "../ui/Badge";
import {
	LAB_ITEM_STATUS_COLORS,
	LAB_ITEM_STATUS_LABEL_KEYS,
	LAB_ORDER_STATUS_COLORS,
	LAB_ORDER_STATUS_LABEL_KEYS,
} from "./labReportConstants";
import { useLanguage } from "../../i18n/LanguageContext";

export default function LabStatusBadge({ status, type = "order" }) {
	const { t } = useLanguage();

	const normalized = (status || "REQUESTED").toUpperCase();

	const labelKeyMap =
		type === "item" ? LAB_ITEM_STATUS_LABEL_KEYS : LAB_ORDER_STATUS_LABEL_KEYS;

	const colorMap =
		type === "item" ? LAB_ITEM_STATUS_COLORS : LAB_ORDER_STATUS_COLORS;

	const labelKey = labelKeyMap[normalized];
	const label = labelKey ? t(labelKey) : normalized;

	return (
		<Badge className={colorMap[normalized] || colorMap.REQUESTED}>
			{label}
		</Badge>
	);
}