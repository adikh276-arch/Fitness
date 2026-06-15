import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FoodItem {
  id: number;
  name: string;
  sugar: number;
}

interface FoodLoggingScreenProps {
  onBack: () => void;
  onReview: (items: FoodItem[]) => void;
}

const QUICK_CHIPS = [
  "Tea/Coffee",
  "Cold Drink",
  "Juice",
  "Mithai",
  "Biscuits",
  "Packaged Snacks",
  "Dessert",
  "Fruit",
];

const sugarLabel = (g: number) => {
  if (g <= 7) return { text: "Low sugar", color: "text-emerald-600" };
  if (g <= 15) return { text: "Moderate", color: "text-amber-600" };
  return { text: "High sugar", color: "text-rose-500" };
};

const SugarSlider = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const label = sugarLabel(value);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('how_sugary_was_it')}</span>
        <span className="text-base font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">~{value}{t('g')}</span>
      </div>

      <div className="relative h-10 flex items-center">
        <div
          className="absolute inset-x-0 h-3 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #10b981, #f59e0b, #f43f5e)",
          }}
        />
        <input
          type="range"
          min={0}
          max={30}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-rose-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-rose-500"
          style={{ background: "transparent" }}
        />
      </div>

      <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1 px-1">
        <span>{t('low')}</span>
        <span>{t('medium')}</span>
        <span>{t('high')}</span>
      </div>

      <p className={`text-sm font-bold mt-2 ${label.color}`}>{label.text}</p>
    </div>
  );
};

const FoodLoggingScreen = ({ onReview }: FoodLoggingScreenProps) => {
    const { t } = useTranslation('DailySugarEase');
  const [input, setInput] = useState("");
  const [items, setItems] = useState<FoodItem[]>([]);
  const [nextId, setNextId] = useState(1);

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => [...prev, { id: nextId, name: trimmed, sugar: 10 }]);
    setNextId((p) => p + 1);
    setInput("");
  };

  const updateSugar = (id: number, sugar: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, sugar } : i)));
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const total = items.reduce((s, i) => s + i.sugar, 0);

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="space-y-8">
        {/* Input */}
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-gray-700">{t('what_did_you_eat_or_drink')}</label>
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem(input)}
              placeholder={t('e_g_chocolate_donut_cola_tea')}
              className="flex-1 py-4 px-6 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-900 placeholder:text-gray-400 text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all focus:bg-white"
            />
            <button
              onClick={() => addItem(input)}
              className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-95"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Quick chips */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('quick_add')}</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => addItem(chip)}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-100 text-sm font-bold text-gray-600 shadow-sm hover:shadow-md hover:border-rose-200 transition-all active:scale-95"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 rounded-3xl bg-white shadow-sm border border-gray-100 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-gray-900">{item.name}</span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <SugarSlider value={item.sugar} onChange={(v) => updateSugar(item.id, v)} />
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 text-lg">{t('your_list_is_empty_add_something_above')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[1000px] px-4 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl px-8 py-5 flex items-center justify-between shadow-2xl shadow-rose-500/10">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('est_total_sugar')}</span>
            <span className="text-2xl font-black text-rose-500">~{total}{t('g')}</span>
          </div>
          <button
            onClick={() => items.length > 0 && onReview(items)}
            disabled={items.length === 0}
            className="px-10 py-4 rounded-2xl bg-rose-500 text-white font-bold text-lg shadow-xl shadow-rose-500/30 disabled:opacity-30 disabled:shadow-none hover:bg-rose-600 transition-all hover:scale-105 active:scale-95"
          >
            {t('review_intake')}
                                </button>
        </div>
      </div>
    </div>
  );
};

export default FoodLoggingScreen;

