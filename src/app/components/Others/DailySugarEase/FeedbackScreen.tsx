import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FeedbackScreenProps {
  total: number;
  onDone: () => void;
  onBack: () => void;
}

const computeScore = (total: number) => Math.max(0, Math.min(100, Math.round(100 - (total / 60) * 100)));

const getLevel = (total: number): "high" | "medium" | "low" => {
  if (total >= 40) return "high";
  if (total >= 20) return "medium";
  return "low";
};

const CONTENT = {
  high: {
    title: "Let's cut it down a bit",
    emoji: "🍭",
    tips: [
      "Reduce sugar in tea/coffee",
      "Avoid sugary drinks like soda",
      "Choose fruit instead of dessert",
    ],
  },
  medium: {
    title: "You're on the right track",
    emoji: "🌿",
    tips: [
      "Watch hidden sugars in snacks",
      "Try slightly reducing portion sizes",
    ],
  },
  low: {
    title: "Great job!",
    emoji: "✨",
    tips: [
      "Great control today",
      "Keep maintaining this habit",
    ],
  },
};

const FeedbackScreen = ({ total, onDone }: FeedbackScreenProps) => {
    const { t } = useTranslation('DailySugarEase');
  const level = getLevel(total);
  const score = computeScore(total);
  const { title, emoji, tips } = CONTENT[level];

  return (
    <div className="max-w-2xl mx-auto py-10 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-7xl mb-6"
      >
        {emoji}
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl lg:text-4xl font-black text-gray-900 mb-8"
      >
        {title}
      </motion.h1>

      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('total_sugar')}</p>
          <p className="text-3xl font-black text-gray-900">~{total}{t('g')}</p>
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm"
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('health_score')}</p>
          <p className="text-3xl font-black text-rose-500">{score}<span className="text-sm text-gray-300">/100</span></p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-8 shadow-sm w-full border border-gray-100 text-left space-y-4 mb-10"
      >
        <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" /> {t('tips_for_tomorrow')}
                          </p>
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <motion.li
              key={tip}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-gray-700 text-base flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{tip}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onDone}
        className="w-full max-w-sm py-5 rounded-2xl bg-rose-500 text-white font-black text-xl shadow-xl shadow-rose-500/25 hover:bg-rose-600 transition-all"
      >
        {t('done')}
                    </motion.button>
    </div>
  );
};

export default FeedbackScreen;


