import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Droplets, Undo2, Calculator as CalcIcon, Save, GlassWater, Milk, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { logUserActivity } from '@/lib/db';

interface WaterLog {
  id: string;
  timestamp: string;
  amount_ml: number;
}

interface WaterData {
  date: string;
  total_ml: number;
  goal_ml: number;
  logs: WaterLog[];
}

interface AllWaterData {
  [date: string]: WaterData;
}

export default function WaterIntakeTracker({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('WaterIntake');
  const [currentTab, setCurrentTab] = useState<'tracker' | 'history'>('tracker');
  const [goal, setGoal] = useState(2500);
  const [total, setTotal] = useState(0);
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [allData, setAllData] = useState<AllWaterData>({});
  const [customAmount, setCustomAmount] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCalcSection, setShowCalcSection] = useState(false);
  const [weight, setWeight] = useState('');
  const [tempGoal, setTempGoal] = useState('2500');
  const prevTotalRef = useRef(0);
  const hasReachedGoal = useRef(false);

  const percentage = Math.min((total / goal) * 100, 100);
  const remaining = Math.max(goal - total, 0);

  // Load data from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = localStorage.getItem('allWaterIntakeData');

    if (savedData) {
      const data: AllWaterData = JSON.parse(savedData);
      setAllData(data);

      // Load today's data
      if (data[today]) {
        setGoal(data[today].goal_ml);
        setTotal(data[today].total_ml);
        setLogs(data[today].logs);
      } else {
        resetDaily();
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayData: WaterData = {
      date: today,
      total_ml: total,
      goal_ml: goal,
      logs,
    };

    const updatedAllData = {
      ...allData,
      [today]: todayData,
    };

    setAllData(updatedAllData);
    localStorage.setItem('allWaterIntakeData', JSON.stringify(updatedAllData));
    logToDatabase(todayData);
  }, [total, goal, logs]);

  // Check for goal completion
  useEffect(() => {
    if (total >= goal && prevTotalRef.current < goal && !hasReachedGoal.current) {
      triggerCelebration();
      hasReachedGoal.current = true;
    }
    prevTotalRef.current = total;
  }, [total, goal]);

  const resetDaily = () => {
    setTotal(0);
    setLogs([]);
    hasReachedGoal.current = false;
  };

  const logToDatabase = (data: WaterData) => {
    logUserActivity('water_intake', 'daily_log', {
      date: data.date,
      total_ml: data.total_ml,
      goal_ml: data.goal_ml,
      entries_count: data.logs.length,
    });
  };

  const addWater = (amount: number) => {
    const newLog: WaterLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      amount_ml: amount,
    };

    setLogs(prev => [...prev, newLog]);
    setTotal(prev => prev + amount);
  };

  const undoLast = () => {
    if (logs.length === 0) return;

    const lastLog = logs[logs.length - 1];
    setLogs(prev => prev.slice(0, -1));
    setTotal(prev => Math.max(0, prev - lastLog.amount_ml));

    if (total < goal) {
      hasReachedGoal.current = false;
    }
  };

  const addCustom = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0 && amount <= 2000) {
      addWater(amount);
      setCustomAmount('');
    }
  };

  const updateGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (newGoal && newGoal >= 500 && newGoal <= 10000) {
      setGoal(newGoal);
      setShowGoalModal(false);
      setShowCalcSection(false);
      setWeight('');
      hasReachedGoal.current = false;
    }
  };

  const calculateRecommended = () => {
    const weightKg = parseFloat(weight);
    if (weightKg && weightKg > 0) {
      const recommended = Math.round(weightKg * 35);
      setTempGoal(recommended.toString());
    }
  };

  const triggerCelebration = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#60A5FA', '#3B82F6', '#1D4ED8'],
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#60A5FA', '#3B82F6', '#1D4ED8'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  // Get sorted dates for history
  const sortedDates = Object.keys(allData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 lg:mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="text-sm lg:text-base">{t('nav.back')}</span>
          </button>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 lg:mb-2">{t('header.title')}</h1>
          <p className="text-sm lg:text-base text-gray-500">{t('header.subtitle')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-1 inline-flex gap-1 mb-6 border border-gray-200 w-full lg:w-auto">
          <button
            onClick={() => setCurrentTab('tracker')}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2 rounded-lg transition-all text-sm lg:text-base ${
              currentTab === 'tracker'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('tabs.tracker')}
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2 rounded-lg transition-all text-sm lg:text-base ${
              currentTab === 'history'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('tabs.history')}
          </button>
        </div>

        {/* Tracker Tab */}
        {currentTab === 'tracker' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Circular Progress Visual */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm">
              <div className="flex flex-col items-center">
                {/* Circular Progress */}
                <div className="relative w-64 h-64 lg:w-80 lg:h-80 mb-6 lg:mb-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* Background Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="16"
                    />

                    {/* Animated Progress Circle */}
                    <motion.circle
                      cx="100"
                      cy="100"
                      r="85"
                      fill="none"
                      stroke="url(#waterGradient)"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 85}
                      initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - percentage / 100) }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />

                    <defs>
                      <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      key={total}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Droplets className="w-12 lg:w-16 h-12 lg:h-16 text-blue-500 mb-3 lg:mb-4" />
                    </motion.div>
                    <motion.div
                      key={`total-${total}`}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="text-4xl lg:text-5xl font-bold text-gray-900 mb-1 lg:mb-2"
                    >
                      {total}
                    </motion.div>
                    <p className="text-gray-500 text-base lg:text-lg mb-1">{t('tracker.consumed')}</p>
                    <p className="text-blue-600 font-semibold text-xl lg:text-2xl">{Math.round(percentage)}%</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 w-full mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.goalLabel')}</p>
                    <p className="text-xl lg:text-2xl font-bold text-blue-600">{goal} ml</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 text-center">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.remainingLabel')}</p>
                    <p className="text-xl lg:text-2xl font-bold text-cyan-600">{remaining} ml</p>
                  </div>
                </div>

                {/* Goal Setting Button */}
                <button
                  onClick={() => {
                    setTempGoal(goal.toString());
                    setShowGoalModal(true);
                    setShowCalcSection(false);
                    setWeight('');
                  }}
                  className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 underline transition-colors"
                >
                  {t('tracker.changeGoal')}
                </button>
              </div>
            </div>

            {/* Right: Quick Add Actions */}
            <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-6">{t('tracker.quickAdd.title')}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <QuickAddButton
                  icon={<GlassWater className="w-6 lg:w-7 h-6 lg:h-7" />}
                  label={t('tracker.quickAdd.smallGlass')}
                  amount="250ml"
                  onClick={() => addWater(250)}
                  color="from-blue-400 to-blue-500"
                />
                <QuickAddButton
                  icon={<Droplets className="w-6 lg:w-7 h-6 lg:h-7" />}
                  label={t('tracker.quickAdd.bottle')}
                  amount="500ml"
                  onClick={() => addWater(500)}
                  color="from-cyan-400 to-cyan-500"
                />
                <QuickAddButton
                  icon={<Droplets className="w-7 lg:w-8 h-7 lg:h-8" />}
                  label={t('tracker.quickAdd.largeBottle')}
                  amount="750ml"
                  onClick={() => addWater(750)}
                  color="from-sky-400 to-sky-500"
                />
                <QuickAddButton
                  icon={<Milk className="w-6 lg:w-7 h-6 lg:h-7" />}
                  label={t('tracker.quickAdd.jug')}
                  amount="1000ml"
                  onClick={() => addWater(1000)}
                  color="from-indigo-400 to-indigo-500"
                />
              </div>

              {/* Custom Input */}
              <div className="mt-auto">
                <label className="block text-sm lg:text-base font-medium text-gray-700 mb-3">{t('tracker.custom.label')}</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                    placeholder={t('tracker.custom.placeholder')}
                    min="1"
                    max="2000"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base"
                  />
                  <button
                    onClick={addCustom}
                    className="px-6 lg:px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium text-base shadow-lg shadow-blue-500/20"
                  >
                    {t('tracker.custom.submit')}
                  </button>
                </div>
                <button
                  onClick={undoLast}
                  disabled={logs.length === 0}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
                >
                  <Undo2 className="w-4 h-4" />
                  {t('tracker.custom.undo')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <div className="bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('history.title')}</h2>
            
            {sortedDates.length === 0 ? (
              <p className="text-center text-gray-400 py-12 lg:py-16 text-sm lg:text-base">{t('history.noHistory')}</p>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                {sortedDates.map((date) => {
                  const dayData = allData[date];
                  const dateObj = new Date(date);
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const percentage = Math.min((dayData.total_ml / dayData.goal_ml) * 100, 100);

                  return (
                    <div key={date} className="border border-gray-200 rounded-xl p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-3 lg:mb-4 gap-2 lg:gap-0">
                        <div>
                          <h3 className="text-base lg:text-lg font-semibold text-gray-900">
                            {isToday ? t('history.today') : dateObj.toLocaleDateString(i18n.language, { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h3>
                          <p className="text-xs lg:text-sm text-gray-500 mt-1">
                            {t('history.summary', { total: dayData.total_ml, goal: dayData.goal_ml, percent: Math.round(percentage) })}
                          </p>
                        </div>
                         <div className="flex items-center gap-3 lg:gap-4">
                          <div className="bg-blue-50 rounded-lg px-3 lg:px-4 py-2 text-center">
                            <p className="text-xs text-gray-600">{t('history.stats.total')}</p>
                            <p className="text-base lg:text-lg font-bold text-blue-600">{dayData.total_ml} ml</p>
                          </div>
                          <div className="bg-green-50 rounded-lg px-3 lg:px-4 py-2 text-center">
                            <p className="text-xs text-gray-600">{t('history.stats.entries')}</p>
                            <p className="text-base lg:text-lg font-bold text-green-600">{dayData.logs.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3 lg:mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 lg:h-3 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Logs */}
                      <div className="space-y-2">
                        {dayData.logs.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-center justify-between p-2 lg:p-3 bg-blue-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Droplets className="w-3 lg:w-4 h-3 lg:h-4 text-blue-500" />
                              <span className="text-sm lg:text-base font-medium text-gray-900">+{log.amount_ml} ml</span>
                            </div>
                            <span className="text-xs lg:text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString(i18n.language, {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Goal Setting Modal */}
        <AnimatePresence>
          {showGoalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowGoalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3 lg:mb-4">{t('modal.title')}</h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-4 lg:mb-6">{t('modal.subtitle')}</p>

                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4 text-sm lg:text-base"
                  placeholder={t('modal.placeholder')}
                  min="500"
                  max="10000"
                />

                {/* Toggle Calculator Section */}
                <button
                  onClick={() => setShowCalcSection(!showCalcSection)}
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2.5 lg:py-3 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-sm lg:text-base"
                >
                  <CalcIcon className="w-4 h-4" />
                  {showCalcSection ? t('modal.calcToggleHide') : t('modal.calcToggleShow')}
                </button>

                {/* Calculator Section */}
                <AnimatePresence>
                  {showCalcSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs lg:text-sm text-gray-600">
                          {t('modal.formula')}
                        </p>
                        <div>
                          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                            <Scale className="w-3 lg:w-4 h-3 lg:h-4 inline mr-1" />
                            {t('modal.weightLabel')}
                          </label>
                          <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm lg:text-base"
                            placeholder={t('modal.weightPlaceholder')}
                            min="1"
                          />
                        </div>
                        <button
                          onClick={calculateRecommended}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm lg:text-base"
                        >
                          {t('modal.calcBtn')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowGoalModal(false);
                      setShowCalcSection(false);
                      setWeight('');
                    }}
                    className="flex-1 px-4 py-2.5 lg:py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm lg:text-base"
                  >
                    {t('modal.cancel')}
                  </button>
                  <button
                    onClick={updateGoal}
                    className="flex-1 px-4 py-2.5 lg:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors text-sm lg:text-base"
                  >
                    {t('modal.save')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function QuickAddButton({
  icon,
  label,
  amount,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} text-white rounded-xl p-3 lg:p-4 flex flex-col items-center gap-1 lg:gap-2 shadow-lg hover:shadow-xl transition-shadow`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs lg:text-sm font-bold">{amount}</span>
    </motion.button>
  );
}