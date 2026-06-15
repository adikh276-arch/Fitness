import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, CheckCircle2, Utensils, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logUserActivity, fetchUserActivityLogs } from '@/lib/db';
import { useTranslation } from "react-i18next";

interface FastingGoal {
  name: string;
  fastHours: number;
  eatHours: number;
}

const fastingGoals: FastingGoal[] = [
  { name: '16:8', fastHours: 16, eatHours: 8 },
  { name: '18:6', fastHours: 18, eatHours: 6 },
  { name: '20:4', fastHours: 20, eatHours: 4 },
  { name: '23:1', fastHours: 23, eatHours: 1 },
];

interface FastLog {
  date: string;
  goalName: string;
  firstMeal: string;
  lastMeal: string;
  eatingWindowHours: number;
  fastingHours: number;
  goalHours: number;
  goalReached: boolean;
}

export default function FastTimer({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('FastTimer');
  const [selectedGoal, setSelectedGoal] = useState<FastingGoal>(fastingGoals[0]);
  const [currentTab, setCurrentTab] = useState<'log' | 'history'>('log');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [firstMeal, setFirstMeal] = useState('12:00');
  const [lastMeal, setLastMeal] = useState('20:00');
  const [history, setHistory] = useState<FastLog[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Load history from localStorage and DB
  useEffect(() => {
    const savedHistory = localStorage.getItem('fastTimerHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('fasting_timer');
      const logs = dbLogs
        .filter(log => log.action_type === 'log_fast')
        .map(log => {
          const p = log.payload;
          return {
            date: new Date(p.timestamp).toLocaleDateString(),
            fastHours: p.calculated_fast_hours,
            goalHours: p.selected_goal,
            eatingStart: p.eating_start,
            eatingEnd: p.eating_end,
            goalReached: p.goal_reached,
            timestamp: p.timestamp
          } as FastLog;
        });
      if (logs.length > 0) {
        setHistory(logs);
      }
    };
    loadDbLogs();
  }, []);

  // Calculate eating window and fasting hours
  const calculateTimes = (first: string, last: string) => {
    if (!first || !last) return { eatingWindow: 0, fastingHours: 0 };

    const [firstHour, firstMin] = first.split(':').map(Number);
    const [lastHour, lastMin] = last.split(':').map(Number);

    let eatingMinutes = (lastHour * 60 + lastMin) - (firstHour * 60 + firstMin);

    // If negative, it means eating window crosses midnight
    if (eatingMinutes < 0) {
      eatingMinutes += 24 * 60;
    }

    const eatingWindow = eatingMinutes / 60;
    const fastingHours = 24 - eatingWindow;

    return { eatingWindow, fastingHours };
  };

  // Live calculation
  const { eatingWindow, fastingHours } = calculateTimes(firstMeal, lastMeal);
  const goalReached = fastingHours >= selectedGoal.fastHours;

  // Handle goal selection with animation
  const handleGoalSelect = (goal: FastingGoal) => {
    setSelectedGoal(goal);
  };

  const saveLog = () => {
    const newLog: FastLog = {
      date: selectedDate,
      goalName: selectedGoal.name,
      firstMeal,
      lastMeal,
      eatingWindowHours: Math.round(eatingWindow * 10) / 10,
      fastingHours: Math.round(fastingHours * 10) / 10,
      goalHours: selectedGoal.fastHours,
      goalReached,
    };

    // Check if log for this date already exists
    const existingIndex = history.findIndex(log => log.date === selectedDate);
    let updatedHistory;

    if (existingIndex !== -1) {
      updatedHistory = [...history];
      updatedHistory[existingIndex] = newLog;
    } else {
      updatedHistory = [...history, newLog];
    }

    setHistory(updatedHistory);
    localStorage.setItem('fastTimerHistory', JSON.stringify(updatedHistory));

    // Database log
    const dbPayload = {
      selected_goal: selectedGoal.fastHours,
      eating_start: firstMeal,
      eating_end: lastMeal,
      calculated_fast_hours: Math.round(fastingHours * 10) / 10,
      goal_reached: goalReached,
      timestamp: new Date().toISOString(),
    };
    logUserActivity('fasting_timer', 'log_fast', dbPayload);

    // Show success message
    setShowSuccessMessage(true);

    // Confetti if goal reached
    if (goalReached) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#C084FC', '#E9D5FF'],
      });
    }

    // Hide success message after 4 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 4000);
  };

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    if (!time || typeof time !== 'string') return '--';
    const parts = time.split(':');
    if (parts.length !== 2) return '--';

    const hour = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);

    if (isNaN(hour) || isNaN(min)) return '--';

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;
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
            <ArrowLeft className="w-4 lg:w-5 h-4 lg:h-5" />
            <span className="text-sm lg:text-base">{t('back_to_dashboard')}</span>
          </button>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 lg:mb-2">{t('fasting_logger')}</h1>
          <p className="text-sm lg:text-base text-gray-500">{t('track_your_eating_windows_and_fasting_ti')}</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-1 inline-flex gap-1 mb-6 border border-gray-200 w-full lg:w-auto">
          <button
            onClick={() => setCurrentTab('log')}
            className={`flex-1 lg:flex-initial px-4 lg:px-6 py-2 rounded-lg transition-all text-sm lg:text-base flex items-center justify-center gap-2 ${
              currentTab === 'log'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t('log_fast')}
                                </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex-1 lg:flex-initial px-4 lg:px-6 py-2 rounded-lg transition-all text-sm lg:text-base flex items-center justify-center gap-2 ${
              currentTab === 'history'
                ? 'bg-purple-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t('history')}
                                </button>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-xl border-2 ${
                goalReached
                  ? 'bg-green-50 border-green-500'
                  : 'bg-purple-50 border-purple-500'
              }`}
            >
              <div className="flex items-center gap-3">
                {goalReached ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-6 h-6 text-purple-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-bold text-base lg:text-lg ${goalReached ? 'text-green-900' : 'text-purple-900'}`}>
                    {goalReached ? `Great job! You hit your ${selectedGoal.fastHours}-hour goal!` : 'Fast logged successfully!'}
                  </p>
                  <p className={`text-sm ${goalReached ? 'text-green-700' : 'text-purple-700'}`}>
                    {goalReached
                      ? `You fasted for ${Math.round(fastingHours * 10) / 10} hours with a ${Math.round(eatingWindow * 10) / 10}-hour eating window.`
                      : `Keep going! You're ${Math.round((fastingHours / selectedGoal.fastHours) * 100)}% of the way to your goal.`
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Log Tab */}
        {currentTab === 'log' && (
          <div className="space-y-6">
            {/* Step 1: Goal Selection */}
            <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm">
              <label className="block text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                {t('step_1_choose_your_fasting_goal')}
                                            </label>
              <p className="text-xs lg:text-sm text-gray-600 mb-4">{t('select_how_many_hours_you_want_to_fast')}</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {fastingGoals.map((goal) => (
                  <motion.button
                    key={goal.name}
                    onClick={() => handleGoalSelect(goal)}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 lg:p-5 rounded-xl border-2 transition-all ${
                      selectedGoal.name === goal.name
                        ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {selectedGoal.name === goal.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                    <p className="text-2xl lg:text-3xl font-bold text-purple-600 mb-1">{goal.name}</p>
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">
                      {goal.fastHours}{t('h_fasting')}
                                                </p>
                    <p className="text-xs text-gray-500">
                      {goal.eatHours}{t('h_eating_window')}
                                                </p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Step 2: Log Entry Form & Progress */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: Input Form */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm space-y-4 lg:space-y-5">
                <div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1">
                    {t('step_2_when_did_you_eat_today')}
                                                        </h3>
                  <p className="text-xs lg:text-sm text-gray-500 mb-4 lg:mb-6">
                    {t('enter_your_first_and_last_meal_times')}
                                                        </p>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('date')}</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm lg:text-base"
                  />
                </div>

                {/* Time of First Meal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Utensils className="w-4 h-4 inline mr-1 text-purple-500" />
                    {t('time_of_first_meal')}
                                                        </label>
                  <input
                    type="time"
                    value={firstMeal}
                    onChange={(e) => setFirstMeal(e.target.value)}
                    className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm lg:text-base"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('e_g_12_00_pm')}</p>
                </div>

                {/* Time of Last Meal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Utensils className="w-4 h-4 inline mr-1 text-purple-500" />
                    {t('time_of_last_meal')}
                                                        </label>
                  <input
                    type="time"
                    value={lastMeal}
                    onChange={(e) => setLastMeal(e.target.value)}
                    className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm lg:text-base"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('e_g_8_00_pm')}</p>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveLog}
                  className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 text-sm lg:text-base mt-6"
                >
                  <CheckCircle2 className="w-4 lg:w-5 h-4 lg:h-5" />
                  {t('save_log')}
                                                  </button>
              </div>

              {/* Right: Daily Progress */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('daily_progress')}</h3>

                {/* Status Badge */}
                <div className="flex flex-col items-center mb-6 lg:mb-8">
                  <motion.div
                    key={goalReached ? 'achieved' : 'progress'}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`mb-4 lg:mb-6 px-4 lg:px-6 py-2 lg:py-3 rounded-full font-bold text-sm lg:text-base flex items-center gap-2 ${
                      goalReached
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'
                    }`}
                  >
                    {goalReached ? (
                      <>
                        <CheckCircle2 className="w-4 lg:w-5 h-4 lg:h-5" />
                        {t('goal_achieved')}
                                                                    </>
                    ) : (
                      <>
                        <Clock className="w-4 lg:w-5 h-4 lg:h-5" />
                        {t('in_progress')}
                                                                        </>
                    )}
                  </motion.div>

                  {/* Fast Duration */}
                  <p className="text-xs lg:text-sm text-gray-500 mb-2">{t('fast_duration')}</p>
                  <motion.div
                    key={`${fastingHours}`}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`text-5xl lg:text-6xl font-bold mb-2 ${
                      goalReached ? 'text-green-600' : 'text-purple-600'
                    }`}
                  >
                    {Math.round(fastingHours * 10) / 10}{t('h')}
                                                        </motion.div>

                  {/* Eating Window */}
                  <p className="text-xs lg:text-sm text-gray-600 mb-6">
                    {t('your_eating_window_was')} <span className="font-semibold">{Math.round(eatingWindow * 10) / 10} {t('hours')}</span>
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs lg:text-sm text-gray-600">
                        {t('goal_2')} <motion.span
                          key={selectedGoal.fastHours}
                          initial={{ scale: 1.2, color: '#A855F7' }}
                          animate={{ scale: 1, color: '#4B5563' }}
                          className="font-semibold"
                        >
                          {selectedGoal.fastHours}{t('h')}
                                                                          </motion.span>
                      </p>
                      <p className={`text-xs lg:text-sm font-semibold ${
                        goalReached ? 'text-green-600' : 'text-purple-600'
                      }`}>
                        {Math.round((fastingHours / selectedGoal.fastHours) * 100)}%
                      </p>
                    </div>
                    <div className="w-full h-3 lg:h-4 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          goalReached
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : 'bg-gradient-to-r from-purple-500 to-violet-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((fastingHours / selectedGoal.fastHours) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Details Cards */}
                <div className="space-y-3">
                  <div className="p-3 lg:p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('selected_goal')}</p>
                    <p className="text-base lg:text-lg font-bold text-purple-600">{selectedGoal.name}</p>
                  </div>

                  <div className="p-3 lg:p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('eating_window')}</p>
                    <p className="text-sm lg:text-base font-semibold text-gray-900">
                      {formatTime(firstMeal)} → {formatTime(lastMeal)}
                    </p>
                  </div>

                  <div className="p-3 lg:p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('date')}</p>
                    <p className="text-sm lg:text-base font-semibold text-gray-900">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-purple-100">
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('fasting_tips')}</h3>
              <div className="grid lg:grid-cols-3 gap-3 lg:gap-4 text-sm lg:text-base">
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">💧</span>
                  <span className="text-gray-600">{t('stay_hydrated_during_your_fast')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">☕</span>
                  <span className="text-gray-600">{t('black_coffee_tea_are_okay')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500">🥗</span>
                  <span className="text-gray-600">{t('break_fast_with_nutrient_dense_foods')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
              <Calendar className="w-5 lg:w-6 h-5 lg:h-6 text-purple-500" />
              {t('fasting_history')}
                                      </h2>

            {history.length === 0 ? (
              <div className="text-center py-12 lg:py-16">
                <Clock className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm lg:text-base text-gray-500 mb-2">{t('no_logs_yet_start_your_journey_by_loggin')}</p>
                <button
                  onClick={() => setCurrentTab('log')}
                  className="mt-4 px-4 lg:px-6 py-2 lg:py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors text-sm lg:text-base"
                >
                  {t('log_your_first_fast')}
                                                  </button>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {history.slice().reverse().map((log, index) => {
                  const logDate = new Date(log.date);
                  const formattedDate = logDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const isToday = log.date === new Date().toISOString().split('T')[0];

                  return (
                    <motion.div
                      key={log.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-xl p-4 lg:p-6 ${
                        isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between lg:justify-start gap-3 mb-3 flex-wrap">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900">{formattedDate}</h3>
                            {isToday && (
                              <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">{t('today')}</span>
                            )}
                            {log.goalReached && (
                              <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {t('goal_reached')}
                                                                            </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-3">
                            <div>
                              <p className="text-xs lg:text-sm text-gray-500">{t('goal')}</p>
                              <p className="text-base lg:text-lg font-bold text-purple-600">{log.goalName}</p>
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm text-gray-500">{t('fasting_time')}</p>
                              <p className="text-base lg:text-lg font-semibold text-gray-900">{log.fastingHours}{t('h')}</p>
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm text-gray-500">{t('eating_window')}</p>
                              <p className="text-base lg:text-lg font-semibold text-gray-600">{log.eatingWindowHours}{t('h')}</p>
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm text-gray-500">{t('meal_times')}</p>
                              <p className="text-xs lg:text-sm font-medium text-gray-900">
                                {formatTime(log.firstMeal)} - {formatTime(log.lastMeal)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((log.fastingHours / log.goalHours) * 100, 100)}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                              className={`h-full rounded-full ${
                                log.goalReached
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gradient-to-r from-purple-500 to-violet-500'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
