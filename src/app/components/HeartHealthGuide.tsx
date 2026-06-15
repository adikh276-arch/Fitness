import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { logUserActivity } from '@/lib/db';
import { ArrowLeft, Heart, AlertTriangle, Plus, TrendingUp, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VitalReading {
  id: string;
  systolic: number;
  diastolic: number;
  bpm: number;
  category: string;
  timestamp: string;
}

interface DailyHabits {
  date: string;
  cardio: boolean;
  low_sodium: boolean;
  no_added_salt: boolean;
  medication: boolean;
}

type TabType = 'vitals' | 'dash' | 'habits';

// Metadata moved inside for translation

export default function HeartHealthGuide({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('HeartHealth');
    const SNEAKY_SALT_FOODS = [
      { id: t('canned_soup', `canned_soup`), sodium: 800 },
      { id: t('deli_turkey', `deli_turkey`), sodium: 520 },
      { id: t('white_bread', `white_bread`), sodium: 230 },
      { id: t('frozen_pizza', `frozen_pizza`), sodium: 700 },
      { id: t('soy_sauce', `soy_sauce`), sodium: 1000 },
      { id: t('cottage_cheese', `cottage_cheese`), sodium: 400 },
      { id: 'pickles', sodium: 570 },
      { id: t('salad_dressing', `salad_dressing`), sodium: 300 },
    ];
  const sneakySaltFoods = useMemo(() => SNEAKY_SALT_FOODS.map(f => ({
    ...f,
    name: t(`foods.${f.id}`)
  })), [t]);

  const dashPrinciples = useMemo(() => ({
    sodium: {
      title: t('dash.principles.sodium.title'),
      limit: t('dash.principles.sodium.limit'),
      highRisk: t('dash.principles.sodium.high_risk'),
      desc: t('dash.principles.sodium.desc'),
    },
    potassium: {
      title: t('dash.principles.potassium.title'),
      limit: t('dash.principles.potassium.limit'),
      source: t('dash.principles.potassium.source'),
      foods: t('dash.principles.potassium.foods', { returnObjects: true }) as string[],
    },
    magnesium: {
      title: t('dash.principles.magnesium.title'),
      limit: t('dash.principles.magnesium.limit'),
      target: t('dash.principles.magnesium.target'),
      foods: t('dash.principles.magnesium.foods', { returnObjects: true }) as string[],
    }
  }), [t]);

  const [activeTab, setActiveTab] = useState<TabType>('dash');
  const [vitalReadings, setVitalReadings] = useState<VitalReading[]>([]);
  const [dailyHabits, setDailyHabits] = useState<DailyHabits[]>([]);
  const [todayHabits, setTodayHabits] = useState({ cardio: false, low_sodium: false, no_added_salt: false, medication: false });
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [lastBpmLogged, setLastBpmLogged] = useState(false);

  // Form states
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpm, setBpm] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Load data from localStorage
  useEffect(() => {
    const savedReadings = localStorage.getItem('heartVitalReadings');
    const savedHabits = localStorage.getItem('heartHealthHabits');

    if (savedReadings) {
      setVitalReadings(JSON.parse(savedReadings));
    }

    if (savedHabits) {
      const habits: DailyHabits[] = JSON.parse(savedHabits);
      setDailyHabits(habits);
      const todayHabit = habits.find(h => h.date === today);
      if (todayHabit) {
        setTodayHabits(todayHabit);
      }
    }
  }, [today]);

  // Categorize blood pressure based on AHA guidelines
  const categorizeBP = (sys: number, dia: number): { category: string; color: string } => {
    if (sys >= 180 || dia >= 120) {
      return { category: t('vitals.categories.crisis'), color: 'red' };
    } else if (sys >= 140 || dia >= 90) {
      return { category: t('vitals.categories.stage2'), color: 'red' };
    } else if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return { category: t('vitals.categories.stage1'), color: 'orange' };
    } else if (sys >= 120 && sys <= 129 && dia < 80) {
      return { category: t('vitals.categories.elevated'), color: 'yellow' };
    } else if (sys < 120 && dia < 80) {
      return { category: t('vitals.categories.normal'), color: 'green' };
    }
    return { category: t('vitals.categories.unknown'), color: 'gray' };
  };

  // Add vital reading
  const addReading = () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    const heartRate = parseInt(bpm);

    if (!sys || !dia || !heartRate || sys < 50 || sys > 250 || dia < 30 || dia > 150 || heartRate < 30 || heartRate > 200) {
      alert(t('alerts.vitals.invalid'));
      return;
    }

    const { category, color } = categorizeBP(sys, dia);

    const newReading: VitalReading = {
      id: crypto.randomUUID(),
      systolic: sys,
      diastolic: dia,
      bpm: heartRate,
      category,
      timestamp: new Date().toISOString(),
    };

    const updatedReadings = [...vitalReadings, newReading];
    setVitalReadings(updatedReadings);
    localStorage.setItem('heartVitalReadings', JSON.stringify(updatedReadings));

    // Reset form
    setSystolic('');
    setDiastolic('');
    setBpm('');

    // Trigger pulse animation
    setLastBpmLogged(true);
    setTimeout(() => setLastBpmLogged(false), 2000);

    // Check for hypertensive crisis
    if (sys >= 180 || dia >= 120) {
      setShowCrisisAlert(true);
      setTimeout(() => setShowCrisisAlert(false), 15000);
    }

    logToDatabase('vitals', {
      vitals: {
        systolic: sys,
        diastolic: dia,
        bpm: heartRate,
        category,
        timestamp: newReading.timestamp,
      },
    });

    alert(t('alerts.vitals.success', { sys, dia, category }));
  };

  // Toggle habit
  const toggleHabit = (habit: keyof Omit<DailyHabits, 'date'>) => {
    const newHabits = { ...todayHabits, [habit]: !todayHabits[habit] };
    setTodayHabits(newHabits);

    const updatedHabits = dailyHabits.filter(h => h.date !== today);
    updatedHabits.push({ date: today, ...newHabits });
    setDailyHabits(updatedHabits);
    localStorage.setItem('heartHealthHabits', JSON.stringify(updatedHabits));

    logToDatabase('habits', {
      habits: {
        cardio_done: newHabits.cardio,
        low_sodium_met: newHabits.low_sodium,
        no_added_salt: newHabits.no_added_salt,
        medication_taken: newHabits.medication,
      },
    });
  };

  // Calculate vitality score (streak of cardio + low sodium)
  const getVitalityScore = () => {
    let streak = 0;
    const sortedHabits = [...dailyHabits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const habit of sortedHabits) {
      if (habit.cardio && habit.low_sodium) {
        streak++;
      } else {
        break;
      }
    }

    return Math.min(streak, 30); // Cap at 30 days
  };

  const vitalityScore = getVitalityScore();

  // Database logging
  const logToDatabase = (action: string, data: any) => {
    logUserActivity('heart_health', action, { ...data, timestamp: new Date().toISOString() });
  };

  // Prepare chart data
  const chartData = vitalReadings.slice(-7).map((reading, index) => ({
    date: new Date(reading.timestamp).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
    systolic: reading.systolic,
    diastolic: reading.diastolic,
    id: reading.id, // Add unique identifier
    index: index, // Add index to ensure uniqueness
  }));

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
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-2 lg:p-3">
              <Heart className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Hypertensive Crisis Alert */}
        <AnimatePresence>
          {showCrisisAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 lg:mb-6 bg-red-600 border-2 border-red-700 rounded-xl p-4 lg:p-6"
            >
              <div className="flex items-start gap-3 lg:gap-4">
                <AlertTriangle className="w-8 h-8 lg:w-10 lg:h-10 text-white flex-shrink-0" />
                <div>
                  <h3 className="text-base lg:text-xl font-bold text-white mb-1 lg:mb-2">{t('alerts.crisis.title')}</h3>
                  <p className="text-sm lg:text-base text-red-100 mb-2 lg:mb-3">
                    {t('alerts.crisis.desc')}
                  </p>
                  <ul className="space-y-1 text-xs lg:text-sm text-red-100">
                    {(t('alerts.crisis.actions', { returnObjects: true }) as string[]).map((action, i) => (
                      <li key={i}>• {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('dash')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'dash'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.dash')}
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'vitals'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.vitals')}
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'habits'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.habits')}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'vitals' && (
            <motion.div
              key="vitals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Vitals Form */}
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('vitals.form.title')}</h3>

                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">{t('vitals.form.bp.label')}</label>
                      <div className="grid grid-cols-2 gap-2 lg:gap-3">
                        <div>
                          <input
                            type="number"
                            value={systolic}
                            onChange={(e) => setSystolic(e.target.value)}
                            className="w-full px-3 py-2 lg:px-4 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm lg:text-base"
                            placeholder={t('vitals.form.bp.systolic')}
                          />
                          <p className="text-xs text-gray-500 mt-1">{t('vitals.form.bp.systolic_desc')}</p>
                        </div>
                        <div>
                          <input
                            type="number"
                            value={diastolic}
                            onChange={(e) => setDiastolic(e.target.value)}
                            className="w-full px-3 py-2 lg:px-4 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm lg:text-base"
                            placeholder={t('vitals.form.bp.diastolic')}
                          />
                          <p className="text-xs text-gray-500 mt-1">{t('vitals.form.bp.diastolic_desc')}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1.5 lg:mb-2">{t('vitals.form.heart_rate.label')}</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={bpm}
                          onChange={(e) => setBpm(e.target.value)}
                          className="w-full px-3 py-2 lg:px-4 lg:py-3 pr-10 lg:pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm lg:text-base"
                          placeholder={t('vitals.form.heart_rate.placeholder')}
                        />
                        <motion.div
                          animate={lastBpmLogged ? {
                            scale: [1, 1.2, 1, 1.2, 1],
                          } : {}}
                          transition={{ duration: 1, repeat: lastBpmLogged ? Infinity : 0 }}
                          className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2"
                        >
                          <Heart className={`w-5 h-5 lg:w-6 lg:h-6 ${lastBpmLogged ? 'text-red-500' : 'text-gray-400'}`} />
                        </motion.div>
                      </div>
                    </div>

                    <button
                      onClick={addReading}
                      className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                      {t('vitals.form.submit')}
                    </button>
                  </div>

                  {/* AHA Guidelines Reference */}
                  <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900 mb-2">{t('vitals.guidelines.title')}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-700">{t('vitals.guidelines.normal')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-gray-700">{t('vitals.guidelines.elevated')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-gray-700">{t('vitals.guidelines.stage1')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-700">{t('vitals.guidelines.stage2')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Readings */}
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('vitals.recent.title')}</h3>
                  <div className="space-y-2 lg:space-y-3 max-h-96 overflow-y-auto">
                    {vitalReadings.slice().reverse().slice(0, 10).map(reading => {
                      const { color } = categorizeBP(reading.systolic, reading.diastolic);
                      return (
                        <div
                          key={reading.id}
                          className={`p-3 lg:p-4 rounded-xl border-2 ${
                            color === 'green' ? 'border-emerald-200 bg-emerald-50' :
                            color === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
                            color === 'orange' ? 'border-orange-200 bg-orange-50' :
                            'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span className={`text-xl lg:text-2xl font-bold ${
                              color === 'green' ? 'text-emerald-600' :
                              color === 'yellow' ? 'text-yellow-600' :
                              color === 'orange' ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {reading.systolic}/{reading.diastolic}
                            </span>
                            <span className={`px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs font-semibold ${
                              color === 'green' ? 'bg-emerald-200 text-emerald-700' :
                              color === 'yellow' ? 'bg-yellow-200 text-yellow-700' :
                              color === 'orange' ? 'bg-orange-200 text-orange-700' :
                              'bg-red-200 text-red-700'
                            }`}>
                              {reading.category}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs lg:text-sm gap-2">
                            <div className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span className="text-gray-600">{t('vitals.recent.bpm', { count: reading.bpm })}</span>
                            </div>
                            <span className="text-gray-500">
                              {new Date(reading.timestamp).toLocaleString(i18n.language, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {vitalReadings.length === 0 && (
                      <p className="text-center text-gray-400 py-6 lg:py-8 text-sm lg:text-base">{t('vitals.recent.empty')}</p>
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
                    <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t('vitals.chart.title')}</h3>
                  </div>
                  <div className="h-64 lg:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                        <YAxis domain={[60, 180]} style={{ fontSize: '12px' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line key="line-systolic" type="monotone" dataKey="systolic" stroke="#EF4444" strokeWidth={2} name={t('vitals.chart.systolic')} dot={{ fill: '#EF4444', r: 4 }} />
                        <Line key="line-diastolic" type="monotone" dataKey="diastolic" stroke="#F87171" strokeWidth={2} name={t('vitals.chart.diastolic')} dot={{ fill: '#F87171', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'dash' && (
            <motion.div
              key="dash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Intro */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-red-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('dash.intro.title')}</h2>
                <p className="text-sm lg:text-base text-gray-700">
                  {t('dash.intro.desc')}
                </p>
              </div>

              {/* Key Principles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <div className="bg-red-100 rounded-lg lg:rounded-xl p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-4">
                    <span className="text-2xl lg:text-3xl">🧂</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{dashPrinciples.sodium.title}</h3>
                  <p className="text-sm lg:text-base text-gray-700 mb-1 lg:mb-2">
                    <strong>{dashPrinciples.sodium.limit}</strong>
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">
                    {dashPrinciples.sodium.highRisk}
                  </p>
                  <p className="text-xs text-gray-600">
                    {dashPrinciples.sodium.desc}
                  </p>
                </div>

                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <div className="bg-yellow-100 rounded-lg lg:rounded-xl p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-4">
                    <span className="text-2xl lg:text-3xl">🍌</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{dashPrinciples.potassium.title}</h3>
                  <p className="text-sm lg:text-base text-gray-700 mb-1 lg:mb-2">
                    <strong>{dashPrinciples.potassium.limit}</strong>
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">
                    {dashPrinciples.potassium.source}
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {dashPrinciples.potassium.foods.map((food, i) => (
                      <p key={i}>• {food}</p>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                  <div className="bg-emerald-100 rounded-lg lg:rounded-xl p-3 lg:p-4 w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mb-3 lg:mb-4">
                    <span className="text-2xl lg:text-3xl">🌰</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{dashPrinciples.magnesium.title}</h3>
                  <p className="text-sm lg:text-base text-gray-700 mb-1 lg:mb-2">
                    <strong>{dashPrinciples.magnesium.limit}</strong>
                  </p>
                  <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">
                    {dashPrinciples.magnesium.target}
                  </p>
                  <div className="text-xs text-gray-600 space-y-1">
                    {dashPrinciples.magnesium.foods.map((food, i) => (
                      <p key={i}>• {food}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hidden Sodium Scanner */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-2xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('dash.scanner.title')}</h3>
                <p className="text-sm lg:text-base text-gray-600 mb-4 lg:mb-6">
                  {t('dash.scanner.subtitle')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  {sneakySaltFoods.map(food => (
                    <div
                      key={food.name}
                      className="flex items-center justify-between p-3 lg:p-4 bg-red-50 border border-red-200 rounded-xl gap-2"
                    >
                      <span className="font-medium text-sm lg:text-base text-gray-900">{food.name}</span>
                      <span className={`px-2 py-1 lg:px-3 lg:py-1 rounded-lg font-bold text-xs lg:text-sm whitespace-nowrap ${
                        food.sodium >= 500 ? 'bg-red-200 text-red-700' :
                        food.sodium >= 300 ? 'bg-orange-200 text-orange-700' :
                        'bg-yellow-200 text-yellow-700'
                      }`}>
                        {food.sodium}mg
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs lg:text-sm text-emerald-900 font-semibold mb-2">{t('dash.scanner.swaps.title')}</p>
                  <ul className="space-y-1 text-xs lg:text-sm text-emerald-700">
                    {(t('dash.scanner.swaps.items', { returnObjects: true }) as string[]).map((swap, i) => (
                      <li key={i}>• {swap}</li>
                    ))}
                  </ul>
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
              className="space-y-4 lg:space-y-6"
            >
              {/* Vitality Score */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-red-200">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-0">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 lg:mb-2">{t('habits.vitality.title')}</h3>
                    <p className="text-sm lg:text-base text-gray-600">
                      {vitalityScore === 0
                        ? t('habits.vitality.start')
                        : vitalityScore >= 5
                        ? t('habits.vitality.streak_good', { count: vitalityScore })
                        : vitalityScore === 1 
                        ? t('habits.vitality.streak_continue_singular', { count: vitalityScore })
                        : t('habits.vitality.streak_continue', { count: vitalityScore })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl lg:text-6xl font-bold text-red-600">{vitalityScore}</div>
                    <p className="text-xs lg:text-sm text-gray-500">{t('habits.vitality.days')}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 lg:mt-6">
                  <div className="h-3 lg:h-4 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-rose-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((vitalityScore / 30) * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">{t('habits.vitality.goal', { count: vitalityScore })}</p>
                </div>
              </div>

              {/* Daily Cardio Checklist */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('habits.checklist.title')}</h3>
                <p className="text-xs lg:text-sm text-gray-500 mb-4 lg:mb-6">
                  {t('habits.checklist.subtitle')}
                </p>

                <div className="space-y-3 lg:space-y-4">
                  <HeartHabitCheckbox
                    checked={todayHabits.cardio}
                    onChange={() => toggleHabit('cardio')}
                    icon={<span className="text-xl lg:text-2xl">🏃</span>}
                    label={t('habits.checklist.items.cardio.label')}
                    description={t('habits.checklist.items.cardio.desc')}
                    color="red"
                  />

                  <HeartHabitCheckbox
                    checked={todayHabits.low_sodium}
                    onChange={() => toggleHabit('low_sodium')}
                    icon={<span className="text-xl lg:text-2xl">🧂</span>}
                    label={t('habits.checklist.items.low_sodium.label')}
                    description={t('habits.checklist.items.low_sodium.desc')}
                    color="orange"
                  />

                  <HeartHabitCheckbox
                    checked={todayHabits.no_added_salt}
                    onChange={() => toggleHabit('no_added_salt')}
                    icon={<span className="text-xl lg:text-2xl">✋</span>}
                    label={t('habits.checklist.items.no_salt.label')}
                    description={t('habits.checklist.items.no_salt.desc')}
                    color="amber"
                  />

                  <HeartHabitCheckbox
                    checked={todayHabits.medication}
                    onChange={() => toggleHabit('medication')}
                    icon={<span className="text-xl lg:text-2xl">💊</span>}
                    label={t('habits.checklist.items.meds.label')}
                    description={t('habits.checklist.items.meds.desc')}
                    color="purple"
                  />
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-red-200">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('habits.tips.title')}</h3>
                <div className="space-y-2 lg:space-y-3 text-xs lg:text-base text-gray-700">
                  {(t('habits.tips.items', { returnObjects: true }) as string[]).map((tip, i) => (
                    <p key={i} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">❤️</span>
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

function HeartHabitCheckbox({
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
    red: 'border-red-500 bg-red-50',
    orange: 'border-orange-500 bg-orange-50',
    amber: 'border-amber-500 bg-amber-50',
    purple: 'border-purple-500 bg-purple-50',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onChange}
      className={`p-3 lg:p-6 rounded-xl border-2 cursor-pointer transition-all ${
        checked ? colorClasses[color as keyof typeof colorClasses] : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2 lg:gap-4">
        <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${checked ? `bg-${color}-100` : 'bg-gray-100'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm lg:text-base text-gray-900 mb-0.5 lg:mb-1">{label}</h4>
          <p className="text-xs lg:text-sm text-gray-500">{description}</p>
        </div>
        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? `border-${color}-500 bg-${color}-500` : 'border-gray-300'
        }`}>
          {checked && <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 text-white" />}
        </div>
      </div>
    </motion.div>
  );
}