import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { logUserActivity } from '@/lib/db';
import { ArrowLeft, Leaf, Info, Plus, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DigestiveLog {
  id: string;
  bristol_type: number;
  symptoms: string[];
  trigger: string;
  timestamp: string;
}

interface DailyHabits {
  date: string;
  fiber: boolean;
  fermented: boolean;
  mindful: boolean;
  fast: boolean;
}

type TabType = 'log' | 'map' | 'habits';

// Metadata moved inside for translation
const BRISTOL_SCALE_CONFIG = [
  { type: 1, icon: '●●●' },
  { type: 2, icon: '◐◐◐' },
  { type: 3, icon: '▬▬▬' },
  { type: 4, icon: '━━━' },
  { type: 5, icon: '◯◯◯' },
  { type: 6, icon: '∼∼∼' },
  { type: 7, icon: '≋≋≋' },
];

const SYMPTOMS = ['Bloating', 'Gas', 'Cramping', 'Reflux', 'Energy Dip'];
const TRIGGERS = ['Dairy', 'Gluten', 'Coffee', 'Spicy Food', 'Alcohol', 'Stress', 'Other'];

const PREBIOTICS_IDS = [
  'Garlic', 'Onions', 'Leeks', 'Asparagus', 'Bananas', 'Oats',
  'Apples', 'Flaxseed', 'Chicory Root', 'Jerusalem Artichoke'
];

const PROBIOTICS_IDS = [
  'Greek Yogurt', 'Kefir', 'Kimchi', 'Sauerkraut', 'Kombucha',
  'Miso', 'Tempeh', 'Pickles', 'Natto'
];

const PLANT_LIST_IDS = [
  'Spinach', 'Kale', 'Arugula', 'Romaine',
  'Broccoli', 'Cauliflower', 'Brussels Sprouts', 'Cabbage',
  'Carrots', 'Sweet Potatoes', 'Beets', 'Radishes',
  'Chickpeas', 'Lentils', 'Black Beans', 'Kidney Beans',
  'Oats', 'Brown Rice', 'Quinoa', 'Barley',
  'Almonds', 'Walnuts', 'Pistachios', 'Cashews',
  'Chia', 'Flax', 'Pumpkin Seeds', 'Sunflower Seeds',
  'Blueberries', 'Strawberries', 'Raspberries', 'Blackberries',
  'Oranges', 'Lemons', 'Limes', 'Grapefruit',
  'Bananas', 'Pineapple', 'Mango', 'Papaya',
  'Peaches', 'Plums', 'Cherries', 'Apricots',
  'Basil', 'Cilantro', 'Mint', 'Parsley', 'Rosemary',
  'Turmeric', 'Ginger', 'Cinnamon', 'Cumin', 'Paprika',
  'Kimchi', 'Sauerkraut', 'Miso', 'Tempeh',
  'Button Mushrooms', 'Shiitake', 'Portobello', 'Oyster Mushrooms',
  'Pumpkin', 'Butternut Squash', 'Zucchini', 'Acorn Squash',
  'Bell Peppers', 'Jalapeños', 'Chili',
  'Cherry Tomatoes', 'Roma Tomatoes', 'Beefsteak Tomatoes',
  'Garlic', 'Onions', 'Leeks', 'Shallots',
  'Alfalfa Sprouts', 'Broccoli Sprouts', 'Mung Bean Sprouts',
  'Nori', 'Kelp', 'Wakame',
  'Buckwheat', 'Farro', 'Amaranth', 'Millet',
  'Watermelon', 'Cantaloupe', 'Honeydew',
  'Apples', 'Pears',
  'Avocado',
  'Coconut', 'Coconut Milk', 'Coconut Water',
  'Olives',
  'Dark Chocolate', 'Cacao Nibs', 'Cocoa Powder',
  'Green Tea', 'Black Tea', 'Chamomile', 'Peppermint Tea',
  'Coffee',
];

export default function GutHealthGuide({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('GutHealth');

  const bristolScale = useMemo(() => BRISTOL_SCALE_CONFIG.map(s => ({
    ...s,
    label: t(`bristol.types.type${s.type}.label`),
    desc: t(`bristol.types.type${s.type}.desc`)
  })), [t]);

  const symptoms = useMemo(() => SYMPTOMS.map(s => ({
    id: s,
    label: t(`symptoms.items.${s}`)
  })), [t]);

  const triggers = useMemo(() => TRIGGERS.map(t_id => ({
    id: t_id,
    label: t(`triggers.items.${t_id}`)
  })), [t]);

  const prebiotics = useMemo(() => PREBIOTICS_IDS.map(p => t(`plants.${p}`)), [t]);
  const probiotics = useMemo(() => PROBIOTICS_IDS.map(p => t(`plants.${p}`)), [t]);
  const plantList = useMemo(() => PLANT_LIST_IDS.map(p => ({
    id: p,
    label: t(`plants.${p}`)
  })), [t]);

  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [digestiveLogs, setDigestiveLogs] = useState<DigestiveLog[]>([]);
  const [dailyHabits, setDailyHabits] = useState<DailyHabits[]>([]);
  const [todayHabits, setTodayHabits] = useState({ fiber: false, fermented: false, mindful: false, fast: false });
  const [weeklyPlants, setWeeklyPlants] = useState<string[]>([]);

  // Form states - Daily Log
  const [selectedBristol, setSelectedBristol] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  const weekKey = weekStart.toISOString().split('T')[0];

  // Load data from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('gutHealthLogs');
    const savedHabits = localStorage.getItem('gutHealthHabits');
    const savedPlants = localStorage.getItem('weeklyPlants');

    if (savedLogs) {
      setDigestiveLogs(JSON.parse(savedLogs));
    }

    if (savedHabits) {
      const habits: DailyHabits[] = JSON.parse(savedHabits);
      setDailyHabits(habits);
      const todayHabit = habits.find(h => h.date === today);
      if (todayHabit) {
        setTodayHabits(todayHabit);
      }
    }

    if (savedPlants) {
      const plants = JSON.parse(savedPlants);
      // Check if it's from current week
      if (plants.weekKey === weekKey) {
        setWeeklyPlants(plants.plants);
      }
    }
  }, [today, weekKey]);

  // Add digestive log
  const addLog = () => {
    if (selectedBristol === null) {
      alert(t('bristol.alert'));
      return;
    }

    const newLog: DigestiveLog = {
      id: crypto.randomUUID(),
      bristol_type: selectedBristol,
      symptoms: selectedSymptoms,
      trigger: selectedTrigger,
      timestamp: new Date().toISOString(),
    };

    const updatedLogs = [...digestiveLogs, newLog];
    setDigestiveLogs(updatedLogs);
    localStorage.setItem('gutHealthLogs', JSON.stringify(updatedLogs));

    // Reset form
    setSelectedBristol(null);
    setSelectedSymptoms([]);
    setSelectedTrigger('');

    logToDatabase('digestive_log', {
      digestive_log: {
        bristol_type: newLog.bristol_type,
        symptoms: newLog.symptoms,
        trigger: newLog.trigger,
        timestamp: newLog.timestamp,
      },
    });

    alert(t('log.success'));
  };

  // Toggle symptom
  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Toggle habit
  const toggleHabit = (habit: keyof Omit<DailyHabits, 'date'>) => {
    const newHabits = { ...todayHabits, [habit]: !todayHabits[habit] };
    setTodayHabits(newHabits);

    const updatedHabits = dailyHabits.filter(h => h.date !== today);
    updatedHabits.push({ date: today, ...newHabits });
    setDailyHabits(updatedHabits);
    localStorage.setItem('gutHealthHabits', JSON.stringify(updatedHabits));

    const completedHabits = Object.entries(newHabits)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    logToDatabase('habits', {
      habits_completed: completedHabits,
    });
  };

  // Toggle plant
  const togglePlant = (plant: string) => {
    let updatedPlants: string[];
    if (weeklyPlants.includes(plant)) {
      updatedPlants = weeklyPlants.filter(p => p !== plant);
    } else {
      updatedPlants = [...weeklyPlants, plant];
    }
    setWeeklyPlants(updatedPlants);
    localStorage.setItem('weeklyPlants', JSON.stringify({ weekKey, plants: updatedPlants }));

    logToDatabase('plant_diversity', {
      weekly_diversity_score: updatedPlants.length,
    });
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
        habits: habitData || { fiber: false, fermented: false, mindful: false, fast: false },
        completionCount: habitData ?
          (habitData.fiber ? 1 : 0) + (habitData.fermented ? 1 : 0) +
          (habitData.mindful ? 1 : 0) + (habitData.fast ? 1 : 0) : 0
      });
    }
    return days;
  };

  // Database logging
  const logToDatabase = (action: string, data: any) => {
    logUserActivity('gut_health', action, { ...data, timestamp: new Date().toISOString() });
  };

  const diversityScore = weeklyPlants.length;

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
            <span className="text-sm lg:text-base">{t('header.back')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-2 lg:p-3">
              <Leaf className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
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
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.log')}
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.map')}
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'habits'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.habits')}
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
              {/* Bristol Stool Scale */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-2 lg:gap-3 mb-4 lg:mb-6">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t('bristol.title')}</h3>
                  <div className="group relative">
                    <Info className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 cursor-help" />
                    <div className="absolute left-0 top-6 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg p-3 w-64 z-10">
                      {t('bristol.info')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3">
                  {bristolScale.map((scale) => (
                    <motion.button
                      key={scale.type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBristol(scale.type)}
                      className={`relative p-3 lg:p-4 rounded-xl border-2 transition-all group flex flex-col items-center justify-center overflow-hidden min-h-[80px] lg:min-h-[100px] ${
                        selectedBristol === scale.type
                          ? scale.type === 4
                            ? 'border-emerald-500 bg-emerald-50'
                            : scale.type <= 3
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full flex items-center justify-center mb-2 overflow-hidden">
                        <span className="text-2xl lg:text-3xl font-bold tracking-tighter leading-none block">{scale.icon}</span>
                      </div>
                      <p className="text-xs lg:text-sm font-semibold text-gray-900 whitespace-nowrap">{scale.label}</p>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden lg:group-hover:block bg-gray-900 text-white text-xs rounded-lg p-3 w-48 z-10">
                        <p className="font-semibold mb-1">{scale.label}</p>
                        <p>{scale.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Symptom Tracker */}
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('symptoms.title')}</h3>
                  <div className="grid grid-cols-2 gap-2 lg:gap-3">
                    {symptoms.map((symptom) => (
                      <motion.button
                        key={symptom.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleSymptom(symptom.id)}
                        className={`p-3 lg:p-4 rounded-xl border-2 transition-all ${
                          selectedSymptoms.includes(symptom.id)
                            ? 'border-lime-500 bg-lime-50 text-lime-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-xs lg:text-sm">{symptom.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Trigger Association */}
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('triggers.title')}</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {triggers.map((trigger) => (
                      <button
                        key={trigger.id}
                        onClick={() => setSelectedTrigger(trigger.id === selectedTrigger ? '' : trigger.id)}
                        className={`w-full p-2.5 lg:p-3 rounded-xl border-2 transition-all text-left text-sm lg:text-base ${
                          selectedTrigger === trigger.id
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {trigger.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log Button */}
              <button
                onClick={addLog}
                className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm lg:text-base"
              >
                <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                {t('log.submit')}
              </button>

              {/* Recent Logs */}
              {digestiveLogs.length > 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('log.recent.title')}</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {digestiveLogs.slice().reverse().slice(0, 5).map((log) => {
                      const scale = bristolScale.find(s => s.type === log.bristol_type);
                      return (
                        <div key={log.id} className="p-3 lg:p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="flex items-center gap-2 lg:gap-3">
                              <span className="text-xl lg:text-2xl">{scale?.icon}</span>
                              <span className="font-semibold text-sm lg:text-base text-gray-900">{scale?.label}</span>
                            </div>
                            <span className="text-xs lg:text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString(i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                            {log.symptoms.length > 0 && (
                              <div className="flex gap-1.5 lg:gap-2 mb-2 flex-wrap">
                                {log.symptoms.map(s => (
                                  <span key={s} className="px-2 py-1 bg-lime-100 text-lime-700 text-xs rounded-lg">
                                    {t(`symptoms.items.${s}`)}
                                  </span>
                                ))}
                              </div>
                            )}
                          {log.trigger && (
                            <p className="text-xs lg:text-sm text-gray-600">
                              <strong>{t('log.recent.trigger')}</strong> {t(`triggers.items.${log.trigger}`)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Probiotic vs Prebiotic */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-lime-50 to-emerald-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-lime-200">
                  <div className="bg-lime-500 rounded-lg lg:rounded-xl p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-4">
                    <span className="text-2xl lg:text-3xl">🌱</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('microbiome.prebiotics.title')}</h3>
                  <p className="text-sm lg:text-base text-gray-700 mb-2 lg:mb-4">
                    <strong>{t('microbiome.prebiotics.subtitle')}</strong>
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">
                    {t('microbiome.prebiotics.desc')}
                  </p>
                  <div className="space-y-1.5 lg:space-y-2">
                    {prebiotics.map(food => (
                      <div key={food} className="flex items-center gap-2 p-2 lg:p-3 bg-white rounded-lg">
                        <span className="text-lime-500">✓</span>
                        <span className="text-xs lg:text-sm font-medium text-gray-900">{food}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-emerald-200">
                  <div className="bg-emerald-500 rounded-lg lg:rounded-xl p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-4">
                    <span className="text-2xl lg:text-3xl">🦠</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('microbiome.probiotics.title')}</h3>
                  <p className="text-sm lg:text-base text-gray-700 mb-2 lg:mb-4">
                    <strong>{t('microbiome.probiotics.subtitle')}</strong>
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">
                    {t('microbiome.probiotics.desc')}
                  </p>
                  <div className="space-y-1.5 lg:space-y-2">
                    {probiotics.map(food => (
                      <div key={food} className="flex items-center gap-2 p-2 lg:p-3 bg-white rounded-lg">
                        <span className="text-emerald-500">✓</span>
                        <span className="text-xs lg:text-sm font-medium text-gray-900">{food}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 30 Plants Challenge */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 lg:mb-6 gap-3 lg:gap-0">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">{t('diversity.title')}</h3>
                    <p className="text-xs lg:text-base text-gray-600">
                      {t('diversity.subtitle')}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-6xl font-bold text-emerald-600">{diversityScore}</div>
                    <p className="text-xs lg:text-sm text-gray-500">{t('diversity.score_label')}</p>
                  </div>
                </div>

                {/* Plant Counter */}
                <div className="mb-4 lg:mb-6">
                  <div className="h-4 lg:h-6 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-lime-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(diversityScore / 30) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Plant Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-3">
                  {plantList.map(plant => (
                    <motion.button
                      key={plant.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePlant(plant.id)}
                      className={`p-2 lg:p-3 rounded-xl border-2 transition-all ${
                        weeklyPlants.includes(plant.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center mb-1">
                        {weeklyPlants.includes(plant.id) && (
                          <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-gray-900 text-center leading-tight">{plant.label}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'habits' && (
            <motion.div
              key="habits"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Diversity Score */}
              <div className="bg-gradient-to-br from-emerald-50 to-lime-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-emerald-200">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">{t('diversity.weekly_score')}</h3>
                    <p className="text-xs lg:text-base text-gray-600">
                      {diversityScore >= 30
                        ? t('diversity.feedback.excellent')
                        : diversityScore >= 20
                        ? t('diversity.feedback.great')
                        : diversityScore >= 10
                        ? t('diversity.feedback.good')
                        : t('diversity.feedback.start')}
                    </p>
                  </div>
                  <div className="text-4xl lg:text-6xl font-bold text-emerald-600">{diversityScore}</div>
                </div>
              </div>

              {/* Happy Gut Checklist */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('habits.title')}</h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-4 lg:mb-6">
                  {t('habits.subtitle')}
                </p>

                <div className="space-y-3 lg:space-y-4 rounded-xl p-3 lg:p-6">
                  <GutHabitCheckbox
                    checked={todayHabits.fiber}
                    onChange={() => toggleHabit('fiber')}
                    icon={<span className="text-xl lg:text-2xl">🌾</span>}
                    label={t('habits.items.fiber.label')}
                    description={t('habits.items.fiber.desc')}
                  />

                  <GutHabitCheckbox
                    checked={todayHabits.fermented}
                    onChange={() => toggleHabit('fermented')}
                    icon={<span className="text-xl lg:text-2xl">🥒</span>}
                    label={t('habits.items.fermented.label')}
                    description={t('habits.items.fermented.desc')}
                  />

                  <GutHabitCheckbox
                    checked={todayHabits.mindful}
                    onChange={() => toggleHabit('mindful')}
                    icon={<span className="text-xl lg:text-2xl">🧘</span>}
                    label={t('habits.items.mindful.label')}
                    description={t('habits.items.mindful.desc')}
                  />

                  <GutHabitCheckbox
                    checked={todayHabits.fast}
                    onChange={() => toggleHabit('fast')}
                    icon={<span className="text-xl lg:text-2xl">🌙</span>}
                    label={t('habits.items.fast.label')}
                    description={t('habits.items.fast.desc')}
                  />
                </div>
              </div>

              {/* 30-Day Habit Tracker */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('tracker.title')}</h3>
                <div className="grid grid-cols-6 lg:grid-cols-10 gap-2">
                  {getLast30DaysHabits().map((day) => {
                    const isToday = day.date === today;
                    const completionPercentage = (day.completionCount / 4) * 100;

                    return (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                          isToday
                            ? 'ring-2 ring-emerald-500 ring-offset-2'
                            : ''
                        } ${
                          completionPercentage === 100
                            ? 'bg-emerald-500 text-white'
                            : completionPercentage >= 75
                            ? 'bg-teal-400 text-white'
                            : completionPercentage >= 50
                            ? 'bg-lime-400 text-gray-900'
                            : completionPercentage >= 25
                            ? 'bg-green-300 text-gray-900'
                            : completionPercentage > 0
                            ? 'bg-lime-300 text-gray-900'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={t('tracker.tooltip', { dayNum: day.dayNum, count: day.completionCount })}
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
                    <span>{t('tracker.legend.none')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-lime-300"></div>
                    <span>{t('tracker.legend.one')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-300"></div>
                    <span>{t('tracker.legend.two')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-lime-400"></div>
                    <span>{t('tracker.legend.three')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-teal-400"></div>
                    <span>{t('tracker.legend.four')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span>{t('tracker.legend.all')}</span>
                  </div>
                </div>
              </div>

              {/* Educational Tips */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">{t('essentials.title')}</h3>
                <div className="space-y-2 lg:space-y-3">
                  {(t('essentials.items', { returnObjects: true }) as string[]).map((tip, i) => (
                    <p key={i} className="flex items-start gap-2 text-xs lg:text-base text-gray-700">
                      <span className="text-emerald-500 mt-1">✓</span>
                      <span dangerouslySetInnerHTML={{ __html: tip }} />
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GutHabitCheckbox({
  checked,
  onChange,
  icon,
  label,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onChange}
      className={`p-3 lg:p-6 rounded-xl border-2 cursor-pointer transition-all ${
        checked ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex items-center gap-2 lg:gap-4">
        <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${checked ? 'bg-emerald-100' : 'bg-gray-100'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm lg:text-base text-gray-900 mb-0.5 lg:mb-1">{label}</h4>
          <p className="text-xs lg:text-sm text-gray-500">{description}</p>
        </div>
        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
        }`}>
          {checked && <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
        </div>
      </div>
    </motion.div>
  );
}
