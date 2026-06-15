import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation, Trans } from 'react-i18next';
import confetti from 'canvas-confetti';
import { logUserActivity } from '@/lib/db';

interface MacroEducationData {
  sectionsRead: string[];
  mealBuilderConfig: { p: number; c: number; f: number } | null;
  quizScore: number | null;
  completedAt: string | null;
}

export default function MacroEducationModule({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('MacroEducation');

  const proteinFoods = useMemo(() => [
    { name: t('foods.chicken'), amount: t('foods.unit100g', { val: 31, macro: t('tabs.protein').toLowerCase() }) },
    { name: t('foods.yogurt'), amount: t('foods.unit100g', { val: 10, macro: t('tabs.protein').toLowerCase() }) },
    { name: t('foods.eggs'), amount: t('foods.eggUnit') },
    { name: t('foods.salmon'), amount: t('foods.unit100g', { val: 25, macro: t('tabs.protein').toLowerCase() }) },
    { name: t('foods.lentils'), amount: t('foods.unit100g', { val: 9, macro: t('tabs.protein').toLowerCase() }) },
    { name: t('foods.tofu'), amount: t('foods.unit100g', { val: 8, macro: t('tabs.protein').toLowerCase() }) },
  ], [t]);

  const carbFoods = useMemo(() => [
    { name: t('foods.rice'), amount: t('foods.unit100g', { val: 23, macro: t('tabs.carbs').toLowerCase() }) },
    { name: t('foods.oats'), amount: t('foods.unit100g', { val: 66, macro: t('tabs.carbs').toLowerCase() }) },
    { name: t('foods.potato'), amount: t('foods.unit100g', { val: 20, macro: t('tabs.carbs').toLowerCase() }) },
    { name: t('foods.quinoa'), amount: t('foods.unit100g', { val: 21, macro: t('tabs.carbs').toLowerCase() }) },
    { name: t('foods.banana'), amount: t('foods.bananaUnit') },
    { name: t('foods.bread'), amount: t('foods.breadUnit') },
  ], [t]);

  const fatFoods = useMemo(() => [
    { name: t('foods.avocado'), amount: t('foods.unit100g', { val: 15, macro: t('tabs.fats').toLowerCase() }) },
    { name: t('foods.almonds'), amount: t('foods.almondsUnit') },
    { name: t('foods.oil'), amount: t('foods.oilUnit') },
    { name: t('foods.salmon'), amount: t('foods.unit100g', { val: 13, macro: t('tabs.fats').toLowerCase() }) },
    { name: t('foods.peanutButter'), amount: t('foods.pbUnit') },
    { name: t('foods.chocolate'), amount: t('foods.chocolateUnit') },
  ], [t]);
  const [activeTab, setActiveTab] = useState<'protein' | 'carbs' | 'fats' | 'plate'>('protein');
  const [educationData, setEducationData] = useState<MacroEducationData>(() => {
    const saved = localStorage.getItem('macro-education-data');
    return saved ? JSON.parse(saved) : {
      sectionsRead: [],
      mealBuilderConfig: null,
      quizScore: null,
      completedAt: null,
    };
  });

  // Meal builder state
  const [proteinPortion, setProteinPortion] = useState(25);
  const [carbPortion, setCarbPortion] = useState(40);
  const [fatPortion, setFatPortion] = useState(35);

  useEffect(() => {
    localStorage.setItem('macro-education-data', JSON.stringify(educationData));
  }, [educationData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('macro_education');
      const latestLog = dbLogs.find(l => l.action_type === 'save_meal_config' || l.action_type === 'submit_quiz');
      if (latestLog) {
        const p = latestLog.payload;
        setEducationData({
          sectionsRead: p.sections_read || [],
          mealBuilderConfig: p.meal_builder_saved_config || null,
          quizScore: p.quiz_score !== undefined ? p.quiz_score : null,
          completedAt: p.completed_at || null,
        });
      }
    };
    loadDbLogs();
  }, []);

  useEffect(() => {
    // Mark section as read when viewing
    if (!educationData.sectionsRead.includes(activeTab)) {
      setEducationData(prev => ({
        ...prev,
        sectionsRead: [...prev.sectionsRead, activeTab],
      }));
    }
  }, [activeTab]);

  const calculateMealCalories = () => {
    const proteinCals = (proteinPortion / 100) * 200 * 4; // Assuming 200g base portion
    const carbCals = (carbPortion / 100) * 200 * 4;
    const fatCals = (fatPortion / 100) * 200 * 9;
    return Math.round(proteinCals + carbCals + fatCals);
  };

  const saveMealConfig = () => {
    const config = { p: proteinPortion, c: carbPortion, f: fatPortion };
    setEducationData(prev => ({
      ...prev,
      mealBuilderConfig: config,
    }));

    // Log to console for database integration
    logUserActivity('macro_education', 'save_meal_config', {
      sections_read: educationData.sectionsRead,
      quiz_score: educationData.quizScore,
      meal_builder_saved_config: config,
      completed_at: new Date().toISOString(),
    });

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#60A5FA', '#93C5FD'],
    });
  };

  const submitQuiz = () => {
    const score = quizAnswers.reduce((total, answer, index) => {
      return total + (answer === quizQuestions[index].correct ? 1 : 0);
    }, 0);

    setEducationData(prev => ({
      ...prev,
      quizScore: score,
      completedAt: new Date().toISOString(),
    }));

    setQuizSubmitted(true);

    // Log to console for database integration
    logUserActivity('macro_education', 'submit_quiz', {
      sections_read: educationData.sectionsRead,
      quiz_score: score,
      meal_builder_saved_config: educationData.mealBuilderConfig,
      completed_at: new Date().toISOString(),
    });

    if (score === 3) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FCD34D', '#F59E0B', '#D97706'],
      });
    }
  };

  const getProgressPercentage = () => {
    let progress = 0;
    progress += (educationData.sectionsRead.length / 4) * 50; // 50% for reading all sections
    if (educationData.mealBuilderConfig) progress += 25; // 25% for meal builder
    if (educationData.quizScore !== null) progress += 25; // 25% for quiz
    return Math.round(progress);
  };

  const isBalanceWarning = proteinPortion < 15 || carbPortion > 60 || fatPortion < 20;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 lg:mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm lg:text-base">{t('nav.back')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-2 lg:p-3">
              <BookOpen className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <div className="flex flex-1 gap-1">
            <button
              onClick={() => setActiveTab('protein')}
              className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
                activeTab === 'protein'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('tabs.protein')}
            </button>
            <button
              onClick={() => setActiveTab('carbs')}
              className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
                activeTab === 'carbs'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('tabs.carbs')}
            </button>
            <button
              onClick={() => setActiveTab('fats')}
              className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
                activeTab === 'fats'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('tabs.fats')}
            </button>
            <button
              onClick={() => setActiveTab('plate')}
              className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
                activeTab === 'plate'
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('tabs.plate')}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 lg:space-y-6">
          <AnimatePresence mode="wait">
            {/* Protein Tab */}
            {activeTab === 'protein' && (
              <motion.div
                key="protein"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 lg:space-y-6"
              >
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4 lg:mb-6">
                    <div className="text-3xl lg:text-4xl">🥩</div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900">{t('protein.title')}</h3>
                      <p className="text-xs lg:text-sm text-blue-600 font-semibold">{t('protein.kcal')}</p>
                    </div>
                  </div>

                  <div className="mb-4 lg:mb-6">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('protein.whyMatters.title')}</h4>
                    <ul className="space-y-2 lg:space-y-3">
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('protein.whyMatters.muscle.title')}</strong> {t('protein.whyMatters.muscle.desc')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('protein.whyMatters.satiety.title')}</strong> {t('protein.whyMatters.satiety.desc')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('protein.whyMatters.metabolic.title')}</strong> {t('protein.whyMatters.metabolic.desc')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-4 lg:mb-6">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('protein.target.title')}</h4>
                    <p className="text-xs lg:text-sm text-gray-700 bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
                      <Trans i18nKey="protein.target.desc" ns="MacroEducation">
                        For optimal health and muscle maintenance, aim for <strong>1.6-2.2g per kg</strong> of body weight.
                        Athletes and those building muscle may need up to 2.5g/kg.
                      </Trans>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('protein.sources')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-3">
                      {proteinFoods.map((food, index) => (
                        <motion.div
                          key={food.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-blue-50 rounded-lg p-2 lg:p-3 border border-blue-100"
                        >
                          <p className="text-xs lg:text-sm font-semibold text-gray-900">{food.name}</p>
                          <p className="text-[10px] lg:text-xs text-gray-600">{food.amount}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Carbs Tab */}
            {activeTab === 'carbs' && (
              <motion.div
                key="carbs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 lg:space-y-6"
              >
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4 lg:mb-6">
                    <div className="text-3xl lg:text-4xl">🍞</div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900">{t('carbs.title')}</h3>
                      <p className="text-xs lg:text-sm text-blue-600 font-semibold">{t('carbs.kcal')}</p>
                    </div>
                  </div>

                  <div className="mb-4 lg:mb-6">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('carbs.whyMatters.title')}</h4>
                    <ul className="space-y-2 lg:space-y-3">
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('carbs.whyMatters.energy.title')}</strong> {t('carbs.whyMatters.energy.desc')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('carbs.whyMatters.performance.title')}</strong> {t('carbs.whyMatters.performance.desc')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('carbs.whyMatters.nutrients.title')}</strong> {t('carbs.whyMatters.nutrients.desc')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-4 lg:mb-6">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('carbs.target.title')}</h4>
                    <p className="text-xs lg:text-sm text-gray-700 bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
                      <Trans i18nKey="carbs.target.desc" ns="MacroEducation">
                        For active individuals, aim for <strong>3-6g per kg</strong> of body weight.
                        Sedentary individuals may need less (2-3g/kg). Focus on complex, whole-food sources.
                      </Trans>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('carbs.sources')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-3">
                      {carbFoods.map((food, index) => (
                        <motion.div
                          key={food.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-blue-50 rounded-lg p-2 lg:p-3 border border-blue-100"
                        >
                          <p className="text-xs lg:text-sm font-semibold text-gray-900">{food.name}</p>
                          <p className="text-[10px] lg:text-xs text-gray-600">{food.amount}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fats Tab */}
            {activeTab === 'fats' && (
              <motion.div
                key="fats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 lg:space-y-6"
              >
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4 lg:mb-6">
                    <div className="text-3xl lg:text-4xl">🥑</div>
                    <div>
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900">{t('fats.title')}</h3>
                      <p className="text-xs lg:text-sm text-blue-600 font-semibold">{t('fats.kcal')}</p>
                    </div>
                  </div>

                  <div className="mb-4 lg:mb-6">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('fats.whyMatters.title')}</h4>
                    <ul className="space-y-2 lg:space-y-3">
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('fats.whyMatters.hormone.title')}</strong> {t('fats.whyMatters.hormone.desc')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('fats.whyMatters.vitamin.title')}</strong> {t('fats.whyMatters.vitamin.desc')}</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{t('fats.whyMatters.brain.title')}</strong> {t('fats.whyMatters.brain.desc')}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mb-4 lg:mb-6">
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('fats.target.title')}</h4>
                    <p className="text-xs lg:text-sm text-gray-700 bg-blue-50 p-3 lg:p-4 rounded-lg border border-blue-200">
                      <Trans i18nKey="fats.target.desc" ns="MacroEducation">
                        Aim for <strong>0.8-1.2g per kg</strong> of body weight, or 20-35% of total calories.
                        Prioritize unsaturated fats (olive oil, nuts, fish) over saturated fats.
                      </Trans>
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm lg:text-base font-semibold text-gray-900 mb-3">{t('fats.sources')}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-3">
                      {fatFoods.map((food, index) => (
                        <motion.div
                          key={food.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-blue-50 rounded-lg p-2 lg:p-3 border border-blue-100"
                        >
                          <p className="text-xs lg:text-sm font-semibold text-gray-900">{food.name}</p>
                          <p className="text-[10px] lg:text-xs text-gray-600">{food.amount}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Balanced Plate Tab */}
            {activeTab === 'plate' && (
              <motion.div
                key="plate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 lg:space-y-6"
              >
                <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 lg:mb-8">{t('plate.title')}</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Left: Visual Plate */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-64 h-64 lg:w-80 lg:h-80 mb-6">
                        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                          {/* Plate circle with border */}
                          <circle cx="100" cy="100" r="95" fill="white" stroke="#9CA3AF" strokeWidth="6" />

                          {/* Inner circle for depth */}
                          <circle cx="100" cy="100" r="90" fill="none" stroke="#E5E7EB" strokeWidth="2" />

                          {/* Protein section */}
                          <motion.path
                            animate={{
                              d: `M 100 100 L 100 10 A 90 90 0 0 1 ${
                                100 + 90 * Math.cos((proteinPortion / 100) * 2 * Math.PI - Math.PI / 2)
                              } ${
                                100 + 90 * Math.sin((proteinPortion / 100) * 2 * Math.PI - Math.PI / 2)
                              } Z`,
                            }}
                            fill="#EF4444"
                            opacity="0.9"
                            stroke="#DC2626"
                            strokeWidth="1"
                          />

                          {/* Carbs section */}
                          <motion.path
                            animate={{
                              d: `M 100 100 L ${
                                100 + 90 * Math.cos((proteinPortion / 100) * 2 * Math.PI - Math.PI / 2)
                              } ${
                                100 + 90 * Math.sin((proteinPortion / 100) * 2 * Math.PI - Math.PI / 2)
                              } A 90 90 0 ${carbPortion > 50 ? 1 : 0} 1 ${
                                100 + 90 * Math.cos(((proteinPortion + carbPortion) / 100) * 2 * Math.PI - Math.PI / 2)
                              } ${
                                100 + 90 * Math.sin(((proteinPortion + carbPortion) / 100) * 2 * Math.PI - Math.PI / 2)
                              } Z`,
                            }}
                            fill="#F59E0B"
                            opacity="0.9"
                            stroke="#D97706"
                            strokeWidth="1"
                          />

                          {/* Fats section */}
                          <motion.path
                            animate={{
                              d: `M 100 100 L ${
                                100 + 90 * Math.cos(((proteinPortion + carbPortion) / 100) * 2 * Math.PI - Math.PI / 2)
                              } ${
                                100 + 90 * Math.sin(((proteinPortion + carbPortion) / 100) * 2 * Math.PI - Math.PI / 2)
                              } A 90 90 0 ${fatPortion > 50 ? 1 : 0} 1 100 10 Z`,
                            }}
                            fill="#10B981"
                            opacity="0.9"
                            stroke="#059669"
                            strokeWidth="1"
                          />

                          {/* Center circle for aesthetics */}
                          <circle cx="100" cy="100" r="8" fill="white" stroke="#9CA3AF" strokeWidth="2" />
                        </svg>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500"></div>
                          <span className="text-sm font-medium text-gray-700">{t('plate.legend.protein', { val: proteinPortion })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                          <span className="text-sm font-medium text-gray-700">{t('plate.legend.carbs', { val: carbPortion })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-gray-700">{t('plate.legend.fats', { val: fatPortion })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex flex-col justify-center space-y-6">
                      {/* Sliders */}
                      <div className="space-y-5">
                        {/* Protein Slider */}
                        <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-lg">🥩</span>
                              </div>
                              <div>
                                <label className="text-sm font-bold text-gray-900">{t('plate.sliders.protein.title')}</label>
                                <p className="text-xs text-gray-600">{t('plate.sliders.protein.desc')}</p>
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{proteinPortion}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={proteinPortion}
                            onChange={(e) => setProteinPortion(parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #EF4444 0%, #EF4444 ${proteinPortion}%, #FEE2E2 ${proteinPortion}%, #FEE2E2 100%)`
                            }}
                          />
                        </div>

                        {/* Carbs Slider */}
                        <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                                <span className="text-lg">🍞</span>
                              </div>
                              <div>
                                <label className="text-sm font-bold text-gray-900">{t('plate.sliders.carbs.title')}</label>
                                <p className="text-xs text-gray-600">{t('plate.sliders.carbs.desc')}</p>
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-orange-600">{carbPortion}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={carbPortion}
                            onChange={(e) => setCarbPortion(parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${carbPortion}%, #FFEDD5 ${carbPortion}%, #FFEDD5 100%)`
                            }}
                          />
                        </div>

                        {/* Fats Slider */}
                        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-lg">🥑</span>
                              </div>
                              <div>
                                <label className="text-sm font-bold text-gray-900">{t('plate.sliders.fats.title')}</label>
                                <p className="text-xs text-gray-600">{t('plate.sliders.fats.desc')}</p>
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{fatPortion}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={fatPortion}
                            onChange={(e) => setFatPortion(parseInt(e.target.value))}
                            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #10B981 0%, #10B981 ${fatPortion}%, #D1FAE5 ${fatPortion}%, #D1FAE5 100%)`
                            }}
                          />
                        </div>
                      </div>

                      {/* Total Calories */}
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border-2 border-indigo-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">{t('plate.calories.title')}</p>
                            <p className="text-xs text-gray-500">{t('plate.calories.subtitle')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-4xl font-bold text-indigo-600">{calculateMealCalories()}</p>
                            <p className="text-sm text-gray-600">{t('plate.calories.unit')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Balance Warning */}
                  {isBalanceWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 bg-yellow-50 rounded-xl p-5 border-2 border-yellow-300 shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-base font-bold text-yellow-900 mb-2">⚠️ {t('plate.warning.title')}</p>
                          <p className="text-sm text-yellow-800">
                            {t('plate.warning.desc')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
