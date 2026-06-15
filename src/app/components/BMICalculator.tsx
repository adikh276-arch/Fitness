import { useState, useEffect } from 'react';
import { ArrowLeft, Scale, TrendingUp, Activity, Info, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/lib/userContext';
import { useTranslation } from 'react-i18next';
import { logUserActivity, fetchUserActivityLogs } from '@/lib/db';

interface BMIRecord {
  id: string;
  date: string;
  weight: number;
  height: number;
  bmi: number;
  waist?: number;
  whtr?: number;
  unit: 'metric' | 'imperial';
  timestamp: string;
}

type TabType = 'calculator' | 'context' | 'history';

export default function BMICalculator({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('BMICalculator');
  const { profile, updateProfile } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = useState<'cm' | 'in'>('cm');
  const [height, setHeight] = useState(profile.height_cm ? profile.height_cm.toString() : '');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState(profile.weight_kg ? profile.weight_kg.toString() : '');
  const [waist, setWaist] = useState('');
  const [bmiRecords, setBMIRecords] = useState<BMIRecord[]>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Load data from localStorage and DB
  useEffect(() => {
    const saved = localStorage.getItem('bmiRecords');
    if (saved) {
      setBMIRecords(JSON.parse(saved));
    }

    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('bmi_calculator');
      const records = dbLogs
        .filter(log => log.action_type === 'calculate_bmi')
        .map(log => {
          const p = log.payload;
          const unit = p.system_used || 'metric';
          return {
            id: log.id.toString(),
            date: new Date(p.timestamp).toLocaleDateString(),
            weight: unit === 'metric' ? p.weight_kg : p.weight_kg / 0.453592,
            height: p.height_cm,
            bmi: p.bmi_score,
            waist: p.waist_cm ? (unit === 'metric' ? p.waist_cm : p.waist_cm / 2.54) : undefined,
            whtr: p.whtr_score || undefined,
            unit: unit,
            timestamp: p.timestamp
          } as BMIRecord;
        });
      if (records.length > 0) {
        setBMIRecords(records);
      }
    };
    loadDbLogs();
  }, []);

  // Update local state when profile changes (from other components)
  useEffect(() => {
    if (profile.height_cm && !height) setHeight(profile.height_cm.toString());
    if (profile.weight_kg && !weight) setWeight(profile.weight_kg.toString());
  }, [profile, height, weight]);

  // Calculate BMI
  const calculateBMI = (): number | null => {
    const w = parseFloat(weight);

    if (!w || w <= 0) return null;

    // Convert height to meters
    let heightInMeters: number;
    if (heightUnit === 'cm') {
      const h = parseFloat(height);
      if (!h || h <= 0) return null;
      heightInMeters = h / 100;
    } else {
      // feet and inches to meters
      const ft = parseFloat(heightFeet);
      const inch = parseFloat(heightInches);
      if (!ft || ft <= 0) return null;
      const totalInches = (ft * 12) + (inch || 0);
      heightInMeters = totalInches * 0.0254;
    }

    // Convert weight to kg
    let weightInKg: number;
    if (weightUnit === 'kg') {
      weightInKg = w;
    } else {
      // lbs to kg
      weightInKg = w * 0.453592;
    }

    // BMI = weight (kg) / height (m)²
    return weightInKg / (heightInMeters * heightInMeters);
  };

  // Calculate Waist-to-Height Ratio
  const calculateWHtR = (): number | null => {
    const w = parseFloat(waist);

    if (!w || w <= 0) return null;

    // Convert both to same unit (cm) for ratio
    let heightInCm: number;
    if (heightUnit === 'cm') {
      const h = parseFloat(height);
      if (!h || h <= 0) return null;
      heightInCm = h;
    } else {
      // feet and inches to cm
      const ft = parseFloat(heightFeet);
      const inch = parseFloat(heightInches);
      if (!ft || ft <= 0) return null;
      const totalInches = (ft * 12) + (inch || 0);
      heightInCm = totalInches * 2.54;
    }

    let waistInCm: number;
    if (waistUnit === 'cm') {
      waistInCm = w;
    } else {
      // inches to cm
      waistInCm = w * 2.54;
    }

    return waistInCm / heightInCm;
  };

  const bmi = calculateBMI();
  const whtr = calculateWHtR();

  // Get BMI category
  const getBMICategory = (bmiValue: number | null): { label: string; color: string; bgColor: string } => {
    if (!bmiValue) return { label: t('calculator.results.categories.enterData'), color: 'text-gray-500', bgColor: 'bg-gray-100' };
    if (bmiValue < 18.5) return { label: t('calculator.results.categories.underweight'), color: 'text-blue-700', bgColor: 'bg-blue-100' };
    if (bmiValue < 25) return { label: t('calculator.results.categories.healthy'), color: 'text-emerald-700', bgColor: 'bg-emerald-100' };
    if (bmiValue < 30) return { label: t('calculator.results.categories.overweight'), color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    return { label: t('calculator.results.categories.obese'), color: 'text-red-700', bgColor: 'bg-red-100' };
  };

  // Get WHtR status
  const getWHtRStatus = (whtrValue: number | null): { label: string; color: string; icon: React.ReactNode } => {
    if (!whtrValue) return { label: t('beyond.results.waistMeasurementPlaceholder'), color: 'text-gray-500', icon: <Info className="w-5 h-5" /> };
    if (whtrValue < 0.5) return { label: t('beyond.results.healthy'), color: 'text-emerald-700', icon: <Check className="w-5 h-5" /> };
    return { label: t('beyond.results.elevated'), color: 'text-orange-700', icon: <AlertCircle className="w-5 h-5" /> };
  };

  // Save BMI record
  const saveBMIRecord = () => {
    if (!bmi || !weight) return;

    // Check if we have valid height data
    if (heightUnit === 'cm' && !height) return;
    if (heightUnit === 'ft' && !heightFeet) return;

    // Determine primary unit based on weight unit
    const primaryUnit = weightUnit === 'kg' ? 'metric' : 'imperial';

    // Store height in a consistent format (convert to cm for storage)
    let heightForStorage: number;
    if (heightUnit === 'cm') {
      heightForStorage = parseFloat(height);
    } else {
      const ft = parseFloat(heightFeet);
      const inch = parseFloat(heightInches) || 0;
      const totalInches = (ft * 12) + inch;
      heightForStorage = totalInches * 2.54; // convert to cm for storage
    }

    const newRecord: BMIRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      weight: parseFloat(weight),
      height: heightForStorage,
      bmi: bmi,
      waist: waist ? parseFloat(waist) : undefined,
      whtr: whtr || undefined,
      unit: primaryUnit,
      timestamp: new Date().toISOString(),
    };

    const updatedRecords = [...bmiRecords, newRecord];
    setBMIRecords(updatedRecords);
    localStorage.setItem('bmiRecords', JSON.stringify(updatedRecords));

    // Update centralized profile so other trackers get the new data
    updateProfile({
      weight_kg: newRecord.unit === 'metric' ? newRecord.weight : newRecord.weight * 0.453592,
      height_cm: newRecord.height,
    });

    // Log to database (console for now)
    logToDatabase(newRecord);

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const logToDatabase = (record: BMIRecord) => {
    const dbPayload = {
      tool: 'bmi_tracker',
      system_used: record.unit,
      height_cm: record.height, // already stored in cm
      weight_kg: record.unit === 'metric' ? record.weight : record.weight * 0.453592,
      bmi_score: record.bmi,
      waist_cm: record.waist ? (waistUnit === 'cm' ? record.waist : record.waist * 2.54) : null,
      whtr_score: record.whtr || null,
      timestamp: record.timestamp,
    };
    logUserActivity('bmi_calculator', 'calculate_bmi', dbPayload);
  };

  // Check for healthy streak
  const getHealthyStreak = (): number => {
    let streak = 0;
    for (let i = bmiRecords.length - 1; i >= 0; i--) {
      if (bmiRecords[i].bmi >= 18.5 && bmiRecords[i].bmi < 25) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const category = getBMICategory(bmi);
  const whtrStatus = getWHtRStatus(whtr);
  const healthyStreak = getHealthyStreak();

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
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-2 lg:p-3">
              <Scale className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Healthy Streak Banner */}
        {healthyStreak >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 lg:mb-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 lg:p-5 flex items-center gap-3 shadow-lg"
          >
            <div className="bg-white rounded-full p-2">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base lg:text-lg">{t('streak.title')}</h3>
              <p className="text-white/90 text-sm">{t('streak.subtitle', { count: healthyStreak })}</p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.calculator')}
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'context'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.context')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.history')}
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Calculator Tab */}
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="mb-6 lg:mb-8">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900">{t('calculator.title')}</h3>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('calculator.inputs.height')}
                      </label>
                      <select
                        value={heightUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value as 'cm' | 'ft';
                          setHeightUnit(newUnit);
                          setWaistUnit(newUnit === 'cm' ? 'cm' : 'in');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium bg-white cursor-pointer"
                      >
                        <option value="cm">cm</option>
                        <option value="ft">feet</option>
                      </select>
                    </div>
                    {heightUnit === 'cm' ? (
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                        placeholder={t('calculator.inputs.placeholders.heightCm')}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(e.target.value)}
                          className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                          placeholder={t('calculator.inputs.placeholders.heightFt')}
                        />
                        <input
                          type="number"
                          value={heightInches}
                          onChange={(e) => setHeightInches(e.target.value)}
                          className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                          placeholder={t('calculator.inputs.placeholders.heightIn')}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('calculator.inputs.weight')}
                      </label>
                      <select
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lbs')}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium bg-white cursor-pointer"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                      placeholder={weightUnit === 'kg' ? t('calculator.inputs.placeholders.weightKg') : t('calculator.inputs.placeholders.weightLbs')}
                    />
                  </div>
                </div>

                {/* BMI Result Display */}
                {bmi ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 lg:mb-8"
                  >
                    {/* BMI Value */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-600 mb-2">{t('calculator.results.yourBMI')}</p>
                      <div className="text-6xl lg:text-7xl font-bold mb-3" style={{
                        color: bmi < 18.5 ? '#3B82F6' : bmi < 25 ? '#10B981' : bmi < 30 ? '#F59E0B' : '#EF4444'
                      }}>
                        {bmi.toFixed(1)}
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-full ${category.bgColor} ${category.color} font-semibold text-sm`}>
                        {category.label}
                      </div>
                    </div>

                    {/* Gradient Bar with Indicator */}
                    <div className="mb-6">
                      <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-400 via-green-500 via-yellow-500 to-red-500 mb-4">
                        {/* Position indicator */}
                        <motion.div
                          initial={{ left: '0%' }}
                          animate={{ left: `${Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100))}%` }}
                          transition={{ type: 'spring', stiffness: 60, damping: 10 }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full border-4 border-gray-800 shadow-lg"
                        />
                      </div>

                      {/* Category Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-semibold text-blue-900">{t('calculator.results.categories.underweight')}</span>
                          </div>
                          <p className="text-xs text-blue-700">&lt; 18.5</p>
                        </div>
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-xs font-semibold text-green-900">{t('calculator.results.categories.normal')}</span>
                          </div>
                          <p className="text-xs text-green-700">18.5 - 24.9</p>
                        </div>
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-xs font-semibold text-yellow-900">{t('calculator.results.categories.overweight')}</span>
                          </div>
                          <p className="text-xs text-yellow-700">25.0 - 29.9</p>
                        </div>
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-xs font-semibold text-red-900">{t('calculator.results.categories.obese')}</span>
                          </div>
                          <p className="text-xs text-red-700">&ge; 30.0</p>
                        </div>
                      </div>
                    </div>

                    {/* Health Tip */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <p className="text-sm text-gray-700">
                        {t('calculator.tip')}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-lg mb-6 lg:mb-8">
                    {t('calculator.results.placeholder')}
                  </div>
                )}

                {/* Save Button */}
                {bmi && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={saveBMIRecord}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 mb-4"
                  >
                    <Check className="w-5 h-5" />
                    {t('calculator.results.submit')}
                  </motion.button>
                )}

                {/* Success Message */}
                <AnimatePresence>
                  {showSaveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 text-center mb-4"
                    >
                      <p className="text-emerald-700 font-medium text-sm">{t('calculator.results.success')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Medical Disclaimer */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium mb-1">{t('calculator.disclaimer.title')}</p>
                      <p className="text-xs text-blue-800">
                        {t('calculator.disclaimer.text')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Beyond BMI Tab */}
          {activeTab === 'context' && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">
                  {t('beyond.title')}
                </h3>

                {/* Educational Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 lg:p-6 border border-emerald-200 mb-6 lg:mb-8">
                  <div className="flex items-start gap-3">
                    <Activity className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-base font-bold text-emerald-900 mb-2">{t('beyond.why.title')}</h4>
                      <p className="text-sm text-emerald-800 mb-3">
                        {t('beyond.why.desc')}
                      </p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {t('beyond.why.target')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Height & Waist Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
                  {/* Height Input (synced with BMI tab) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('calculator.inputs.height')}
                      </label>
                      <select
                        value={heightUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value as 'cm' | 'ft';
                          setHeightUnit(newUnit);
                          setWaistUnit(newUnit === 'cm' ? 'cm' : 'in');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium bg-white cursor-pointer"
                      >
                        <option value="cm">cm</option>
                        <option value="ft">feet</option>
                      </select>
                    </div>
                    {heightUnit === 'cm' ? (
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                        placeholder={t('calculator.inputs.placeholders.heightCm')}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={heightFeet}
                          onChange={(e) => setHeightFeet(e.target.value)}
                          className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                          placeholder={t('calculator.inputs.placeholders.heightFt')}
                        />
                        <input
                          type="number"
                          value={heightInches}
                          onChange={(e) => setHeightInches(e.target.value)}
                          className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                          placeholder={t('calculator.inputs.placeholders.heightIn')}
                        />
                      </div>
                    )}
                  </div>

                  {/* Waist Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('beyond.inputs.waist')}
                      </label>
                      <select
                        value={waistUnit}
                        onChange={(e) => setWaistUnit(e.target.value as 'cm' | 'in')}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-medium bg-white cursor-pointer"
                      >
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                      </select>
                    </div>
                    <input
                      type="number"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-lg"
                      placeholder={waistUnit === 'cm' ? t('beyond.inputs.placeholders.waistCm') : t('beyond.inputs.placeholders.waistIn')}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('beyond.inputs.waistHint')}
                    </p>
                  </div>
                </div>

                {/* WHtR Result */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`rounded-xl p-6 lg:p-8 mb-6 ${
                    whtr && whtr < 0.5 ? 'bg-emerald-50 border-2 border-emerald-300' :
                    whtr ? 'bg-orange-50 border-2 border-orange-300' :
                    'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  <div className="text-center">
                    {whtr ? (
                      <>
                        <div className={`inline-flex items-center gap-2 mb-4 ${whtrStatus.color}`}>
                          {whtrStatus.icon}
                          <span className="text-xl font-bold">{whtrStatus.label}</span>
                        </div>
                        <div className="text-5xl lg:text-6xl font-bold mb-2" style={{ color: whtr < 0.5 ? '#059669' : '#D97706' }}>
                          {whtr.toFixed(3)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {t('beyond.results.label')}
                        </p>
                        {/* Calculation Formula */}
                        <div className="bg-white/60 rounded-lg px-4 py-2 inline-block">
                          <p className="text-xs text-gray-600 font-mono">
                            {waistUnit === 'cm' ? (
                              `${waist}cm ÷ ${heightUnit === 'cm' ? height : `${(parseFloat(heightFeet || '0') * 12 + parseFloat(heightInches || '0')) * 2.54}`}cm = ${whtr.toFixed(3)}`
                            ) : (
                              `${waist}in ÷ ${heightUnit === 'cm' ? (parseFloat(height) / 2.54).toFixed(1) : `${parseFloat(heightFeet || '0') * 12 + parseFloat(heightInches || '0')}`}in = ${whtr.toFixed(3)}`
                            )}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl lg:text-6xl font-bold text-gray-300 mb-2">
                          --
                        </div>
                        <p className="text-sm text-gray-500">
                          {t('beyond.results.placeholder')}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Save Button for WHtR */}
                {whtr && bmi && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={saveBMIRecord}
                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 mb-6"
                  >
                    <Check className="w-5 h-5" />
                    {t('beyond.results.submit')}
                  </motion.button>
                )}

                {/* Success Message */}
                <AnimatePresence>
                  {showSaveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3 text-center mb-6"
                    >
                      <p className="text-emerald-700 font-medium text-sm">{t('calculator.results.success')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Comparison Chart */}
                <div className="mt-6 lg:mt-8 bg-gray-50 rounded-xl p-4 lg:p-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('beyond.comparison.title')}</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('beyond.comparison.bmi.title')}</p>
                        <p className="text-xs text-gray-600">{t('beyond.comparison.bmi.desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('beyond.comparison.whtr.title')}</p>
                        <p className="text-xs text-gray-600">{t('beyond.comparison.whtr.desc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {bmiRecords.length > 0 ? (
                <>
                  {/* BMI Progress Cards */}
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('history.title')}</h3>
                    <div className="space-y-3">
                      {bmiRecords.slice(-8).reverse().map((record, index) => {
                        const cat = getBMICategory(record.bmi);
                        const isHealthy = record.bmi >= 18.5 && record.bmi < 25;
                        return (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl border-2 ${
                              isHealthy ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-xl ${cat.bgColor} flex items-center justify-center`}>
                              <span className={`text-lg lg:text-xl font-bold ${cat.color}`}>
                                {record.bmi.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm lg:text-base font-semibold text-gray-900">{record.date}</span>
                                {isHealthy && <Check className="w-4 h-4 text-emerald-600" />}
                              </div>
                              <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                                <span>{record.weight} {record.unit === 'metric' ? 'kg' : 'lbs'}</span>
                                <span className="text-gray-400">•</span>
                                <span className={`font-medium ${cat.color}`}>{cat.label}</span>
                              </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="hidden lg:block flex-shrink-0 w-32">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    record.bmi < 18.5 ? 'bg-blue-500' :
                                    record.bmi < 25 ? 'bg-emerald-500' :
                                    record.bmi < 30 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, (record.bmi / 40) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('history.stats.title')}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
                        <div className="text-xs text-emerald-700 font-medium mb-1">{t('history.stats.total')}</div>
                        <div className="text-2xl font-bold text-emerald-900">{bmiRecords.length}</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                        <div className="text-xs text-blue-700 font-medium mb-1">{t('history.stats.latest')}</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {bmiRecords.length > 0 ? bmiRecords[bmiRecords.length - 1].bmi.toFixed(1) : '-'}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                        <div className="text-xs text-purple-700 font-medium mb-1">{t('history.stats.healthyCount')}</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {bmiRecords.filter(r => r.bmi >= 18.5 && r.bmi < 25).length}
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                        <div className="text-xs text-orange-700 font-medium mb-1">{t('history.stats.bestStreak')}</div>
                        <div className="text-2xl font-bold text-orange-900">{healthyStreak}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 border border-gray-200 shadow-sm text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('history.noHistory')}</h3>
                  <p className="text-sm text-gray-500 mb-6">
                    {t('history.noHistoryDesc')}
                  </p>
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg"
                  >
                    {t('tabs.calculator')}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
