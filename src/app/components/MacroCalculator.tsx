import { useState, useEffect } from 'react';
import { ArrowLeft, Scale, User, Ruler, Activity, Target, Save } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useUser } from '@/lib/userContext';
import { useTranslation } from 'react-i18next';

interface MacroResults {
  bmr: number;
  tdee: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_kcal: number;
  carbs_kcal: number;
  fat_kcal: number;
}

type Gender = 'male' | 'female';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very';
type Goal = 'maintenance' | 'loss' | 'gain';
type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ft';

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

const macroSplits = {
  maintenance: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  loss: { protein: 0.40, carbs: 0.35, fat: 0.25 },
  gain: { protein: 0.35, carbs: 0.45, fat: 0.20 },
};

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

export default function MacroCalculator({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation('MacroCalculator');
  const { profile, updateProfile } = useUser();
  const [currentTab, setCurrentTab] = useState<'input' | 'results'>('input');
  const [age, setAge] = useState(profile.age ? profile.age.toString() : '');
  const [gender, setGender] = useState<Gender>((profile.gender as Gender) || 'male');
  const [weight, setWeight] = useState(profile.weight_kg ? profile.weight_kg.toString() : '');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [heightCm, setHeightCm] = useState(profile.height_cm ? profile.height_cm.toString() : '');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>((profile.activity_level as ActivityLevel) || 'moderate');
  const [goal, setGoal] = useState<Goal>((profile.goal as Goal) || 'maintenance');
  const [results, setResults] = useState<MacroResults | null>(null);

  // Sync state if profile loads dynamically
  useEffect(() => {
    if (profile.age && !age) setAge(profile.age.toString());
    if (profile.weight_kg && !weight) setWeight(profile.weight_kg.toString());
    if (profile.height_cm && !heightCm) setHeightCm(profile.height_cm.toString());
    if (profile.gender) setGender(profile.gender as Gender);
    if (profile.activity_level) setActivityLevel(profile.activity_level as ActivityLevel);
    if (profile.goal) setGoal(profile.goal as Goal);
  }, [profile, age, weight, heightCm]);

  const calculateMacros = () => {
    // Convert to metric
    let weightKg = parseFloat(weight);
    let heightCmVal = parseFloat(heightCm);

    if (weightUnit === 'lbs') {
      weightKg = parseFloat(weight) * 0.453592; // lbs to kg
    }

    if (heightUnit === 'ft') {
      const totalInches = (parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0);
      heightCmVal = totalInches * 2.54; // inches to cm
    }

    const ageVal = parseFloat(age);

    // Validation
    if (!ageVal || !weightKg || !heightCmVal || ageVal < 10 || ageVal > 120 || weightKg < 20 || weightKg > 300 || heightCmVal < 100 || heightCmVal > 250) {
      alert(t('results.validation'));
      return;
    }

    // Calculate BMR using Mifflin-St Jeor
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCmVal - 5 * ageVal + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCmVal - 5 * ageVal - 161;
    }

    // Calculate TDEE
    const tdee = bmr * activityFactors[activityLevel];

    // Calculate macros based on goal
    const split = macroSplits[goal];
    const protein_kcal = tdee * split.protein;
    const carbs_kcal = tdee * split.carbs;
    const fat_kcal = tdee * split.fat;

    // Convert kcal to grams (protein/carbs = 4 kcal/g, fat = 9 kcal/g)
    const protein_g = protein_kcal / 4;
    const carbs_g = carbs_kcal / 4;
    const fat_g = fat_kcal / 9;

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      protein_g: Math.round(protein_g),
      carbs_g: Math.round(carbs_g),
      fat_g: Math.round(fat_g),
      protein_kcal: Math.round(protein_kcal),
      carbs_kcal: Math.round(carbs_kcal),
      fat_kcal: Math.round(fat_kcal),
    });

    setCurrentTab('results');
  };

  const saveToProfile = () => {
    if (!results) return;

    const weightKg = weightUnit === 'kg' ? parseFloat(weight) : parseFloat(weight) * 0.453592;
    const heightCmVal = heightUnit === 'cm'
      ? parseFloat(heightCm)
      : ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;

    const profileData = {
      user_id: 'user_123', // Placeholder
      age: parseInt(age),
      gender,
      weight_kg: Math.round(weightKg * 10) / 10,
      height_cm: Math.round(heightCmVal * 10) / 10,
      activity_level: activityLevel,
      goal,
      tdee_kcal: results.tdee,
      protein_g: results.protein_g,
      carbs_g: results.carbs_g,
      fat_g: results.fat_g,
      created_at: new Date().toISOString(),
    };

    updateProfile({
      weight_kg: profileData.weight_kg,
      height_cm: profileData.height_cm,
      age: profileData.age,
      gender: profileData.gender,
      activity_level: profileData.activity_level,
      goal: profileData.goal,
    });

    console.log('Save to Profile - User Macros Data:', JSON.stringify(profileData, null, 2));
    alert(t('results.success'));
  };

  const chartData = results ? [
    { name: t('results.protein'), value: results.protein_g, kcal: results.protein_kcal },
    { name: t('results.carbs'), value: results.carbs_g, kcal: results.carbs_kcal },
    { name: t('results.fat'), value: results.fat_g, kcal: results.fat_kcal },
  ] : [];

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

        {/* Tab Navigation - Mobile Only */}
        <div className="lg:hidden bg-white rounded-xl p-1 inline-flex gap-1 mb-6 border border-gray-200 w-full">
          <button
            onClick={() => setCurrentTab('input')}
            className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm ${
              currentTab === 'input'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('tabs.input')}
          </button>
          <button
            onClick={() => setCurrentTab('results')}
            className={`flex-1 px-4 py-2 rounded-lg transition-all text-sm ${
              currentTab === 'results'
                ? 'bg-teal-500 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('tabs.results')}
          </button>
        </div>

        {/* Two Column Layout - Desktop | Single Column - Mobile */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Input Form */}
          <div className={`bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm ${currentTab === 'results' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('form.title')}</h2>

            {/* Age */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                {t('form.age')}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t('form.placeholders.age')}
                min="10"
                max="120"
                className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
              />
            </div>

            {/* Gender */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('form.gender')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGender('male')}
                  className={`px-4 py-2.5 lg:py-3 rounded-xl border transition-all text-sm lg:text-base ${
                    gender === 'male'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('form.male')}
                </button>
                <button
                  onClick={() => setGender('female')}
                  className={`px-4 py-2.5 lg:py-3 rounded-xl border transition-all text-sm lg:text-base ${
                    gender === 'female'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('form.female')}
                </button>
              </div>
            </div>

            {/* Weight */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scale className="w-4 h-4 inline mr-2" />
                {t('form.weight')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={weightUnit === 'kg' ? t('form.placeholders.weightKg') : t('form.placeholders.weightLbs')}
                  min="20"
                  max={weightUnit === 'kg' ? '300' : '660'}
                  className="col-span-2 px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
                  className="px-3 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Height */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Ruler className="w-4 h-4 inline mr-2" />
                {t('form.height')}
              </label>
              {heightUnit === 'cm' ? (
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder={t('form.placeholders.heightCm')}
                    min="100"
                    max="250"
                    className="col-span-2 px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                  />
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as HeightUnit)}
                    className="px-3 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                  >
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                      placeholder={t('form.placeholders.heightFt')}
                      min="3"
                      max="8"
                      className="px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                    />
                    <input
                      type="number"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                      placeholder={t('form.placeholders.heightIn')}
                      min="0"
                      max="11"
                      className="px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                    />
                  </div>
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as HeightUnit)}
                    className="w-full px-3 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
                  >
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              )}
            </div>

            {/* Activity Level */}
            <div className="mb-4 lg:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Activity className="w-4 h-4 inline mr-2" />
                {t('form.activity')}
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
              >
                <option value="sedentary">{t('form.activityLevels.sedentary')}</option>
                <option value="light">{t('form.activityLevels.light')}</option>
                <option value="moderate">{t('form.activityLevels.moderate')}</option>
                <option value="very">{t('form.activityLevels.very')}</option>
              </select>
            </div>

            {/* Goal */}
            <div className="mb-6 lg:mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-2" />
                {t('form.goal')}
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className="w-full px-4 py-2.5 lg:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-sm lg:text-base"
              >
                <option value="maintenance">{t('form.goals.maintenance')}</option>
                <option value="loss">{t('form.goals.loss')}</option>
                <option value="gain">{t('form.goals.gain')}</option>
              </select>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateMacros}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 lg:py-4 rounded-xl font-semibold transition-colors shadow-lg shadow-teal-500/20 text-sm lg:text-base"
            >
              {t('form.submit')}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className={`bg-white rounded-2xl p-4 lg:p-8 border border-gray-200 shadow-sm ${currentTab === 'input' ? 'hidden lg:block' : ''}`}>
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4 lg:mb-6">{t('results.title')}</h2>

            {results ? (
              <div className="space-y-4 lg:space-y-6">
                {/* TDEE Display */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 lg:p-6 border border-teal-100">
                  <p className="text-xs lg:text-sm text-gray-600 mb-1">{t('results.calorieTarget')}</p>
                  <p className="text-3xl lg:text-4xl font-bold text-teal-600">{results.tdee}</p>
                  <p className="text-xs lg:text-sm text-gray-500 mt-1">{t('results.kcalPerDay')}</p>
                  <p className="text-xs text-gray-400 mt-2">{t('results.bmrLabel', { val: results.bmr })}</p>
                </div>

                {/* Macro Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-blue-50 rounded-xl">
                    <span className="text-sm lg:text-base font-medium text-gray-700">{t('results.protein')}</span>
                    <span className="text-sm lg:text-base font-bold text-blue-600">{results.protein_g}g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-yellow-50 rounded-xl">
                    <span className="text-sm lg:text-base font-medium text-gray-700">{t('results.carbs')}</span>
                    <span className="text-sm lg:text-base font-bold text-yellow-600">{results.carbs_g}g</span>
                  </div>
                  <div className="flex items-center justify-between p-3 lg:p-4 bg-red-50 rounded-xl">
                    <span className="text-sm lg:text-base font-medium text-gray-700">{t('results.fat')}</span>
                    <span className="text-sm lg:text-base font-bold text-red-600">{results.fat_g}g</span>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="h-48 lg:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string, props: any) => [
                          `${value}g (${props.payload.kcal} kcal)`,
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveToProfile}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 lg:py-4 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm lg:text-base"
                >
                  <Save className="w-4 lg:w-5 h-4 lg:h-5" />
                  {t('results.submit')}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] lg:min-h-0 text-gray-400">
                <div className="text-center">
                  <Target className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm lg:text-base">{t('results.placeholder')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}