import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Footprints, Settings, Plus, TrendingUp, MapPin, Flame, Clock, Award, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { logUserActivity } from '@/lib/db';

interface StepData {
  date: string;
  steps_count: number;
  step_goal: number;
  height_cm: number;
  gender: 'male' | 'female';
  weight_kg: number;
}

interface HistoryEntry {
  date: string;
  steps: number;
  goal: number;
  distance: number;
  calories: number;
}

export default function StepTracker({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('StepTracker');
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(10000);
  const [height, setHeight] = useState(170);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState(70);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [customSteps, setCustomSteps] = useState('');
  const [tempGoal, setTempGoal] = useState('10000');
  const [tempHeight, setTempHeight] = useState('170');
  const [tempWeight, setTempWeight] = useState('70');
  const [tempGender, setTempGender] = useState<'male' | 'female'>('male');
  const [currentTab, setCurrentTab] = useState<'tracker' | 'history'>('tracker');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const hasReachedGoal = useRef(false);
  const prevSteps = useRef(0);

  const percentage = Math.min((steps / goal) * 100, 100);

  // Calculate stride length based on height and gender
  const strideLength = gender === 'male' ? height * 0.415 : height * 0.413;

  // Calculate distance in km
  const distanceKm = (steps * strideLength) / 100000;

  // Calculate calories burned (using weight if available)
  const caloriesBurned = Math.round(steps * 0.0005 * weight);

  // Calculate active time (assuming 100 steps per minute on average)
  const activeTimeMinutes = Math.round(steps / 100);

  // Load data from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedData = localStorage.getItem('stepTrackerData');

    if (savedData) {
      const data: StepData = JSON.parse(savedData);

      if (data.date === today) {
        setSteps(data.steps_count);
        setGoal(data.step_goal);
        setHeight(data.height_cm);
        setGender(data.gender);
        setWeight(data.weight_kg);
      } else {
        resetDaily();
      }
    }

    // Load history
    const savedHistory = localStorage.getItem('stepTrackerHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Try to load profile data from Macro Calculator
    const macroData = localStorage.getItem('macroCalculatorWeight');
    if (macroData) {
      setWeight(parseFloat(macroData));
    }
  }, []);

  // Save data to localStorage and log to database
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const data: StepData = {
      date: today,
      steps_count: steps,
      step_goal: goal,
      height_cm: height,
      gender,
      weight_kg: weight,
    };

    localStorage.setItem('stepTrackerData', JSON.stringify(data));
    logToDatabase();
    updateHistory();
  }, [steps, goal, height, gender, weight]);

  // Check for goal completion
  useEffect(() => {
    if (steps >= goal && prevSteps.current < goal && !hasReachedGoal.current) {
      triggerCelebration();
      hasReachedGoal.current = true;
    }
    prevSteps.current = steps;
  }, [steps, goal]);

  const resetDaily = () => {
    setSteps(0);
    hasReachedGoal.current = false;
  };

  const logToDatabase = () => {
    logUserActivity('step_tracker', 'daily_steps', {
      date: new Date().toISOString().split('T')[0],
      steps_count: steps,
      step_goal: goal,
      distance_km: Math.round(distanceKm * 100) / 100,
      calories_burned: caloriesBurned,
    });
  };

  const addSteps = (amount: number) => {
    setSteps(prev => prev + amount);
  };

  const addCustomSteps = () => {
    const amount = parseInt(customSteps);
    if (amount && amount > 0 && amount <= 50000) {
      addSteps(amount);
      setCustomSteps('');
    }
  };

  const updateGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (newGoal && newGoal >= 1000 && newGoal <= 100000) {
      setGoal(newGoal);
      setShowGoalModal(false);
      hasReachedGoal.current = false;
    }
  };

  const updateProfile = () => {
    const newHeight = parseInt(tempHeight);
    const newWeight = parseInt(tempWeight);
    if (newHeight && newHeight >= 100 && newHeight <= 250) {
      setHeight(newHeight);
    }
    if (newWeight && newWeight >= 30 && newWeight <= 300) {
      setWeight(newWeight);
    }
    setGender(tempGender);
    setShowProfileModal(false);
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
        colors: ['#10B981', '#34D399', '#6EE7B7'],
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10B981', '#34D399', '#6EE7B7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  // Determine gauge color based on progress
  const getGaugeColor = () => {
    if (percentage < 50) return '#F97316'; // Orange
    if (percentage < 100) return '#EAB308'; // Yellow
    return '#10B981'; // Green
  };

  const updateHistory = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: HistoryEntry = {
      date: today,
      steps: steps,
      goal: goal,
      distance: distanceKm,
      calories: caloriesBurned,
    };

    // Check if entry for today already exists
    const existingIndex = history.findIndex(entry => entry.date === today);
    let updatedHistory;
    
    if (existingIndex !== -1) {
      // Update existing entry
      updatedHistory = [...history];
      updatedHistory[existingIndex] = newEntry;
    } else {
      // Add new entry
      updatedHistory = [...history, newEntry];
    }
    
    setHistory(updatedHistory);
    localStorage.setItem('stepTrackerHistory', JSON.stringify(updatedHistory));
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
            <span className="text-sm lg:text-base">{t('nav.back')}</span>
          </button>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 lg:mb-2">{t('header.title')}</h1>
              <p className="text-sm lg:text-base text-gray-500">{t('header.subtitle')}</p>
            </div>
            <button
              onClick={() => {
                setTempHeight(height.toString());
                setTempWeight(weight.toString());
                setTempGender(gender);
                setShowProfileModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all text-sm lg:text-base self-start lg:self-auto"
            >
              <Settings className="w-4 lg:w-5 h-4 lg:h-5" />
              <span>{t('header.profile')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl p-1 inline-flex gap-1 mb-6 border border-gray-200 w-full lg:w-auto">
          <button
            onClick={() => setCurrentTab('tracker')}
            className={`flex-1 lg:flex-initial px-4 lg:px-6 py-2 rounded-lg transition-all text-sm lg:text-base flex items-center justify-center gap-2 ${
              currentTab === 'tracker'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Footprints className="w-4 h-4" />
            {t('tabs.tracker')}
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`flex-1 lg:flex-initial px-4 lg:px-6 py-2 rounded-lg transition-all text-sm lg:text-base flex items-center justify-center gap-2 ${
              currentTab === 'history'
                ? 'bg-emerald-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t('tabs.history')}
          </button>
        </div>

        {/* Tracker Tab */}
        {currentTab === 'tracker' && (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Left: Semi-Circular Gauge */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
              <div className="flex flex-col items-center">
                {/* Semi-Circular Gauge */}
                <div className="relative w-full max-w-md mb-6 lg:mb-8">
                  <svg viewBox="0 0 200 120" className="w-full">
                    {/* Background Arc */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />

                    {/* Animated Progress Arc */}
                    <motion.path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke={getGaugeColor()}
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2}
                      initial={{ strokeDashoffset: 251.2 }}
                      animate={{ strokeDashoffset: percentage === 0 ? 251.2 : 251.2 * (1 - percentage / 100) }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                    <motion.div
                      key={steps}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Footprints className="w-10 lg:w-12 h-10 lg:h-12 text-emerald-500 mb-2" />
                    </motion.div>
                    <motion.div
                      key={`steps-${steps}`}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      className="text-4xl lg:text-5xl font-bold text-gray-900 mb-1"
                    >
                      {steps.toLocaleString()}
                    </motion.div>
                    <p className="text-gray-500 text-xs lg:text-sm mb-1">{t('tracker.stepsToday')}</p>
                    <p className="text-emerald-600 font-semibold text-lg lg:text-xl">{Math.round(percentage)}%</p>
                  </div>
                </div>

                {/* Goal Achieved Badge */}
                <AnimatePresence>
                  {steps >= goal && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="mb-4 lg:mb-6"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-full flex items-center gap-2 shadow-lg text-sm lg:text-base"
                      >
                        <Award className="w-4 lg:w-5 h-4 lg:h-5" />
                        <span className="font-semibold">{t('tracker.goalAchieved')}</span>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 lg:gap-3 w-full mb-4 lg:mb-6">
                   <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 lg:p-4 text-center border border-blue-100">
                    <MapPin className="w-4 lg:w-5 h-4 lg:h-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 mb-1">{t('tracker.stats.distance')}</p>
                    <p className="text-base lg:text-lg font-bold text-blue-600">{distanceKm.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{t('tracker.stats.km')}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 lg:p-4 text-center border border-orange-100">
                    <Flame className="w-4 lg:w-5 h-4 lg:h-5 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 mb-1">{t('tracker.stats.calories')}</p>
                    <p className="text-base lg:text-lg font-bold text-orange-600">{caloriesBurned}</p>
                    <p className="text-xs text-gray-500">{t('tracker.stats.kcal')}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-3 lg:p-4 text-center border border-purple-100">
                    <Clock className="w-4 lg:w-5 h-4 lg:h-5 text-purple-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 mb-1">{t('tracker.stats.activeTime')}</p>
                    <p className="text-base lg:text-lg font-bold text-purple-600">{activeTimeMinutes}</p>
                    <p className="text-xs text-gray-500">{t('tracker.stats.mins')}</p>
                  </div>
                </div>

                {/* Goal Setting */}
                <div className="w-full bg-emerald-50 rounded-xl p-3 lg:p-4 border border-emerald-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
                    <div>
                      <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('tracker.goal.label')}</p>
                      <p className="text-xl lg:text-2xl font-bold text-emerald-600">{t('tracker.goal.value', { val: goal.toLocaleString() })}</p>
                    </div>
                    <button
                      onClick={() => {
                        setTempGoal(goal.toString());
                        setShowGoalModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-xs lg:text-sm font-medium"
                    >
                      {t('tracker.goal.change')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Add & Actions */}
            <div className="lg:col-span-2 space-y-4 lg:space-y-6">
              {/* Quick Add Buttons */}
              <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('tracker.quickAdd.title')}</h3>
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  <QuickAddButton
                    label="+500"
                    onClick={() => addSteps(500)}
                    color="from-emerald-400 to-emerald-500"
                  />
                  <QuickAddButton
                    label="+1,000"
                    onClick={() => addSteps(1000)}
                    color="from-green-400 to-green-500"
                  />
                  <QuickAddButton
                    label="+2,500"
                    onClick={() => addSteps(2500)}
                    color="from-teal-400 to-teal-500"
                  />
                  <QuickAddButton
                    label="+5,000"
                    onClick={() => addSteps(5000)}
                    color="from-cyan-400 to-cyan-500"
                  />
                </div>

                {/* Custom Input */}
                <div className="mt-3 lg:mt-4">
                  <label className="block text-xs lg:text-sm text-gray-600 mb-2">{t('tracker.quickAdd.label')}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customSteps}
                      onChange={(e) => setCustomSteps(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomSteps()}
                      placeholder={t('tracker.quickAdd.placeholder')}
                      min="1"
                      max="50000"
                      className="flex-1 px-3 lg:px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm lg:text-base"
                    />
                    <button
                      onClick={addCustomSteps}
                      className="px-4 lg:px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm lg:text-base"
                    >
                      <Plus className="w-4 h-4" />
                      {t('tracker.quickAdd.submit')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 lg:w-5 h-4 lg:h-5 text-emerald-500" />
                  {t('tracker.insights.title')}
                </h3>

                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center justify-between p-2.5 lg:p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs lg:text-sm text-gray-600">{t('tracker.insights.remaining')}</span>
                    <span className="text-sm lg:text-base font-semibold text-gray-900">
                      {Math.max(0, goal - steps).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 lg:p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs lg:text-sm text-gray-600">{t('tracker.insights.stride')}</span>
                    <span className="text-sm lg:text-base font-semibold text-gray-900">
                      {strideLength.toFixed(1)} cm
                    </span>
                  </div>

                  {steps > 0 && (
                    <div className="flex items-center justify-between p-2.5 lg:p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-xs lg:text-sm text-gray-600">{t('tracker.insights.progress')}</span>
                      <span className="text-sm lg:text-base font-semibold text-emerald-600">
                        {steps >= goal ? t('tracker.insights.complete') : t('tracker.insights.percentOfGoal', { val: Math.round(percentage) })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetDaily}
                className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-xs lg:text-sm"
              >
                {t('tracker.reset')}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <div className="bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6 flex items-center gap-2">
              <Calendar className="w-5 lg:w-6 h-5 lg:h-6 text-emerald-500" />
              {t('history.title')}
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-12 lg:py-16">
                <Footprints className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-sm lg:text-base text-gray-500">{t('history.noHistory')}</p>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {history.slice().reverse().map((entry, index) => {
                  const entryPercentage = Math.min((entry.steps / entry.goal) * 100, 100);
                  const formattedDate = new Date(entry.date).toLocaleDateString(i18n.language, {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  const isToday = entry.date === new Date().toISOString().split('T')[0];

                  return (
                    <motion.div
                      key={entry.date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border rounded-xl p-4 lg:p-6 ${
                        isToday ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between lg:justify-start gap-3 mb-2">
                            <h3 className="text-base lg:text-lg font-semibold text-gray-900">{formattedDate}</h3>
                            {isToday && (
                              <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded-full">{t('history.today')}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mb-3">
                            <div>
                              <p className="text-xs lg:text-sm text-gray-500">{t('history.stats.steps')}</p>
                              <p className="text-xl lg:text-2xl font-bold text-gray-900">{entry.steps.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs lg:text-sm text-gray-500">{t('history.stats.goal')}</p>
                              <p className="text-base lg:text-lg font-semibold text-gray-600">{entry.goal.toLocaleString()}</p>
                            </div>
                            <div className={`ml-auto lg:ml-0 ${entry.steps >= entry.goal ? 'text-emerald-600' : 'text-orange-600'}`}>
                              <p className="text-xs lg:text-sm text-gray-500">{t('history.stats.progress')}</p>
                              <p className="text-base lg:text-lg font-bold">{Math.round(entryPercentage)}%</p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${entryPercentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                              className={`h-2 rounded-full ${
                                entry.steps >= entry.goal 
                                  ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                                  : 'bg-gradient-to-r from-orange-500 to-yellow-500'
                              }`}
                            />
                          </div>

                          {/* Stats */}
                           <div className="grid grid-cols-3 gap-2 lg:gap-3">
                            <div className="bg-blue-50 rounded-lg p-2 lg:p-3 text-center border border-blue-100">
                              <MapPin className="w-3 lg:w-4 h-3 lg:h-4 text-blue-500 mx-auto mb-1" />
                              <p className="text-xs lg:text-sm font-bold text-blue-600">{entry.distance.toFixed(2)} {t('tracker.stats.km')}</p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-2 lg:p-3 text-center border border-orange-100">
                              <Flame className="w-3 lg:w-4 h-3 lg:h-4 text-orange-500 mx-auto mb-1" />
                              <p className="text-xs lg:text-sm font-bold text-orange-600">{entry.calories} {t('tracker.stats.kcal')}</p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-2 lg:p-3 text-center border border-purple-100">
                              <Clock className="w-3 lg:w-4 h-3 lg:h-4 text-purple-500 mx-auto mb-1" />
                              <p className="text-xs lg:text-sm font-bold text-purple-600">{Math.round(entry.steps / 100)} {t('tracker.stats.mins')}</p>
                            </div>
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

        {/* Goal Modal */}
        <AnimatePresence>
          {showGoalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowGoalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 w-96 shadow-2xl"
              >
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('modals.goal.title')}</h3>
                <p className="text-sm text-gray-500 mb-6">{t('modals.goal.subtitle')}</p>

                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-6"
                  placeholder={t('modals.goal.placeholder')}
                  min="1000"
                  max="100000"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {t('modals.goal.cancel')}
                  </button>
                  <button
                    onClick={updateGoal}
                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                  >
                    {t('modals.goal.save')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Modal */}
        <AnimatePresence>
          {showProfileModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setShowProfileModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 w-96 shadow-2xl"
              >
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{t('modals.profile.title')}</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {t('modals.profile.subtitle')}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('modals.profile.height')}</label>
                    <input
                      type="number"
                      value={tempHeight}
                      onChange={(e) => setTempHeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder={t('modals.profile.placeholderHeight')}
                      min="100"
                      max="250"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('modals.profile.weight')}</label>
                    <input
                      type="number"
                      value={tempWeight}
                      onChange={(e) => setTempWeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder={t('modals.profile.placeholderWeight')}
                      min="30"
                      max="300"
                    />
                  </div>

                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('modals.profile.gender')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setTempGender('male')}
                        className={`px-4 py-3 rounded-xl border transition-all ${
                          tempGender === 'male'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t('modals.profile.male')}
                      </button>
                      <button
                        onClick={() => setTempGender('female')}
                        className={`px-4 py-3 rounded-xl border transition-all ${
                          tempGender === 'female'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {t('modals.profile.female')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {t('modals.profile.cancel')}
                  </button>
                  <button
                    onClick={updateProfile}
                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                  >
                    {t('modals.profile.save')}
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
  label,
  onClick,
  color,
}: {
  label: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} text-white rounded-xl py-4 font-semibold shadow-lg hover:shadow-xl transition-shadow`}
    >
      {label}
    </motion.button>
  );
}