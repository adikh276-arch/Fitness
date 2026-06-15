import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Leaf, Award, CheckCircle2, AlertCircle, Plus, Trash2, Lightbulb, Sparkles, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { logUserActivity } from '@/lib/db';

interface SupplementLog {
  b12: boolean;
  omega3: boolean;
  iron: boolean;
  calcium: boolean;
  date: string;
}

interface ProteinSource {
  name: string;
  proteinPer100g: number;
  isLegume: boolean;
  isGrain: boolean;
  hasIron: boolean;
}

interface ProteinEntry {
  source: string;
  amount: number;
  protein: number;
}

interface VeganData {
  supplementLogs: SupplementLog[];
  proteinHistory: {
    date: string;
    total: number;
    sources: string[];
  }[];
}

export default function VeganNutritionGuide({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('VeganNutrition');

  const proteinSources: ProteinSource[] = useMemo(() => [
    // Soy Products
    { name: t('proteinSources.tofu'), proteinPer100g: 8, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.tempeh'), proteinPer100g: 19, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.edamame'), proteinPer100g: 11, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.soybeansBoiled'), proteinPer100g: 17, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.soyChunks'), proteinPer100g: 52, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.soyMince'), proteinPer100g: 50, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.soyMilk'), proteinPer100g: 3, isLegume: true, isGrain: false, hasIron: false },
    { name: t('proteinSources.soyYogurt'), proteinPer100g: 4, isLegume: true, isGrain: false, hasIron: false },
    { name: t('proteinSources.seitan'), proteinPer100g: 25, isLegume: false, isGrain: true, hasIron: true },

    // Lentils
    { name: t('proteinSources.lentilsCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.redLentilsCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.greenLentilsCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.blackLentilsCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },

    // Beans
    { name: t('proteinSources.chickpeasCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.blackBeansCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.kidneyBeansCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.pintoBeansCooked'), proteinPer100g: 9, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.cannelliniBeansCooked'), proteinPer100g: 8, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.navyBeansCooked'), proteinPer100g: 8, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.adzukiBeansCooked'), proteinPer100g: 8, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.mungBeansCooked'), proteinPer100g: 7, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.lupinBeans'), proteinPer100g: 16, isLegume: true, isGrain: false, hasIron: true },

    // Peas
    { name: t('proteinSources.splitPeasCooked'), proteinPer100g: 8, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.greenPeas'), proteinPer100g: 5, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.peaProteinIsolate'), proteinPer100g: 80, isLegume: true, isGrain: false, hasIron: false },
    { name: t('proteinSources.peaMilk'), proteinPer100g: 3, isLegume: true, isGrain: false, hasIron: false },

    // Bean Products
    { name: t('proteinSources.hummus'), proteinPer100g: 8, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.falafel'), proteinPer100g: 13, isLegume: true, isGrain: false, hasIron: true },

    // Grains
    { name: t('proteinSources.quinoaCooked'), proteinPer100g: 4, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.amaranthCooked'), proteinPer100g: 4, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.buckwheatCooked'), proteinPer100g: 4, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.oatsDry'), proteinPer100g: 17, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.rolledOats'), proteinPer100g: 13, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.steelCutOats'), proteinPer100g: 13, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.oatBran'), proteinPer100g: 17, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.barleyCooked'), proteinPer100g: 3, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.milletCooked'), proteinPer100g: 4, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.brownRiceCooked'), proteinPer100g: 3, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.wildRiceCooked'), proteinPer100g: 4, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.teffCooked'), proteinPer100g: 4, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.farroCooked'), proteinPer100g: 5, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.freekehCooked'), proteinPer100g: 5, isLegume: false, isGrain: true, hasIron: true },

    // Pasta
    { name: t('proteinSources.wholeWheatPastaCooked'), proteinPer100g: 6, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.chickpeaPastaDry'), proteinPer100g: 22, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.lentilPastaDry'), proteinPer100g: 25, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.blackBeanPastaDry'), proteinPer100g: 22, isLegume: true, isGrain: false, hasIron: true },

    // Superfoods
    { name: t('proteinSources.spirulinaDry'), proteinPer100g: 57, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.nutritionalYeast'), proteinPer100g: 50, isLegume: false, isGrain: false, hasIron: true },

    // Vegetables
    { name: t('proteinSources.mushroomsWhite'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: false },
    { name: t('proteinSources.portobelloMushrooms'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: false },
    { name: t('proteinSources.spinach'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.kale'), proteinPer100g: 4, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.broccoli'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.brusselsSprouts'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.sweetCorn'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: false },
    { name: t('proteinSources.artichoke'), proteinPer100g: 3, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.avocado'), proteinPer100g: 2, isLegume: false, isGrain: false, hasIron: false },

    // Seeds
    { name: t('proteinSources.pumpkinSeeds'), proteinPer100g: 30, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.hempSeeds'), proteinPer100g: 32, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.chiaSeeds'), proteinPer100g: 17, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.flaxSeeds'), proteinPer100g: 18, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.sesameSeeds'), proteinPer100g: 18, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.sunflowerSeeds'), proteinPer100g: 21, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.watermelonSeeds'), proteinPer100g: 28, isLegume: false, isGrain: false, hasIron: true },

    // Nuts
    { name: t('proteinSources.almonds'), proteinPer100g: 21, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.peanuts'), proteinPer100g: 26, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.peanutButterNatural'), proteinPer100g: 25, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.cashews'), proteinPer100g: 18, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.pistachios'), proteinPer100g: 20, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.walnuts'), proteinPer100g: 15, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.hazelnuts'), proteinPer100g: 15, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.brazilNuts'), proteinPer100g: 14, isLegume: false, isGrain: false, hasIron: false },

    // Nut Butters
    { name: t('proteinSources.almondButter'), proteinPer100g: 21, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.tahini'), proteinPer100g: 17, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.cashewButter'), proteinPer100g: 18, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.pumpkinSeedButter'), proteinPer100g: 29, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.sunflowerSeedButter'), proteinPer100g: 21, isLegume: false, isGrain: false, hasIron: true },

    // Flours
    { name: t('proteinSources.almondFlour'), proteinPer100g: 21, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.chickpeaFlour'), proteinPer100g: 22, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.soyFlour'), proteinPer100g: 36, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.wholeWheatFlour'), proteinPer100g: 13, isLegume: false, isGrain: true, hasIron: true },

    // Bread & Snacks
    { name: t('proteinSources.breadWholeWheat'), proteinPer100g: 13, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.ezekielBread'), proteinPer100g: 13, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.proteinBreadVegan'), proteinPer100g: 20, isLegume: false, isGrain: true, hasIron: true },
    { name: t('proteinSources.roastedChickpeas'), proteinPer100g: 20, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.dryRoastedEdamame'), proteinPer100g: 43, isLegume: true, isGrain: false, hasIron: true },
    { name: t('proteinSources.proteinBarVegan'), proteinPer100g: 25, isLegume: false, isGrain: false, hasIron: false },

    // Meat Alternatives
    { name: t('proteinSources.veganSausage'), proteinPer100g: 18, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.veganBurgerPatty'), proteinPer100g: 20, isLegume: false, isGrain: false, hasIron: true },
    { name: t('proteinSources.mycoproteinVegan'), proteinPer100g: 15, isLegume: false, isGrain: false, hasIron: true },

    // Sprouts
    { name: t('proteinSources.beanSprouts'), proteinPer100g: 3, isLegume: true, isGrain: false, hasIron: false },
    { name: t('proteinSources.alfalfaSprouts'), proteinPer100g: 4, isLegume: true, isGrain: false, hasIron: true },
  ], [t]);

  const micronutrients = useMemo(() => [
    {
      name: t('nutrients.micronutrients.b12.name'),
      key: 'b12',
      importance: t('nutrients.micronutrients.b12.importance'),
      sources: t('nutrients.micronutrients.b12.sources', { returnObjects: true }) as string[],
      dosage: t('nutrients.micronutrients.b12.dosage'),
      color: 'from-emerald-500 to-green-600',
      icon: '💊',
    },
    {
      name: t('nutrients.micronutrients.iron.name'),
      key: 'iron',
      importance: t('nutrients.micronutrients.iron.importance'),
      sources: t('nutrients.micronutrients.iron.sources', { returnObjects: true }) as string[],
      dosage: t('nutrients.micronutrients.iron.dosage'),
      color: 'from-green-600 to-lime-600',
      icon: '🌱',
    },
    {
      name: t('nutrients.micronutrients.omega3.name'),
      key: 'omega3',
      importance: t('nutrients.micronutrients.omega3.importance'),
      sources: t('nutrients.micronutrients.omega3.sources', { returnObjects: true }) as string[],
      dosage: t('nutrients.micronutrients.omega3.dosage'),
      color: 'from-lime-600 to-green-500',
      icon: '🥜',
    },
    {
      name: t('nutrients.micronutrients.calcium.name'),
      key: 'calcium',
      importance: t('nutrients.micronutrients.calcium.importance'),
      sources: t('nutrients.micronutrients.calcium.sources', { returnObjects: true }) as string[],
      dosage: t('nutrients.micronutrients.calcium.dosage'),
      color: 'from-green-500 to-emerald-600',
      icon: '🦴',
    },
  ], [t]);

  const [activeTab, setActiveTab] = useState<'plate' | 'nutrients' | 'calculator'>('plate');
  const [veganData, setVeganData] = useState<VeganData>(() => {
    const saved = localStorage.getItem('vegan-nutrition-data');
    return saved ? JSON.parse(saved) : {
      supplementLogs: [],
      proteinHistory: [],
    };
  });

  const [proteinEntries, setProteinEntries] = useState<ProteinEntry[]>([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [amount, setAmount] = useState('');
  const [showVitaminCTip, setShowVitaminCTip] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('vegan-nutrition-data', JSON.stringify(veganData));
  }, [veganData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('vegan_nutrition');
      
      const supplementLogs = dbLogs
        .filter(l => l.action_type === 'daily_supplements')
        .map(log => {
          const p = log.payload;
          return {
            b12: p.daily_supplements.b12,
            omega3: p.daily_supplements.omega3,
            iron: p.daily_supplements.iron,
            calcium: p.daily_supplements.calcium,
            date: new Date(p.timestamp).toISOString().split('T')[0]
          } as SupplementLog;
        });

      const proteinHistory = dbLogs
        .filter(l => l.action_type === 'log_protein')
        .map(log => {
          const p = log.payload;
          return {
            date: new Date(p.timestamp).toISOString().split('T')[0],
            total: p.logged_protein_total,
            sources: p.top_sources
          };
        });

      if (supplementLogs.length > 0 || proteinHistory.length > 0) {
        setVeganData({
          supplementLogs,
          proteinHistory,
        });
      }
    };
    loadDbLogs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTodayLog = (): SupplementLog => {
    const today = new Date().toISOString().split('T')[0];
    const existing = veganData.supplementLogs.find(log => log.date === today);
    return existing || { b12: false, omega3: false, iron: false, calcium: false, date: today };
  };

  const toggleSupplement = (key: keyof Omit<SupplementLog, 'date'>) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLog = getTodayLog();
    const newLog = { ...todayLog, [key]: !todayLog[key], date: today };

    const otherLogs = veganData.supplementLogs.filter(log => log.date !== today);
    setVeganData(prev => ({
      ...prev,
      supplementLogs: [newLog, ...otherLogs],
    }));

    // Log to console for database integration
    logUserActivity('vegan_nutrition', 'daily_supplements', {
      daily_supplements: {
        b12: newLog.b12,
        omega3: newLog.omega3,
        iron: newLog.iron,
        calcium: newLog.calcium,
        date: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  };

  const addProteinEntry = () => {
    if (!selectedSource || !amount) return;

    const source = proteinSources.find(s => s.name === selectedSource);
    if (!source) return;

    const amountNum = parseFloat(amount);
    const protein = (source.proteinPer100g * amountNum) / 100;

    const newEntry: ProteinEntry = {
      source: selectedSource,
      amount: amountNum,
      protein,
    };

    setProteinEntries(prev => [...prev, newEntry]);
    setSelectedSource('');
    setAmount('');

    // Check if iron-rich food selected
    if (source.hasIron) {
      setShowVitaminCTip(true);
      setTimeout(() => setShowVitaminCTip(false), 5000);
    }
  };

  const removeProteinEntry = (index: number) => {
    setProteinEntries(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalProtein = () => {
    return proteinEntries.reduce((sum, entry) => sum + entry.protein, 0);
  };

  const checkAminoAcidCompleteness = () => {
    const hasLegume = proteinEntries.some(entry => {
      const source = proteinSources.find(s => s.name === entry.source);
      return source?.isLegume;
    });
    const hasGrain = proteinEntries.some(entry => {
      const source = proteinSources.find(s => s.name === entry.source);
      return source?.isGrain;
    });
    return hasLegume && hasGrain;
  };

  const logProteinTotal = () => {
    const total = getTotalProtein();
    const sources = proteinEntries.map(e => e.source);
    const today = new Date().toISOString().split('T')[0];

    setVeganData(prev => ({
      ...prev,
      proteinHistory: [
        { date: today, total, sources },
        ...prev.proteinHistory,
      ],
    }));

    // Log to console for database integration
    logUserActivity('vegan_nutrition', 'log_protein', {
      logged_protein_total: total,
      top_sources: sources,
      amino_acid_complete: checkAminoAcidCompleteness(),
      timestamp: new Date().toISOString(),
    });

    // Celebrate if goal achieved (assuming 50g minimum)
    if (total >= 50) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#16A34A', '#15803D'],
      });
    }

    // Reset entries
    setProteinEntries([]);
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
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm lg:text-base">{t('nav.back')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-2 lg:p-3">
              <Leaf className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{t('header.title')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('header.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('plate')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'plate'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.plate')}
          </button>
          <button
            onClick={() => setActiveTab('nutrients')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'nutrients'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.nutrients')}
          </button>
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
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: The Vegan Plate */}
          {activeTab === 'plate' && (
            <motion.div
              key="plate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('plate.title')}</h2>

                {/* Plate Proportions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-6 mb-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border-2 border-green-200"
                  >
                    <div className="text-3xl lg:text-4xl font-bold text-green-600 mb-1 lg:mb-2">25%</div>
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{t('plate.proportions.legumes.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plate.proportions.legumes.subtitle')}</p>
                    <div className="mt-2 lg:mt-3 text-xs lg:text-sm text-gray-500">
                      {t('plate.proportions.legumes.examples')}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border-2 border-amber-200"
                  >
                    <div className="text-3xl lg:text-4xl font-bold text-amber-600 mb-1 lg:mb-2">25%</div>
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{t('plate.proportions.grains.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plate.proportions.grains.subtitle')}</p>
                    <div className="mt-2 lg:mt-3 text-xs lg:text-sm text-gray-500">
                      {t('plate.proportions.grains.examples')}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-lime-50 to-green-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border-2 border-lime-200"
                  >
                    <div className="text-3xl lg:text-4xl font-bold text-lime-600 mb-1 lg:mb-2">40%</div>
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{t('plate.proportions.vegetables.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plate.proportions.vegetables.subtitle')}</p>
                    <div className="mt-2 lg:mt-3 text-xs lg:text-sm text-gray-500">
                      {t('plate.proportions.vegetables.examples')}
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg lg:rounded-xl p-4 lg:p-6 border-2 border-orange-200"
                  >
                    <div className="text-3xl lg:text-4xl font-bold text-orange-600 mb-1 lg:mb-2">10%</div>
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{t('plate.proportions.fats.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{t('plate.proportions.fats.subtitle')}</p>
                    <div className="mt-2 lg:mt-3 text-xs lg:text-sm text-gray-500">
                      {t('plate.proportions.fats.examples')}
                    </div>
                  </motion.div>
                </div>

                {/* Visual Plate */}
                <div className="flex justify-center mb-6 lg:mb-8">
                  <div className="relative w-64 h-64 lg:w-80 lg:h-80">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      <circle cx="100" cy="100" r="95" fill="white" stroke="#D1D5DB" strokeWidth="2" />
                      <path d="M 100 100 L 100 5 A 95 95 0 0 1 167 33 Z" fill="#10B981" opacity="0.8" />
                      <text x="120" y="40" fill="white" fontSize="12" fontWeight="bold">25%</text>
                      <text x="110" y="55" fill="white" fontSize="10">{t('plate.legumes')}</text>
                      <path d="M 100 100 L 167 33 A 95 95 0 0 1 195 100 Z" fill="#F59E0B" opacity="0.8" />
                      <text x="155" y="70" fill="white" fontSize="12" fontWeight="bold">25%</text>
                      <text x="150" y="85" fill="white" fontSize="10">{t('plate.grains')}</text>
                      <path d="M 100 100 L 195 100 A 95 95 0 0 1 33 167 Z" fill="#84CC16" opacity="0.8" />
                      <text x="120" y="150" fill="white" fontSize="12" fontWeight="bold">40%</text>
                      <text x="105" y="165" fill="white" fontSize="10">{t('plate.vegetables')}</text>
                      <path d="M 100 100 L 33 167 A 95 95 0 0 1 100 5 Z" fill="#FB923C" opacity="0.8" />
                      <text x="45" y="95" fill="white" fontSize="12" fontWeight="bold">10%</text>
                      <text x="40" y="110" fill="white" fontSize="9">{t('plate.fats')}</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bioavailability Tip */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-3 flex-shrink-0">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-3">💡 {t('plate.tip.title')}</h3>
                    <p className="text-gray-700 mb-4">{t('plate.tip.desc')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm font-semibold text-gray-900 mb-2">🌱 {t('plate.tip.ironRich')}</p>
                        <p className="text-xs text-gray-600">{t('plate.tip.ironExamples')}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-emerald-100">
                        <p className="text-sm font-semibold text-gray-900 mb-2">🍋 {t('plate.tip.vitaminC')}</p>
                        <p className="text-xs text-gray-600">{t('plate.tip.vitaminCExamples')}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 lg:p-4 bg-emerald-50 rounded-lg lg:rounded-xl border border-emerald-100">
                      <p className="text-xs lg:text-sm text-emerald-800 italic">
                        💡 {t('calculator.results.aminoNote')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Tab 2: Essential Micronutrients */}
          {activeTab === 'nutrients' && (
            <motion.div
              key="nutrients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('nutrients.title')}</h2>
                <div className="space-y-4">
                  {micronutrients.map((nutrient, index) => {
                    const todayLog = getTodayLog();
                    const isChecked = todayLog[nutrient.key as keyof Omit<SupplementLog, 'date'>];

                    return (
                      <motion.div
                        key={nutrient.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`rounded-lg lg:rounded-xl p-4 lg:p-6 border-2 transition-all ${
                          isChecked
                            ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3 lg:mb-4">
                          <div className="flex items-start gap-3 lg:gap-4 flex-1">
                            <div className={`bg-gradient-to-br ${nutrient.color} rounded-lg lg:rounded-xl p-2 lg:p-3 flex items-center justify-center`}>
                              <span className="text-xl lg:text-2xl">{nutrient.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-1">{nutrient.name}</h3>
                              <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">{nutrient.importance}</p>
                              <div className="mb-2 lg:mb-3">
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                                  {nutrient.dosage}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                                {nutrient.sources.map((source) => (
                                  <span
                                    key={source}
                                    className="text-xs bg-gray-100 text-gray-700 px-2 lg:px-3 py-1 rounded-full"
                                  >
                                    {source}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleSupplement(nutrient.key as keyof Omit<SupplementLog, 'date'>)}
                            className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <CheckCircle2
                              className={`w-5 h-5 lg:w-6 lg:h-6 ${isChecked ? 'text-white' : 'text-gray-400'}`}
                            />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Progress */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-emerald-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 lg:mb-4 gap-1">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900">{t('nutrients.progress.title')}</h3>
                  <span className="text-xs lg:text-sm text-gray-600">
                    {new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
                  {micronutrients.map((nutrient) => {
                    const todayLog = getTodayLog();
                    const isChecked = todayLog[nutrient.key as keyof Omit<SupplementLog, 'date'>];
                    return (
                      <div
                        key={nutrient.name}
                        className={`text-center p-3 lg:p-4 rounded-lg lg:rounded-xl ${
                          isChecked ? 'bg-green-500 text-white' : 'bg-white text-gray-400'
                        }`}
                      >
                        <div className="text-xl lg:text-2xl mb-1">{nutrient.icon}</div>
                        <div className="text-xs font-medium">
                          {isChecked ? `✓ ${t('nutrients.progress.done')}` : t('nutrients.progress.pending')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2">{t('nutrients.why.title')}</h3>
                    <p className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">
                      {t('nutrients.why.desc1')}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-600">
                      <span className="font-semibold text-green-700">{t('nutrients.why.note').split(':')[0]}:</span> {t('nutrients.why.note').split(':')[1]}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Protein Calculator */}
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-2 lg:mb-3">{t('calculator.title')}</h2>
                <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">{t('calculator.subtitle')}</p>

                {/* Input Form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      {t('calculator.form.selectFood')}
                    </label>
                    <div ref={dropdownRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white flex items-center justify-between"
                      >
                        <span className={selectedSource ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedSource || t('calculator.form.placeholderFood')}
                        </span>
                        <ChevronDown className={`w-4 h-4 lg:w-5 lg:h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg lg:rounded-xl shadow-lg overflow-hidden"
                          >
                            {/* Search Input */}
                            <div className="p-2 lg:p-3 border-b border-gray-200">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  value={foodSearch}
                                  onChange={(e) => setFoodSearch(e.target.value)}
                                  placeholder={t('calculator.form.searchPlaceholder')}
                                  className="w-full pl-9 pr-3 py-2 text-sm lg:text-base rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                  autoFocus
                                />
                              </div>
                            </div>

                            {/* Options List */}
                            <div className="max-h-60 overflow-y-auto">
                              {(() => {
                                const filteredSources = proteinSources.filter(source =>
                                  source.name.toLowerCase().includes(foodSearch.toLowerCase())
                                );
                                const displaySources = filteredSources.slice(0, 5);

                                if (displaySources.length === 0) {
                                  return (
                                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                                      {t('calculator.form.noMatches')}
                                    </div>
                                  );
                                }

                                return (
                                  <>
                                    {displaySources.map((source) => (
                                      <button
                                        key={source.name}
                                        type="button"
                                        onClick={() => {
                                          setSelectedSource(source.name);
                                          setIsDropdownOpen(false);
                                          setFoodSearch('');
                                        }}
                                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-left hover:bg-emerald-50 transition-colors flex items-center justify-between group"
                                      >
                                        <span className="text-sm lg:text-base text-gray-900">{source.name}</span>
                                        <span className="text-xs lg:text-sm text-gray-500 group-hover:text-green-600">
                                          {t('calculator.form.proteinPer100', { val: source.proteinPer100g })}
                                        </span>
                                      </button>
                                    ))}
                                    {filteredSources.length > 5 && (
                                      <div className="px-4 py-2 text-xs text-gray-500 text-center bg-gray-50 border-t border-gray-100">
                                        {t('calculator.form.matches', { total: filteredSources.length })}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      {t('calculator.form.amount')}
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={t('calculator.form.placeholderAmount')}
                      className="w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Protein Result Display */}
              {selectedSource && amount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl lg:rounded-2xl p-6 lg:p-8 border-2 border-emerald-200"
                >
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">{t('calculator.results.estProtein')}</p>
                    <div className="text-4xl lg:text-5xl font-bold text-green-600 mb-2">
                      {((proteinSources.find(s => s.name === selectedSource)?.proteinPer100g || 0) * parseFloat(amount) / 100).toFixed(1)}g
                    </div>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {t('calculator.results.calcInfo', { amount, food: selectedSource })}
                    </p>
                  </div>
                  <button
                    onClick={addProteinEntry}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 lg:py-3 rounded-lg lg:rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 lg:w-5 h-4 lg:h-5" />
                    {t('calculator.form.add')}
                  </button>

                  {/* Iron Tip */}
                  {(() => {
                    const source = proteinSources.find(s => s.name === selectedSource);
                    if (!source?.hasIron) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-yellow-50 rounded-lg p-3 border border-yellow-200"
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs lg:text-sm text-yellow-900">
                            <strong>{t('calculator.results.ironTip.title')}</strong> {t('calculator.results.ironTip.desc')}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })()}
                </motion.div>
              )}

              {/* Protein Source Reference */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 lg:mb-4">{t('calculator.reference.title')}</h3>
                <input
                  type="text"
                  value={referenceSearch}
                  onChange={(e) => setReferenceSearch(e.target.value)}
                  placeholder={t('calculator.form.searchPlaceholder')}
                  className="w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm lg:text-base rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 mb-3 lg:mb-4"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:gap-3">
                  {proteinSources
                    .filter(source =>
                      source.name.toLowerCase().includes(referenceSearch.toLowerCase())
                    )
                    .slice(0, 10)
                    .map((source) => (
                      <div
                        key={source.name}
                        className="flex items-center justify-between p-2.5 lg:p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs lg:text-sm font-medium text-gray-900 truncate">{source.name}</span>
                          {source.isLegume && <span className="text-xs text-green-600 flex-shrink-0">🫘</span>}
                          {source.isGrain && <span className="text-xs text-amber-600 flex-shrink-0">🌾</span>}
                        </div>
                        <span className="text-xs lg:text-sm font-semibold text-green-600 flex-shrink-0 ml-2">
                          {source.proteinPer100g}g
                        </span>
                      </div>
                    ))}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4">
                  <div className="flex gap-4 lg:gap-8">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('calculator.results.total')}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-green-600">{getTotalProtein().toFixed(1)}g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('calculator.results.aminoAcid')}</p>
                      <div className="flex items-center gap-2">
                        {checkAminoAcidCompleteness() ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm font-semibold text-emerald-600">{t('calculator.results.aminoComplete')}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-semibold text-amber-600">{t('calculator.results.aminoIncomplete')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={logProteinTotal}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-lg lg:rounded-xl font-bold shadow-lg shadow-green-200 transition-all"
                  >
                    {t('calculator.results.save')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
