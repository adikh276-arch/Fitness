import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { loadLocalHistory, SugarEntry } from "./sugarHistory";
import { fetchSugarEntries } from "@/lib/persistence";

interface HistorySheetProps {
  onClose: () => void;
}

const levelStyle: Record<SugarEntry["level"], string> = {
  high: "bg-rose-100 text-rose-600",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700",
};

const levelLabel: Record<SugarEntry["level"], string> = {
  high: "High Sugar",
  medium: "Moderate",
  low: "Excellent",
};

const HistorySheet = () => {
  const [entries, setEntries] = useState<SugarEntry[]>(loadLocalHistory());

  useEffect(() => {
    const syncWithDb = async () => {
      const dbEntries = await fetchSugarEntries();
      if (dbEntries.length > 0) {
        const formatted: SugarEntry[] = dbEntries.map(e => ({
          id: e.id,
          date: e.date,
          total: e.total,
          score: e.score,
          level: e.level as any
        }));
        setEntries(formatted);
      }
    };
    syncWithDb();
  }, []);


  return (
    <div className="w-full">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl">
            📭
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No entries yet</h3>
          <p className="text-gray-500">Your sugar intake history will appear here once you start logging.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((e, idx) => (
            <motion.div
              key={e.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex flex-col items-center justify-center text-rose-500 font-bold">
                  <span className="text-xs uppercase leading-none">
                    {new Date(e.date).toLocaleDateString(undefined, { month: "short" })}
                  </span>
                  <span className="text-lg leading-none">
                    {new Date(e.date).getDate()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400">
                    {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-lg font-black text-gray-900">~{e.total}g <span className="text-sm text-gray-400 font-normal">Sugar</span></p>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${levelStyle[e.level]}`}>
                  {levelLabel[e.level]}
                </span>
                <p className="text-sm font-bold text-gray-400 mt-2">Score: <span className="text-rose-500 font-black">{e.score}</span></p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorySheet;


