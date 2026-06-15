import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Dumbbell, Plus, Check, Trash2, Trophy, TrendingUp, Search, AlertCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';
import { logUserActivity } from '@/lib/db';
import { useTranslation } from "react-i18next";

interface Set {
  setNum: number;
  weight: number;
  reps: number;
  completed: boolean;
}

interface Exercise {
  name: string;
  sets: Set[];
  estimated1RM: number;
}

interface WorkoutSession {
  id: string;
  exercises: Exercise[];
  totalVolume: number;
  timestamp: string;
  date: string;
}

interface StrengthData {
  sessions: WorkoutSession[];
  personalRecords: Record<string, number>;
}

interface ExerciseInfo {
  name: string;
  targetMuscles: string[];
  setRepRange: string;
  formTip: string;
  commonMistakes: string[];
}

const exercises = [
  'Squat',
  'Deadlift',
  'Bench Press',
  'Overhead Press',
  'Barbell Row',
  'Pull Up',
  'Chin Up',
  'Lat Pulldown',
  'Seated Cable Row',
  'Dumbbell Row',
  'Romanian Deadlift',
  'Hip Thrust',
  'Lunge',
  'Bulgarian Split Squat',
  'Leg Press',
  'Leg Extension',
  'Leg Curl',
  'Calf Raise',
  'Glute Bridge',
  'Push Up',
  'Incline Dumbbell Press',
  'Dips',
  'Chest Fly',
  'Lateral Raise',
  'Rear Delt Fly',
  'Face Pull',
  'Bicep Curl',
  'Hammer Curl',
  'Tricep Pushdown',
  'Skull Crusher',
  'Plank',
  'Hanging Leg Raise',
  'Russian Twist',
  'Farmer Carry',
  'Shrug',
  'Arnold Press',
  'Front Squat',
  'Sumo Deadlift',
  'Goblet Squat',
  'Step Up',
];

const exerciseLibrary: ExerciseInfo[] = [
  {
    name: 'Squat',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    setRepRange: '3-5 sets x 3-8 reps',
    formTip: 'Keep chest up, brace core, weight on mid-foot, knees track over toes',
    commonMistakes: ['Knees cave inward', 'Lower back rounds', 'Weight shifts to toes'],
  },
  {
    name: 'Deadlift',
    targetMuscles: ['Glutes', 'Hamstrings', 'Lower Back', 'Core', 'Lats'],
    setRepRange: '3-5 sets x 3-6 reps',
    formTip: 'Keep bar close, hinge at hips, neutral spine, push floor away',
    commonMistakes: ['Rounded back', 'Bar drifts forward', 'Hips rise too fast'],
  },
  {
    name: 'Bench Press',
    targetMuscles: ['Chest', 'Triceps', 'Front Delts'],
    setRepRange: '3-5 sets x 4-8 reps',
    formTip: 'Retract shoulders, feet planted, touch lower chest with control',
    commonMistakes: ['Elbows flare too much', 'Bouncing bar', 'Lifting hips off bench'],
  },
  {
    name: 'Overhead Press',
    targetMuscles: ['Shoulders', 'Triceps', 'Core', 'Upper Chest'],
    setRepRange: '3-5 sets x 4-8 reps',
    formTip: 'Brace core, squeeze glutes, press bar overhead in straight path',
    commonMistakes: ['Overarching lower back', 'Pressing forward', 'Incomplete lockout'],
  },
  {
    name: 'Barbell Row',
    targetMuscles: ['Lats', 'Rhomboids', 'Rear Delts', 'Biceps', 'Core'],
    setRepRange: '3-4 sets x 6-10 reps',
    formTip: 'Hinge torso, pull elbows back, keep spine neutral',
    commonMistakes: ['Jerking weight', 'Rounded back', 'Standing too upright'],
  },
  {
    name: 'Pull Up',
    targetMuscles: ['Lats', 'Biceps', 'Upper Back', 'Core'],
    setRepRange: '3-5 sets x 5-10 reps',
    formTip: 'Start from dead hang, drive elbows down, chest toward bar',
    commonMistakes: ['Kipping excessively', 'Half reps', 'Shrugged shoulders'],
  },
  {
    name: 'Chin Up',
    targetMuscles: ['Lats', 'Biceps', 'Upper Back'],
    setRepRange: '3-5 sets x 5-10 reps',
    formTip: 'Use full range, keep chest tall, control lowering phase',
    commonMistakes: ['Swinging body', 'Short reps', 'Neck reaching upward'],
  },
  {
    name: 'Lat Pulldown',
    targetMuscles: ['Lats', 'Biceps', 'Mid Back'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Pull bar to upper chest, keep torso slightly leaned back',
    commonMistakes: ['Pulling behind neck', 'Using momentum', 'Shrugging shoulders'],
  },
  {
    name: 'Seated Cable Row',
    targetMuscles: ['Mid Back', 'Lats', 'Biceps', 'Rear Delts'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Sit tall, pull handle to torso, squeeze shoulder blades',
    commonMistakes: ['Rounding shoulders', 'Leaning back too much', 'Using arms only'],
  },
  {
    name: 'Dumbbell Row',
    targetMuscles: ['Lats', 'Rhomboids', 'Biceps'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Keep hips square, pull elbow to hip, control descent',
    commonMistakes: ['Twisting torso', 'Shrugging shoulder', 'Jerking weight'],
  },
  {
    name: 'Romanian Deadlift',
    targetMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    setRepRange: '3-4 sets x 6-10 reps',
    formTip: 'Soft knees, hinge hips back, keep dumbbells close',
    commonMistakes: ['Turning into squat', 'Rounded back', 'Going too low'],
  },
  {
    name: 'Hip Thrust',
    targetMuscles: ['Glutes', 'Hamstrings', 'Core'],
    setRepRange: '3-5 sets x 8-12 reps',
    formTip: 'Chin tucked, ribs down, squeeze glutes at top',
    commonMistakes: ['Overarching back', 'Pushing through toes', 'Incomplete lockout'],
  },
  {
    name: 'Lunge',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    setRepRange: '3-4 sets x 8-12 reps each leg',
    formTip: 'Step long enough, torso tall, front foot planted',
    commonMistakes: ['Front knee collapsing inward', 'Tiny step length', 'Leaning forward'],
  },
  {
    name: 'Bulgarian Split Squat',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    setRepRange: '3-4 sets x 8-12 reps each leg',
    formTip: 'Front foot far enough forward, descend straight down',
    commonMistakes: ['Pushing off rear leg', 'Wobbling stance', 'Knee cave'],
  },
  {
    name: 'Leg Press',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    setRepRange: '3-4 sets x 10-15 reps',
    formTip: 'Keep lower back on pad, control depth, drive evenly',
    commonMistakes: ['Locking knees hard', 'Butt lifting off seat', 'Shallow reps'],
  },
  {
    name: 'Leg Extension',
    targetMuscles: ['Quadriceps'],
    setRepRange: '3-4 sets x 10-15 reps',
    formTip: 'Control tempo, squeeze quads at top',
    commonMistakes: ['Swinging weight', 'Slamming stack', 'Partial reps'],
  },
  {
    name: 'Leg Curl',
    targetMuscles: ['Hamstrings'],
    setRepRange: '3-4 sets x 10-15 reps',
    formTip: 'Keep hips down, curl smoothly, pause at contraction',
    commonMistakes: ['Using momentum', 'Hips lifting', 'Fast negatives'],
  },
  {
    name: 'Calf Raise',
    targetMuscles: ['Calves'],
    setRepRange: '4-5 sets x 10-20 reps',
    formTip: 'Full stretch at bottom, pause at top',
    commonMistakes: ['Bouncing reps', 'Short range', 'Leaning excessively'],
  },
  {
    name: 'Glute Bridge',
    targetMuscles: ['Glutes', 'Hamstrings', 'Core'],
    setRepRange: '3-4 sets x 12-15 reps',
    formTip: 'Drive through heels, ribs down, squeeze glutes',
    commonMistakes: ['Overarching back', 'Knees flaring too much', 'Rushing reps'],
  },
  {
    name: 'Push Up',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders', 'Core'],
    setRepRange: '3-4 sets x 8-20 reps',
    formTip: 'Body straight, hands under shoulders, chest to floor',
    commonMistakes: ['Sagging hips', 'Flaring elbows', 'Half reps'],
  },
  {
    name: 'Incline Dumbbell Press',
    targetMuscles: ['Upper Chest', 'Shoulders', 'Triceps'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Shoulders back, lower dumbbells with control',
    commonMistakes: ['Bouncing weights', 'Excessive arch', 'Elbows too wide'],
  },
  {
    name: 'Dips',
    targetMuscles: ['Chest', 'Triceps', 'Front Delts'],
    setRepRange: '3-4 sets x 6-12 reps',
    formTip: 'Lean slightly forward, shoulders packed, full control',
    commonMistakes: ['Shrugging shoulders', 'Going too deep painfully', 'Swinging'],
  },
  {
    name: 'Chest Fly',
    targetMuscles: ['Chest', 'Front Delts'],
    setRepRange: '3-4 sets x 10-15 reps',
    formTip: 'Soft elbows, wide arc, squeeze chest together',
    commonMistakes: ['Too much elbow bend', 'Dropping too low', 'Using momentum'],
  },
  {
    name: 'Lateral Raise',
    targetMuscles: ['Side Delts'],
    setRepRange: '3-5 sets x 12-20 reps',
    formTip: 'Raise to shoulder height, lead with elbows',
    commonMistakes: ['Swinging torso', 'Shrugging traps', 'Going too heavy'],
  },
  {
    name: 'Rear Delt Fly',
    targetMuscles: ['Rear Delts', 'Upper Back'],
    setRepRange: '3-4 sets x 12-20 reps',
    formTip: 'Hinge slightly, arms wide, control motion',
    commonMistakes: ['Jerking reps', 'Using traps only', 'Neck tension'],
  },
  {
    name: 'Face Pull',
    targetMuscles: ['Rear Delts', 'Rotator Cuff', 'Upper Back'],
    setRepRange: '3-4 sets x 12-15 reps',
    formTip: 'Pull rope to face, elbows high, rotate outward',
    commonMistakes: ['Lower back lean', 'Too heavy', 'Pulling to chest'],
  },
  {
    name: 'Bicep Curl',
    targetMuscles: ['Biceps', 'Forearms'],
    setRepRange: '3-4 sets x 8-15 reps',
    formTip: 'Keep elbows pinned, full stretch and squeeze',
    commonMistakes: ['Swinging body', 'Elbows drifting forward', 'Partial reps'],
  },
  {
    name: 'Hammer Curl',
    targetMuscles: ['Biceps', 'Brachialis', 'Forearms'],
    setRepRange: '3-4 sets x 8-15 reps',
    formTip: 'Neutral grip, control both directions',
    commonMistakes: ['Using momentum', 'Shrugging shoulders', 'Fast lowering'],
  },
  {
    name: 'Tricep Pushdown',
    targetMuscles: ['Triceps'],
    setRepRange: '3-4 sets x 10-15 reps',
    formTip: 'Elbows fixed at sides, full extension',
    commonMistakes: ['Elbows moving forward', 'Leaning bodyweight', 'Half reps'],
  },
  {
    name: 'Skull Crusher',
    targetMuscles: ['Triceps'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Lower behind forehead, elbows steady',
    commonMistakes: ['Flaring elbows', 'Dropping too fast', 'Excessive weight'],
  },
  {
    name: 'Plank',
    targetMuscles: ['Core', 'Shoulders', 'Glutes'],
    setRepRange: '3-4 sets x 20-60 sec',
    formTip: 'Brace abs, squeeze glutes, body straight line',
    commonMistakes: ['Sagging hips', 'Holding breath', 'Looking forward'],
  },
  {
    name: 'Hanging Leg Raise',
    targetMuscles: ['Lower Abs', 'Hip Flexors', 'Core'],
    setRepRange: '3-4 sets x 8-15 reps',
    formTip: 'Posteriorly tilt pelvis, control swing',
    commonMistakes: ['Using momentum', 'Short range', 'Shrugged shoulders'],
  },
  {
    name: 'Russian Twist',
    targetMuscles: ['Obliques', 'Core'],
    setRepRange: '3-4 sets x 15-20 reps each side',
    formTip: 'Rotate torso, keep chest lifted',
    commonMistakes: ['Only moving arms', 'Rounded back', 'Going too fast'],
  },
  {
    name: 'Farmer Carry',
    targetMuscles: ['Grip', 'Traps', 'Core', 'Glutes'],
    setRepRange: '3-5 sets x 20-40 meters',
    formTip: 'Stand tall, walk controlled, shoulders down',
    commonMistakes: ['Leaning sideways', 'Tiny steps rushed', 'Looking down'],
  },
  {
    name: 'Shrug',
    targetMuscles: ['Traps'],
    setRepRange: '3-4 sets x 10-15 reps',
    formTip: 'Lift shoulders straight up, pause briefly',
    commonMistakes: ['Rolling shoulders', 'Jerking weight', 'Neck jutting'],
  },
  {
    name: 'Arnold Press',
    targetMuscles: ['Shoulders', 'Triceps'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Rotate smoothly, keep core tight',
    commonMistakes: ['Overarching back', 'Too heavy', 'Inconsistent path'],
  },
  {
    name: 'Front Squat',
    targetMuscles: ['Quadriceps', 'Glutes', 'Core', 'Upper Back'],
    setRepRange: '3-5 sets x 3-8 reps',
    formTip: 'Elbows high, chest proud, sit between hips',
    commonMistakes: ['Elbows dropping', 'Heels lifting', 'Rounded upper back'],
  },
  {
    name: 'Sumo Deadlift',
    targetMuscles: ['Glutes', 'Hamstrings', 'Adductors', 'Core'],
    setRepRange: '3-5 sets x 3-6 reps',
    formTip: 'Wide stance, chest tall, push knees out',
    commonMistakes: ['Hips too high', 'Knees collapsing', 'Bar far from body'],
  },
  {
    name: 'Goblet Squat',
    targetMuscles: ['Quadriceps', 'Glutes', 'Core'],
    setRepRange: '3-4 sets x 8-12 reps',
    formTip: 'Hold weight close, elbows down, torso upright',
    commonMistakes: ['Falling forward', 'Heels lifting', 'Shallow depth'],
  },
  {
    name: 'Step Up',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    setRepRange: '3-4 sets x 8-12 reps each leg',
    formTip: 'Drive through top foot, stand fully tall',
    commonMistakes: ['Pushing off rear foot', 'Knee cave', 'Unstable box'],
  },
];

export default function StrengthTrainingGuide({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('StrengthTraining');
  const [activeTab, setActiveTab] = useState<'log' | 'library' | 'progress'>('log');
  const [strengthData, setStrengthData] = useState<StrengthData>(() => {
    const saved = localStorage.getItem('strength-training-data');
    return saved ? JSON.parse(saved) : {
      sessions: [],
      personalRecords: {},
    };
  });

  // Current session state
  const [currentSession, setCurrentSession] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [currentExerciseSets, setCurrentExerciseSets] = useState<Set[]>([{ setNum: 1, weight: 0, reps: 0, completed: false }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('strength-training-data', JSON.stringify(strengthData));
  }, [strengthData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('strength_training');
      const sessions = dbLogs
        .filter(log => log.action_type === 'finish_workout')
        .map(log => {
          const p = log.payload;
          return {
            id: p.session_id,
            exercises: p.exercises.map((ex: any) => ({
              name: ex.name,
              sets: ex.sets.map((s: any) => ({ setNum: s.set_num, weight: s.weight, reps: s.reps, completed: true })),
              estimated1RM: ex.estimated_1rm,
            })),
            totalVolume: p.total_volume_kg,
            timestamp: p.timestamp,
            date: new Date(p.timestamp).toISOString().split('T')[0],
          } as WorkoutSession;
        });

      if (sessions.length > 0) {
        const personalRecords: Record<string, number> = {};
        sessions.forEach(session => {
          session.exercises.forEach(ex => {
            const currentPR = personalRecords[ex.name] || 0;
            if (ex.estimated1RM > currentPR) {
              personalRecords[ex.name] = ex.estimated1RM;
            }
          });
        });

        setStrengthData({
          sessions,
          personalRecords,
        });
      }
    };
    loadDbLogs();
  }, []);

  // Click outside dropdown to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calculate1RM = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    if (reps >= 37) return weight; // Formula breaks down at high reps
    return Math.round(weight * (36 / (37 - reps)));
  };

  const addSet = () => {
    setCurrentExerciseSets(prev => [
      ...prev,
      { setNum: prev.length + 1, weight: 0, reps: 0, completed: false }
    ]);
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    setCurrentExerciseSets(prev => prev.map((set, i) =>
      i === index ? { ...set, [field]: value } : set
    ));
  };

  const toggleSetCompletion = (index: number) => {
    setCurrentExerciseSets(prev => prev.map((set, i) =>
      i === index ? { ...set, completed: !set.completed } : set
    ));
  };

  const removeSet = (index: number) => {
    setCurrentExerciseSets(prev => prev.filter((_, i) => i !== index));
  };

  const completeExercise = () => {
    if (!selectedExercise || currentExerciseSets.length === 0) return;

    const completedSets = currentExerciseSets.filter(set => set.completed && set.weight > 0 && set.reps > 0);
    if (completedSets.length === 0) return;

    // Calculate max 1RM from completed sets
    const estimated1RM = Math.max(...completedSets.map(set => calculate1RM(set.weight, set.reps)));

    const exercise: Exercise = {
      name: selectedExercise,
      sets: completedSets,
      estimated1RM,
    };

    setCurrentSession(prev => [...prev, exercise]);

    // Check for PR
    const currentPR = strengthData.personalRecords[selectedExercise] || 0;
    if (estimated1RM > currentPR) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#475569', '#64748B', '#94A3B8'],
      });
    }

    // Reset for next exercise
    setSelectedExercise('');
    setCurrentExerciseSets([{ setNum: 1, weight: 0, reps: 0, completed: false }]);
  };

  const finishWorkout = () => {
    if (currentSession.length === 0) return;

    const totalVolume = currentSession.reduce((total, exercise) => {
      return total + exercise.sets.reduce((exTotal, set) => {
        return exTotal + (set.weight * set.reps);
      }, 0);
    }, 0);

    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      exercises: currentSession,
      totalVolume,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    // Update PRs
    const newPRs = { ...strengthData.personalRecords };
    currentSession.forEach(exercise => {
      const currentPR = newPRs[exercise.name] || 0;
      if (exercise.estimated1RM > currentPR) {
        newPRs[exercise.name] = exercise.estimated1RM;
      }
    });

    setStrengthData(prev => ({
      sessions: [newSession, ...prev.sessions],
      personalRecords: newPRs,
    }));

    // Log to console for database integration
    logUserActivity('strength_training', 'finish_workout', {
      session_id: newSession.id,
      exercises: currentSession.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ set_num: s.setNum, weight: s.weight, reps: s.reps })),
        estimated_1rm: ex.estimated1RM,
      })),
      total_volume_kg: totalVolume,
      timestamp: newSession.timestamp,
    });

    // Celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#64748B', '#94A3B8', '#CBD5E1'],
    });

    // Reset session
    setCurrentSession([]);
  };

  const getWeeklyVolumeData = () => {
    const weeks: Record<string, number> = {};

    strengthData.sessions.forEach(session => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      weeks[weekKey] = (weeks[weekKey] || 0) + session.totalVolume;
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, volume]) => ({
        week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: Math.round(volume),
      }));
  };

  const get1RMProgressionData = (exerciseName: string) => {
    return strengthData.sessions
      .filter(session => session.exercises.some(ex => ex.name === exerciseName))
      .slice(-10)
      .reverse()
      .map(session => {
        const exercise = session.exercises.find(ex => ex.name === exerciseName);
        return {
          date: new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          oneRM: exercise?.estimated1RM || 0,
        };
      });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back_to_dashboard')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl p-3">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t('strength_training')}</h1>
              <p className="text-sm text-gray-500">{t('track_your_lifts_and_build_progressive_s')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('log_workout')}
                                </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('exercise_library')}
                                </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-3 px-4 rounded-lg transition-all font-medium ${
              activeTab === 'progress'
                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('strength_progress')}
                                </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: Log Workout */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Exercise Selector */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t('select_exercise')}</h3>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 flex items-center justify-between bg-white"
                  >
                    <span className={selectedExercise ? 'text-gray-900' : 'text-gray-400'}>
                      {selectedExercise || 'Choose an exercise...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-white rounded-xl border-2 border-slate-500 shadow-lg"
                      >
                        {/* Search Input Inside Dropdown */}
                        <div className="p-3 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={t('search_exercises')}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-slate-500 focus:outline-none focus:border-slate-600"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Exercise List (Max 5 visible with scroll) */}
                        <div className="max-h-[240px] overflow-y-auto">
                          {exercises
                            .filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((ex, index) => (
                              <button
                                key={ex}
                                onClick={() => {
                                  setSelectedExercise(ex);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-gray-900">{ex}</span>
                              </button>
                            ))}
                          {exercises.filter(ex => ex.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-500">
                              {t('no_exercises_found')}
                                                                                      </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Set Entry */}
              {selectedExercise && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-6 border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900 mb-4">{selectedExercise}</h3>
                  <div className="space-y-3">
                    {currentExerciseSets.map((set, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl ${
                          set.completed ? 'bg-green-50 border-2 border-green-400' : 'bg-gray-50 border-2 border-gray-200'
                        }`}
                      >
                        <div className="col-span-1 text-center font-semibold text-gray-700">
                          {set.setNum}
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                            placeholder={t('weight_kg')}
                            disabled={set.completed}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                            placeholder={t('reps')}
                            disabled={set.completed}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-slate-500/20 disabled:bg-gray-100"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleSetCompletion(index)}
                            className={`p-2 rounded-lg transition-all ${
                              set.completed
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            <Check className="w-5 h-5" />
                          </motion.button>
                          <button
                            onClick={() => removeSet(index)}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        {set.completed && set.weight > 0 && set.reps > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-12 text-sm text-gray-600 text-center"
                          >
                            {t('est_1rm')} <span className="font-bold text-slate-700">{calculate1RM(set.weight, set.reps)}{t('kg')}</span>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={addSet}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {t('add_set')}
                                                              </button>
                    <button
                      onClick={completeExercise}
                      disabled={currentExerciseSets.filter(s => s.completed).length === 0}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {t('complete_exercise')}
                                                              </button>
                  </div>
                </motion.div>
              )}

              {/* Current Session Summary */}
              {currentSession.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('today_s_session')}</h3>
                  <div className="space-y-3 mb-4">
                    {currentSession.map((exercise, index) => (
                      <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{exercise.name}</h4>
                          <span className="text-sm font-bold text-slate-700">
                            {t('1rm')} {exercise.estimated1RM}{t('kg')}
                                                              </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {exercise.sets.length} {t('sets')} {exercise.sets.reduce((sum, s) => sum + (s.weight * s.reps), 0)}{t('kg_total_volume')}
                                                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={finishWorkout}
                    className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                  >
                    {t('finish_workout')}
                                                        </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 2: Exercise Library */}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('exercise_library')}</h2>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={librarySearchQuery}
                    onChange={(e) => {
                      setLibrarySearchQuery(e.target.value);
                      setShowAllExercises(false);
                    }}
                    placeholder={t('search_exercises')}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-6">
                  {exerciseLibrary
                    .filter(exercise =>
                      exercise.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                      exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                    )
                    .slice(0, showAllExercises ? undefined : 5)
                    .map((exercise, index) => (
                    <motion.div
                      key={exercise.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-50 rounded-xl p-6 border border-slate-200"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{exercise.name}</h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {exercise.targetMuscles.map(muscle => (
                              <span
                                key={muscle}
                                className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-medium"
                              >
                                {muscle}
                              </span>
                            ))}
                          </div>
                          <div className="mb-3">
                            <span className="text-sm font-semibold text-slate-700">{t('recommended')} </span>
                            <span className="text-sm text-gray-600">{exercise.setRepRange}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <span className="text-blue-600">✓</span> {t('form_tip')}
                                                            </h4>
                        <p className="text-sm text-gray-700">{exercise.formTip}</p>
                      </div>

                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {t('common_mistakes')}
                                                            </h4>
                        <ul className="space-y-1">
                          {exercise.commonMistakes.map((mistake, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-red-600 mt-0.5">•</span>
                              <span>{mistake}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Show More Button */}
                {!showAllExercises && exerciseLibrary.filter(exercise =>
                  exercise.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                  exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                ).length > 5 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllExercises(true)}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                      {t('show_more_exercises')}{exerciseLibrary.filter(exercise =>
                        exercise.name.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
                        exercise.targetMuscles.some(muscle => muscle.toLowerCase().includes(librarySearchQuery.toLowerCase()))
                      ).length - 5} {t('more')}
                                                              </button>
                  </div>
                )}

                {showAllExercises && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAllExercises(false)}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                    >
                      {t('show_less')}
                                                              </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 3: Strength Progress */}
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Personal Records */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t('personal_records_1rm')}</h3>
                {Object.keys(strengthData.personalRecords).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(strengthData.personalRecords).map(([exercise, pr]) => (
                      <div
                        key={exercise}
                        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border-2 border-slate-200"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Trophy className="w-6 h-6 text-yellow-600" />
                          <h4 className="font-semibold text-gray-900">{exercise}</h4>
                        </div>
                        <p className="text-3xl font-bold text-slate-700">{pr}{t('kg')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">{t('complete_a_workout_to_see_your_prs')}</p>
                )}
              </div>

              {/* Volume Chart */}
              {getWeeklyVolumeData().length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-slate-600" />
                    <h3 className="font-semibold text-gray-900">{t('weekly_volume_progression')}</h3>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getWeeklyVolumeData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar key="bar-volume" dataKey="volume" fill="#475569" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 1RM Progression for Main Lift */}
              {Object.keys(strengthData.personalRecords).length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{t('1rm_progression')}</h3>
                  {Object.keys(strengthData.personalRecords).slice(0, 1).map(exerciseName => {
                    const data = get1RMProgressionData(exerciseName);
                    if (data.length === 0) return null;

                    return (
                      <div key={exerciseName}>
                        <p className="text-sm text-gray-600 mb-4">{exerciseName}</p>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis label={{ value: '1RM (kg)', angle: -90, position: 'insideLeft' }} />
                              <Tooltip />
                              <Legend />
                              <Line
                                key="line-1rm"
                                type="monotone"
                                dataKey="oneRM"
                                stroke="#475569"
                                strokeWidth={3}
                                name="Estimated 1RM"
                                dot={{ fill: '#475569', r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {strengthData.sessions.length === 0 && (
                <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
                  <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{t('no_workouts_logged_yet')}</h3>
                  <p className="text-sm text-gray-600">{t('start_logging_your_lifts_to_track_your_p')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
