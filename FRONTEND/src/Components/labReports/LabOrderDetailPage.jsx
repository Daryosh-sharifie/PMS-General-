import { useEffect } from "react";
import { useParams } from "react-router-dom";
import LabOrderDetail from "./LabOrderDetail";
import { useLabOrders } from "./useLabOrders";

export default function LabOrderDetailPage() {
	const { id } = useParams();
	const { selectedOrder, selectedOrderLoading, selectedOrderError, loadOrderById, refresh } = useLabOrders({ autoLoad: false });

	useEffect(() => {
		if (id) {
			loadOrderById(id);
		}
	}, [id, loadOrderById]);

	return (
		<LabOrderDetail
			order={selectedOrder}
			loading={selectedOrderLoading}
			error={selectedOrderError}
			onReload={() => (id ? loadOrderById(id) : refresh())}
		/>
	);
}