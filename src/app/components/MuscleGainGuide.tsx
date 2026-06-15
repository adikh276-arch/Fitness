import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Dumbbell, TrendingUp, CheckSquare, Plus, Zap, Flame, Scale, Moon, Droplets, Calculator, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { logUserActivity } from '@/lib/db';
import { useTranslation } from 'react-i18next';

interface BodyMetrics {
  id: string;
  date: string;
  weight: number;
  chest: number;
  bicep_r: number;
  bicep_l: number;
  thigh: number;
  waist: number;
}

interface GrowthProfile {
  targetWeight: number;
}

interface DailyHabits {
  date: string;
  surplus_met: boolean;
  protein_met: boolean;
  creatine: boolean;
  sleep: boolean;
  trained: boolean;
}

interface VolumeLog {
  lift: string;
  sets: number;
  reps: number;
  weight: number;
}

type TabType = 'plan' | 'metrics' | 'habits';

export default function MuscleGainGuide({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('MuscleGain');
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics[]>([]);
  const [dailyHabits, setDailyHabits] = useState<DailyHabits[]>([]);
  const [todayHabits, setTodayHabits] = useState({ surplus_met: false, protein_met: false, creatine: false, sleep: false, trained: false });
  const [volumeLogs, setVolumeLogs] = useState<VolumeLog[]>([]);
  const [growthProfile, setGrowthProfile] = useState<GrowthProfile>({ targetWeight: 0 });

  // Form states - Metrics
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [bicepR, setBicepR] = useState('');
  const [bicepL, setBicepL] = useState('');
  const [thigh, setThigh] = useState('');
  const [waist, setWaist] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  // Form states - Volume
  const [lift, setLift] = useState(t('exercises.benchPress'));
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [volumeWeight, setVolumeWeight] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Load data from localStorage
  useEffect(() => {
    const savedMetrics = localStorage.getItem('muscleGainMetrics');
    const savedHabits = localStorage.getItem('muscleGainHabits');
    const savedVolume = localStorage.getItem('muscleGainVolume');
    const savedProfile = localStorage.getItem('muscleGainGrowthProfile');

    if (savedMetrics) {
      setBodyMetrics(JSON.parse(savedMetrics));
    }

    if (savedHabits) {
      const habits: DailyHabits[] = JSON.parse(savedHabits);
      setDailyHabits(habits);
      const todayHabit = habits.find(h => h.date === today);
      if (todayHabit) {
        setTodayHabits(todayHabit);
      }
    }

    if (savedVolume) {
      setVolumeLogs(JSON.parse(savedVolume));
    }

    if (savedProfile) {
      const profile: GrowthProfile = JSON.parse(savedProfile);
      setGrowthProfile(profile);
      setTargetWeight(profile.targetWeight.toString());
    }
  }, [today]);

  // Add body metrics
  const addMetrics = () => {
    const weightVal = parseFloat(weight);
    const chestVal = parseFloat(chest);
    const bicepRVal = parseFloat(bicepR);
    const bicepLVal = parseFloat(bicepL);
    const thighVal = parseFloat(thigh);
    const waistVal = parseFloat(waist);
    const targetWeightVal = parseFloat(targetWeight);

    if (!weightVal || !chestVal || !bicepRVal || !targetWeightVal) return;

    const newMetric: BodyMetrics = {
      id: crypto.randomUUID(),
      date: today,
      weight: weightVal,
      chest: chestVal,
      bicep_r: bicepRVal,
      bicep_l: bicepLVal || bicepRVal,
      thigh: thighVal || 0,
      waist: waistVal || 0,
    };

    const updatedMetrics = bodyMetrics.filter(m => m.date !== today);
    updatedMetrics.push(newMetric);
    updatedMetrics.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setBodyMetrics(updatedMetrics);
    localStorage.setItem('muscleGainMetrics', JSON.stringify(updatedMetrics));

    const newProfile: GrowthProfile = { targetWeight: targetWeightVal };
    setGrowthProfile(newProfile);
    localStorage.setItem('muscleGainGrowthProfile', JSON.stringify(newProfile));

    setWeight('');
    setChest('');
    setBicepR('');
    setBicepL('');
    setThigh('');
    setWaist('');

    logToDatabase('metrics', { measurements: newMetric, target_weight: targetWeightVal });
    alert(t('metrics.form.success'));
  };

  // Add volume log
  const addVolume = () => {
    const setsVal = parseInt(sets);
    const repsVal = parseInt(reps);
    const weightVal = parseFloat(volumeWeight);

    if (!setsVal || !repsVal || !weightVal) return;

    const newLog: VolumeLog = {
      lift,
      sets: setsVal,
      reps: repsVal,
      weight: weightVal,
    };

    const updatedLogs = [...volumeLogs, newLog];
    setVolumeLogs(updatedLogs);
    localStorage.setItem('muscleGainVolume', JSON.stringify(updatedLogs));

    setSets('');
    setReps('');
    setVolumeWeight('');

    const totalVolume = setsVal * repsVal * weightVal;
    logToDatabase('volume', { total_volume_kg: totalVolume });
    alert(t('metrics.volume.logged', { lift, volume: totalVolume }));
  };

  // Toggle habit
  const toggleHabit = (habit: keyof Omit<DailyHabits, 'date'>) => {
    const newHabits = { ...todayHabits, [habit]: !todayHabits[habit] };
    setTodayHabits(newHabits);

    const updatedHabits = dailyHabits.filter(h => h.date !== today);
    updatedHabits.push({ date: today, ...newHabits });
    setDailyHabits(updatedHabits);
    localStorage.setItem('muscleGainHabits', JSON.stringify(updatedHabits));

    logToDatabase('habits', { habits: newHabits });
  };

  // Calculate total weekly volume
  const getTotalWeeklyVolume = () => {
    return volumeLogs.reduce((sum, log) => sum + (log.sets * log.reps * log.weight), 0);
  };

  // Calculate volume goal based on target weight
  const getVolumeGoal = () => {
    return growthProfile.targetWeight * 100;
  };

  // Calculate volume progress percentage
  const getVolumeProgressPercentage = () => {
    const goal = getVolumeGoal();
    if (goal === 0) return 0;
    return Math.min((getTotalWeeklyVolume() / goal) * 100, 100);
  };

  // Get volume status
  const getVolumeStatus = () => {
    const percentage = getVolumeProgressPercentage();
    if (percentage === 0) return { label: t('metrics.strength.statusLabels.setTarget'), color: 'gray' };
    if (percentage < 50) return { label: t('metrics.strength.statusLabels.building'), color: 'blue' };
    if (percentage < 90) return { label: t('metrics.strength.statusLabels.growth'), color: 'orange' };
    if (percentage >= 100) return { label: t('metrics.strength.statusLabels.hit'), color: 'red' };
    return { label: t('metrics.strength.statusLabels.growth'), color: 'orange' };
  };

  // Calculate gap to target
  const getGapToTarget = () => {
    const currentWeight = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1].weight : 0;
    const gap = growthProfile.targetWeight - currentWeight;
    return gap > 0 ? gap : 0;
  };

  // Calculate recovery score
  const getRecoveryScore = () => {
    return todayHabits.sleep && todayHabits.protein_met;
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
        habits: habitData || { surplus_met: false, protein_met: false, creatine: false, sleep: false, trained: false },
        completionCount: habitData ?
          (habitData.surplus_met ? 1 : 0) + (habitData.protein_met ? 1 : 0) +
          (habitData.creatine ? 1 : 0) + (habitData.sleep ? 1 : 0) + (habitData.trained ? 1 : 0) : 0
      });
    }
    return days;
  };

  const getVolumeStatusKey = (label: string) => {
    if (label === t('metrics.strength.statusLabels.setTarget')) return 'setTarget';
    if (label === t('metrics.strength.statusLabels.building')) return 'building';
    if (label === t('metrics.strength.statusLabels.growth')) return 'growth';
    if (label === t('metrics.strength.statusLabels.hit')) return 'hit';
    return 'growth';
  };

  // Database logging
  const logToDatabase = (action: string, data: any) => {
    logUserActivity('muscle_gain', action, { ...data, timestamp: new Date().toISOString() });
  };

  // Prepare chart data
  const chartData = bodyMetrics.map(metric => ({
    date: new Date(metric.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
    weight: metric.weight,
    chest: metric.chest,
    bicep: metric.bicep_r,
  }));

  const totalVolume = getTotalWeeklyVolume();
  const volumeGoal = getVolumeGoal();
  const volumePercentage = getVolumeProgressPercentage();
  const volumeStatus = getVolumeStatus();
  const gap = getGapToTarget();

  const exercises = useMemo(() => [
    t('exercises.squat'),
    t('exercises.deadlift'),
    t('exercises.benchPress'),
    t('exercises.overheadPress'),
    t('exercises.barbellRow'),
    t('exercises.pullUp'),
    t('exercises.chinUp'),
    t('exercises.latPulldown'),
    t('exercises.seatedCableRow'),
    t('exercises.dumbbellRow'),
    t('exercises.romanianDeadlift'),
    t('exercises.hipThrust'),
    t('exercises.lunge'),
    t('exercises.bulgarianSplitSquat'),
    t('exercises.legPress'),
    t('exercises.legExtension'),
    t('exercises.legCurl'),
    t('exercises.calfRaise'),
    t('exercises.gluteBridge'),
    t('exercises.pushUp'),
    t('exercises.inclineDumbbellPress'),
    t('exercises.dips'),
    t('exercises.chestFly'),
    t('exercises.lateralRaise'),
    t('exercises.rearDeltFly'),
    t('exercises.facePull'),
    t('exercises.bicepCurl'),
    t('exercises.hammerCurl'),
    t('exercises.tricepPushdown'),
    t('exercises.skullCrusher'),
    t('exercises.plank'),
    t('exercises.hangingLegRaise'),
    t('exercises.russianTwist'),
    t('exercises.farmerCarry'),
    t('exercises.shrug'),
    t('exercises.arnoldPress'),
    t('exercises.frontSquat'),
    t('exercises.sumoDeadlift'),
    t('exercises.gobletSquat'),
    t('exercises.stepUp'),
  ], [t]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-8">
      <div className="w-[1000px]">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('nav.back')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-2 lg:p-3">
              <Dumbbell className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'plan'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.plan')}
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'metrics'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.metrics')}
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'habits'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
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
              className="space-y-6"
            >
              {/* The 3 Pillars */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
                  <div className="bg-amber-500 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <Flame className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3">{t('plan.pillars.caloric.title')}</h3>
                  <p className="text-gray-700 mb-4">
                    <strong>{t('plan.pillars.caloric.value')}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('plan.pillars.caloric.desc')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
                  <div className="bg-orange-500 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <Scale className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3">{t('plan.pillars.protein.title')}</h3>
                  <p className="text-gray-700 mb-4">
                    <strong>{t('plan.pillars.protein.value')}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('plan.pillars.protein.desc')}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-200">
                  <div className="bg-red-500 rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3">{t('plan.pillars.overload.title')}</h3>
                  <p className="text-gray-700 mb-4">
                    <strong>{t('plan.pillars.overload.value')}</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    {t('plan.pillars.overload.desc')}
                  </p>
                </div>
              </div>

              {/* Meal Timing */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('plan.mealTiming.title')}</h3>
                <p className="text-gray-600 mb-8">
                  {t('plan.mealTiming.subtitle')}
                </p>

                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-amber-200 via-orange-300 to-amber-200"></div>

                  <div className="grid grid-cols-5 gap-4 relative">
                    <div className="text-center">
                      <div className="bg-gray-100 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-2">{t('plan.mealTiming.preWorkoutLong.time')}</p>
                        <p className="font-semibold text-gray-900">{t('plan.mealTiming.preWorkoutLong.title')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('plan.mealTiming.preWorkoutLong.desc')}</p>
                    </div>

                    <div className="text-center">
                      <div className="bg-amber-100 rounded-xl p-4 mb-4 border-2 border-amber-500">
                        <p className="text-xs text-amber-700 mb-2">{t('plan.mealTiming.preWorkoutCarbs.time')}</p>
                        <p className="font-semibold text-amber-900">{t('plan.mealTiming.preWorkoutCarbs.title')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('plan.mealTiming.preWorkoutCarbs.desc')}</p>
                    </div>

                    <div className="text-center">
                      <div className="bg-red-100 rounded-xl p-4 mb-4 border-2 border-red-500">
                        <p className="text-xs text-red-700 mb-2">{t('plan.mealTiming.training.time')}</p>
                        <p className="font-semibold text-red-900">{t('plan.mealTiming.training.title')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('plan.mealTiming.training.desc')}</p>
                    </div>

                    <div className="text-center">
                      <div className="bg-orange-100 rounded-xl p-4 mb-4 border-2 border-orange-500">
                        <p className="text-xs text-orange-700 mb-2">{t('plan.mealTiming.postWorkout.time')}</p>
                        <p className="font-semibold text-orange-900">{t('plan.mealTiming.postWorkout.title')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('plan.mealTiming.postWorkout.desc')}</p>
                    </div>

                    <div className="text-center">
                      <div className="bg-gray-100 rounded-xl p-4 mb-4">
                        <p className="text-xs text-gray-500 mb-2">{t('plan.mealTiming.eveningProtein.time')}</p>
                        <p className="font-semibold text-gray-900">{t('plan.mealTiming.eveningProtein.title')}</p>
                      </div>
                      <p className="text-sm text-gray-600">{t('plan.mealTiming.eveningProtein.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Principles */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">{t('plan.principles.title')}</h3>
                <div className="space-y-3">
                  <p className="flex items-start gap-2 text-gray-700">
                    <span className="text-amber-500 mt-1">✓</span>
                    <span><strong>{t('plan.principles.p1.title')}</strong> {t('plan.principles.p1.desc')}</span>
                  </p>
                  <p className="flex items-start gap-2 text-gray-700">
                    <span className="text-amber-500 mt-1">✓</span>
                    <span><strong>{t('plan.principles.p2.title')}</strong> {t('plan.principles.p2.desc')}</span>
                  </p>
                  <p className="flex items-start gap-2 text-gray-700">
                    <span className="text-amber-500 mt-1">✓</span>
                    <span><strong>{t('plan.principles.p3.title')}</strong> {t('plan.principles.p3.desc')}</span>
                  </p>
                  <p className="flex items-start gap-2 text-gray-700">
                    <span className="text-amber-500 mt-1">✓</span>
                    <span><strong>{t('plan.principles.p4.title')}</strong> {t('plan.principles.p4.desc')}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Strength Meter */}
              <div className={`rounded-2xl p-8 border-2 transition-all ${
                volumeStatus.color === 'gray'
                  ? 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300'
                  : volumeStatus.color === 'blue'
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
                  : volumeStatus.color === 'orange'
                  ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300'
                  : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {growthProfile.targetWeight > 0
                        ? t('metrics.strength.volumeTarget', { weight: growthProfile.targetWeight })
                        : t('metrics.strength.totalVolume')}
                    </h3>
                    <p className={`text-sm font-semibold ${
                      volumeStatus.color === 'gray' ? 'text-gray-600' :
                      volumeStatus.color === 'blue' ? 'text-blue-700' :
                      volumeStatus.color === 'orange' ? 'text-orange-700' :
                      'text-red-700'
                    }`}>
                      {t(`metrics.strength.statusLabels.${getVolumeStatusKey(volumeStatus.label)}`)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-4xl font-bold ${
                      volumeStatus.color === 'gray' ? 'text-gray-600' :
                      volumeStatus.color === 'blue' ? 'text-blue-600' :
                      volumeStatus.color === 'orange' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {totalVolume.toLocaleString()}
                    </p>
                     <p className="text-sm text-gray-500">{t('metrics.strength.kgLifted')}</p>
                  </div>
                </div>

                {/* Strength Meter */}
                {growthProfile.targetWeight > 0 && (
                  <>
                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className={`absolute inset-y-0 left-0 ${
                          volumeStatus.color === 'blue'
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                            : volumeStatus.color === 'orange'
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                            : volumeStatus.color === 'red'
                            ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse'
                            : 'bg-gray-400'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${volumePercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {t('metrics.strength.goal', { percent: volumePercentage.toFixed(0), goal: volumeGoal.toLocaleString() })}
                        </span>
                      </div>
                    </div>
                    {gap > 0 && (
                      <p className="text-sm text-gray-600 text-center">
                        {t('metrics.strength.awayFromTarget', { gap: gap.toFixed(1) })}
                      </p>
                    )}
                  </>
                )}

                {growthProfile.targetWeight === 0 && (
                  <div className="bg-gray-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-600">{t('metrics.strength.setTarget')}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Body Metrics Form */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('metrics.form.title')}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('metrics.form.currentWeight')}</label>
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.form.placeholders.weight')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-amber-700 mb-2">
                          {t('metrics.form.targetWeight')}
                          <span className="text-xs text-gray-500 block">{t('metrics.form.targetWeightHint')}</span>
                        </label>
                        <input
                          type="number"
                          value={targetWeight}
                          onChange={(e) => setTargetWeight(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-amber-50"
                          placeholder={t('metrics.form.placeholders.targetWeight')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('metrics.form.chest')}
                          <span className="text-xs text-gray-500 block">{t('metrics.form.chestHint')}</span>
                        </label>
                        <input
                          type="number"
                          value={chest}
                          onChange={(e) => setChest(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.form.placeholders.chest')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('metrics.form.waist')}
                          <span className="text-xs text-gray-500 block">{t('metrics.form.waistHint')}</span>
                        </label>
                        <input
                          type="number"
                          value={waist}
                          onChange={(e) => setWaist(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.form.placeholders.waist')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('metrics.form.bicepR')}
                          <span className="text-xs text-gray-500 block">{t('metrics.form.bicepRHint')}</span>
                        </label>
                        <input
                          type="number"
                          value={bicepR}
                          onChange={(e) => setBicepR(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.form.placeholders.bicep')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('metrics.form.bicepL')}
                          <span className="text-xs text-gray-500 block">{t('metrics.form.bicepLHint')}</span>
                        </label>
                        <input
                          type="number"
                          value={bicepL}
                          onChange={(e) => setBicepL(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.form.placeholders.bicepL')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('metrics.form.thigh')}
                          <span className="text-xs text-gray-500 block">{t('metrics.form.thighHint')}</span>
                        </label>
                        <input
                          type="number"
                          value={thigh}
                          onChange={(e) => setThigh(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.form.placeholders.thigh')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="text-transparent">Placeholder</span>
                          <span className="text-xs text-transparent block">-</span>
                        </label>
                        <div className="h-[52px]"></div>
                      </div>
                    </div>

                    <button
                      onClick={addMetrics}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {t('metrics.form.submit')}
                    </button>
                  </div>
                </div>

                {/* Volume Calculator */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('metrics.volume.title')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('metrics.volume.exercise')}</label>
                      <select
                        value={lift}
                        onChange={(e) => setLift(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        {exercises.map(ex => (
                          <option key={ex} value={ex}>{ex}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('metrics.volume.sets')}</label>
                        <input
                          type="number"
                          value={sets}
                          onChange={(e) => setSets(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.volume.placeholders.sets')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('metrics.volume.reps')}</label>
                        <input
                          type="number"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.volume.placeholders.reps')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('metrics.volume.weight')}</label>
                        <input
                          type="number"
                          value={volumeWeight}
                          onChange={(e) => setVolumeWeight(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          placeholder={t('metrics.volume.placeholders.weight')}
                        />
                      </div>
                    </div>

                    {sets && reps && volumeWeight && (
                      <div className="space-y-3">
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                          <p className="text-sm text-gray-600 mb-1">{t('metrics.volume.totalVolume')}</p>
                          <p className="text-3xl font-bold text-amber-600">
                            {(parseInt(sets) * parseInt(reps) * parseFloat(volumeWeight)).toLocaleString()} kg
                          </p>
                        </div>
                        {growthProfile.targetWeight > 0 && (
                          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                            <p className="text-sm text-gray-600 mb-1">{t('metrics.volume.remaining')}</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {Math.max(0, volumeGoal - totalVolume - (parseInt(sets) * parseInt(reps) * parseFloat(volumeWeight))).toLocaleString()} kg
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={addVolume}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <Calculator className="w-5 h-5" />
                      {t('metrics.volume.submit')}
                    </button>
                  </div>

                  {/* Recent Volume Logs */}
                  {volumeLogs.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('metrics.volume.recentLifts')}</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {volumeLogs.slice(-5).reverse().map((log, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-medium text-gray-900">{log.lift}</span>
                            <span className="text-gray-600">
                              {log.sets}×{log.reps} @ {log.weight}kg
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Growth Chart */}
              {chartData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
                >
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('metrics.chart.title')}</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#F59E0B" strokeWidth={3} name={t('metrics.chart.weight')} />
                        <Line yAxisId="right" type="monotone" dataKey="chest" stroke="#EF4444" strokeWidth={3} name={t('metrics.chart.chest')} />
                        <Line yAxisId="right" type="monotone" dataKey="bicep" stroke="#EC4899" strokeWidth={3} name={t('metrics.chart.bicep')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
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
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Recovery Score */}
              <div className={`rounded-2xl p-8 border-2 transition-all ${
                getRecoveryScore()
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-500'
                  : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">{t('habits.recovery.title')}</h3>
                    <p className="text-gray-600">
                      {getRecoveryScore()
                        ? t('habits.recovery.goodDesc')
                        : t('habits.recovery.improveDesc')}
                    </p>
                  </div>
                  <div className={`text-6xl font-bold ${
                    getRecoveryScore() ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {getRecoveryScore() ? '✓' : '—'}
                  </div>
                </div>
              </div>

              {/* Daily Habits Checklist */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('habits.title')}</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {t('habits.subtitle')}
                </p>

                <div className="space-y-4">
                  <HypertrophyCheckbox
                    checked={todayHabits.surplus_met}
                    onChange={() => toggleHabit('surplus_met')}
                    icon={<Flame className="w-6 h-6" />}
                    label={t('habits.items.surplus.title')}
                    description={t('habits.items.surplus.desc')}
                    color="amber"
                  />

                  <HypertrophyCheckbox
                    checked={todayHabits.protein_met}
                    onChange={() => toggleHabit('protein_met')}
                    icon={<Scale className="w-6 h-6" />}
                    label={t('habits.items.protein.title')}
                    description={t('habits.items.protein.desc')}
                    color="orange"
                  />

                  <HypertrophyCheckbox
                    checked={todayHabits.creatine}
                    onChange={() => toggleHabit('creatine')}
                    icon={<Droplets className="w-6 h-6" />}
                    label={t('habits.items.creatine.title')}
                    description={t('habits.items.creatine.desc')}
                    color="cyan"
                  />

                  <HypertrophyCheckbox
                    checked={todayHabits.sleep}
                    onChange={() => toggleHabit('sleep')}
                    icon={<Moon className="w-6 h-6" />}
                    label={t('habits.items.sleep.title')}
                    description={t('habits.items.sleep.desc')}
                    color="purple"
                  />

                  <HypertrophyCheckbox
                    checked={todayHabits.trained}
                    onChange={() => toggleHabit('trained')}
                    icon={<Zap className="w-6 h-6" />}
                    label={t('habits.items.trained.title')}
                    description={t('habits.items.trained.desc')}
                    color="red"
                  />
                </div>
              </div>

              {/* 30-Day Habit Log */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-6">{t('habits.calendar.title')}</h3>
                <div className="grid grid-cols-6 lg:grid-cols-10 gap-2">
                  {getLast30DaysHabits().map((day) => {
                    const isToday = day.date === today;
                    const completionPercentage = (day.completionCount / 5) * 100;

                    return (
                      <div
                        key={day.date}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center transition-all ${
                          isToday
                            ? 'ring-2 ring-amber-500 ring-offset-2'
                            : ''
                        } ${
                          completionPercentage === 100
                            ? 'bg-amber-500 text-white'
                            : completionPercentage >= 80
                            ? 'bg-orange-400 text-white'
                            : completionPercentage >= 60
                            ? 'bg-orange-300 text-gray-900'
                            : completionPercentage >= 40
                            ? 'bg-yellow-400 text-gray-900'
                            : completionPercentage > 0
                            ? 'bg-yellow-300 text-gray-900'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                        title={t('habits.calendar.tooltip', { day: day.dayNum, count: day.completionCount })}
                      >
                        <span className="text-xs font-bold">{day.dayNum}</span>
                        <span className="text-xs">{day.completionCount}/5</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-100"></div>
                    <span>{t('habits.calendar.legend.none')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-300"></div>
                    <span>1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-400"></div>
                    <span>2-3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-300"></div>
                    <span>3-4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-400"></div>
                    <span>4</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500"></div>
                    <span>{t('habits.calendar.legend.perfect')}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">{t('essentials.title')}</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">💪</span>
                    <span><strong>{t('essentials.tips.rest.title')}</strong> {t('essentials.tips.rest.desc')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">🍖</span>
                    <span><strong>{t('essentials.tips.protein.title')}</strong> {t('essentials.tips.protein.desc')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">📈</span>
                    <span><strong>{t('essentials.tips.track.title')}</strong> {t('essentials.tips.track.desc')}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">⚡</span>
                    <span><strong>{t('essentials.tips.creatine.title')}</strong> {t('essentials.tips.creatine.desc')}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HypertrophyCheckbox({
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
    amber: 'border-amber-500 bg-amber-50',
    orange: 'border-orange-500 bg-orange-50',
    cyan: 'border-cyan-500 bg-cyan-50',
    purple: 'border-purple-500 bg-purple-50',
    red: 'border-red-500 bg-red-50',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onChange}
      className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
        checked ? colorClasses[color as keyof typeof colorClasses] : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-3 rounded-xl ${checked ? `bg-${color}-100` : 'bg-gray-100'}`}>
            <div className={checked ? `text-${color}-600` : 'text-gray-400'}>
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
          checked ? `border-${color}-500 bg-${color}-500` : 'border-gray-300'
        }`}>
          {checked && <Check className="w-5 h-5 text-white" />}
        </div>
      </div>
    </motion.div>
  );
}