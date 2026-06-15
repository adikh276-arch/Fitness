import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ReflectionScreenProps {
  onDone: (reflection: string) => void;
  initialData?: string;
}

const ReflectionScreen = ({ onDone, initialData }: ReflectionScreenProps) => {
  const { t } = useTranslation('FoodDiary');
  const [reflection, setReflection] = useState(initialData || "");

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <span className="text-6xl">🎉</span>
      </div>

      <h1 className="font-display text-2xl lg:text-3xl text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
        {t('reflection.title')}
      </h1>

      <p className="text-emerald-600 font-semibold text-lg mb-6">
        {t('reflection.question')}
      </p>

      <textarea
        placeholder={t('reflection.placeholder')}
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={4}
        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-gray-900 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all resize-none shadow-sm mb-8"
      />

      <p className="text-gray-500 text-base leading-relaxed mb-10">
        {t('reflection.encouragement')}
      </p>

      <button
        onClick={() => onDone(reflection)}
        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-95"
      >
        {t('reflection.saveButton')} ✅
      </button>
    </div>
  );
};

export default ReflectionScreen;



