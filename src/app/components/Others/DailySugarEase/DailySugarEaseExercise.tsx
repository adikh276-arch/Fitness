import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StartScreen from "./StartScreen";
import FoodLoggingScreen from "./FoodLoggingScreen";
import SummaryScreen from "./SummaryScreen";
import FeedbackScreen from "./FeedbackScreen";
import { saveEntry } from "./sugarHistory";
import { ArrowLeft, Clock } from 'lucide-react';
import HistorySheet from "./HistorySheet";

interface FoodItem {
  id: number;
  name: string;
  sugar: number;
}

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

interface DailySugarEaseExerciseProps {
  onBack: () => void;
}

const DailySugarEaseExercise = ({ onBack: onBackToDashboard }: DailySugarEaseExerciseProps) => {
  const [screen, setScreen] = useState(0);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const total = items.reduce((s, i) => s + i.sugar, 0);

  const getScreenTitle = () => {
    switch (screen) {
      case 0: return "Sugar Tracker";
      case 1: return "Log Your Intake";
      case 2: return "Sugar Summary";
      case 3: return "Daily Feedback";
      default: return "Sugar Tracker";
    }
  };

  const getScreenSubtitle = () => {
    switch (screen) {
      case 0: return "Manage your daily sugar intake";
      case 1: return "Add the foods you ate today";
      case 2: return "Here's your total sugar breakdown";
      case 3: return "Personalized tips based on your intake";
      default: return "Manage your health";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/40 flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px] flex flex-col relative">
        
        {/* Standard Dashboard Header */}
        <div className="mb-6 lg:mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-white/60">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={showHistory ? () => setShowHistory(false) : (screen === 0 ? onBackToDashboard : () => setScreen(screen - 1))}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {screen === 0 && !showHistory && (
                <button 
                  onClick={() => setShowHistory(true)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                >
                  <Clock className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                  {showHistory ? "Sugar Intake History" : getScreenTitle()}
                </h1>
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {showHistory ? "Your past recordings" : getScreenSubtitle()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm border border-white/60 min-h-[500px]">
          {showHistory ? (
            <HistorySheet onClose={() => setShowHistory(false)} />
          ) : (
            <AnimatePresence mode="wait">
              {screen === 0 && (
                <motion.div key="start" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <StartScreen onStart={() => setScreen(1)} onBack={onBackToDashboard} />
                </motion.div>
              )}
              {screen === 1 && (
                <motion.div key="log" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <FoodLoggingScreen
                    onBack={() => setScreen(0)}
                    onReview={(foodItems) => {
                      setItems(foodItems);
                      setScreen(2);
                    }}
                  />
                </motion.div>
              )}
              {screen === 2 && (
                <motion.div key="summary" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <SummaryScreen
                    items={items}
                    onBack={() => setScreen(1)}
                    onFeedback={() => setScreen(3)}
                  />
                </motion.div>
              )}
              {screen === 3 && (
                <motion.div key="feedback" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <FeedbackScreen
                    total={total}
                    onBack={() => setScreen(2)}
                    onDone={() => {
                      if (total > 0) saveEntry(total);
                      setScreen(0);
                      setItems([]);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailySugarEaseExercise;

