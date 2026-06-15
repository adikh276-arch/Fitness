import { createBrowserRouter } from "react-router";
import { useNavigate } from 'react-router';
import Dashboard from "./pages/Dashboard";
import MacroCalculator from "./components/MacroCalculator";
import CalorieBurner from "./components/CalorieBurner";
import FastTimer from "./components/FastTimer";
import BMICalculator from "./components/BMICalculator";
import WeightLossGuide from "./components/WeightLossGuide";
import DiabetesDietGuide from "./components/DiabetesDietGuide";
import MuscleGainGuide from "./components/MuscleGainGuide";
import GutHealthGuide from "./components/GutHealthGuide";
import KetoBasicsGuide from "./components/KetoBasicsGuide";
import HeartHealthGuide from "./components/HeartHealthGuide";
import IntermittentFastingGuide from "./components/IntermittentFastingGuide";
import VeganNutritionGuide from "./components/VeganNutritionGuide";
import YogaFlexibilityGuide from "./components/YogaFlexibilityGuide";
import HIITCardioGuide from "./components/HIITCardioGuide";
import StrengthTrainingGuide from "./components/StrengthTrainingGuide";
import PostureCorrectionGuide from "./components/PostureCorrectionGuide";
import HomeWorkoutsGuide from "./components/HomeWorkoutsGuide";
import FlexibilityMobilityGuide from "./components/FlexibilityMobilityGuide";
import MacroEducationModule from "./components/MacroEducationModule";
import OthersDashboard from "./pages/OthersDashboard";
import FoodDiaryExercise from "./components/Others/FoodDiary/FoodDiaryExercise";
import PlanYourPlateExercise from "./components/Others/PlanYourPlate/PlanYourPlateExercise";
import DailySugarEaseExercise from "./components/Others/DailySugarEase/DailySugarEaseExercise";
import HealthyRecipeLogExercise from "./components/Others/HealthyRecipeLog/HealthyRecipeLogExercise";


// Wrapper components to inject navigation
function MacroCalculatorPage() {
  const navigate = useNavigate();
  return <MacroCalculator onBack={() => navigate('/')} />;
}

function CalorieBurnerPage() {
  const navigate = useNavigate();
  return <CalorieBurner onBack={() => navigate('/')} />;
}

function FastTimerPage() {
  const navigate = useNavigate();
  return <FastTimer onBack={() => navigate('/')} />;
}

function BMICalculatorPage() {
  const navigate = useNavigate();
  return <BMICalculator onBack={() => navigate('/')} />;
}

function WeightLossGuidePage() {
  const navigate = useNavigate();
  return <WeightLossGuide onBack={() => navigate('/')} />;
}

function DiabetesDietGuidePage() {
  const navigate = useNavigate();
  return <DiabetesDietGuide onBack={() => navigate('/')} />;
}

function MuscleGainGuidePage() {
  const navigate = useNavigate();
  return <MuscleGainGuide onBack={() => navigate('/')} />;
}

function GutHealthGuidePage() {
  const navigate = useNavigate();
  return <GutHealthGuide onBack={() => navigate('/')} />;
}

function KetoBasicsGuidePage() {
  const navigate = useNavigate();
  return <KetoBasicsGuide onBack={() => navigate('/')} />;
}

function HeartHealthGuidePage() {
  const navigate = useNavigate();
  return <HeartHealthGuide onBack={() => navigate('/')} />;
}

function IntermittentFastingGuidePage() {
  const navigate = useNavigate();
  return <IntermittentFastingGuide onBack={() => navigate('/')} />;
}

function VeganNutritionGuidePage() {
  const navigate = useNavigate();
  return <VeganNutritionGuide onBack={() => navigate('/')} />;
}

function YogaFlexibilityGuidePage() {
  const navigate = useNavigate();
  return <YogaFlexibilityGuide onBack={() => navigate('/')} />;
}

function HIITCardioGuidePage() {
  const navigate = useNavigate();
  return <HIITCardioGuide onBack={() => navigate('/')} />;
}

function StrengthTrainingGuidePage() {
  const navigate = useNavigate();
  return <StrengthTrainingGuide onBack={() => navigate('/')} />;
}

function PostureCorrectionGuidePage() {
  const navigate = useNavigate();
  return <PostureCorrectionGuide onBack={() => navigate('/')} />;
}

function HomeWorkoutsGuidePage() {
  const navigate = useNavigate();
  return <HomeWorkoutsGuide onBack={() => navigate('/')} />;
}

function FlexibilityMobilityGuidePage() {
  const navigate = useNavigate();
  return <FlexibilityMobilityGuide onBack={() => navigate('/')} />;
}

function MacroEducationModulePage() {
  const navigate = useNavigate();
  return <MacroEducationModule onBack={() => navigate('/')} />;
}

function FoodDiaryPage() {
  const navigate = useNavigate();
  return <FoodDiaryExercise onBack={() => navigate('/others')} />;
}

function PlanYourPlatePage() {
  const navigate = useNavigate();
  return <PlanYourPlateExercise onBack={() => navigate('/others')} />;
}

function DailySugarEasePage() {
  const navigate = useNavigate();
  return <DailySugarEaseExercise onBack={() => navigate('/others')} />;
}

function HealthyRecipeLogPage() {
  const navigate = useNavigate();
  return <HealthyRecipeLogExercise onBack={() => navigate('/others')} />;
}


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/tools/macro-calculator",
    Component: MacroCalculatorPage,
  },
  {
    path: "/tools/calorie-burner",
    Component: CalorieBurnerPage,
  },
  {
    path: "/tools/fast-timer",
    Component: FastTimerPage,
  },
  {
    path: "/tools/bmi-calculator",
    Component: BMICalculatorPage,
  },
  {
    path: "/guides/weight-loss",
    Component: WeightLossGuidePage,
  },
  {
    path: "/guides/diabetes-diet",
    Component: DiabetesDietGuidePage,
  },
  {
    path: "/guides/muscle-gain",
    Component: MuscleGainGuidePage,
  },
  {
    path: "/guides/gut-health",
    Component: GutHealthGuidePage,
  },
  {
    path: "/guides/keto-basics",
    Component: KetoBasicsGuidePage,
  },
  {
    path: "/guides/heart-health",
    Component: HeartHealthGuidePage,
  },
  {
    path: "/guides/intermittent-fasting",
    Component: IntermittentFastingGuidePage,
  },
  {
    path: "/guides/vegan-nutrition",
    Component: VeganNutritionGuidePage,
  },
  {
    path: "/workouts/yoga",
    Component: YogaFlexibilityGuidePage,
  },
  {
    path: "/workouts/hiit",
    Component: HIITCardioGuidePage,
  },
  {
    path: "/workouts/strength-training",
    Component: StrengthTrainingGuidePage,
  },
  {
    path: "/workouts/posture-correction",
    Component: PostureCorrectionGuidePage,
  },
  {
    path: "/workouts/home-workouts",
    Component: HomeWorkoutsGuidePage,
  },
  {
    path: "/workouts/flexibility",
    Component: FlexibilityMobilityGuidePage,
  },
  {
    path: "/learn/macro-education",
    Component: MacroEducationModulePage,
  },
  {
    path: "/others",
    Component: OthersDashboard,
  },
  {
    path: "/others/food-diary",
    Component: FoodDiaryPage,
  },
  {
    path: "/others/plan-your-plate",
    Component: PlanYourPlatePage,
  },
  {
    path: "/others/daily-sugar-ease",
    Component: DailySugarEasePage,
  },
  {
    path: "/others/healthy-recipe-log",
    Component: HealthyRecipeLogPage,
  },

], { basename: "/fitness" });
