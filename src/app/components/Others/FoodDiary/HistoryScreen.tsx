import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";

export interface DiaryEntry {
  id: string;
  date: string;
  meals: Record<string, string>;
  feelings: string;
  reflection: string;
}

interface HistoryScreenProps {
  entries: DiaryEntry[];
  onBack: () => void;
  onDelete: (id: string) => void;
}

const HistoryScreen = ({ entries, onDelete }: HistoryScreenProps) => {
  const { t, i18n } = useTranslation('FoodDiary');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <span className="text-5xl mb-4">📝</span>
            <p className="text-gray-500 text-lg">
              {t('history.empty')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl bg-gray-50 border border-gray-100 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    {formatDate(entry.date)}
                  </span>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors bg-white rounded-lg border border-gray-100 shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {Object.entries(entry.meals).some(([, v]) => v) && (
                  <div className="space-y-2">
                    {entry.meals.breakfast && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-base">🍳</span> {entry.meals.breakfast}
                      </p>
                    )}
                    {entry.meals.lunch && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-base">🥗</span> {entry.meals.lunch}
                      </p>
                    )}
                    {entry.meals.dinner && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-base">🍽️</span> {entry.meals.dinner}
                      </p>
                    )}
                    {entry.meals.snacks && (
                      <p className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="text-base">🍎</span> {entry.meals.snacks}
                      </p>
                    )}
                  </div>
                )}

                {entry.feelings && (
                  <div className="bg-white/60 p-3 rounded-xl border border-gray-100">
                    <p className="text-sm text-gray-500 italic">
                      "{entry.feelings}"
                    </p>
                  </div>
                )}

                {entry.reflection && (
                  <div className="flex items-start gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100/50">
                    <span className="text-base">💡</span>
                    <p className="text-sm text-emerald-800 font-medium">
                      {entry.reflection}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;



