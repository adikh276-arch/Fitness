import { useTranslation } from "react-i18next";
import { ArrowLeft, Clock } from "lucide-react";

interface IntroScreenProps {
  onStart: () => void;
  onBack: () => void;
  onHistory: () => void;
}

const IntroScreen = ({ onStart, onBack, onHistory }: IntroScreenProps) => {
  const { t } = useTranslation('FoodDiary');

  return (
    <div className="flex flex-col h-full items-center text-center">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl lg:text-4xl text-gray-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          {t('intro.title')}
        </h1>
        <p className="text-emerald-600 font-semibold text-base mb-8">
          {t('intro.subtitle')}
        </p>
        <p className="text-gray-600 text-lg leading-relaxed mb-10">
          {t('intro.description')}
        </p>
      </div>

      <button
        onClick={onStart}
        className="px-10 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95"
      >
        {t('intro.startButton')}
      </button>
    </div>
  );
};

export default IntroScreen;



