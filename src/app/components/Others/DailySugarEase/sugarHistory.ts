import { saveSugarEntry } from "@/lib/persistence";

export interface SugarEntry {
  id: string;
  date: string; // ISO date
  total: number;
  score: number;
  level: "high" | "medium" | "low";
}

const KEY = "sugar-history";

export const getLevel = (total: number): "high" | "medium" | "low" => {
  if (total >= 40) return "high";
  if (total >= 20) return "medium";
  return "low";
};

export const computeScore = (total: number) =>
  Math.max(0, Math.min(100, Math.round(100 - (total / 60) * 100)));

export const loadLocalHistory = (): SugarEntry[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SugarEntry[]) : [];
  } catch {
    return [];
  }
};

export const saveLocalHistory = (list: SugarEntry[]) => {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
};

export const saveEntry = async (total: number) => {
  const newId = crypto.randomUUID();
  const isoDate = new Date().toISOString();
  
  const entry: SugarEntry = {
    id: newId,
    date: isoDate,
    total,
    score: computeScore(total),
    level: getLevel(total),
  };
  
  const list = loadLocalHistory();
  list.unshift(entry);
  saveLocalHistory(list);

  // Save to DB
  await saveSugarEntry({
    id: newId,
    total,
    score: entry.score,
    level: entry.level,
    date: isoDate.split('T')[0]
  });
};

