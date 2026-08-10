import { useCallback, useEffect, useMemo, useState } from "react";
import { labOrderApi } from "../../api/labOrderApi";
import { normalizeLabOrder } from "./labReportHelpers";

export function useLabOrders({ autoLoad = true } = {}) {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [selectedOrderLoading, setSelectedOrderLoading] = useState(false);
	const [selectedOrderError, setSelectedOrderError] = useState("");

	const loadOrders = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const result = await labOrderApi.getAllLabOrders();
			const list = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
			const normalized = list.map(normalizeLabOrder).filter(Boolean);
			setOrders(normalized);
			return normalized;
		} catch (err) {
			setError(err?.message || "Failed to load lab orders");
			setOrders([]);
			return [];
		} finally {
			setLoading(false);
		}
	}, []);

	const loadOrderById = useCallback(async (id) => {
		if (!id) return null;
		setSelectedOrderLoading(true);
		setSelectedOrderError("");
		try {
			const result = await labOrderApi.getLabOrderById(id);
			const payload = result?.data || result;
			const normalized = normalizeLabOrder(payload);
			setSelectedOrder(normalized);
			return normalized;
		} catch (err) {
			setSelectedOrderError(err?.message || "Failed to load lab order");
			setSelectedOrder(null);
			return null;
		} finally {
			setSelectedOrderLoading(false);
		}
	}, []);

	const loadPatientOrders = useCallback(async (patientId) => {
		if (!patientId) return [];
		try {
			const result = await labOrderApi.getPatientLabOrders(patientId);
			const list = Array.isArray(result?.data) ? result.data : [];
			return list.map(normalizeLabOrder).filter(Boolean);
		} catch {
			return [];
		}
	}, []);

	const loadPrescriptionOrders = useCallback(async (prescriptionId) => {
		if (!prescriptionId) return [];
		try {
			const result = await labOrderApi.getPrescriptionLabOrders(prescriptionId);
			const list = Array.isArray(result?.data) ? result.data : [];
			return list.map(normalizeLabOrder).filter(Boolean);
		} catch {
			return [];
		}
	}, []);

	const refresh = useCallback(async () => {
		return loadOrders();
	}, [loadOrders]);

	useEffect(() => {
		if (autoLoad) {
			loadOrders();
		}
	}, [autoLoad, loadOrders]);

	return {
		orders,
		loading,
		error,
		selectedOrder,
		selectedOrderLoading,
		selectedOrderError,
		loadOrders,
		loadOrderById,
		loadPatientOrders,
		loadPrescriptionOrders,
		refresh,
		setOrders,
		setSelectedOrder,
	};
}