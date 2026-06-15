import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Book, ClipboardList, Candy, UtensilsCrossed } from 'lucide-react';

export default function OthersDashboard() {
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
                onClick={() => navigate('/')}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{t('others.title')}</h1>
                <p className="text-xs lg:text-sm text-gray-500 truncate">{t('others.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Other Tools */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolCard
            icon={<Book className="w-8 h-8 text-white" />}
            label={t('others.tools.foodDiary.label')}
            description={t('others.tools.foodDiary.desc')}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
            onClick={() => navigate('/others/food-diary')}
          />
          <ToolCard
            icon={<ClipboardList className="w-8 h-8 text-white" />}
            label={t('others.tools.planPlate.label')}
            description={t('others.tools.planPlate.desc')}
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
            onClick={() => navigate('/others/plan-your-plate')}
          />
          <ToolCard
            icon={<Candy className="w-8 h-8 text-white" />}
            label={t('others.tools.sugarEase.label')}
            description={t('others.tools.sugarEase.desc')}
            color="bg-gradient-to-br from-rose-500 to-pink-600"
            onClick={() => navigate('/others/daily-sugar-ease')}
          />
          <ToolCard
            icon={<UtensilsCrossed className="w-8 h-8 text-white" />}
            label={t('others.tools.recipeLog.label')}
            description={t('others.tools.recipeLog.desc')}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            onClick={() => navigate('/others/healthy-recipe-log')}
          />
        </div>
      </div>
    </div>
  );
}

function ToolCard({ icon, label, description, color, onClick }: { icon: React.ReactNode; label: string; description: string; color: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden ${color} rounded-2xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:scale-[1.05] hover:shadow-xl transition-all duration-300 group aspect-square`}
    >
      <div className="bg-white/20 p-4 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-center">
        <h3 className="text-white font-bold text-lg leading-tight">{label}</h3>
        <p className="text-white/80 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}
