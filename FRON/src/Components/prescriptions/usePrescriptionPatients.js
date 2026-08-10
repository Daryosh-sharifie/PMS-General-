import { useEffect, useMemo, useState } from "react";
import { patientApi } from "../../api/patientApi";

export function usePrescriptionPatients(patients, prescriptionForm) {
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [latestPatients, setLatestPatients] = useState([]);

  const selectedPatient = patients.find(
    (p) => p.id === Number.parseInt(prescriptionForm.patientId, 10)
  );

  useEffect(() => {
    const loadLatestPatients = async () => {
      try {
        const result = await patientApi.getLatestPatients(10);

        let patientsArray = [];
        if (result.data?.patients) patientsArray = result.data.patients;
        else if (result.data) patientsArray = Array.isArray(result.data) ? result.data : [];
        else if (result.patients) patientsArray = result.patients;
        else if (Array.isArray(result)) patientsArray = result;

        setLatestPatients(Array.isArray(patientsArray) ? patientsArray : []);
      } catch (error) {
        console.error("Failed to load latest patients:", error);

        const sorted = [...(patients || [])]
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.lastVisit || 0);
            const dateB = new Date(b.createdAt || b.lastVisit || 0);
            return dateB - dateA;
          })
          .slice(0, 10);

        setLatestPatients(sorted);
      }
    };

    loadLatestPatients();
  }, [patients]);

  useEffect(() => {
    if (!patientSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);

      try {
        const result = await patientApi.searchPatients(patientSearch, 20);

        let patientsData = [];
        if (result.data?.patients) patientsData = result.data.patients;
        else if (result.data) patientsData = Array.isArray(result.data) ? result.data : [];
        else if (result.patients) patientsData = result.patients;
        else if (Array.isArray(result)) patientsData = result;

        if (!Array.isArray(patientsData)) {
          setSearchResults([]);
          return;
        }

        const searchTerm = patientSearch.trim();
        const isIdSearch = /^\d+$/.test(searchTerm);

        setSearchResults(
          isIdSearch
            ? patientsData.filter((p) => p.id === parseInt(searchTerm))
            : patientsData
        );
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearch]);

  const filteredPatients = useMemo(() => {
    const patientList = patientSearch ? searchResults : latestPatients;
    return Array.isArray(patientList) ? patientList : [];
  }, [patientSearch, searchResults, latestPatients]);

  return {
    selectedPatient,
    patientSearch,
    setPatientSearch,
    showPatientDropdown,
    setShowPatientDropdown,
    filteredPatients,
    isSearching,
    setLatestPatients,
  };
}