import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MessageCircle, Calculator, Flame, Timer, TrendingDown, Heart, Dumbbell, Salad, Apple, Activity, Clock, Leaf, Zap, Target, Home, Move, User, Star, ChevronRight, Scale, LayoutGrid } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-6 lg:mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-white/60">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={() => {
                  if (window.parent !== window) {
                    window.parent.postMessage({ action: 'exit' }, 'https://web.mantracare.com');
                  } else {
                    window.location.href = 'https://web.mantracare.com';
                  }
                }}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{t('shell.title')}</h1>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{t('shell.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Active Trackers */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">{t('sections.tools')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <TrackerCard
              icon={<Calculator className="w-6 lg:w-7 h-6 lg:h-7 text-white" />}
              label={t('tools.macro.label')}
              description={t('tools.macro.desc')}
              color="bg-gradient-to-br from-teal-500 to-cyan-600"
              onClick={() => navigate('/tools/macro-calculator')}
            />
            <TrackerCard
              icon={<Flame className="w-6 lg:w-7 h-6 lg:h-7 text-white" />}
              label={t('tools.calories.label')}
              description={t('tools.calories.desc')}
              color="bg-gradient-to-br from-orange-500 to-red-600"
              onClick={() => navigate('/tools/calorie-burner')}
            />
            <TrackerCard
              icon={<Timer className="w-6 lg:w-7 h-6 lg:h-7 text-white" />}
              label={t('tools.fasting.label')}
              description={t('tools.fasting.desc')}
              color="bg-gradient-to-br from-purple-500 to-indigo-600"
              onClick={() => navigate('/tools/fast-timer')}
            />
            <TrackerCard
              icon={<Scale className="w-6 lg:w-7 h-6 lg:h-7 text-white" />}
              label={t('tools.bmi.label')}
              description={t('tools.bmi.desc')}
              color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              onClick={() => navigate('/tools/bmi-calculator')}
            />
          </div>
        </div>

        {/* Section 2: Nutrition Guides */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('sections.guides')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            <NutritionCard
              icon={<TrendingDown className="w-6 lg:w-7 h-6 lg:h-7 text-blue-500" />}
              label={t('guides.weightLoss')}
              iconBg="bg-blue-50"
              onClick={() => navigate('/guides/weight-loss')}
            />
            <NutritionCard
              icon={<Apple className="w-6 lg:w-7 h-6 lg:h-7 text-cyan-500" />}
              label={t('guides.diabetes')}
              iconBg="bg-cyan-50"
              onClick={() => navigate('/guides/diabetes-diet')}
            />
            <NutritionCard
              icon={<Dumbbell className="w-6 lg:w-7 h-6 lg:h-7 text-orange-500" />}
              label={t('guides.muscle')}
              iconBg="bg-orange-50"
              onClick={() => navigate('/guides/muscle-gain')}
            />
            <NutritionCard
              icon={<Salad className="w-6 lg:w-7 h-6 lg:h-7 text-emerald-500" />}
              label={t('guides.gut')}
              iconBg="bg-emerald-50"
              onClick={() => navigate('/guides/gut-health')}
            />
            <NutritionCard
              icon={<Activity className="w-6 lg:w-7 h-6 lg:h-7 text-indigo-500" />}
              label={t('guides.keto')}
              iconBg="bg-indigo-50"
              onClick={() => navigate('/guides/keto-basics')}
            />
            <NutritionCard
              icon={<Heart className="w-6 lg:w-7 h-6 lg:h-7 text-red-500" />}
              label={t('guides.heart')}
              iconBg="bg-red-50"
              onClick={() => navigate('/guides/heart-health')}
            />
            <NutritionCard
              icon={<Clock className="w-6 lg:w-7 h-6 lg:h-7 text-blue-500" />}
              label={t('guides.fasting')}
              iconBg="bg-blue-50"
              onClick={() => navigate('/guides/intermittent-fasting')}
            />
            <NutritionCard
              icon={<Leaf className="w-6 lg:w-7 h-6 lg:h-7 text-lime-600" />}
              label={t('guides.vegan')}
              iconBg="bg-lime-50"
              onClick={() => navigate('/guides/vegan-nutrition')}
            />
          </div>
        </div>

        {/* Section 3: Fitness & Movement */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('sections.workouts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            <GuideCard
              icon={<User className="w-5 lg:w-6 h-5 lg:h-6 text-purple-500" />}
              label={t('workouts.yoga')}
              iconBg="bg-purple-100"
              onClick={() => navigate('/workouts/yoga')}
            />
            <GuideCard
              icon={<Zap className="w-5 lg:w-6 h-5 lg:h-6 text-yellow-600" />}
              label={t('workouts.hiit')}
              iconBg="bg-yellow-100"
              onClick={() => navigate('/workouts/hiit')}
            />
            <GuideCard
              icon={<Dumbbell className="w-5 lg:w-6 h-5 lg:h-6 text-gray-700" />}
              label={t('workouts.strength')}
              iconBg="bg-gray-100"
              onClick={() => navigate('/workouts/strength-training')}
            />
            <GuideCard
              icon={<Target className="w-5 lg:w-6 h-5 lg:h-6 text-teal-500" />}
              label={t('workouts.posture')}
              iconBg="bg-teal-100"
              onClick={() => navigate('/workouts/posture-correction')}
            />
            <GuideCard
              icon={<Home className="w-5 lg:w-6 h-5 lg:h-6 text-rose-500" />}
              label={t('workouts.home')}
              iconBg="bg-rose-100"
              onClick={() => navigate('/workouts/home-workouts')}
            />
            <GuideCard
              icon={<Move className="w-5 lg:w-6 h-5 lg:h-6 text-sky-500" />}
              label={t('workouts.flexibility')}
              iconBg="bg-sky-100"
              onClick={() => navigate('/workouts/flexibility')}
            />
          </div>
        </div>

        {/* Section 4: Featured Learning */}
        <div className="mb-8 lg:mb-10">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('sections.learning')}</h2>
          <div
            onClick={() => navigate('/learn/macro-education')}
            className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 group mb-3"
          >
            <div className="bg-orange-500 rounded-2xl p-3 lg:p-3.5 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 lg:w-7 h-6 lg:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-0.5 lg:mb-1">{t('learning.macros.title')}</h3>
              <p className="text-xs lg:text-sm text-gray-500">
                {t('learning.macros.desc')}
              </p>
            </div>
            <ChevronRight className="w-5 lg:w-6 h-5 lg:h-6 text-orange-500 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>

          <div
            onClick={() => navigate('/others')}
            className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 flex items-center gap-3 lg:gap-4 cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-100 group"
          >
            <div className="bg-blue-600 rounded-2xl p-3 lg:p-3.5 flex items-center justify-center flex-shrink-0">
              <LayoutGrid className="w-6 lg:w-7 h-6 lg:h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-0.5 lg:mb-1">{t('learning.others.title')}</h3>
              <p className="text-xs lg:text-sm text-gray-500">
                {t('learning.others.desc')}
              </p>
            </div>
            <ChevronRight className="w-5 lg:w-6 h-5 lg:h-6 text-blue-600 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>
    </div>
  );
}

function TrackerCard({ icon, label, description, color, onClick }: { icon: React.ReactNode; label: string; description?: string; color: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${color} rounded-xl p-4 lg:p-5 flex flex-col items-start justify-between cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group min-h-[100px] lg:min-h-[110px]`}
    >
      {/* Simple hover overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

      {/* Icon */}
      <div className="relative mb-auto">
        {icon}
      </div>

      {/* Text content */}
      <div className="relative mt-3">
        <span className="text-white text-xs lg:text-sm font-semibold leading-tight block">{label}</span>
        {description && (
          <span className="text-white/70 text-[10px] lg:text-xs leading-tight block mt-0.5">{description}</span>
        )}
      </div>
    </div>
  );
}

function NutritionCard({ icon, label, iconBg, onClick }: { icon: React.ReactNode; label: string; iconBg: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 flex flex-col items-center justify-center gap-3 lg:gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-300 border border-gray-100 group min-h-[120px] lg:min-h-[140px]">
      <div className={`${iconBg} rounded-2xl p-3 lg:p-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-gray-900 text-sm lg:text-base font-semibold text-center leading-tight">{label}</span>
    </div>
  );
}

function GuideCard({ icon, label, iconBg, onClick }: { icon: React.ReactNode; label: string; iconBg: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 flex flex-row items-center gap-3 lg:gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      <div className={`${iconBg} rounded-full p-3 lg:p-3.5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-gray-900 text-sm lg:text-base font-semibold text-left leading-tight">{label}</span>
    </div>
  );
}
