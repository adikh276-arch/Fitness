import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, ChevronDown, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { saveMealPlanEntry, fetchMealPlanEntries } from "@/lib/persistence";
import { useTranslation } from "react-i18next";

interface HistoryEntry {
  id: string;
  date: string;
  meals: Record<string, number>;
  reflection: string;
}

const HISTORY_KEY = "meal-plan-history";

function loadLocalHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 20)));
}


const TOTAL_STEPS = 5;

interface UserDetails {
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  goal: "lose" | "maintain" | "gain";
}

interface NutritionGoals {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
}

const breakfastOptions = [
  "2 boiled eggs + oats with banana + a glass of milk",
  "Poha with peanuts + a cup of green tea",
  "Multigrain toast + peanut butter + a fruit",
  "Idli with sambar + coconut chutney",
  "Greek yogurt + granola + mixed berries",
];
const lunchOptions = [
  "Brown rice + dal + sabzi + curd",
  "Roti + rajma curry + salad",
  "Quinoa bowl + grilled paneer + vegetables",
  "Khichdi + papad + a glass of buttermilk",
  "Whole wheat roti + chicken curry + cucumber salad",
];
const dinnerOptions = [
  "Roti + grilled chicken or paneer + salad",
  "Vegetable soup + multigrain bread",
  "Moong dal chilla + mint chutney",
  "Brown rice + fish curry + stir-fried vegetables",
  "Tofu stir fry + steamed rice + a bowl of dal",
];
const snackOptions = [
  "A handful of mixed nuts + a fruit",
  "Roasted chana + green tea",
  "Hummus + carrot & cucumber sticks",
  "A banana + a glass of milk",
  "Sprouts chaat with lemon & spices",
];

const mealSections = [
  { key: "breakfast", emoji: "🍳", title: "Breakfast", options: breakfastOptions },
  { key: "lunch", emoji: "🥗", title: "Lunch", options: lunchOptions },
  { key: "dinner", emoji: "🍽️", title: "Dinner", options: dinnerOptions },
  { key: "snacks", emoji: "🍎", title: "Snacks", options: snackOptions },
];

function calculateNutrition(details: UserDetails): NutritionGoals {
  let bmr: number;
  if (details.gender === "male") {
    bmr = 88.36 + 13.4 * details.weight + 4.8 * details.height - 5.7 * details.age;
  } else {
    bmr = 447.6 + 9.2 * details.weight + 3.1 * details.height - 4.3 * details.age;
  }
  const calories = Math.round(bmr * 1.375);

  let proteinPerKg = 0.8;
  if (details.goal === "gain") proteinPerKg *= 1.2;
  if (details.goal === "lose") proteinPerKg *= 0.9;
  const protein = Math.round(proteinPerKg * details.weight);

  const fats = Math.round((calories * 0.25) / 9);
  const proteinCals = protein * 4;
  const fatCals = fats * 9;
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);

  return { calories, protein, fats, carbs };
}

const ProgressDots = ({ current }: { current: number }) => (
  <div className="flex items-center justify-center gap-2 py-4">
    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
      <div
        key={i}
        className={`transition-all duration-300 rounded-full ${
          i === current
            ? "w-8 h-2 bg-blue-600"
            : i < current
              ? "w-2 h-2 bg-blue-600/50"
              : "w-2 h-2 bg-gray-200"
        }`}
      />
    ))}
  </div>
);

const slideVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

interface PlanYourPlateExerciseProps {
  onBack: () => void;
}

export default function PlanYourPlateExercise({ onBack: onBackToOthers }: PlanYourPlateExerciseProps) {
    const { t } = useTranslation('PlanYourPlate');
  const [step, setStep] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [details, setDetails] = useState<UserDetails>({
    gender: "male",
    age: 25,
    height: 170,
    weight: 70,
    goal: "maintain",
  });
  const [nutrition, setNutrition] = useState<NutritionGoals | null>(null);
  const [meals, setMeals] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(loadLocalHistory());

  useEffect(() => {
    const syncWithDb = async () => {
      const dbEntries = await fetchMealPlanEntries();
      if (dbEntries.length > 0) {
        const formatted = dbEntries.map(e => ({
          id: e.id,
          date: e.date,
          meals: e.meals,
          reflection: e.reflection
        }));
        setHistory(formatted);
      }
    };
    syncWithDb();
  }, []);

  useEffect(() => {
    saveLocalHistory(history);
  }, [history]);

  const handleCalculate = () => {
    setNutrition(calculateNutrition(details));
    setStep(2);
  };

  const selectMeal = (category: string, index: number) => {
    setMeals((prev) => ({ ...prev, [category]: index }));
  };

  const handleDone = async () => {
    const newId = crypto.randomUUID();
    const newDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const isoDate = new Date().toISOString().split('T')[0];

    const newEntry: HistoryEntry = {
      id: newId,
      date: newDate,
      meals: { ...meals },
      reflection,
    };

    setHistory(prev => [newEntry, ...prev]);

    // Save to DB
    await saveMealPlanEntry({
      id: newId,
      meals: { ...meals },
      reflection,
      date: isoDate
    });

    setMeals({});
    setReflection("");
    setStep(0);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px] flex flex-col relative">
        
        {/* Standard Dashboard Header */}
        <div className="mb-6 lg:mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-sm border border-white/60">
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                onClick={showHistory ? () => setShowHistory(false) : onBackToOthers}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {!showHistory && (
                <button 
                  onClick={() => setShowHistory(true)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 flex-shrink-0"
                >
                  <Clock className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">{t('plan_your_plate')}</h1>
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {showHistory ? "Past meal plans" : "Build a balanced meal plan for your goals"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {showHistory && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm border border-white/60 min-h-[500px]">
            <HistoryPanel history={history} onClose={() => setShowHistory(false)} />
          </div>
        )}


        {!showHistory && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-sm border border-white/60 min-h-[500px]">
            <div className="mb-8">
              <ProgressDots current={step} />
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="flex flex-col h-full"
                >
                  {step === 0 && <IntroScreen onNext={() => setStep(1)} onHistory={() => setShowHistory(true)} onBack={onBackToOthers} />}
                  {step === 1 && (
                    <DetailsScreen details={details} setDetails={setDetails} onNext={handleCalculate} />
                  )}
                  {step === 2 && nutrition && (
                    <ResultsScreen nutrition={nutrition} onNext={() => setStep(3)} />
                  )}
                  {step === 3 && (
                    <MealPlanScreen meals={meals} selectMeal={selectMeal} onNext={() => setStep(4)} />
                  )}
                  {step === 4 && (
                    <CompletionScreen reflection={reflection} setReflection={setReflection} onDone={handleDone} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onClose }: { history: HistoryEntry[]; onClose: () => void }) {


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-2xl text-gray-900">{t('past_meal_plans')}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <X size={24} className="text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">{t('no_past_entries_yet_complete_an_exercise')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.map((entry, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{entry.date}</p>
                </div>
                <div className="space-y-3">
                  {mealSections.map((s) => {
                    const selectedIdx = entry.meals[s.key];
                    if (selectedIdx === undefined) return null;
                    return (
                      <div key={s.key} className="text-sm text-gray-800 flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{s.emoji}</span>
                        <div>
                          <span className="font-bold text-gray-900">{s.title}:</span>{" "}
                          <span className="text-gray-600">{s.options[selectedIdx]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {entry.reflection && (
                  <div className="bg-white p-3 rounded-xl border border-gray-100 mt-2">
                    <p className="text-sm text-gray-500 italic">"{entry.reflection}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IntroScreen({ onNext, onHistory, onBack }: { onNext: () => void; onHistory: () => void; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-8">
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{t('build_your_perfect_plate')}</h1>
      <p className="text-blue-600 font-bold text-lg mb-8 uppercase tracking-wide">{t('eat_smart_feel_great')}</p>
      <p className="text-gray-600 text-lg leading-relaxed mb-12">
        {t('welcome_to_your_meal_planning_exercise_a')}
                    </p>
      <Button variant="pill" size="lg" className="px-12 py-6 text-lg h-auto rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20" onClick={onNext}>
        {t('let_s_begin')}
                    </Button>
    </div>
  );
}

function DetailsScreen({
  details,
  setDetails,
  onNext,
}: {
  details: UserDetails;
  setDetails: React.Dispatch<React.SetStateAction<UserDetails>>;
  onNext: () => void;
}) {
  const update = <K extends keyof UserDetails>(key: K, value: UserDetails[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const isValid = details.age > 0 && details.height > 0 && details.weight > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t('tell_us_about_yourself')}</h1>
      <p className="text-gray-500 text-base mb-8">
        {t('we_ll_use_this_to_calculate_exactly_what')}
                    </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender */}
        <div className="md:col-span-2">
          <label className="text-sm font-bold text-gray-700 mb-3 block">{t('gender')}</label>
          <div className="flex gap-4">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => update("gender", g)}
                className={`flex-1 py-4 rounded-2xl text-base font-bold transition-all border-2 ${
                  details.gender === g
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:border-blue-600/30"
                }`}
              >
                {g === "male" ? "Male" : "Female"}
              </button>
            ))}
          </div>
        </div>

        {/* Age, Height, Weight */}
        <InputField label={t('age')} value={details.age} onChange={(v) => update("age", v)} />
        <InputField
          label={t('height_cm')}
          value={details.height}
          onChange={(v) => update("height", v)}
        />
        <InputField
          label={t('weight_kg')}
          value={details.weight}
          onChange={(v) => update("weight", v)}
        />

        {/* Goal */}
        <div className="md:col-span-1">
          <label className="text-sm font-bold text-gray-700 mb-3 block">{t('goal')}</label>
          <div className="grid grid-cols-1 gap-2">
            {([
              ["lose", "Lose Weight"],
              ["maintain", "Maintain"],
              ["gain", "Gain Weight"],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => update("goal", val)}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${
                  details.goal === val
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-500 border-gray-100 hover:border-blue-600/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Button variant="pill" size="lg" className="w-full py-6 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20" onClick={onNext} disabled={!isValid}>
          {t('calculate_goals')}
                          </Button>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-gray-700 mb-3 block">{label}</label>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 transition-all shadow-sm"
      />
    </div>
  );
}

function ResultsScreen({
  nutrition,
  onNext,
}: {
  nutrition: NutritionGoals;
  onNext: () => void;
}) {
  const cards = [
    { emoji: "🔥", label: "Calories", value: `${nutrition.calories} kcal/day`, color: "bg-orange-50 border-orange-100 text-orange-700" },
    { emoji: "💪", label: "Protein", value: `${nutrition.protein} g/day`, color: "bg-blue-50 border-blue-100 text-blue-700" },
    { emoji: "🥑", label: "Healthy Fats", value: `${nutrition.fats} g/day`, color: "bg-amber-50 border-amber-100 text-amber-700" },
    { emoji: "🌾", label: "Carbohydrates", value: `${nutrition.carbs} g/day`, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t('your_daily_nutrition_goals')}</h1>
      <p className="text-gray-500 text-base mb-10">
        {t('based_on_your_details_here_s_what_your_b')}
                    </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {cards.map((c) => (
          <div key={c.label} className={`${c.color} border rounded-3xl p-6 text-center shadow-sm`}>
            <span className="text-3xl mb-2 block">{c.emoji}</span>
            <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-80">{c.label}</p>
            <p className="font-extrabold text-lg">{c.value.split(' ')[0]} <span className="text-xs font-medium">{c.value.split(' ')[1]}</span></p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-12">
        <p className="text-sm text-gray-600 leading-relaxed text-center italic">
          {t('your_body_is_a_temple_but_only_if_you_tr')}
                          </p>
      </div>

      <Button variant="pill" size="lg" className="w-full py-6 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20" onClick={onNext}>
        {t('see_my_meal_plan')}
                    </Button>
    </div>
  );
}

function MealPlanScreen({
  meals,
  selectMeal,
  onNext,
}: {
  meals: Record<string, number>;
  selectMeal: (cat: string, i: number) => void;
  onNext: () => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const sections = [
    { key: "breakfast", emoji: "🍳", title: "Breakfast", options: breakfastOptions },
    { key: "lunch", emoji: "🥗", title: "Lunch", options: lunchOptions },
    { key: "dinner", emoji: "🍽️", title: "Dinner", options: dinnerOptions },
    { key: "snacks", emoji: "🍎", title: "Snacks", options: snackOptions },
  ];

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t('here_s_your_meal_plan')}</h1>
      <p className="text-gray-500 text-base mb-8">
        {t('based_on_your_nutrition_goals_here_are_s')}
                    </p>

      <div className="space-y-4 mb-10">
        {sections.map((s) => {
          const isOpen = openSection === s.key;
          const selectedIndex = meals[s.key];
          return (
            <div key={s.key} className={`rounded-2xl border transition-all duration-300 ${isOpen ? "border-blue-200 shadow-md ring-4 ring-blue-50" : "border-gray-100 shadow-sm"}`}>
              <button
                onClick={() => toggleSection(s.key)}
                className={`w-full flex items-center justify-between px-6 py-5 rounded-t-2xl transition-colors ${isOpen ? "bg-white" : "bg-gray-50/50 hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="text-left">
                    <span className="font-bold text-gray-900">{s.title}</span>
                    {selectedIndex === undefined && <span className="text-gray-400 text-xs ml-2">{t('pick_one')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedIndex !== undefined && (
                    <span className="text-xs text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full truncate max-w-[150px]">
                      {s.options[selectedIndex].split("+")[0].trim()}…
                    </span>
                  )}
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden bg-white rounded-b-2xl"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-2">
                      {s.options.map((opt, i) => {
                        const selected = meals[s.key] === i;
                        return (
                          <button
                            key={i}
                            onClick={() => selectMeal(s.key, i)}
                            className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all border-2 flex items-center gap-4 ${
                              selected
                                ? "bg-blue-50 border-blue-200 shadow-sm"
                                : "bg-gray-50 border-transparent hover:border-gray-200"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs transition-all border-2 ${
                                selected ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200"
                              }`}
                            >
                              {selected ? "✓" : ""}
                            </span>
                            <span className={`text-gray-900 ${selected ? "font-bold" : "font-medium"}`}>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <Button
        variant="pill"
        size="lg"
        className="w-full py-6 text-lg rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 disabled:opacity-50"
        onClick={onNext}
        disabled={Object.keys(meals).length < 4}
      >
        {Object.keys(meals).length < 4
          ? `Select all meals (${Object.keys(meals).length}/4)`
          : "Save Meal Plan →"}
      </Button>
    </div>
  );
}

function CompletionScreen({
  reflection,
  setReflection,
  onDone,
}: {
  reflection: string;
  setReflection: (v: string) => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-10">
      <span className="text-7xl mb-6 animate-bounce">🎉</span>
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('you_re_all_set')}</h1>
      <p className="text-blue-600 font-bold text-lg mb-8 italic">
        {t('which_meal_from_today_s_plan_are_you_mos')}
                    </p>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder={t('write_your_thoughts_here')}
        className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600/50 resize-none h-32 mb-8 shadow-sm transition-all focus:bg-white"
      />
      <p className="text-gray-600 text-lg leading-relaxed mb-12">
        {t('a_little_planning_goes_a_long_way_you_no')}
                    </p>
      <Button variant="pill" size="lg" className="px-16 py-6 text-xl rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95" onClick={onDone}>
        {t('finish')}
                    </Button>
    </div>
  );
}
