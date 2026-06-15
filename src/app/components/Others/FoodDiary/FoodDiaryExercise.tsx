import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import ProgressDots from "./ProgressDots";
import IntroScreen from "./IntroScreen";
import MealLogScreen from "./MealLogScreen";
import FeelingsScreen from "./FeelingsScreen";
import ReflectionScreen from "./ReflectionScreen";
import HistoryScreen, { DiaryEntry } from "./HistoryScreen";
import { toast } from "sonner";
import { ArrowLeft, Clock } from 'lucide-react';
import { saveFoodDiaryEntry, fetchFoodDiaryEntries } from "@/lib/persistence";

const STORAGE_KEY = "food-diary-entries";

const loadLocalEntries = (): DiaryEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalEntries = (entries: DiaryEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
};

interface FoodDiaryExerciseProps {
  onBack: () => void;
}

const FoodDiaryExercise = ({ onBack: onBackToOthers }: FoodDiaryExerciseProps) => {

  const { t } = useTranslation('FoodDiary');
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mealData, setMealData] = useState<Record<string, string>>({});
  const [feelings, setFeelings] = useState("");
  const [reflection, setReflection] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>(loadLocalEntries);

  useEffect(() => {
    const syncWithDb = async () => {
      const dbEntries = await fetchFoodDiaryEntries();
      if (dbEntries.length > 0) {
        const formattedEntries: DiaryEntry[] = dbEntries.map(e => ({
          id: e.id,
          date: e.date,
          meals: e.meals.reduce((acc: any, m: any) => ({ ...acc, [m.type]: m.name }), {}),
          feelings: e.feelings,
          reflection: e.reflection
        }));
        setEntries(formattedEntries);
      }
    };
    syncWithDb();
  }, []);

  useEffect(() => {
    saveLocalEntries(entries);
  }, [entries]);

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleHistory = () => {
    setShowHistory(true);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success(t('messages.entryDeleted'));
  };

  const handleDone = async (ref: string) => {
    setReflection(ref);
    const newId = crypto.randomUUID();
    const newDate = new Date().toISOString();
    
    const newEntry: DiaryEntry = {
      id: newId,
      date: newDate,
      meals: { ...mealData },
      feelings,
      reflection: ref,
    };
    
    setEntries((prev) => [newEntry, ...prev]);
    
    const dbMeals = Object.entries(mealData).map(([type, name]) => ({ type, name }));
    await saveFoodDiaryEntry({
      id: newId,
      date: newDate.split('T')[0],
      meals: dbMeals,
      feelings,
      reflection: ref
    });

    toast.success(t('messages.entrySaved'));
    setDirection(1);
    setStep(0);
    setMealData({});
    setFeelings("");
    setReflection("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Standard Dashboard Header */}
        <div className="mb-6 lg:mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-white/60">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={showHistory ? () => setShowHistory(false) : onBackToOthers}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {!showHistory && (
                <button 
                  onClick={handleHistory}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                >
                  <Clock className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{t('common.title')}</h1>
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {showHistory ? t('history.subtitle') : t('common.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm border border-white/60 min-h-[500px]">
          {!showHistory && (
            <div className="mb-8">
              <ProgressDots currentStep={step} totalSteps={4} />
            </div>
          )}

          <div className="relative">
            <AnimatePresence mode="wait" custom={direction}>
              {showHistory ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <HistoryScreen
                    entries={entries}
                    onBack={() => setShowHistory(false)}
                    onDelete={handleDeleteEntry}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {step === 0 && (
                    <IntroScreen onStart={goNext} onBack={onBackToOthers} onHistory={handleHistory} />
                  )}
                  {step === 1 && (
                    <MealLogScreen
                      initialData={mealData}
                      onNext={(data) => { setMealData(data); goNext(); }}
                    />
                  )}
                  {step === 2 && (
                    <FeelingsScreen
                      initialData={feelings}
                      onNext={(f) => { setFeelings(f); goNext(); }}
                    />
                  )}
                  {step === 3 && (
                    <ReflectionScreen initialData={reflection} onDone={handleDone} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};


export default FoodDiaryExercise;


