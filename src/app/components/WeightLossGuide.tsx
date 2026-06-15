import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, TrendingDown, CheckSquare, Scale, Target, Calendar, Droplets, Moon, Utensils, Activity, Plus, Edit2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation, Trans } from 'react-i18next';
import { logUserActivity } from '@/lib/db';

interface WeightLog {
  date: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
}

interface DailyHabits {
  date: string;
  protein: boolean;
  noSugar: boolean;
  walk: boolean;
  sleep: boolean;
}

interface Goals {
  startWeight: number;
  targetWeight: number;
  targetDate: string;
}

type TabType = 'plan' | 'tracker' | 'habits';

export default function WeightLossGuide({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('WeightLoss');
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [goals, setGoals] = useState<Goals | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [dailyHabits, setDailyHabits] = useState<DailyHabits[]>([]);
  const [todayHabits, setTodayHabits] = useState({ protein: false, noSugar: false, walk: false, sleep: false });
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Form states
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Load data from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem('weightLossGoals');
    const savedLogs = localStorage.getItem('weightLogs');
    const savedHabits = localStorage.getItem('dailyHabits');

    if (savedGoals) {
      const parsed = JSON.parse(savedGoals);
      setGoals(parsed);
      setStartWeight(parsed.startWeight.toString());
      setTargetWeight(parsed.targetWeight.toString());
      setTargetDate(parsed.targetDate);
    } else {
      setShowGoalForm(true);
    }

    if (savedLogs) {
      setWeightLogs(JSON.parse(savedLogs));
    }

    if (savedHabits) {
      const habits: DailyHabits[] = JSON.parse(savedHabits);
      setDailyHabits(habits);

      // Load today's habits
      const todayHabit = habits.find(h => h.date === today);
      if (todayHabit) {
        setTodayHabits(todayHabit);
      }
    }
  }, [today]);

  // Save goals
  const saveGoals = () => {
    if (!startWeight || !targetWeight || !targetDate) {
      alert(t('modal.fillAll'));
      return;
    }

    const newGoals = {
      startWeight: parseFloat(startWeight),
      targetWeight: parseFloat(targetWeight),
      targetDate,
    };
    setGoals(newGoals);
    localStorage.setItem('weightLossGoals', JSON.stringify(newGoals));
    setShowGoalForm(false);
    logToDatabase('goal_update', newGoals);
  };

  // Add weight log
  const addWeightLog = () => {
    const weight = parseFloat(currentWeight);
    if (!weight) return;

    const newLog: WeightLog = {
      date: today,
      weight,
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
    };

    // Replace today's log if exists, otherwise add
    const updatedLogs = weightLogs.filter(log => log.date !== today);
    updatedLogs.push(newLog);
    updatedLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setWeightLogs(updatedLogs);
    localStorage.setItem('weightLogs', JSON.stringify(updatedLogs));

    setCurrentWeight('');
    setChest('');
    setWaist('');
    setHips('');

    logToDatabase('weight_log', { current_metrics: newLog, goals });
  };

  // Toggle habit
  const toggleHabit = (habit: keyof Omit<DailyHabits, 'date'>) => {
    const newHabits = { ...todayHabits, [habit]: !todayHabits[habit] };
    setTodayHabits(newHabits);

    // Update in daily habits array
    const updatedHabits = dailyHabits.filter(h => h.date !== today);
    updatedHabits.push({ date: today, ...newHabits });
    setDailyHabits(updatedHabits);
    localStorage.setItem('dailyHabits', JSON.stringify(updatedHabits));

    logToDatabase('habit_toggle', { daily_habits: newHabits, goals });
  };

  // Calculate stats
  const currentWeightValue = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : goals?.startWeight || 0;
  const weightLost = (goals?.startWeight || 0) - currentWeightValue;
  const weightRemaining = currentWeightValue - (goals?.targetWeight || 0);
  const progressPercentage = goals && goals.startWeight > 0 ? ((weightLost / (goals.startWeight - goals.targetWeight)) * 100) : 0;

  // Calculate weekly consistency
  const getWeeklyConsistency = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekHabits = dailyHabits.filter(h => new Date(h.date) >= sevenDaysAgo);
    if (weekHabits.length === 0) return 0;

    const totalChecks = weekHabits.reduce((sum, day) => {
      return sum + (day.protein ? 1 : 0) + (day.noSugar ? 1 : 0) + (day.walk ? 1 : 0) + (day.sleep ? 1 : 0);
    }, 0);

    return Math.round((totalChecks / (weekHabits.length * 4)) * 100);
  };

  // Get start date based on first logged habit, or today if none
  const getStartDate = () => {
    if (dailyHabits.length > 0) {
      return dailyHabits.reduce((min, p) => p.date < min ? p.date : min, dailyHabits[0].date);
    }
    return new Date().toISOString().split('T')[0];
  };

  // Get 30 days of habit tracking
  const getLast30DaysHabits = () => {
    const days = [];
    const startDateStr = getStartDate();
    const startDate = new Date(startDateStr);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const habitData = dailyHabits.find(h => h.date === dateStr);
      days.push({
        date: dateStr,
        dayNum: i + 1,
        habits: habitData || { protein: false, noSugar: false, walk: false, sleep: false },
        completionCount: habitData ?
          (habitData.protein ? 1 : 0) + (habitData.noSugar ? 1 : 0) +
          (habitData.walk ? 1 : 0) + (habitData.sleep ? 1 : 0) : 0
      });
    }
    return days;
  };

  // Database logging
  const logToDatabase = (type: string, data: any) => {
    logUserActivity('weight_loss', type, { ...data, timestamp: new Date().toISOString() });
  };


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
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-2 lg:p-3">
              <TrendingDown className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'plan'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.plan')}
          </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'tracker'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.tracker')}
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'habits'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.habits')}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'plan' && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* The Golden Rule */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-blue-200">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="bg-blue-500 rounded-xl p-3 flex-shrink-0">
                    <Scale className="w-6 lg:w-7 h-6 lg:h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('plan.goldenRule.title')}</h2>
                    <p className="text-sm lg:text-base text-gray-700 mb-2 lg:mb-3">
                      <strong>{t('plan.goldenRule.subtitle')}</strong>
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {t('plan.goldenRule.desc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Protein First */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-start gap-3 lg:gap-4">
                  <div className="bg-orange-100 rounded-xl p-3 flex-shrink-0">
                    <Utensils className="w-6 lg:w-7 h-6 lg:h-7 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('plan.proteinFirst.title')}</h2>
                    <p className="text-xs lg:text-sm text-gray-700 mb-3">
                      <strong>{t('plan.proteinFirst.subtitle')}</strong>
                    </p>
                    <ul className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>{t('plan.proteinFirst.muscle')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>{t('plan.proteinFirst.thermic')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span>{t('plan.proteinFirst.satiety')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{t('plan.proteinFirst.sugar')}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* The Plate Method */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-start gap-3 lg:gap-4 mb-4">
                  <div className="bg-emerald-100 rounded-xl p-3 flex-shrink-0">
                    <Target className="w-6 lg:w-7 h-6 lg:h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('plan.plateMethod.title')}</h2>
                    <p className="text-xs lg:text-sm text-gray-600 mb-3">
                      {t('plan.plateMethod.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                  <div className="bg-green-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border border-green-200 text-center">
                    <div className="w-12 lg:w-16 h-12 lg:h-16 bg-green-500 rounded-full mx-auto mb-2 lg:mb-3 flex items-center justify-center text-white font-bold text-lg lg:text-xl">
                      50%
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">{t('plan.plateMethod.veg.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plan.plateMethod.veg.desc')}</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border border-orange-200 text-center">
                    <div className="w-12 lg:w-16 h-12 lg:h-16 bg-orange-500 rounded-full mx-auto mb-2 lg:mb-3 flex items-center justify-center text-white font-bold text-lg lg:text-xl">
                      25%
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">{t('plan.plateMethod.protein.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plan.plateMethod.protein.desc')}</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border border-amber-200 text-center">
                    <div className="w-12 lg:w-16 h-12 lg:h-16 bg-amber-500 rounded-full mx-auto mb-2 lg:mb-3 flex items-center justify-center text-white font-bold text-lg lg:text-xl">
                      25%
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 lg:mb-2 text-sm lg:text-base">{t('plan.plateMethod.carbs.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plan.plateMethod.carbs.desc')}</p>
                  </div>
                </div>
              </div>

              {/* Hydration & Sleep */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">{t('plan.hiddenFactors.title')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-cyan-100 rounded-xl p-3 flex-shrink-0">
                      <Droplets className="w-6 lg:w-7 h-6 lg:h-7 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{t('plan.hiddenFactors.hydration.title')}</h3>
                      <p className="text-xs text-gray-600 mb-2">{t('plan.hiddenFactors.hydration.desc')}</p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {t('plan.hiddenFactors.hydration.list', { returnObjects: true }).map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 rounded-xl p-3 flex-shrink-0">
                      <Moon className="w-6 lg:w-7 h-6 lg:h-7 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{t('plan.hiddenFactors.sleep.title')}</h3>
                      <p className="text-xs text-gray-600 mb-2">{t('plan.hiddenFactors.sleep.desc')}</p>
                      <ul className="space-y-1 text-xs text-gray-600">
                        {t('plan.hiddenFactors.sleep.list', { returnObjects: true }).map((item: string, i: number) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tracker' && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Progress Ring */}
              {goals && (
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t('tracker.progress.title')}</h3>
                    <button
                      onClick={() => setShowGoalForm(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('tracker.progress.change')}
                    </button>
                  </div>

                  <div className="flex flex-col lg:flex-row items-center lg:justify-between gap-6">
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-3 gap-2 lg:gap-4">
                        <div className="bg-blue-50 rounded-lg lg:rounded-xl p-2 lg:p-4 border border-blue-100">
                          <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.progress.lost')}</p>
                          <p className="text-lg lg:text-2xl font-bold text-blue-600">{weightLost.toFixed(1)} {t('tracker.history.unit')}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg lg:rounded-xl p-2 lg:p-4 border border-orange-100">
                          <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.progress.remaining')}</p>
                          <p className="text-lg lg:text-2xl font-bold text-orange-600">{Math.max(0, weightRemaining).toFixed(1)} {t('tracker.history.unit')}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg lg:rounded-xl p-2 lg:p-4 border border-emerald-100">
                          <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.progress.percent')}</p>
                          <p className="text-lg lg:text-2xl font-bold text-emerald-600">{Math.min(100, Math.max(0, progressPercentage)).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Ring */}
                    <div className="relative w-32 h-32 lg:w-48 lg:h-48">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                        <circle
                          cx="100"
                          cy="100"
                          r="85"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="16"
                        />
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="85"
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="16"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 85}
                          initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - Math.min(progressPercentage, 100) / 100) }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-2xl lg:text-3xl font-bold text-blue-600">{Math.min(100, Math.max(0, progressPercentage)).toFixed(0)}%</p>
                        <p className="text-xs lg:text-sm text-gray-500">{t('tracker.progress.complete')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Log Weight */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 rounded-xl p-3 flex-shrink-0">
                    <Scale className="w-6 lg:w-7 h-6 lg:h-7 text-blue-500" />
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t('tracker.log.title')}</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">{t('tracker.log.weight')}</label>
                    <input
                      type="number"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm lg:text-base"
                      placeholder={t('tracker.log.placeholder', { val: '75.5' })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">{t('tracker.log.chest')}</label>
                    <input
                      type="number"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm lg:text-base"
                      placeholder={t('tracker.log.placeholder', { val: '38' })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">{t('tracker.log.waist')}</label>
                    <input
                      type="number"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm lg:text-base"
                      placeholder={t('tracker.log.placeholder', { val: '32' })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">{t('tracker.log.hips')}</label>
                    <input
                      type="number"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm lg:text-base"
                      placeholder={t('tracker.log.placeholder', { val: '40' })}
                    />
                  </div>
                </div>

                <button
                  onClick={addWeightLog}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2.5 lg:py-3 rounded-lg lg:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
                  {t('tracker.log.submit')}
                </button>
              </div>

              {/* Metrics History */}
              {weightLogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm"
                >
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('tracker.history.title')}</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {weightLogs.slice().reverse().map((log) => (
                      <div
                        key={log.date}
                        className="p-3 lg:p-4 rounded-lg lg:rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs lg:text-sm font-semibold text-gray-900">
                              {new Date(log.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-lg">
                              <Scale className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-blue-600" />
                              <span className="text-sm lg:text-base font-bold text-blue-600">{log.weight} {t('tracker.history.unit')}</span>
                            </div>

                            {log.chest && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 rounded-lg">
                                <Activity className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-orange-600" />
                                <span className="text-xs lg:text-sm font-semibold text-orange-600">{log.chest}" {t('tracker.history.chest')}</span>
                              </div>
                            )}

                            {log.waist && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-lg">
                                <Target className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-purple-600" />
                                <span className="text-xs lg:text-sm font-semibold text-purple-600">{log.waist}" {t('tracker.history.waist')}</span>
                              </div>
                            )}

                            {log.hips && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-100 rounded-lg">
                                <Target className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-pink-600" />
                                <span className="text-xs lg:text-sm font-semibold text-pink-600">{log.hips}" {t('tracker.history.hips')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {weightLogs.length >= 2 && (
                    <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                        <div className="bg-emerald-50 rounded-lg p-3 lg:p-4 border border-emerald-200">
                          <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.history.total')}</p>
                          <p className="text-lg lg:text-2xl font-bold text-emerald-600">{weightLogs.length}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 lg:p-4 border border-blue-200">
                          <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.history.first')}</p>
                          <p className="text-lg lg:text-2xl font-bold text-blue-600">{weightLogs[0].weight} {t('tracker.history.unit')}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 lg:p-4 border border-purple-200 col-span-2 lg:col-span-1">
                          <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.history.latest')}</p>
                          <p className="text-lg lg:text-2xl font-bold text-purple-600">{weightLogs[weightLogs.length - 1].weight} {t('tracker.history.unit')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Consistency Score */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-cyan-200">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('habits.consistency.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('habits.consistency.subtitle')}</p>
                  </div>
                  <div className="text-4xl lg:text-5xl font-bold text-cyan-600">{getWeeklyConsistency()}%</div>
                </div>
              </div>

              {/* Daily Checklist */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">{t('habits.today.title')}</h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-4">{t('habits.today.subtitle')}</p>

                <div className="space-y-3 lg:space-y-4">
                  <HabitCheckbox
                    checked={todayHabits.protein}
                    onChange={() => toggleHabit('protein')}
                    icon={<Utensils className="w-5 lg:w-6 h-5 lg:h-6" />}
                    label={t('habits.today.protein.label')}
                    description={t('habits.today.protein.desc')}
                    color="orange"
                  />

                  <HabitCheckbox
                    checked={todayHabits.noSugar}
                    onChange={() => toggleHabit('noSugar')}
                    icon={<Droplets className="w-5 lg:w-6 h-5 lg:h-6" />}
                    label={t('habits.today.noSugar.label')}
                    description={t('habits.today.noSugar.desc')}
                    color="cyan"
                  />

                  <HabitCheckbox
                    checked={todayHabits.walk}
                    onChange={() => toggleHabit('walk')}
                    icon={<Activity className="w-5 lg:w-6 h-5 lg:h-6" />}
                    label={t('habits.today.walk.label')}
                    description={t('habits.today.walk.desc')}
                    color="emerald"
                  />

                  <HabitCheckbox
                    checked={todayHabits.sleep}
                    onChange={() => toggleHabit('sleep')}
                    icon={<Moon className="w-5 lg:w-6 h-5 lg:h-6" />}
                    label={t('habits.today.sleep.label')}
                    description={t('habits.today.sleep.desc')}
                    color="purple"
                  />
                </div>
              </div>

              {/* 30-Day Habit Log */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('habits.tracker30.title')}</h3>
                <div className="grid grid-cols-6 lg:grid-cols-10 gap-2">
                  {getLast30DaysHabits().map((day) => {
                    const isToday = day.date === today;
                    const completionPercentage = (day.completionCount / 4) * 100;

                    return (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                          isToday
                            ? 'ring-2 ring-blue-500 ring-offset-2'
                            : ''
                        } ${
                          completionPercentage === 100
                            ? 'bg-cyan-500 text-white'
                            : completionPercentage >= 75
                            ? 'bg-blue-400 text-white'
                            : completionPercentage >= 50
                            ? 'bg-blue-300 text-white'
                            : completionPercentage > 0
                            ? 'bg-sky-300 text-gray-900'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={`Day ${day.dayNum}: ${day.completionCount}/4 habits`}
                      >
                        <span className="text-xs font-bold">{day.dayNum}</span>
                        <span className="text-xs">{day.completionCount}/4</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100"></div>
                    <span>{t('habits.tracker30.legend.none')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-sky-300"></div>
                    <span>{t('habits.tracker30.legend.low')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-300"></div>
                    <span>{t('habits.tracker30.legend.mid')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-400"></div>
                    <span>{t('habits.tracker30.legend.high')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-cyan-500"></div>
                    <span>{t('habits.tracker30.legend.all')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-blue-100">
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">{t('habits.whyMatters.title')}</h3>
                <div className="space-y-2 lg:space-y-3 text-sm lg:text-base text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{t('habits.whyMatters.protein')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{t('habits.whyMatters.noSugar')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{t('habits.whyMatters.walk')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{t('habits.whyMatters.sleep')}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goal Setting Modal */}
        <AnimatePresence>
          {showGoalForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => goals && setShowGoalForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 lg:p-8 border-2 border-purple-200 shadow-2xl max-w-md w-full"
              >
                <div className="flex items-center justify-center mb-4 lg:mb-6">
                  <div className="bg-purple-500 rounded-xl p-3">
                    <Target className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 text-center mb-2">{t('modal.title')}</h2>
                <p className="text-sm text-gray-600 text-center mb-6">{t('modal.subtitle')}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('modal.start')}</label>
                    <input
                      type="number"
                      value={startWeight}
                      onChange={(e) => setStartWeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
                      placeholder={t('tracker.log.placeholder', { val: '80' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('modal.target')}</label>
                    <input
                      type="number"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
                      placeholder={t('tracker.log.placeholder', { val: '70' })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('modal.date')}</label>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm bg-white"
                    />
                  </div>

                  <button
                    onClick={saveGoals}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-xl font-semibold transition-all shadow-lg text-sm flex items-center justify-center gap-2 mt-6"
                  >
                    <Check className="w-4 h-4" />
                    {t('modal.save')}
                  </button>

                  {goals && (
                    <button
                      onClick={() => setShowGoalForm(false)}
                      className="w-full text-gray-600 hover:text-gray-900 py-2 text-sm transition-colors"
                    >
                      {t('modal.cancel')}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HabitCheckbox({
  checked,
  onChange,
  icon,
  label,
  description,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    orange: 'border-orange-500 bg-orange-50',
    cyan: 'border-cyan-500 bg-cyan-50',
    emerald: 'border-emerald-500 bg-emerald-50',
    purple: 'border-purple-500 bg-purple-50',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onChange}
      className={`p-4 lg:p-6 rounded-xl border-2 cursor-pointer transition-all ${
        checked ? colorClasses[color as keyof typeof colorClasses] : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3 lg:gap-4">
        <div className={`p-2 lg:p-3 rounded-xl ${checked ? `bg-${color}-100` : 'bg-gray-100'}`}>
          <div className={checked ? `text-${color}-600` : 'text-gray-400'}>
            {icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">{label}</h4>
          <p className="text-xs lg:text-sm text-gray-500">{description}</p>
        </div>
        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? `border-${color}-500 bg-${color}-500` : 'border-gray-300'
        }`}>
          {checked && <Check className="w-4 lg:w-5 h-4 lg:h-5 text-white" />}
        </div>
      </div>
    </motion.div>
  );
}
