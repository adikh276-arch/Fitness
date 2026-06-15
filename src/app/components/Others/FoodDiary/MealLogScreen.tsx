import { useState } from "react";
import { useTranslation } from "react-i18next";

interface MealLogScreenProps {
  onNext: (data: Record<string, string>) => void;
  initialData?: Record<string, string>;
}

const MealLogScreen = ({ onNext, initialData }: MealLogScreenProps) => {
  const { t } = useTranslation('FoodDiary');
  const [data, setData] = useState<Record<string, string>>(initialData || {});

  const meals = [
    { key: "breakfast", emoji: "🍳", label: t('meals.breakfast.label'), placeholder: t('meals.breakfast.placeholder') },
    { key: "lunch", emoji: "🥗", label: t('meals.lunch.label'), placeholder: t('meals.lunch.placeholder') },
    { key: "dinner", emoji: "🍽️", label: t('meals.dinner.label'), placeholder: t('meals.dinner.placeholder') },
    { key: "snacks", emoji: "🍎", label: t('meals.snacks.label'), placeholder: t('meals.snacks.placeholder') },
  ];

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <h1 className="font-display text-2xl lg:text-3xl text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        {t('meals.title')}
      </h1>
      <p className="text-gray-500 text-base mb-8">
        {t('meals.description')}
      </p>

      <div className="flex-1 space-y-5">
        {meals.map((meal) => (
          <div key={meal.key}>
            <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
              <span className="text-xl">{meal.emoji}</span> {meal.label}
            </label>
            <input
              type="text"
              placeholder={meal.placeholder}
              value={data[meal.key] || ""}
              onChange={(e) => setData({ ...data, [meal.key]: e.target.value })}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all shadow-sm"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onNext(data)}
        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-95 mt-10"
      >
        {t('common.next')} →
      </button>
    </div>
  );
};

export default MealLogScreen;



