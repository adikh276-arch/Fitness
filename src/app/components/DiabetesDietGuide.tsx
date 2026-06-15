import { useState, useEffect } from 'react';
import { ArrowLeft, Droplet, Utensils, Search, Plus, AlertTriangle, TrendingUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { giDatabase, type Food } from '../data/giDatabase';
import { logUserActivity } from '@/lib/db';

interface GlucoseReading {
  id: string;
  value: number;
  unit: 'mg/dL' | 'mmol/L';
  timing: string;
  mealContext: string;
  timestamp: string;
  status: 'normal' | 'high' | 'low';
}

// Metadata moved inside for translation
const TIMING_OPTIONS = ['fasting', 'preMeal', 'postMeal1h', 'postMeal2h', 'bedtime'];

const PLATE_CONFIG = {
  veggies: {
    id: 'veggies',
    color: 'emerald',
    foods: ['Spinach', 'Broccoli', 'Cauliflower', 'Bell Peppers', 'Zucchini', 'Asparagus', 'Cucumber', 'Tomatoes'],
  },
  protein: {
    id: 'protein',
    color: 'orange',
    foods: ['Chicken Breast', 'Fish (Salmon, Tuna)', 'Tofu', 'Lentils', 'Eggs', 'Turkey', 'Greek Yogurt'],
  },
  carbs: {
    id: 'carbs',
    color: 'amber',
    foods: ['Brown Rice', 'Quinoa', 'Sweet Potato', 'Whole Wheat Pasta', 'Oats', 'Barley'],
  },
};

type TabType = 'log' | 'plate' | 'gi';

export default function DiabetesDietGuide({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('DiabetesDiet');

  const timingOptions = useMemo(() => TIMING_OPTIONS.map(opt => ({
    id: opt,
    label: t(`timing.${opt}`)
  })), [t]);

  const plateCategories = useMemo(() => ({
    veggies: {
      ...PLATE_CONFIG.veggies,
      name: `${t('plate.categories.veggies.name')} (${t('plate.categories.veggies.percent')})`,
      foods: PLATE_CONFIG.veggies.foods.map(f => t(`foods.${f}`))
    },
    protein: {
      ...PLATE_CONFIG.protein,
      name: `${t('plate.categories.protein.name')} (${t('plate.categories.protein.percent')})`,
      foods: PLATE_CONFIG.protein.foods.map(f => t(`foods.${f}`))
    },
    carbs: {
      ...PLATE_CONFIG.carbs,
      name: `${t('plate.categories.carbs.name')} (${t('plate.categories.carbs.percent')})`,
      foods: PLATE_CONFIG.carbs.foods.map(f => t(`foods.${f}`))
    }
  }), [t]);

  const [activeTab, setActiveTab] = useState<TabType>('plate');
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([]);
  const [unit, setUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');

  // Form states
  const [value, setValue] = useState('');
  const [timing, setTiming] = useState('fasting');
  const [mealContext, setMealContext] = useState('');
  const [showLowSugarAlert, setShowLowSugarAlert] = useState(false);

  // Plate states
  const [selectedPlateSection, setSelectedPlateSection] = useState<keyof typeof plateCategories | null>(null);

  // GI lookup states
  const [searchQuery, setSearchQuery] = useState('');

  // Load data from localStorage
  useEffect(() => {
    const savedReadings = localStorage.getItem('glucoseReadings');
    if (savedReadings) {
      setGlucoseReadings(JSON.parse(savedReadings));
    }
  }, []);

  const getStatus = (value: number, timing: string, unit: 'mg/dL' | 'mmol/L'): 'normal' | 'high' | 'low' => {
    // Convert to mg/dL if needed
    const mgdl = unit === 'mmol/L' ? value * 18 : value;

    if (mgdl < 70) return 'low';

    if (mgdl < 70) return 'low';

    if (timing === 'fasting') {
      return mgdl >= 80 && mgdl <= 130 ? 'normal' : 'high';
    } else if (timing.includes('postMeal')) {
      return mgdl < 180 ? 'normal' : 'high';
    } else {
      return mgdl >= 80 && mgdl <= 180 ? 'normal' : 'high';
    }
  };

  const addReading = () => {
    const glucoseValue = parseFloat(value);
    if (!glucoseValue || glucoseValue <= 0) return;

    const status = getStatus(glucoseValue, timing, unit);

    const newReading: GlucoseReading = {
      id: crypto.randomUUID(),
      value: glucoseValue,
      unit,
      timing,
      mealContext,
      timestamp: new Date().toISOString(),
      status,
    };

    const updatedReadings = [...glucoseReadings, newReading];
    setGlucoseReadings(updatedReadings);
    localStorage.setItem('glucoseReadings', JSON.stringify(updatedReadings));

    // Log to database
    logToDatabase(newReading);

    // Show alert if low
    if (status === 'low') {
      setShowLowSugarAlert(true);
      setTimeout(() => setShowLowSugarAlert(false), 10000);
    }

    // Reset form
    setValue('');
    setMealContext('');
    alert(t('log.success'));
  };

  const logToDatabase = (reading: GlucoseReading) => {
    logUserActivity('diabetes_diet', 'glucose_reading', {
      value: reading.value,
      unit: reading.unit,
      timing: reading.timing,
      meal_context: reading.mealContext,
      status: reading.status,
      timestamp: reading.timestamp,
    });
  };

  const getGILabel = (gi: number): { label: string; color: string } => {
    if (gi <= 55) return { label: t('gi.labels.low'), color: 'emerald' };
    if (gi <= 69) return { label: t('gi.labels.medium'), color: 'orange' };
    return { label: t('gi.labels.high'), color: 'red' };
  };

  const filteredFoods = giDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    food.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show only 4 items by default when no search query
  const displayedFoods = searchQuery.trim() === '' ? filteredFoods.slice(0, 4) : filteredFoods;

  // Prepare chart data (last 7 readings)
  const chartData = glucoseReadings.slice(-7).map((reading, index) => {
    const date = new Date(reading.timestamp);
    return {
      // Use reading ID as unique identifier for the data point
      id: reading.id,
      // Make time unique by appending index to prevent duplicate keys
      time: `${date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}-${index}`,
      displayTime: date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
      fullTime: date.toLocaleString(i18n.language, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      value: reading.value,
      timing: t(`timing.${reading.timing}`),
    };
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 lg:py-8 px-4 lg:px-0">
      <div className="w-full max-w-full lg:w-[1000px]">
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
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-2 lg:p-3">
              <Droplet className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Low Sugar Alert */}
        <AnimatePresence>
          {showLowSugarAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 lg:mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4 lg:p-6"
            >
              <div className="flex items-start gap-3 lg:gap-4">
                <AlertTriangle className="w-6 lg:w-8 h-6 lg:h-8 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="text-base lg:text-lg font-semibold text-red-900 mb-2">{t('alert.title')}</h3>
                  <p className="text-sm lg:text-base text-red-700 mb-3">
                    {t('alert.desc')}
                  </p>
                  <ul className="space-y-1 text-xs lg:text-sm text-red-700">
                    <li>• {t('alert.actions.carbs')}</li>
                    <li>• {t('alert.actions.wait')}</li>
                    <li>• {t('alert.actions.repeat')}</li>
                    <li>• {t('alert.actions.contact')}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('plate')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'plate'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.plate')}
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.log')}
          </button>
          <button
            onClick={() => setActiveTab('gi')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'gi'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.gi')}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Log Form */}
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('log.title')}</h3>

                  {/* Unit Toggle */}
                  <div className="mb-4 lg:mb-6">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">{t('log.unit')}</label>
                    <div className="grid grid-cols-2 gap-2 lg:gap-3">
                      <button
                        onClick={() => setUnit('mg/dL')}
                        className={`px-3 lg:px-4 py-2 rounded-lg border transition-all text-sm lg:text-base ${
                          unit === 'mg/dL'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        mg/dL
                      </button>
                      <button
                        onClick={() => setUnit('mmol/L')}
                        className={`px-3 lg:px-4 py-2 rounded-lg border transition-all text-sm lg:text-base ${
                          unit === 'mmol/L'
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        mmol/L
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                        {t('log.value', { unit })}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                        placeholder={unit === 'mg/dL' ? t('log.valuePlaceholder') : t('log.valuePlaceholderMmol')}
                      />
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">{t('log.timing')}</label>
                      <select
                        value={timing}
                        onChange={(e) => setTiming(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                      >
                        {timingOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                        {t('log.mealContext')}
                      </label>
                      <textarea
                        value={mealContext}
                        onChange={(e) => setMealContext(e.target.value)}
                        rows={3}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                        placeholder={t('log.mealContextPlaceholder')}
                      />
                    </div>

                    <button
                      onClick={addReading}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-3 lg:py-4 rounded-lg lg:rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
                      {t('log.submit')}
                    </button>
                  </div>

                  {/* Target Ranges */}
                  <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-teal-50 rounded-lg lg:rounded-xl border border-teal-100">
                    <p className="text-xs lg:text-sm font-semibold text-teal-900 mb-2">{t('log.targets.title')}</p>
                    <ul className="space-y-1 text-xs lg:text-sm text-teal-700">
                      <li>• {t('log.targets.fasting')}</li>
                      <li>• {t('log.targets.postMeal')}</li>
                      <li>• {t('log.targets.low')}</li>
                    </ul>
                  </div>
                </div>

                {/* Recent Readings */}
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('log.recent.title')}</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {glucoseReadings.slice().reverse().slice(0, 10).map(reading => (
                      <div
                        key={reading.id}
                        className={`p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 ${
                          reading.status === 'low'
                            ? 'border-red-200 bg-red-50'
                            : reading.status === 'high'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xl lg:text-2xl font-bold ${
                            reading.status === 'low'
                              ? 'text-red-600'
                              : reading.status === 'high'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}>
                            {reading.value} {reading.unit}
                          </span>
                          <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${
                            reading.status === 'low'
                              ? 'bg-red-200 text-red-700'
                              : reading.status === 'high'
                              ? 'bg-yellow-200 text-yellow-700'
                              : 'bg-green-200 text-green-700'
                          }`}>
                            {t(`status.${reading.status}`)}
                          </span>
                        </div>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between text-xs lg:text-sm gap-1 lg:gap-0">
                          <span className="text-gray-600">{t(`timing.${reading.timing}`)}</span>
                          <span className="text-gray-500">
                            {new Date(reading.timestamp).toLocaleString(i18n.language)}
                          </span>
                        </div>
                        {reading.mealContext && (
                          <p className="mt-2 text-xs lg:text-sm text-gray-600 italic">{reading.mealContext}</p>
                        )}
                      </div>
                    ))}

                    {glucoseReadings.length === 0 && (
                      <p className="text-center text-gray-400 py-8 text-sm">{t('log.recent.noReadings')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              {chartData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-4 lg:mb-6">
                    <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6 text-teal-500" />
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t('log.recent.trend')}</h3>
                  </div>
                  <div className="h-64 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="displayTime" 
                          tick={{ fontSize: 12 }} 
                        />
                        <YAxis domain={[50, 250]} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number, name: string, props: any) => [
                            `${value} ${unit}`,
                            props.payload.timing
                          ]}
                          labelFormatter={(label: string, payload: any) => {
                            if (payload && payload[0]) {
                              return payload[0].payload.fullTime;
                            }
                            return label;
                          }}
                        />
                        <ReferenceLine key="ref-line-130" y={130} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: t('log.recent.targetMax'), fontSize: 10 }} />
                        <ReferenceLine key="ref-line-180" y={180} stroke="#EF4444" strokeDasharray="3 3" label={{ value: t('timing.postMeal1h'), fontSize: 10 }} />
                        <ReferenceLine key="ref-line-70" y={70} stroke="#DC2626" strokeDasharray="3 3" label={{ value: t('status.low'), fontSize: 10 }} />
                        <Line type="monotone" dataKey="value" stroke="#14B8A6" strokeWidth={3} dot={{ fill: '#14B8A6', r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'plate' && (
            <motion.div
              key="plate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Intro */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-teal-100">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('plate.intro.title')}</h2>
                <p className="text-sm lg:text-base text-gray-700">
                  {t('plate.intro.desc')}
                </p>
              </div>

              {/* Interactive Plate */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">
                  {t('plate.build.title')}
                </h3>

                {/* Plate Diagram and Category Cards Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
                  {/* Visual Plate Diagram - Left */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full max-w-sm">
                      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                        {/* Plate Circle */}
                        <div className="absolute inset-0 bg-white rounded-full border-8 border-gray-300 shadow-xl overflow-hidden">
                          {/* Left Half - Veggies (50%) */}
                          <motion.div
                            whileHover={{ opacity: 0.9 }}
                            onClick={() => setSelectedPlateSection('veggies')}
                            className="absolute left-0 top-0 bottom-0 w-1/2 bg-emerald-400 cursor-pointer transition-all"
                            style={{
                              opacity: selectedPlateSection === 'veggies' ? 1 : 0.8,
                              boxShadow: selectedPlateSection === 'veggies' ? 'inset 0 0 0 4px rgb(16, 185, 129)' : 'none'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white drop-shadow-md">
                                <div className="text-3xl lg:text-4xl font-bold mb-1">{t('plate.categories.veggies.percent')}</div>
                                <div className="text-xs lg:text-sm font-semibold">{t('plate.categories.veggies.name')}</div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Top Right Quarter - Protein (25%) */}
                          <motion.div
                            whileHover={{ opacity: 0.9 }}
                            onClick={() => setSelectedPlateSection('protein')}
                            className="absolute right-0 top-0 w-1/2 h-1/2 bg-orange-400 cursor-pointer transition-all"
                            style={{
                              opacity: selectedPlateSection === 'protein' ? 1 : 0.8,
                              boxShadow: selectedPlateSection === 'protein' ? 'inset 0 0 0 4px rgb(249, 115, 22)' : 'none'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white drop-shadow-md">
                                <div className="text-2xl lg:text-3xl font-bold mb-1">{t('plate.categories.protein.percent')}</div>
                                <div className="text-xs lg:text-sm font-semibold">{t('plate.categories.protein.name')}</div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Bottom Right Quarter - Carbs (25%) */}
                          <motion.div
                            whileHover={{ opacity: 0.9 }}
                            onClick={() => setSelectedPlateSection('carbs')}
                            className="absolute right-0 bottom-0 w-1/2 h-1/2 bg-amber-400 cursor-pointer transition-all"
                            style={{
                              opacity: selectedPlateSection === 'carbs' ? 1 : 0.8,
                              boxShadow: selectedPlateSection === 'carbs' ? 'inset 0 0 0 4px rgb(245, 158, 11)' : 'none'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-white drop-shadow-md">
                                <div className="text-2xl lg:text-3xl font-bold mb-1">{t('plate.categories.carbs.percent')}</div>
                                <div className="text-xs lg:text-sm font-semibold">{t('plate.categories.carbs.name')}</div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                      <p className="text-center text-xs lg:text-sm text-gray-500 mt-3">{t('plate.build.hint')}</p>
                    </div>
                  </div>

                  {/* Category Cards - Right (Vertical Stack) */}
                  <div className="flex flex-col gap-4 lg:gap-5 justify-center">
                    {/* Veggies Card */}
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlateSection('veggies')}
                      className={`relative rounded-2xl p-5 lg:p-6 border-3 transition-all text-left ${
                        selectedPlateSection === 'veggies'
                          ? 'border-emerald-500 bg-emerald-50 shadow-xl'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-white font-bold text-xl lg:text-2xl">50%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1.5 text-base lg:text-lg">
                            {t('plate.categories.veggies.name')}
                          </h4>
                          <p className="text-sm lg:text-base text-gray-600">{t('plate.categories.veggies.desc')}</p>
                        </div>
                        {selectedPlateSection === 'veggies' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Protein Card */}
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlateSection('protein')}
                      className={`relative rounded-2xl p-5 lg:p-6 border-3 transition-all text-left ${
                        selectedPlateSection === 'protein'
                          ? 'border-orange-500 bg-orange-50 shadow-xl'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-white font-bold text-xl lg:text-2xl">25%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1.5 text-base lg:text-lg">
                            {t('plate.categories.protein.name')}
                          </h4>
                          <p className="text-sm lg:text-base text-gray-600">{t('plate.categories.protein.desc')}</p>
                        </div>
                        {selectedPlateSection === 'protein' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Carbs Card */}
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlateSection('carbs')}
                      className={`relative rounded-2xl p-5 lg:p-6 border-3 transition-all text-left ${
                        selectedPlateSection === 'carbs'
                          ? 'border-amber-500 bg-amber-50 shadow-xl'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 lg:w-18 lg:h-18 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-white font-bold text-xl lg:text-2xl">25%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1.5 text-base lg:text-lg">
                            {t('plate.categories.carbs.name')}
                          </h4>
                          <p className="text-sm lg:text-base text-gray-600">{t('plate.categories.carbs.desc')}</p>
                        </div>
                        {selectedPlateSection === 'carbs' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center"
                          >
                            <Check className="w-5 h-5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Selected Section Foods */}
                <AnimatePresence mode="wait">
                  {selectedPlateSection && (
                    <motion.div
                      key={selectedPlateSection}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 shadow-lg ${
                        selectedPlateSection === 'veggies'
                          ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                          : selectedPlateSection === 'protein'
                          ? 'bg-gradient-to-br from-orange-50 to-white border-orange-200'
                          : 'bg-gradient-to-br from-amber-50 to-white border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4 lg:mb-5">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedPlateSection === 'veggies'
                            ? 'bg-emerald-500'
                            : selectedPlateSection === 'protein'
                            ? 'bg-orange-500'
                            : 'bg-amber-500'
                        }`}>
                          <span className="text-white text-xl">
                            {selectedPlateSection === 'veggies' ? '🥦' : selectedPlateSection === 'protein' ? '🍗' : '🍠'}
                          </span>
                        </div>
                        <h4 className="text-base lg:text-lg font-bold text-gray-900">
                          {plateCategories[selectedPlateSection].name}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3">
                        {plateCategories[selectedPlateSection].foods.map((food, index) => (
                          <motion.div
                            key={food}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white rounded-lg lg:rounded-xl p-3 lg:p-4 border-2 text-center hover:shadow-md transition-shadow ${
                              selectedPlateSection === 'veggies'
                                ? 'border-emerald-200'
                                : selectedPlateSection === 'protein'
                                ? 'border-orange-200'
                                : 'border-amber-200'
                            }`}
                          >
                            <p className="text-xs lg:text-sm font-semibold text-gray-900">{food}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

               {/* Key Principles */}
               <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('plate.principles.title')}</h3>
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className="bg-emerald-100 rounded-lg p-2 lg:p-3 flex-shrink-0">
                      <span className="text-xl lg:text-2xl">🥦</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">{t('plate.principles.veggies.title')}</h4>
                      <p className="text-xs lg:text-sm text-gray-600">
                        {t('plate.principles.veggies.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className="bg-orange-100 rounded-lg p-2 lg:p-3 flex-shrink-0">
                      <span className="text-xl lg:text-2xl">🍗</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">{t('plate.principles.protein.title')}</h4>
                      <p className="text-xs lg:text-sm text-gray-600">
                        {t('plate.principles.protein.desc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 lg:gap-4">
                    <div className="bg-amber-100 rounded-lg p-2 lg:p-3 flex-shrink-0">
                      <span className="text-xl lg:text-2xl">🍠</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">{t('plate.principles.carbs.title')}</h4>
                      <p className="text-xs lg:text-sm text-gray-600">
                        {t('plate.principles.carbs.desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'gi' && (
            <motion.div
              key="gi"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Intro */}
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-teal-100">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('gi.intro.title')}</h2>
                <p className="text-sm lg:text-base text-gray-700 mb-3 lg:mb-4">
                  {t('gi.intro.desc')}
                </p>
                <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 lg:w-4 h-3 lg:h-4 rounded bg-emerald-500"></div>
                    <span className="text-xs lg:text-sm text-gray-700">{t('gi.intro.low')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 lg:w-4 h-3 lg:h-4 rounded bg-orange-500"></div>
                    <span className="text-xs lg:text-sm text-gray-700">{t('gi.intro.medium')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 lg:w-4 h-3 lg:h-4 rounded bg-red-500"></div>
                    <span className="text-xs lg:text-sm text-gray-700">{t('gi.intro.high')}</span>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <div className="relative mb-4 lg:mb-6">
                  <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-4 lg:w-5 h-4 lg:h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('gi.search')}
                    className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-3 lg:py-4 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-base lg:text-lg"
                  />
                </div>

                {/* Food Table */}
                <div className="space-y-2">
                  {displayedFoods.map(food => {
                    const { label, color } = getGILabel(food.gi);
                    return (
                      <div
                        key={food.name}
                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 rounded-lg lg:rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors gap-2 lg:gap-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4">
                          <span className="text-base lg:text-lg font-medium text-gray-900">{food.name}</span>
                          <span className="text-xs lg:text-sm text-gray-500">{food.category}</span>
                        </div>
                        <div className="flex items-center gap-3 lg:gap-4">
                          <span className="text-xl lg:text-2xl font-bold text-gray-900">{food.gi}</span>
                          <span className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg font-semibold text-xs lg:text-sm bg-${color}-100 text-${color}-700 border border-${color}-200`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {searchQuery.trim() !== '' && filteredFoods.length === 0 && (
                    <p className="text-center text-gray-400 py-8 text-sm">{t('gi.noResults')}</p>
                  )}

                  {searchQuery.trim() === '' && (
                    <p className="text-center text-gray-500 py-4 text-sm">
                      Start typing to search through {giDatabase.length} foods...
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}