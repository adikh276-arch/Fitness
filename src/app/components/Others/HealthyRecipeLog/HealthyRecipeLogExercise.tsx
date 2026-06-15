import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Screen1Welcome from "./Screen1Welcome";
import Screen2Recipe from "./Screen2Recipe";
import Screen3Rating from "./Screen3Rating";
import Screen4Done from "./Screen4Done";
import ScreenClosing from "./ScreenClosing";
import HistoryDrawer from "./HistoryDrawer";
import { ArrowLeft, Clock } from 'lucide-react';
import { saveHealthyRecipe, fetchHealthyRecipes } from "@/lib/persistence";
import { useTranslation } from "react-i18next";

export interface RecipeEntry {
  id: string;
  name: string;
  ingredients: string;
  instructions: string;
  time: string;
  mealType: string;
  rating: number;
  healthiness: string;
  tags: string[];
  photo?: string;
  reflection: string;
  date: string;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

interface HealthyRecipeLogExerciseProps {
  onBack: () => void;
}

const HealthyRecipeLogExercise = ({ onBack: onBackToDashboard }: HealthyRecipeLogExerciseProps) => {
    const { t } = useTranslation('HealthyRecipeLog');
  const [screen, setScreen] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [entries, setEntries] = useState<RecipeEntry[]>(() => {
    const saved = localStorage.getItem("recipe-entries");
    return saved ? JSON.parse(saved) : [];
  });
  const [current, setCurrent] = useState<Partial<RecipeEntry>>({});

  useEffect(() => {
    const syncWithDb = async () => {
      const dbEntries = await fetchHealthyRecipes();
      if (dbEntries.length > 0) {
        setEntries(dbEntries);
      }
    };
    syncWithDb();
  }, []);

  const saveEntry = async (reflection: string) => {
    const newId = Date.now().toString();
    const isoDate = new Date().toISOString().split('T')[0];
    
    const entry: RecipeEntry = {
      id: newId,
      name: current.name || "",
      ingredients: current.ingredients || "",
      instructions: current.instructions || "",
      time: current.time || "",
      mealType: current.mealType || "",
      rating: current.rating || 0,
      healthiness: current.healthiness || "",
      tags: current.tags || [],
      photo: current.photo,
      reflection,
      date: new Date().toLocaleDateString(),
    };
    
    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem("recipe-entries", JSON.stringify(updated));

    // Save to DB
    await saveHealthyRecipe({
      ...entry,
      date: isoDate
    });
  };


  const getScreenTitle = () => {
    switch (screen) {
      case 1: return t('recipe_log', "Recipe Log");
      case 2: return t('recipe_details', "Recipe Details");
      case 3: return t('experience', "Experience");
      case 4: return t('final_thoughts', "Final Thoughts");
      case 5: return t('all_done', "All Done!");
      default: return t('recipe_log', "Recipe Log");
    }
  };

  const getScreenSubtitle = () => {
    switch (screen) {
      case 1: return t('save_your_healthy_culinary_creations', "Save your healthy culinary creations");
      case 2: return t('what_did_you_cook_today', "What did you cook today?");
      case 3: return t('how_did_it_taste_and_feel', "How did it taste and feel?");
      case 4: return t('reflect_on_your_cooking_journey', "Reflect on your cooking journey");
      case 5: return t('recipe_saved_successfully', "Recipe saved successfully");
      default: return t('track_your_healthy_habits', "Track your healthy habits");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/40 flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px] flex flex-col relative">
        
        {/* Standard Dashboard Header */}
        <div className="mb-6 lg:mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-white/60">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={showHistory ? () => setShowHistory(false) : (screen === 1 ? onBackToDashboard : () => setScreen(screen - 1))}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {screen === 1 && !showHistory && (
                <button 
                  onClick={() => setShowHistory(true)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                >
                  <Clock className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  {showHistory ? t('recipe_history', "Recipe History") : getScreenTitle()}
                </h1>
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {showHistory ? t('your_collection_of_healthy_meals', "Your collection of healthy meals") : getScreenSubtitle()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm border border-white/60 min-h-[500px]">
          {showHistory ? (
            <HistoryDrawer
              entries={entries}
              onClose={() => setShowHistory(false)}
            />
          ) : (
            <AnimatePresence mode="wait">
              {screen === 1 && (
                <motion.div key="welcome" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Screen1Welcome onStart={() => setScreen(2)} />
                </motion.div>
              )}
              {screen === 2 && (
                <motion.div key="recipe" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Screen2Recipe
                    data={current}
                    onNext={(d) => { setCurrent({ ...current, ...d }); setScreen(3); }}
                  />
                </motion.div>
              )}
              {screen === 3 && (
                <motion.div key="rating" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Screen3Rating
                    data={current}
                    onNext={(d) => { setCurrent({ ...current, ...d }); setScreen(4); }}
                  />
                </motion.div>
              )}
              {screen === 4 && (
                <motion.div key="done" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <Screen4Done
                    onDone={(reflection) => {
                      saveEntry(reflection);
                      setCurrent({});
                      setScreen(5);
                    }}
                  />
                </motion.div>
              )}
              {screen === 5 && (
                <motion.div key="closing" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <ScreenClosing onComplete={() => setScreen(1)} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthyRecipeLogExercise;

