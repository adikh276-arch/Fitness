import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, Scale, Clock, Save, Zap, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { logUserActivity, fetchUserActivityLogs } from '@/lib/db';

interface Activity {
  name: string;
  met: number;
  icon: string;
}

interface LoggedActivity {
  id: string;
  activity_name: string;
  met_value: number;
  duration_min: number;
  weight_kg: number;
  calories_burned: number;
  timestamp: string;
  icon: string;
}

// Static metadata moved inside for translation support
const ACTIVITY_METS = [
  { id: 'walking', met: 4.0, icon: '🚶' },
  { id: 'running', met: 11.0, icon: '🏃' },
  { id: 'cycling', met: 8.0, icon: '🚴' },
  { id: 'yoga', met: 2.5, icon: '🧘' },
  { id: 'swimming', met: 7.0, icon: '🏊' },
  { id: 'strength', met: 6.0, icon: '🏋️' },
  { id: 'household', met: 3.0, icon: '🧹' },
  { id: 'dance', met: 6.5, icon: '💃' },
];

type WeightUnit = 'kg' | 'lbs';
type Tab = 'calculator' | 'log';

export default function CalorieBurner({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('CalorieBurner');

  const activities = useMemo(() => ACTIVITY_METS.map(a => ({
    ...a,
    name: t(`activities.${a.id}`)
  })), [t]);

  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [selectedActivity, setSelectedActivity] = useState<Activity>(activities[0]);
  const [weight, setWeight] = useState('70');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [duration, setDuration] = useState(30);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [activityLog, setActivityLog] = useState<LoggedActivity[]>([]);

  // Load weight and activity log from localStorage and DB
  useEffect(() => {
    const savedMacroData = localStorage.getItem('macroCalculatorWeight');
    if (savedMacroData) {
      setWeight(savedMacroData);
    }

    const savedLog = localStorage.getItem('calorieBurnerLog');
    if (savedLog) {
      try {
        const parsedLog = JSON.parse(savedLog);
        setActivityLog(parsedLog);
      } catch (e) {
        console.error('Failed to parse activity log:', e);
      }
    }

    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('calorie_burner');
      const logEntries = dbLogs
        .filter(log => log.action_type === 'log_activity')
        .map(log => log.payload as LoggedActivity);
      if (logEntries.length > 0) {
        setActivityLog(logEntries);
      }
    };
    loadDbLogs();
  }, []);

  // Calculate calories burned using MET formula
  useEffect(() => {
    const weightKg = weightUnit === 'kg' ? parseFloat(weight) : parseFloat(weight) * 0.453592;

    if (weightKg && weightKg > 0 && duration > 0) {
      // Formula: (MET × 3.5 × Weight in kg / 200) × Duration in minutes
      const calories = (selectedActivity.met * 3.5 * weightKg / 200) * duration;
      setCaloriesBurned(Math.round(calories));
    } else {
      setCaloriesBurned(0);
    }
  }, [selectedActivity, weight, duration, weightUnit]);

  const logActivity = () => {
    const weightKg = weightUnit === 'kg' ? parseFloat(weight) : parseFloat(weight) * 0.453592;

    const newLogEntry: LoggedActivity = {
      id: Date.now().toString(),
      activity_name: selectedActivity.name,
      met_value: selectedActivity.met,
      duration_min: duration,
      weight_kg: Math.round(weightKg * 10) / 10,
      calories_burned: caloriesBurned,
      timestamp: new Date().toISOString(),
      icon: selectedActivity.icon,
    };

    const updatedLog = [newLogEntry, ...activityLog];
    setActivityLog(updatedLog);
    localStorage.setItem('calorieBurnerLog', JSON.stringify(updatedLog));

    // Database log
    logUserActivity('calorie_burner', 'log_activity', newLogEntry);

    // Switch to log tab after saving
    setActiveTab('log');
  };

  const deleteActivity = (id: string) => {
    const updatedLog = activityLog.filter(activity => activity.id !== id);
    setActivityLog(updatedLog);
    localStorage.setItem('calorieBurnerLog', JSON.stringify(updatedLog));
  };

  const flameIntensity = Math.min(caloriesBurned / 10, 100);

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
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'calculator'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Flame className="w-4 h-4 inline mr-2" />
            {t('tabs.calculator')}
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'log'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {t('tabs.log', { count: activityLog.length })}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'calculator' && (
          <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Input Form */}
          <div className="bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('calculator.form.title')}</h2>

            {/* Activity Selector */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Zap className="w-4 h-4 inline mr-2" />
                {t('calculator.form.selectActivity')}
              </label>
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                {activities.map((activity) => (
                  <motion.button
                    key={activity.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedActivity(activity)}
                    className={`p-3 lg:p-4 rounded-xl border-2 transition-all text-left ${
                      selectedActivity.name === activity.name
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl lg:text-2xl">{activity.icon}</span>
                      <span className="text-xs text-gray-500">MET: {activity.met}</span>
                    </div>
                    <p className="text-xs lg:text-sm font-medium text-gray-900">{activity.name}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Weight Input */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scale className="w-4 h-4 inline mr-2" />
                {t('calculator.form.weight')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={weightUnit === 'kg' ? t('calculator.form.placeholders.weightKg') : t('calculator.form.placeholders.weightLbs')}
                  min="20"
                  max={weightUnit === 'kg' ? '300' : '660'}
                  className="col-span-2 px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-sm lg:text-base"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
                  className="px-3 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-sm lg:text-base"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-6 lg:mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                {t('calculator.form.duration')}
              </label>
              <div className="space-y-3 lg:space-y-4">
                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(5, Math.min(180, parseInt(e.target.value) || 5)))}
                    min="5"
                    max="180"
                    className="flex-1 px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-sm lg:text-base"
                  />
                  <span className="text-sm lg:text-base text-gray-600 font-medium">{t('log.item.minutes')}</span>
                </div>
              </div>
            </div>

            {/* Log Activity Button */}
            <button
              onClick={logActivity}
              disabled={caloriesBurned === 0}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base"
            >
              <Save className="w-4 lg:w-5 h-4 lg:h-5" />
              {t('calculator.form.submit')}
            </button>
          </div>

          {/* Right Column: Burn Summary */}
          <div className="bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('calculator.summary.title')}</h2>

            {/* Large Calorie Display */}
            <div className="flex flex-col items-center mb-6 lg:mb-8">
              {/* Animated Flame Visual */}
              <div className="relative mb-4 lg:mb-6">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <Flame
                    className="w-24 h-24 lg:w-32 lg:h-32"
                    style={{
                      fill: `rgba(236, 72, 153, ${Math.min(flameIntensity / 100, 1)})`,
                      color: '#EC4899',
                    }}
                  />
                </motion.div>

                {/* Flame particles */}
                {caloriesBurned > 0 && (
                  <>
                    <motion.div
                      animate={{
                        y: [-20, -60],
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 0,
                      }}
                      className="absolute top-0 left-1/4 w-2 h-2 bg-orange-400 rounded-full"
                    />
                    <motion.div
                      animate={{
                        y: [-20, -60],
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 0.5,
                      }}
                      className="absolute top-0 right-1/4 w-2 h-2 bg-yellow-400 rounded-full"
                    />
                    <motion.div
                      animate={{
                        y: [-20, -60],
                        opacity: [1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 1,
                      }}
                      className="absolute top-0 left-1/2 w-2 h-2 bg-red-400 rounded-full"
                    />
                  </>
                )}
              </div>

              <motion.div
                key={caloriesBurned}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <p className="text-5xl lg:text-6xl font-bold text-pink-600 mb-2">{caloriesBurned}</p>
                <p className="text-base lg:text-lg text-gray-500">{t('calculator.summary.calories')}</p>
              </motion.div>
            </div>

            {/* Activity Summary Cards */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-3 lg:p-4 border border-pink-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl lg:text-2xl">{selectedActivity.icon}</span>
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600">{t('calculator.summary.activity')}</p>
                      <p className="text-sm lg:text-base font-semibold text-gray-900">{selectedActivity.name}</p>
                    </div>
                  </div>
                  <div className="bg-pink-100 px-2 lg:px-3 py-1 rounded-lg">
                    <p className="text-xs text-gray-600">{t('log.item.met')}</p>
                    <p className="text-sm lg:text-base font-bold text-pink-600">{selectedActivity.met}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 lg:p-4 border border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 lg:w-5 h-4 lg:h-5 text-orange-500" />
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600">{t('calculator.summary.duration')}</p>
                      <p className="text-sm lg:text-base font-semibold text-gray-900">{duration} {t('log.item.minutes')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-3 lg:p-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 lg:w-5 h-4 lg:h-5 text-purple-500" />
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600">{t('calculator.summary.weight')}</p>
                      <p className="text-sm lg:text-base font-semibold text-gray-900">
                        {weight} {weightUnit}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {caloriesBurned > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 lg:p-4 border border-emerald-100"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 lg:w-5 h-4 lg:h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600">{t('calculator.summary.burnRate')}</p>
                      <p className="text-sm lg:text-base font-semibold text-gray-900">
                        {Math.round(caloriesBurned / duration)} cal/{t('log.item.minutes')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Formula Info */}
            <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                {t('calculator.summary.formula')}
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Activity Log Tab */}
        {activeTab === 'log' && (
          <div className="space-y-4">
            {activityLog.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 lg:p-12 border border-gray-200 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('log.noActivities')}</h3>
                <p className="text-gray-500 mb-6">{t('log.noActivitiesDesc')}</p>
                <button
                  onClick={() => setActiveTab('calculator')}
                  className="px-6 py-3 bg-pink-500 text-white rounded-xl font-medium hover:bg-pink-600 transition-colors"
                >
                  {t('log.logFirst')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {activityLog.map((activity, index) => {
                    const date = new Date(activity.timestamp);
                    const formattedDate = date.toLocaleDateString(i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const formattedTime = date.toLocaleTimeString(i18n.language, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 lg:gap-4 flex-1">
                            <div className="bg-pink-100 rounded-xl p-3 flex items-center justify-center flex-shrink-0">
                              <span className="text-2xl lg:text-3xl">{activity.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">
                                {activity.activity_name}
                              </h3>
                              <div className="flex flex-wrap gap-2 text-xs lg:text-sm text-gray-500 mb-2">
                                <span>{formattedDate}</span>
                                <span>•</span>
                                <span>{formattedTime}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                                <div className="bg-orange-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600">{t('log.item.duration')}</p>
                                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                                    {activity.duration_min} {t('log.item.minutes')}
                                  </p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600">{t('log.item.met')}</p>
                                  <p className="text-sm lg:text-base font-semibold text-gray-900">
                                    {activity.met_value}
                                  </p>
                                </div>
                                <div className="bg-pink-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-600">{t('log.item.calories')}</p>
                                  <p className="text-sm lg:text-base font-semibold text-pink-600">
                                    {activity.calories_burned}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteActivity(activity.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 group"
                          >
                            <Trash2 className="w-4 lg:w-5 h-4 lg:h-5 text-gray-400 group-hover:text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Summary Stats */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 lg:p-6 border border-pink-100 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('log.summary.title')}</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                    <div className="bg-white rounded-xl p-3 lg:p-4">
                      <p className="text-xs text-gray-600 mb-1">{t('log.summary.totalActivities')}</p>
                      <p className="text-xl lg:text-2xl font-bold text-pink-600">
                        {activityLog.length}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 lg:p-4">
                      <p className="text-xs text-gray-600 mb-1">{t('log.summary.totalCalories')}</p>
                      <p className="text-xl lg:text-2xl font-bold text-orange-600">
                        {activityLog.reduce((sum, a) => sum + a.calories_burned, 0)}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 lg:p-4">
                      <p className="text-xs text-gray-600 mb-1">{t('log.summary.totalTime')}</p>
                      <p className="text-xl lg:text-2xl font-bold text-purple-600">
                        {activityLog.reduce((sum, a) => sum + a.duration_min, 0)} {t('log.item.minutes')}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 lg:p-4">
                      <p className="text-xs text-gray-600 mb-1">{t('log.summary.avgSession')}</p>
                      <p className="text-xl lg:text-2xl font-bold text-emerald-600">
                        {activityLog.length > 0
                          ? Math.round(
                              activityLog.reduce((sum, a) => sum + a.calories_burned, 0) /
                                activityLog.length
                            )
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}