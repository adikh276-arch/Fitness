import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FeelingsScreenProps {
  onNext: (feelings: string) => void;
  initialData?: string;
}

const FeelingsScreen = ({ onNext, initialData }: FeelingsScreenProps) => {
  const { t } = useTranslation('FoodDiary');
  const [feelings, setFeelings] = useState(initialData || "");

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <h1 className="font-display text-2xl lg:text-3xl text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        {t('feelings.title')}
      </h1>
      <p className="text-gray-500 text-base mb-8">
        {t('feelings.description')}
      </p>

      <div className="flex-1">
        <textarea
          placeholder={t('feelings.placeholder')}
          value={feelings}
          onChange={(e) => setFeelings(e.target.value)}
          rows={6}
          className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all resize-none shadow-sm min-h-[200px]"
        />
      </div>

      <button
        onClick={() => onNext(feelings)}
        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-95 mt-10"
      >
        {t('common.next')} →
      </button>
    </div>
  );
};

export default FeelingsScreen;



