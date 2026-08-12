import { useEffect, useMemo, useState } from "react";
import { labTestApi } from "../../api/labTestApi.js";

function extractLabTests(result) {
	if (Array.isArray(result)) return result;
	if (Array.isArray(result?.data)) return result.data;
	if (Array.isArray(result?.data?.labTests)) return result.data.labTests;
	if (Array.isArray(result?.data?.tests)) return result.data.tests;
	if (Array.isArray(result?.labTests)) return result.labTests;
	if (Array.isArray(result?.tests)) return result.tests;
	return [];
}

function normalizeId(value) {
	const rawId = typeof value === "object" && value !== null ? value.id : value;
	const id = Number(rawId);
	return Number.isFinite(id) && id > 0 ? id : null;
}

function normalizeTest(test) {
	if (!test || typeof test !== "object") return null;

	const id = normalizeId(test);
	if (!id) return null;

	return {
		...test,
		id,
		labOrderItemId:
			test.labOrderItemId ||
			test.orderItemId ||
			test.labOrderItem?.id ||
			test.itemId ||
			null,
		status: test.status || "",
		name:
			test.name ||
			test.testName ||
			test.testNameSnapshot ||
			test.title ||
			"Unnamed Test",
		category:
			test.category ||
			test.categorySnapshot ||
			test.group ||
			test.department ||
			"",
	};
}

export function useLabTestSelector(initialSelectedIds = [], initialSelectedTests = []) {
	const initialSelectedKey = JSON.stringify(initialSelectedIds || []);
	const initialTestsKey = JSON.stringify(initialSelectedTests || []);
	const [labTests, setLabTests] = useState([]);
	const [selectedLabTestIds, setSelectedLabTestIds] = useState([]);
	const [removedLabOrderItemIds, setRemovedLabOrderItemIds] = useState([]);
	const [labTestSearch, setLabTestSearch] = useState("");
	const [showLabDropdown, setShowLabDropdown] = useState(false);
	const [loadingLabTests, setLoadingLabTests] = useState(false);
	const [labRequestError, setLabRequestError] = useState("");

	useEffect(() => {
		let active = true;

		const loadLabTests = async () => {
			try {
				setLoadingLabTests(true);

				const result = await labTestApi.getLabTests();
				const tests = [
					...extractLabTests(result),
					...(Array.isArray(initialSelectedTests) ? initialSelectedTests : []),
				]
					.map(normalizeTest)
					.filter(Boolean)
					.filter(
						(test, index, array) =>
							array.findIndex((item) => Number(item.id) === Number(test.id)) ===
							index
					);

				if (active) setLabTests(tests);
			} catch (error) {
				console.error("Failed to load lab tests:", error);
				if (active) setLabTests([]);
			} finally {
				if (active) setLoadingLabTests(false);
			}
		};

		loadLabTests();

		return () => {
			active = false;
		};
	}, [initialTestsKey]);

	useEffect(() => {
		const ids = (Array.isArray(initialSelectedIds) ? initialSelectedIds : [])
			.map(normalizeId)
			.filter(Boolean);

		setSelectedLabTestIds([...new Set(ids)]);
		setRemovedLabOrderItemIds([]);
	}, [initialSelectedKey]);

	const selectedLabTests = useMemo(() => {
		const selectedIds = new Set(selectedLabTestIds.map(Number));
		return labTests.filter((test) => selectedIds.has(Number(test.id)));
	}, [labTests, selectedLabTestIds]);

	const filteredLabTests = useMemo(() => {
		const search = labTestSearch.trim().toLowerCase();
		const selectedIds = new Set(selectedLabTestIds.map(Number));

		return labTests.filter((test) => {
			if (selectedIds.has(Number(test.id))) return false;
			if (!search) return true;

			return (
				String(test.name || "").toLowerCase().includes(search) ||
				String(test.category || "").toLowerCase().includes(search)
			);
		});
	}, [labTests, labTestSearch, selectedLabTestIds]);

	const selectLabTest = (testOrId) => {
		const id = normalizeId(testOrId);
		if (!id) return;

		const existingTest = labTests.find((test) => Number(test.id) === id);
		const itemId = normalizeId(existingTest?.labOrderItemId);

		if (itemId) {
			setRemovedLabOrderItemIds((prev) =>
				prev.map(Number).filter((removedId) => removedId !== itemId)
			);
		}

		setSelectedLabTestIds((prev) => {
			const existingIds = prev.map(Number);
			if (existingIds.includes(id)) return existingIds;
			return [...existingIds, id];
		});

		setLabTestSearch("");
		setShowLabDropdown(false);
		setLabRequestError("");
	};

	const removeLabTest = (testOrId) => {
		const id = normalizeId(testOrId);
		if (!id) return;

		const existingTest = labTests.find((test) => Number(test.id) === id);
		const itemId = normalizeId(existingTest?.labOrderItemId);

		if (itemId) {
			setRemovedLabOrderItemIds((prev) =>
				prev.map(Number).includes(itemId) ? prev : [...prev, itemId]
			);
		}

		setSelectedLabTestIds((prev) => prev.map(Number).filter((item) => item !== id));
		setLabRequestError("");
	};

	const resetLabTests = () => {
		setSelectedLabTestIds([]);
		setRemovedLabOrderItemIds([]);
		setLabTestSearch("");
		setShowLabDropdown(false);
		setLabRequestError("");
	};

	return {
		labTests,
		selectedLabTests,
		selectedLabTestIds,
		removedLabOrderItemIds,
		filteredLabTests,
		labTestSearch,
		setLabTestSearch,
		showLabDropdown,
		setShowLabDropdown,
		loadingLabTests,
		labRequestError,
		setLabRequestError,
		selectLabTest,
		removeLabTest,
		resetLabTests,
	};
}
