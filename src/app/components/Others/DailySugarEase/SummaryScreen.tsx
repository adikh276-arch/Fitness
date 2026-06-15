import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface FoodItem {
  id: number;
  name: string;
  sugar: number;
}

interface SummaryScreenProps {
  items: FoodItem[];
  onBack: () => void;
  onFeedback: () => void;
}

const drinkKeywords = ["tea", "coffee", "juice", "shake", "soda", "milk", "drink", "latte", "smoothie"];
const snackKeywords = ["snack", "chips", "cookie", "biscuit", "cracker", "bar", "candy", "chocolate", "dessert", "cake", "ice cream", "mithai", "fruit"];

const categorize = (items: FoodItem[]) => {
  let drinks = 0, snacks = 0, meals = 0;
  items.forEach((item) => {
    const lower = item.name.toLowerCase();
    if (drinkKeywords.some((k) => lower.includes(k))) drinks += item.sugar;
    else if (snackKeywords.some((k) => lower.includes(k))) snacks += item.sugar;
    else meals += item.sugar;
  });
  return { drinks, snacks, meals };
};

// Score: lower sugar = higher score. 0g→100, 60g+→0
const computeScore = (total: number) => Math.max(0, Math.min(100, Math.round(100 - (total / 60) * 100)));

const interpret = (total: number) => {
  if (total >= 40) return "Your sugar intake is on the higher side today";
  if (total >= 20) return "Moderate sugar intake";
  return "Low sugar intake today";
};

const SummaryScreen = ({ items, onFeedback }: SummaryScreenProps) => {
    const { t } = useTranslation('DailySugarEase');
  const total = items.reduce((s, i) => s + i.sugar, 0);
  const { drinks, snacks, meals } = categorize(items);
  const max = Math.max(drinks, snacks, meals, 1);
  const score = computeScore(total);

  const categories = [
    { label: "Drinks", value: drinks, color: "bg-blue-500" },
    { label: "Snacks", value: snacks, color: "bg-amber-500" },
    { label: "Meals", value: meals, color: "bg-emerald-500" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Score and Total */}
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('daily_total')}</p>
            <span className="text-7xl font-black text-gray-900">~{total}{t('g')}</span>
            <p className="text-lg text-gray-500 mt-2">{t('sugar_consumed')}</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t('health_score')}</p>
            <p className="text-6xl font-black text-rose-500">{score}<span className="text-2xl text-gray-300">/100</span></p>
            <p className="text-base text-gray-600 font-bold mt-4">{interpret(total)}</p>
          </motion.div>
        </div>

        {/* Right Side: Breakdown and Action */}
        <div className="space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t('where_did_it_come_from')}</h3>
            <div className="space-y-8">
              {categories.map((cat, idx) => (
                <div key={cat.label}>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-base font-bold text-gray-700">{cat.label}</span>
                    <span className="text-lg font-black text-gray-900">~{cat.value}{t('g')}</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.value / max) * 100}%` }}
                      transition={{ delay: 0.4 + idx * 0.1, duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${cat.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onFeedback}
            className="w-full py-6 rounded-2xl bg-rose-500 text-white font-black text-xl shadow-xl shadow-rose-500/25 hover:bg-rose-600 transition-all"
          >
            {t('get_personalized_tips')}
                                </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SummaryScreen;


