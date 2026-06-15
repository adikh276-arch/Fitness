import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Home, Dumbbell, Droplets, Calendar, Award, TrendingUp, Flame, Clock, Zap, CheckCircle2, AlertCircle, Play, Pause, RotateCcw, X, Eye, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logUserActivity, fetchUserActivityLogs } from '@/lib/db';
import { useTranslation } from "react-i18next";

type GearType = 'no-equipment' | 'dumbbells' | 'bands' | 'chair';

interface Exercise {
  name: string;
  duration: number;
  description: string;
  gif: string;
}

interface Workout {
  id: string;
  name: string;
  duration: number;
  intensity: 'Low' | 'Medium' | 'High';
  requiredGear: GearType[];
  description: string;
  caloriesEstimate: number;
  exercises: Exercise[];
  emoji: string;
}

interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  duration: number;
  rpeScore: number;
  caloriesEst: number;
  timestamp: string;
  date: string;
}

interface HomeWorkoutData {
  gearAvailable: GearType[];
  sessions: WorkoutSession[];
}

const gearOptions = [
  {
    id: 'no-equipment' as GearType,
    name: 'None',
    description: 'Bodyweight only',
    icon: '💪',
    color: 'from-rose-500 to-pink-500',
  },
  {
    id: 'dumbbells' as GearType,
    name: 'Dumbbells',
    description: 'Free weights',
    icon: '🏋️',
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'bands' as GearType,
    name: 'Bands',
    description: 'Resistance bands',
    icon: '🔗',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'chair' as GearType,
    name: 'Chair',
    description: 'Stable surface',
    icon: '🪑',
    color: 'from-amber-500 to-orange-500',
  },
];

const workouts: Workout[] = [
  {
    id: 'full-body-blast',
    name: 'Full Body Blast',
    duration: 20,
    intensity: 'High',
    requiredGear: ['no-equipment'],
    description: 'High intensity bodyweight workout hitting all major muscle groups',
    caloriesEstimate: 180,
    emoji: '🔥',
    exercises: [
      {
        name: 'Jumping Jacks',
        duration: 45,
        description: 'Jump feet out wide while raising arms overhead, then return to start.',
        gif: '🏃',
      },
      {
        name: 'Push-ups',
        duration: 45,
        description: 'Lower chest to floor with elbows at 45°, push back up to start.',
        gif: '💪',
      },
      {
        name: 'Bodyweight Squats',
        duration: 45,
        description: 'Lower hips back and down, keeping chest up, then drive through heels.',
        gif: '🦵',
      },
      {
        name: 'Mountain Climbers',
        duration: 45,
        description: 'In plank position, drive knees to chest alternating quickly.',
        gif: '🏔️',
      },
      {
        name: 'Plank Hold',
        duration: 45,
        description: 'Hold forearm plank with body in straight line, core engaged.',
        gif: '🧍',
      },
    ],
  },
  {
    id: 'chair-strength',
    name: 'Chair Strength',
    duration: 20,
    intensity: 'Medium',
    requiredGear: ['chair'],
    description: 'Use a chair for triceps, step-ups, and incline work',
    caloriesEstimate: 160,
    emoji: '🪑',
    exercises: [
      {
        name: 'Incline Push-ups',
        duration: 40,
        description: 'Hands on chair, lower chest toward chair, push back up.',
        gif: '🤲',
      },
      {
        name: 'Tricep Dips',
        duration: 40,
        description: 'Hands on chair edge, lower body by bending elbows, push back up.',
        gif: '💪',
      },
      {
        name: 'Chair Step-ups',
        duration: 40,
        description: 'Step onto chair with one foot, drive through heel to stand tall.',
        gif: '🦶',
      },
      {
        name: 'Seated Knee Tucks',
        duration: 40,
        description: 'Seated on edge, lean back, bring knees to chest, extend legs.',
        gif: '🦵',
      },
    ],
  },
  {
    id: 'core-abs',
    name: 'Core & Abs',
    duration: 15,
    intensity: 'Medium',
    requiredGear: ['no-equipment'],
    description: 'Floor-based core strengthening routine',
    caloriesEstimate: 120,
    emoji: '⚡',
    exercises: [
      {
        name: 'Crunches',
        duration: 40,
        description: 'Lie back, lift shoulders off floor, squeeze abs, lower slowly.',
        gif: '🧘',
      },
      {
        name: 'Russian Twists',
        duration: 40,
        description: 'Seated, lean back, rotate torso side to side touching floor.',
        gif: '🔄',
      },
      {
        name: 'Leg Raises',
        duration: 40,
        description: 'Lie flat, lift straight legs to 90°, lower slowly without touching floor.',
        gif: '🦵',
      },
      {
        name: 'Bicycle Crunches',
        duration: 40,
        description: 'Alternate bringing elbow to opposite knee in cycling motion.',
        gif: '🚴',
      },
    ],
  },
  {
    id: 'express-10',
    name: 'Express 10-min',
    duration: 10,
    intensity: 'Low',
    requiredGear: ['no-equipment'],
    description: 'Quick workout perfect between meetings',
    caloriesEstimate: 80,
    emoji: '⏱️',
    exercises: [
      {
        name: 'Jumping Jacks',
        duration: 40,
        description: 'Jump feet out wide while raising arms overhead.',
        gif: '🏃',
      },
      {
        name: 'Push-ups',
        duration: 40,
        description: 'Lower chest to floor, push back up to start.',
        gif: '💪',
      },
      {
        name: 'Squats',
        duration: 40,
        description: 'Lower hips back and down, drive through heels to stand.',
        gif: '🦵',
      },
      {
        name: 'High Knees',
        duration: 40,
        description: 'Run in place bringing knees to hip height alternating quickly.',
        gif: '🏃',
      },
    ],
  },
  {
    id: 'band-resistance',
    name: 'Band Resistance',
    duration: 25,
    intensity: 'Medium',
    requiredGear: ['bands'],
    description: 'Full body toning with resistance bands',
    caloriesEstimate: 190,
    emoji: '🎯',
    exercises: [
      {
        name: 'Band Squats',
        duration: 45,
        description: 'Stand on band, hold handles at shoulders, squat down.',
        gif: '🦵',
      },
      {
        name: 'Band Rows',
        duration: 45,
        description: 'Secure band, pull handles to ribs squeezing shoulder blades.',
        gif: '🫱',
      },
      {
        name: 'Band Chest Press',
        duration: 45,
        description: 'Band behind back, press handles forward at chest height.',
        gif: '💪',
      },
      {
        name: 'Band Curls',
        duration: 45,
        description: 'Stand on band, curl handles to shoulders keeping elbows still.',
        gif: '💪',
      },
      {
        name: 'Band Lateral Raises',
        duration: 45,
        description: 'Stand on band center, raise handles to shoulder height.',
        gif: '🤲',
      },
    ],
  },
  {
    id: 'dumbbell-power',
    name: 'Dumbbell Power',
    duration: 30,
    intensity: 'High',
    requiredGear: ['dumbbells'],
    description: 'Build muscle with compound dumbbell movements',
    caloriesEstimate: 240,
    emoji: '🏋️',
    exercises: [
      {
        name: 'Dumbbell Squats',
        duration: 45,
        description: 'Hold dumbbells at shoulders, squat down, drive through heels.',
        gif: '🦵',
      },
      {
        name: 'Dumbbell Press',
        duration: 45,
        description: 'Dumbbells at shoulders, press overhead to full extension.',
        gif: '🙌',
      },
      {
        name: 'Dumbbell Rows',
        duration: 45,
        description: 'Hinge forward, pull dumbbells to ribs, squeeze shoulder blades.',
        gif: '🫱',
      },
      {
        name: 'Dumbbell Lunges',
        duration: 45,
        description: 'Hold dumbbells at sides, step forward into lunge, alternate legs.',
        gif: '🦶',
      },
      {
        name: 'Dumbbell Curls',
        duration: 45,
        description: 'Curl dumbbells to shoulders, control the descent.',
        gif: '💪',
      },
    ],
  },
];

export default function HomeWorkoutsGuide({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation('HomeWorkouts');
  const [activeTab, setActiveTab] = useState<'library' | 'tracker'>('library');
  const [homeWorkoutData, setHomeWorkoutData] = useState<HomeWorkoutData>(() => {
    const saved = localStorage.getItem('home-workouts-data');
    return saved ? JSON.parse(saved) : {
      gearAvailable: [],
      sessions: [],
    };
  });

  // Filter state
  const [activeFilters, setActiveFilters] = useState<GearType[]>([]);

  // Workout player state
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showWorkoutPreview, setShowWorkoutPreview] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<'work' | 'rest'>('work');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showWorkoutComplete, setShowWorkoutComplete] = useState(false);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);

  // Progress tracker pre-fill state
  const [prefilledWorkout, setPrefilledWorkout] = useState('');
  const [prefilledDuration, setPrefilledDuration] = useState('');
  const [rpeScore, setRpeScore] = useState(5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const workoutStartTime = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem('home-workouts-data', JSON.stringify(homeWorkoutData));
  }, [homeWorkoutData]);

  // Load from Neon DB on mount
  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('home_workout');
      const sessions = dbLogs
        .filter(log => log.action_type === 'log_workout')
        .map(log => {
          const p = log.payload;
          const workout = workouts.find(w => w.id === p.workout_id);
          return {
            id: log.id.toString(),
            workoutId: p.workout_id,
            workoutName: workout ? workout.name : 'Custom Workout',
            duration: p.duration_mins,
            rpeScore: p.rpe_score,
            caloriesEst: p.calories_burned,
            timestamp: p.timestamp,
            date: new Date(p.timestamp).toISOString().split('T')[0]
          } as WorkoutSession;
        });

      if (sessions.length > 0) {
        setHomeWorkoutData(prev => ({
          ...prev,
          sessions,
        }));
      }
    };
    loadDbLogs();
  }, []);

  // Workout timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayerActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayerActive, isPaused, timeRemaining, phase]);

  const playGoWhistle = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const playFinishChime = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;

    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);

      oscillator.start(ctx.currentTime + i * 0.15);
      oscillator.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  };

  const toggleFilter = (gear: GearType) => {
    setActiveFilters(prev =>
      prev.includes(gear)
        ? prev.filter(g => g !== gear)
        : [...prev, gear]
    );
  };

  const getFilteredWorkouts = () => {
    if (activeFilters.length === 0) return workouts;
    return workouts.filter(workout =>
      workout.requiredGear.every(gear => activeFilters.includes(gear))
    );
  };

  const loadWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setShowWorkoutPreview(true);
    setIsPlayerActive(false);
    setShowWorkoutComplete(false);
  };

  const startWorkout = () => {
    if (!selectedWorkout) return;
    setShowWorkoutPreview(false);
    setIsPlayerActive(true);
    setCurrentExerciseIndex(0);
    setPhase('work');
    setTimeRemaining(selectedWorkout.exercises[0].duration);
    setIsPaused(false);
    workoutStartTime.current = Date.now();
    playGoWhistle();
  };

  const cancelWorkout = () => {
    setIsPlayerActive(false);
    setShowWorkoutPreview(false);
    setSelectedWorkout(null);
    setCurrentExerciseIndex(0);
    setPhase('work');
    setTimeRemaining(0);
    setIsPaused(false);
  };

  const pauseWorkout = () => {
    setIsPaused(true);
  };

  const resumeWorkout = () => {
    setIsPaused(false);
  };


  const handlePhaseComplete = () => {
    if (!selectedWorkout) return;

    if (phase === 'work') {
      // Work phase complete, go to rest
      if (currentExerciseIndex < selectedWorkout.exercises.length - 1) {
        setPhase('rest');
        setTimeRemaining(15);
      } else {
        // Last exercise complete
        completeWorkout();
      }
    } else {
      // Rest phase complete, go to next exercise
      const nextIndex = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIndex);
      setPhase('work');
      setTimeRemaining(selectedWorkout.exercises[nextIndex].duration);
      playGoWhistle();
    }
  };

  const skipRest = () => {
    if (!selectedWorkout || phase !== 'rest') return;
    const nextIndex = currentExerciseIndex + 1;
    setCurrentExerciseIndex(nextIndex);
    setPhase('work');
    setTimeRemaining(selectedWorkout.exercises[nextIndex].duration);
    playGoWhistle();
  };

  const skipExercise = () => {
    if (!selectedWorkout || phase !== 'work') return;

    if (currentExerciseIndex < selectedWorkout.exercises.length - 1) {
      // Go to rest phase
      setPhase('rest');
      setTimeRemaining(15);
    } else {
      // Last exercise, complete workout
      completeWorkout();
    }
  };

  const completeWorkout = () => {
    if (!selectedWorkout) return;

    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - workoutStartTime.current) / 60000);
    const caloriesBurned = Math.round((selectedWorkout.caloriesEstimate / selectedWorkout.duration) * durationMinutes);

    setActualDuration(durationMinutes);
    setTotalCaloriesBurned(caloriesBurned);
    setIsPlayerActive(false);
    setShowWorkoutComplete(true);
    playFinishChime();

    // Confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FB7185', '#F472B6', '#FDA4AF'],
    });
  };

  const saveToProgressTracker = () => {
    if (!selectedWorkout) return;

    setPrefilledWorkout(selectedWorkout.id);
    setPrefilledDuration(actualDuration.toString());
    setShowWorkoutComplete(false);
    setSelectedWorkout(null);
    setActiveTab('tracker');
  };

  const logSession = () => {
    if (!prefilledWorkout || !prefilledDuration) return;

    const workout = workouts.find(w => w.id === prefilledWorkout);
    if (!workout) return;

    const durationNum = parseInt(prefilledDuration);
    const caloriesEst = Math.round((workout.caloriesEstimate / workout.duration) * durationNum);
    const today = new Date().toISOString().split('T')[0];

    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      workoutId: prefilledWorkout,
      workoutName: workout.name,
      duration: durationNum,
      rpeScore,
      caloriesEst,
      timestamp: new Date().toISOString(),
      date: today,
    };

    setHomeWorkoutData(prev => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
    }));

    // Log to console for database integration
    logUserActivity('home_workout', 'log_workout', {
      workout_id: prefilledWorkout,
      gear_used: workout.requiredGear,
      duration_mins: durationNum,
      rpe_score: rpeScore,
      calories_burned: caloriesEst,
      timestamp: new Date().toISOString(),
    });

    // Celebrate
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FB7185', '#F472B6', '#FDA4AF'],
    });

    // Reset form
    setPrefilledWorkout('');
    setPrefilledDuration('');
    setRpeScore(5);
  };

  const getWeeklyMinutes = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return homeWorkoutData.sessions
      .filter(session => new Date(session.date) >= weekStart)
      .reduce((sum, session) => sum + session.duration, 0);
  };

  const getThisWeekSessions = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return homeWorkoutData.sessions.filter(session => new Date(session.date) >= weekStart);
  };

  const get30DayStreak = () => {
    const today = new Date();
    const daysArray = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateStr = date.toISOString().split('T')[0];
      const dayNumber = 30 - i; // Day 1 is 30 days ago, Day 30 is today
      const hasWorkout = homeWorkoutData.sessions.some(s => s.date === dateStr);

      daysArray.push({ day: dayNumber, hasWorkout, date: dateStr });
    }

    return daysArray;
  };

  const getIntensityColor = (intensity: string) => {
    if (intensity === 'Low') return 'text-green-600 bg-green-100';
    if (intensity === 'Medium') return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressPercentage = () => {
    if (!selectedWorkout) return 0;
    const totalExercises = selectedWorkout.exercises.length;
    const completedExercises = currentExerciseIndex + (phase === 'rest' ? 1 : 0);
    return (completedExercises / totalExercises) * 100;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex justify-center py-4 px-4 lg:py-8 lg:px-0">
      <div className="w-full max-w-[1000px] lg:w-[1000px]">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm lg:text-base">{t('back_to_dashboard')}</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-2.5 lg:p-3">
              <Home className="w-6 lg:w-8 h-6 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{t('home_workouts')}</h1>
              <p className="text-xs lg:text-sm text-gray-500">{t('train_anywhere_with_what_you_have')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2.5 lg:py-3 px-4 rounded-lg transition-all font-medium text-sm lg:text-base ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('workout_library')}
                                </button>
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 py-2.5 lg:py-3 px-4 rounded-lg transition-all font-medium text-sm lg:text-base ${
              activeTab === 'tracker'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('progress_tracker')}
                                </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: Workout Library */}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Workout Preview Screen */}
              {showWorkoutPreview && selectedWorkout ? (
                <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{selectedWorkout.name}</h2>
                    <button
                      onClick={() => {
                        setShowWorkoutPreview(false);
                        setSelectedWorkout(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6 text-sm lg:text-base">{selectedWorkout.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200 text-center">
                      <Clock className="w-5 h-5 text-rose-600 mx-auto mb-2" />
                      <div className="text-xl lg:text-2xl font-bold text-gray-900">{selectedWorkout.duration}</div>
                      <div className="text-xs text-gray-600">{t('minutes')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200 text-center">
                      <Flame className="w-5 h-5 text-rose-600 mx-auto mb-2" />
                      <div className="text-xl lg:text-2xl font-bold text-gray-900">~{selectedWorkout.caloriesEstimate}</div>
                      <div className="text-xs text-gray-600">{t('calories')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200 text-center">
                      <Zap className="w-5 h-5 text-rose-600 mx-auto mb-2" />
                      <div className="text-xl lg:text-2xl font-bold text-gray-900">{selectedWorkout.exercises.length}</div>
                      <div className="text-xs text-gray-600">{t('exercises_2')}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">{t('exercises_in_this_workout')}</h3>
                    <div className="space-y-2">
                      {selectedWorkout.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
                        >
                          <div className="text-2xl">{exercise.gif}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm lg:text-base">{exercise.name}</div>
                            <div className="text-xs text-gray-600">{exercise.duration}{t('s')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowWorkoutPreview(false);
                        setSelectedWorkout(null);
                      }}
                      className="flex-1 py-3 lg:py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm lg:text-base"
                    >
                      {t('cancel')}
                                                              </button>
                    <button
                      onClick={startWorkout}
                      className="flex-1 py-3 lg:py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <Play className="w-5 h-5" />
                      {t('start_workout')}
                                                              </button>
                  </div>
                </div>
              ) : showWorkoutComplete && selectedWorkout ? (
                <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-gray-200">
                  <div className="text-center">
                    <div className="text-6xl lg:text-7xl mb-4">🎉</div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{t('workout_complete')}</h2>
                    <p className="text-gray-600 mb-6 text-sm lg:text-base">
                      {t('great_job_finishing')} {selectedWorkout.name}!
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
                        <div className="text-xs lg:text-sm text-gray-600 mb-1">{t('total_time')}</div>
                        <div className="text-2xl lg:text-3xl font-bold text-rose-600">{actualDuration}{t('m')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200">
                        <div className="text-xs lg:text-sm text-gray-600 mb-1">{t('est_calories')}</div>
                        <div className="text-2xl lg:text-3xl font-bold text-rose-600">{totalCaloriesBurned}</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <button
                        onClick={saveToProgressTracker}
                        className="flex-1 py-3 lg:py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold hover:scale-105 transition-all text-sm lg:text-base"
                      >
                        {t('save_to_progress_tracker')}
                                                                        </button>
                      <button
                        onClick={() => {
                          setShowWorkoutComplete(false);
                          setSelectedWorkout(null);
                        }}
                        className="flex-1 py-3 lg:py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm lg:text-base"
                      >
                        {t('done')}
                                                                        </button>
                    </div>
                  </div>
                </div>
              ) : isPlayerActive && selectedWorkout ? (
                // Workout Player
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-rose-600">
                  {/* Progress Bar */}
                  <div className="mb-6 lg:mb-8">
                    <div className="w-full bg-rose-400/30 rounded-full h-2 lg:h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        className="h-full bg-white rounded-full transition-all duration-300"
                      />
                    </div>
                    <p className="text-white text-xs lg:text-sm mt-2 text-center">
                      {t('exercise')} {currentExerciseIndex + 1} {t('of')} {selectedWorkout.exercises.length}
                    </p>
                  </div>

                  {phase === 'work' ? (
                    // Work Phase
                    <div className="text-center text-white">
                      <div className="text-6xl lg:text-7xl mb-4 lg:mb-6">{selectedWorkout.exercises[currentExerciseIndex].gif}</div>
                      <h2 className="text-2xl lg:text-3xl font-bold mb-3">{selectedWorkout.exercises[currentExerciseIndex].name}</h2>
                      <p className="text-rose-100 mb-6 lg:mb-8 text-sm lg:text-base max-w-2xl mx-auto">
                        {selectedWorkout.exercises[currentExerciseIndex].description}
                      </p>

                      {/* Circular Timer */}
                      <div className="relative w-40 h-40 lg:w-56 lg:h-56 mx-auto mb-6 lg:mb-8">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke="white"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={2 * Math.PI * 45 * (1 - timeRemaining / selectedWorkout.exercises[currentExerciseIndex].duration)}
                            strokeLinecap="round"
                            className="transition-all duration-300"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-4xl lg:text-6xl font-bold">{timeRemaining}{t('s')}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:gap-3 justify-center flex-wrap">
                        {isPaused ? (
                          <button
                            onClick={resumeWorkout}
                            className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white text-rose-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                          >
                            <Play className="w-4 lg:w-5 h-4 lg:h-5" />
                            {t('resume')}
                                                                                        </button>
                        ) : (
                          <button
                            onClick={pauseWorkout}
                            className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white text-rose-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                          >
                            <Pause className="w-4 lg:w-5 h-4 lg:h-5" />
                            {t('pause')}
                                                                                            </button>
                        )}
                        <button
                          onClick={skipExercise}
                          className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white/90 text-rose-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                        >
                          <ChevronRight className="w-4 lg:w-5 h-4 lg:h-5" />
                          {t('skip')}
                                                                                  </button>
                        <button
                          onClick={cancelWorkout}
                          className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white/90 text-rose-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                        >
                          <X className="w-4 lg:w-5 h-4 lg:h-5" />
                          {t('cancel')}
                                                                                  </button>
                      </div>
                    </div>
                  ) : (
                    // Rest Phase
                    <div className="text-center text-white">
                      <div className="text-6xl lg:text-7xl mb-4 lg:mb-6">💧</div>
                      <h2 className="text-2xl lg:text-3xl font-bold mb-3">{t('hydrate_rest')}</h2>
                      <p className="text-rose-100 mb-6 lg:mb-8 text-sm lg:text-base">{t('take_a_breather_grab_some_water')}</p>

                      <div className="text-5xl lg:text-6xl font-bold mb-6 lg:mb-8">{timeRemaining}{t('s')}</div>

                      {/* Next Exercise Preview */}
                      {currentExerciseIndex < selectedWorkout.exercises.length - 1 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-5 max-w-md mx-auto mb-6">
                          <div className="flex items-center gap-2 text-xs lg:text-sm text-rose-100 mb-3">
                            <Eye className="w-4 h-4" />
                            {t('next_up')}
                                                                                            </div>
                          <div className="flex items-center gap-4">
                            <div className="text-3xl lg:text-4xl">{selectedWorkout.exercises[currentExerciseIndex + 1].gif}</div>
                            <div className="text-left">
                              <div className="font-bold text-base lg:text-lg">{selectedWorkout.exercises[currentExerciseIndex + 1].name}</div>
                              <div className="text-xs lg:text-sm text-rose-100">{selectedWorkout.exercises[currentExerciseIndex + 1].duration}{t('s_work')}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={skipRest}
                        className="py-2 lg:py-2.5 px-6 lg:px-8 bg-white text-rose-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all text-xs lg:text-sm"
                      >
                        {t('skip_rest')}
                                                                                </button>
                    </div>
                  )}
                </div>
              ) : (
                // Normal Library View
                <>
                  {/* Equipment Filters */}
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('filter_by_equipment')}</h2>
                    <div className="flex gap-2 lg:gap-3 overflow-x-auto pb-2">
                      {gearOptions.map((gear) => (
                        <motion.button
                          key={gear.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleFilter(gear.id)}
                          className={`flex-shrink-0 px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg lg:rounded-xl font-medium transition-all text-sm lg:text-base ${
                            activeFilters.includes(gear.id)
                              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg border-2 border-rose-600'
                              : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-rose-300'
                          }`}
                        >
                          <span className="mr-2">{gear.icon}</span>
                          {gear.name}
                        </motion.button>
                      ))}
                    </div>
                    {activeFilters.length > 0 && (
                      <button
                        onClick={() => setActiveFilters([])}
                        className="mt-3 text-xs lg:text-sm text-rose-600 hover:text-rose-700 font-medium"
                      >
                        {t('clear_all_filters')}
                                                                                </button>
                    )}
                  </div>

                  {/* Workout Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <AnimatePresence mode="popLayout">
                  {getFilteredWorkouts().map((workout) => (
                    <motion.div
                      key={workout.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                      className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200 hover:border-rose-300 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-3 lg:mb-4">
                        <div className="text-4xl lg:text-5xl">{workout.emoji}</div>
                        <span className={`px-2.5 lg:px-3 py-1 rounded-full text-xs font-semibold ${getIntensityColor(workout.intensity)}`}>
                          {workout.intensity}
                        </span>
                      </div>
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{workout.name}</h3>
                      <p className="text-xs lg:text-sm text-gray-600 mb-4">{workout.description}</p>

                      <div className="flex items-center gap-3 lg:gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-rose-600" />
                          <span className="text-xs lg:text-sm font-medium text-gray-700">{workout.duration} {t('min_2')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-rose-600" />
                          <span className="text-xs lg:text-sm font-medium text-gray-700">~{workout.caloriesEstimate} {t('cal')}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">{t('equipment')}</p>
                        <div className="flex flex-wrap gap-2">
                          {workout.requiredGear.map(gearId => {
                            const gear = gearOptions.find(g => g.id === gearId);
                            return (
                              <span key={gearId} className="text-xl lg:text-2xl">
                                {gear?.icon}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">{workout.exercises.length} {t('exercises')}</p>
                        <div className="flex flex-wrap gap-2">
                          {workout.exercises.slice(0, 3).map(ex => (
                            <span key={ex.name} className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded">
                              {ex.name}
                            </span>
                          ))}
                          {workout.exercises.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              +{workout.exercises.length - 3} {t('more')}
                                                                      </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => loadWorkout(workout)}
                        className="w-full py-2.5 lg:py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg lg:rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                      >
                        <Play className="w-4 lg:w-5 h-4 lg:h-5" />
                        {t('load_workout')}
                                                    </button>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                  </div>

                  {getFilteredWorkouts().length === 0 && (
                    <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 border border-gray-200 text-center">
                      <Dumbbell className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="font-semibold text-gray-900 mb-2 text-base lg:text-lg">{t('no_matching_workouts')}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('try_a_different_equipment_combination_or')}
                                                                                </p>
                      <button
                        onClick={() => setActiveFilters([])}
                        className="px-6 py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all text-sm lg:text-base"
                      >
                        {t('show_all_workouts')}
                                                                                </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* Tab 2: Progress Tracker */}
          {activeTab === 'tracker' && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Session Logger */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('log_your_workout')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      {t('workout_name')}
                                                              </label>
                    <select
                      value={prefilledWorkout}
                      onChange={(e) => setPrefilledWorkout(e.target.value)}
                      className="w-full px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm lg:text-base"
                    >
                      <option value="">{t('select_a_workout')}</option>
                      {workouts.map(workout => (
                        <option key={workout.id} value={workout.id}>
                          {workout.name} ({workout.duration} {t('min')}
                                                      </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      {t('actual_duration_minutes')}
                                                              </label>
                    <input
                      type="number"
                      value={prefilledDuration}
                      onChange={(e) => setPrefilledDuration(e.target.value)}
                      placeholder="30"
                      className="w-full px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm lg:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-3">
                      {t('rate_of_perceived_exertion_rpe')} {rpeScore}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rpeScore}
                      onChange={(e) => setRpeScore(parseInt(e.target.value))}
                      className="w-full h-2 lg:h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #86EFAC 0%, #FDE047 50%, #EF4444 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{t('1_easy')}</span>
                      <span>{t('5_moderate')}</span>
                      <span>{t('10_max_effort')}</span>
                    </div>
                  </div>

                  <button
                    onClick={logSession}
                    disabled={!prefilledWorkout || !prefilledDuration}
                    className="w-full py-3 lg:py-4 px-6 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm lg:text-base"
                  >
                    {t('log_workout')}
                                                        </button>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{t('weekly_active_minutes')}</h3>
                  <TrendingUp className="w-5 h-5 text-rose-600" />
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 text-xs lg:text-sm">{t('progress')}</span>
                    <span className="font-semibold text-gray-900 text-xs lg:text-sm">
                      {getWeeklyMinutes()} {t('150_mins')}
                                                              </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((getWeeklyMinutes() / 150) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
                    />
                  </div>
                </div>
                {getWeeklyMinutes() >= 150 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-200"
                  >
                    <p className="text-xs lg:text-sm font-medium text-rose-900 text-center">
                      {t('weekly_goal_achieved_you_re_a_fitness_ch')}
                                                              </p>
                  </motion.div>
                )}
              </div>

              {/* Home Hero Badge */}
              {getThisWeekSessions().length >= 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl lg:rounded-2xl p-6 text-center"
                >
                  <Award className="w-12 lg:w-16 h-12 lg:h-16 text-white mx-auto mb-3" />
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">{t('home_hero')}</h3>
                  <p className="text-yellow-50 text-sm lg:text-base">
                    {t('you_ve_completed')} {getThisWeekSessions().length} {t('home_workouts_this_week')}
                                                        </p>
                </motion.div>
              )}

              {/* 30 Day Streak */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{t('30_day_streak')}</h3>
                  <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{t('last_30_days')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {get30DayStreak().map((day, index) => (
                    <div
                      key={`${day.date}-${index}`}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs lg:text-sm font-medium transition-all ${
                        day.hasWorkout
                          ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {day.hasWorkout ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-white"
                        />
                      ) : (
                        day.day
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs lg:text-sm text-gray-500 mt-4 text-center">
                  {t('pink_dots_mark_days_with_completed_worko')}
                                                  </p>
              </div>

              {/* Recent Sessions */}
              {homeWorkoutData.sessions.length > 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm lg:text-base">{t('recent_workouts')}</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {homeWorkoutData.sessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 lg:p-4 rounded-lg lg:rounded-xl bg-rose-50 border border-rose-100"
                      >
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm lg:text-base">
                            {session.duration}{t('m')}
                                                              </div>
                          <div>
                            <p className="text-xs lg:text-sm font-semibold text-gray-900">{session.workoutName}</p>
                            <p className="text-xs text-gray-600">
                              {t('rpe')} {session.rpeScore}/10 • ~{session.caloriesEst} {t('calories')}
                                                                    </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {homeWorkoutData.sessions.length === 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 border border-gray-200 text-center">
                  <Home className="w-12 lg:w-16 h-12 lg:h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2 text-base lg:text-lg">{t('no_workouts_logged_yet')}</h3>
                  <p className="text-sm text-gray-600">{t('start_tracking_your_home_workouts_to_see')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
