import { checkRecord } from "./validators.js"

const DATA_KEY = "argenttracker:records";
const SETTINGS_KEY = "argenttracker:settings";

export function defaultSettings() {
  return {
    base: "RWF",
    rates: { EUR: 1660, GBP: 1900 },
    cap: 600000,
    categories: ["Food", "Books", "Transport", "Entertainment", "Fees", "Other Expenses" ]
  };
}

export function load() {
  try { return JSON.parse(localStorage.getItem(DATA_KEY) || "[]"); }
  catch { return []; }
}

export function save(records) {
  localStorage.setItem(DATA_KEY, JSON.stringify(records));
}

export function loadSettings() {
  try { return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
  catch { return defaultSettings(); }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function checkImport(data) {
  if (!data || !Array.isArray(data.records)) return "File must contain a records array.";
  const settings = { ...defaultSettings(), ...(data.settings || {}) };
  const seen = new Set();

  for (const row of data.records) {
    if (!row.id || seen.has(row.id)) return "Every record needs a unique id.";
    seen.add(row.id);
    if (typeof checkRecord(row, settings.categories) === "string") return "A record failed validation.";
    if (!row.createdAt || !row.updatedAt) return "Every record needs createdAt and updatedAt";

  }

  return { records: data.records, settings };

}