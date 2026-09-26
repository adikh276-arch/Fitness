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


import { handleExitOrDashboard, handleExitOrOthers } from "@/lib/navigation";

// Wrapper components to inject navigation
function MacroCalculatorPage() {
  const navigate = useNavigate();
  return <MacroCalculator onBack={() => handleExitOrDashboard(navigate)} />;
}

function CalorieBurnerPage() {
  const navigate = useNavigate();
  return <CalorieBurner onBack={() => handleExitOrDashboard(navigate)} />;
}

function FastTimerPage() {
  const navigate = useNavigate();
  return <FastTimer onBack={() => handleExitOrDashboard(navigate)} />;
}

function BMICalculatorPage() {
  const navigate = useNavigate();
  return <BMICalculator onBack={() => handleExitOrDashboard(navigate)} />;
}

function WeightLossGuidePage() {
  const navigate = useNavigate();
  return <WeightLossGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function DiabetesDietGuidePage() {
  const navigate = useNavigate();
  return <DiabetesDietGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function MuscleGainGuidePage() {
  const navigate = useNavigate();
  return <MuscleGainGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function GutHealthGuidePage() {
  const navigate = useNavigate();
  return <GutHealthGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function KetoBasicsGuidePage() {
  const navigate = useNavigate();
  return <KetoBasicsGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function HeartHealthGuidePage() {
  const navigate = useNavigate();
  return <HeartHealthGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function IntermittentFastingGuidePage() {
  const navigate = useNavigate();
  return <IntermittentFastingGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function VeganNutritionGuidePage() {
  const navigate = useNavigate();
  return <VeganNutritionGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function YogaFlexibilityGuidePage() {
  const navigate = useNavigate();
  return <YogaFlexibilityGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function HIITCardioGuidePage() {
  const navigate = useNavigate();
  return <HIITCardioGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function StrengthTrainingGuidePage() {
  const navigate = useNavigate();
  return <StrengthTrainingGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function PostureCorrectionGuidePage() {
  const navigate = useNavigate();
  return <PostureCorrectionGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function HomeWorkoutsGuidePage() {
  const navigate = useNavigate();
  return <HomeWorkoutsGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function FlexibilityMobilityGuidePage() {
  const navigate = useNavigate();
  return <FlexibilityMobilityGuide onBack={() => handleExitOrDashboard(navigate)} />;
}

function MacroEducationModulePage() {
  const navigate = useNavigate();
  return <MacroEducationModule onBack={() => handleExitOrDashboard(navigate)} />;
}

function FoodDiaryPage() {
  const navigate = useNavigate();
  return <FoodDiaryExercise onBack={() => handleExitOrOthers(navigate)} />;
}

function PlanYourPlatePage() {
  const navigate = useNavigate();
  return <PlanYourPlateExercise onBack={() => handleExitOrOthers(navigate)} />;
}

function DailySugarEasePage() {
  const navigate = useNavigate();
  return <DailySugarEaseExercise onBack={() => handleExitOrOthers(navigate)} />;
}

function HealthyRecipeLogPage() {
  const navigate = useNavigate();
  return <HealthyRecipeLogExercise onBack={() => handleExitOrOthers(navigate)} />;
}


import { Outlet, useLocation } from "react-router";
import { useEffect, useRef } from "react";

function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDirectOpenRef = useRef<boolean>(false);

  useEffect(() => {
    // Determine on initial mount if opened directly into a subroute
    const isRoot = window.location.pathname === '/fitness' || window.location.pathname === '/fitness/';
    if (!isRoot && !isOpenedFromDashboard() && !isOpenedFromOthers()) {
      isDirectOpenRef.current = true;
      // Push an initial dummy state so hardware back trigger triggers popstate instead of exiting whole webview immediately
      try {
        window.history.pushState({ directActivity: true }, '');
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      // If direct deep link into an activity, phone hardware back must invoke handleExit()
      if (isDirectOpenRef.current) {
        handleExit();
        return;
      }

      // If user is at root /fitness and not opened from dashboard
      const pathname = window.location.pathname.replace(/\/+$/, '');
      if (pathname === '/fitness' || pathname === '') {
        if (!isOpenedFromDashboard()) {
          handleExit();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: Dashboard,
      },
      {
        path: "tools/macro-calculator",
        Component: MacroCalculatorPage,
      },
      {
        path: "tools/calorie-burner",
        Component: CalorieBurnerPage,
      },
      {
        path: "tools/fast-timer",
        Component: FastTimerPage,
      },
      {
        path: "tools/bmi-calculator",
        Component: BMICalculatorPage,
      },
      {
        path: "guides/weight-loss",
        Component: WeightLossGuidePage,
      },
      {
        path: "guides/diabetes-diet",
        Component: DiabetesDietGuidePage,
      },
      {
        path: "guides/muscle-gain",
        Component: MuscleGainGuidePage,
      },
      {
        path: "guides/gut-health",
        Component: GutHealthGuidePage,
      },
      {
        path: "guides/keto-basics",
        Component: KetoBasicsGuidePage,
      },
      {
        path: "guides/heart-health",
        Component: HeartHealthGuidePage,
      },
      {
        path: "guides/intermittent-fasting",
        Component: IntermittentFastingGuidePage,
      },
      {
        path: "guides/vegan-nutrition",
        Component: VeganNutritionGuidePage,
      },
      {
        path: "workouts/yoga",
        Component: YogaFlexibilityGuidePage,
      },
      {
        path: "workouts/hiit",
        Component: HIITCardioGuidePage,
      },
      {
        path: "workouts/strength-training",
        Component: StrengthTrainingGuidePage,
      },
      {
        path: "workouts/posture-correction",
        Component: PostureCorrectionGuidePage,
      },
      {
        path: "workouts/home-workouts",
        Component: HomeWorkoutsGuidePage,
      },
      {
        path: "workouts/flexibility",
        Component: FlexibilityMobilityGuidePage,
      },
      {
        path: "learn/macro-education",
        Component: MacroEducationModulePage,
      },
      {
        path: "others",
        Component: OthersDashboard,
      },
      {
        path: "others/food-diary",
        Component: FoodDiaryPage,
      },
      {
        path: "others/plan-your-plate",
        Component: PlanYourPlatePage,
      },
      {
        path: "others/daily-sugar-ease",
        Component: DailySugarEasePage,
      },
      {
        path: "others/healthy-recipe-log",
        Component: HealthyRecipeLogPage,
      },
    ],
  },
], { basename: "/fitness" });
