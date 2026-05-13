const API_BASE = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("adminToken");

export const eventCategories = [
  "Summer Camp",
  "Workshop",
  "Bootcamp",
  "Competition",
  "AI Training",
  "Seminar",
  "Webinar",
];

export const requestJson = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  const isJson = String(res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    throw new Error(data?.msg || data?.message || "Request failed");
  }

  return data;
};

export const downloadFile = async (path, filename) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

