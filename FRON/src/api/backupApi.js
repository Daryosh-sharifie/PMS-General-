const API_URL = `${import.meta.env.VITE_API_URL}/api/v1/backup`;

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const triggerDownload = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const dateStamp = () => new Date().toISOString().slice(0, 10);

// Parse a JSON file selected by the user, returns a Promise<object>
const readJsonFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch {
        reject(new Error('فایل JSON معتبر نیست'));
      }
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل'));
    reader.readAsText(file);
  });

const postRestore = async (endpoint, body) => {
  const res = await fetch(`${API_URL}/restore/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'خطا در بازیابی');
  return data;
};

export const backupApi = {
  // ── Downloads ──────────────────────────────────────────────────────────────
  downloadFullBackup: async () => {
    const res = await fetch(`${API_URL}/full`, { headers: getHeaders() });
    if (!res.ok) throw new Error('خطا در دریافت پشتیبان');
    const data = await res.json();
    triggerDownload(data, `backup-full-${dateStamp()}.json`);
  },

  downloadPatientsBackup: async () => {
    const res = await fetch(`${API_URL}/patients`, { headers: getHeaders() });
    if (!res.ok) throw new Error('خطا در دریافت پشتیبان مریضان');
    const data = await res.json();
    triggerDownload(data, `backup-patients-${dateStamp()}.json`);
  },

  downloadPrescriptionsBackup: async () => {
    const res = await fetch(`${API_URL}/prescriptions`, { headers: getHeaders() });
    if (!res.ok) throw new Error('خطا در دریافت پشتیبان نسخه‌ها');
    const data = await res.json();
    triggerDownload(data, `backup-prescriptions-${dateStamp()}.json`);
  },

  downloadMedicinesBackup: async () => {
    const res = await fetch(`${API_URL}/medicines`, { headers: getHeaders() });
    if (!res.ok) throw new Error('خطا در دریافت پشتیبان دواها');
    const data = await res.json();
    triggerDownload(data, `backup-medicines-${dateStamp()}.json`);
  },

  // ── Restores ───────────────────────────────────────────────────────────────
  restoreFromFile: async (file) => {
    const json = await readJsonFile(file);
    // Auto-detect type by keys present in data
    const data = json.data ?? json;
    if (data.patients && data.prescriptions && data.medicines) {
      return postRestore('full', json);
    } else if (data.patients) {
      return postRestore('patients', json);
    } else if (data.prescriptions) {
      return postRestore('prescriptions', json);
    } else if (data.medicines) {
      return postRestore('medicines', json);
    }
    throw new Error('نوع فایل پشتیبان شناسایی نشد');
  },
};
