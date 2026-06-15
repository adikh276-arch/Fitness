import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Play, Pause, RotateCcw, TrendingUp, Award, Flame, Timer, SkipForward, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logUserActivity, fetchUserActivityLogs } from '@/lib/db';

interface Exercise {
  name: string;
  duration: number;
  metValue: number;
  emoji: string;
  animation: string;
}

interface WorkoutLog {
  id: string;
  workoutName: string;
  actualDuration: number;
  rpeScore: number;
  totalCaloriesWithEpoc: number;
  intervalsCompleted: number;
  exercisesCompleted: string[];
  timestamp: string;
}

interface HIITData {
  workoutLogs: WorkoutLog[];
  totalWorkouts: number;
  totalHighIntensityMinutes: number;
  averageRPE: number;
}

interface TimerConfig {
  warmup: number;
  work: number;
  rest: number;
  rounds: number;
}

type TimerPhase = 'idle' | 'warmup' | 'work' | 'rest' | 'complete';

const workoutExercises: Record<string, Exercise[]> = {
  tabata: [
    { name: 'Burpees', duration: 20, metValue: 12.0, emoji: '💥', animation: 'burpees' },
    { name: 'Jump Squats', duration: 20, metValue: 10.0, emoji: '⬆️', animation: 'jump-squat' },
    { name: 'Mountain Climbers', duration: 20, metValue: 11.0, emoji: '⛰️', animation: 'mountain-climbers' },
    { name: 'High Knees', duration: 20, metValue: 10.0, emoji: '🦵', animation: 'high-knees' },
    { name: 'Plank Jacks', duration: 20, metValue: 9.0, emoji: '🏋️', animation: 'plank-jacks' },
    { name: 'Burpees', duration: 20, metValue: 12.0, emoji: '💥', animation: 'burpees' },
    { name: 'Jump Squats', duration: 20, metValue: 10.0, emoji: '⬆️', animation: 'jump-squat' },
    { name: 'Sprint in Place', duration: 20, metValue: 12.0, emoji: '🏃', animation: 'sprint' },
  ],
  'full-body': [
    { name: 'Burpees', duration: 40, metValue: 12.0, emoji: '💥', animation: 'burpees' },
    { name: 'Jump Squats', duration: 40, metValue: 10.0, emoji: '⬆️', animation: 'jump-squat' },
    { name: 'Mountain Climbers', duration: 40, metValue: 11.0, emoji: '⛰️', animation: 'mountain-climbers' },
    { name: 'Push-up to T', duration: 40, metValue: 9.0, emoji: '💪', animation: 'pushup' },
    { name: 'High Knees', duration: 40, metValue: 10.0, emoji: '🦵', animation: 'high-knees' },
    { name: 'Plank to Down Dog', duration: 40, metValue: 8.0, emoji: '🧘', animation: 'plank' },
    { name: 'Jumping Lunges', duration: 40, metValue: 10.0, emoji: '🦿', animation: 'lunges' },
    { name: 'Spider Crawl', duration: 40, metValue: 9.0, emoji: '🕷️', animation: 'crawl' },
    { name: 'Star Jumps', duration: 40, metValue: 11.0, emoji: '⭐', animation: 'star-jumps' },
    { name: 'Bicycle Crunches', duration: 40, metValue: 8.0, emoji: '🚴', animation: 'bicycle' },
    { name: 'Burpee Broad Jump', duration: 40, metValue: 12.0, emoji: '💥', animation: 'burpees' },
    { name: 'Sprint in Place', duration: 40, metValue: 12.0, emoji: '🏃', animation: 'sprint' },
  ],
  'core-shred': [
    { name: 'Russian Twists', duration: 45, metValue: 7.0, emoji: '🔄', animation: 'russian-twists' },
    { name: 'Bicycle Crunches', duration: 45, metValue: 8.0, emoji: '🚴', animation: 'bicycle' },
    { name: 'Plank Jacks', duration: 45, metValue: 9.0, emoji: '🏋️', animation: 'plank-jacks' },
    { name: 'Mountain Climbers', duration: 45, metValue: 11.0, emoji: '⛰️', animation: 'mountain-climbers' },
    { name: 'V-Ups', duration: 45, metValue: 8.0, emoji: '✌️', animation: 'v-ups' },
    { name: 'Side Plank Dips', duration: 45, metValue: 7.0, emoji: '↔️', animation: 'side-plank' },
    { name: 'Hollow Body Hold', duration: 45, metValue: 6.0, emoji: '🎯', animation: 'hollow-hold' },
    { name: 'Leg Raises', duration: 45, metValue: 7.0, emoji: '⬆️', animation: 'leg-raises' },
  ],
  'no-equipment': [
    { name: 'Jumping Jacks', duration: 50, metValue: 8.0, emoji: '🤸', animation: 'jumping-jacks' },
    { name: 'High Knees', duration: 50, metValue: 10.0, emoji: '🦵', animation: 'high-knees' },
    { name: 'Shadow Boxing', duration: 50, metValue: 9.0, emoji: '🥊', animation: 'boxing' },
    { name: 'Butt Kicks', duration: 50, metValue: 9.0, emoji: '🦿', animation: 'butt-kicks' },
    { name: 'Jump Squats', duration: 50, metValue: 10.0, emoji: '⬆️', animation: 'jump-squat' },
    { name: 'Mountain Climbers', duration: 50, metValue: 11.0, emoji: '⛰️', animation: 'mountain-climbers' },
    { name: 'Burpees', duration: 50, metValue: 12.0, emoji: '💥', animation: 'burpees' },
    { name: 'Speed Skaters', duration: 50, metValue: 10.0, emoji: '⛸️', animation: 'skaters' },
    { name: 'Jumping Jacks', duration: 50, metValue: 8.0, emoji: '🤸', animation: 'jumping-jacks' },
    { name: 'High Knees', duration: 50, metValue: 10.0, emoji: '🦵', animation: 'high-knees' },
    { name: 'Shadow Boxing', duration: 50, metValue: 9.0, emoji: '🥊', animation: 'boxing' },
    { name: 'Plank Jacks', duration: 50, metValue: 9.0, emoji: '🏋️', animation: 'plank-jacks' },
    { name: 'Burpees', duration: 50, metValue: 12.0, emoji: '💥', animation: 'burpees' },
    { name: 'Sprint in Place', duration: 50, metValue: 12.0, emoji: '🏃', animation: 'sprint' },
    { name: 'Star Jumps', duration: 50, metValue: 11.0, emoji: '⭐', animation: 'star-jumps' },
    { name: 'Cool Down Jog', duration: 50, metValue: 6.0, emoji: '🚶', animation: 'jog' },
  ],
};

const warmupInstructions: Record<string, string> = {
  'full-body': 'Light jog in place, arm circles, leg swings, and dynamic stretches',
  'core-shred': 'Gentle torso twists, cat-cow stretches, and knee-to-chest movements',
  'no-equipment': 'March in place, shoulder rolls, ankle circles, and easy jumping jacks',
};

const presetWorkouts = [
  {
    id: 'tabata',
    name: 'The Tabata Burn',
    duration: 4,
    description: 'Pure 20s work/10s rest',
    config: { warmup: 0, work: 20, rest: 10, rounds: 8 },
    color: 'from-orange-500 to-red-500',
    icon: '🔥',
    exercises: workoutExercises.tabata,
  },
  {
    id: 'full-body',
    name: 'Full Body Blast',
    duration: 15,
    description: 'Burpees, Squat Jumps, Mountain Climbers',
    config: { warmup: 120, work: 40, rest: 20, rounds: 12 },
    color: 'from-red-500 to-rose-600',
    icon: '💪',
    exercises: workoutExercises['full-body'],
  },
  {
    id: 'core-shred',
    name: 'Core Shred',
    duration: 10,
    description: 'High-intensity abdominal work',
    config: { warmup: 60, work: 45, rest: 15, rounds: 8 },
    color: 'from-orange-600 to-amber-600',
    icon: '⚡',
    exercises: workoutExercises['core-shred'],
  },
  {
    id: 'no-equipment',
    name: 'No-Equipment Cardio',
    duration: 20,
    description: 'Jumping jacks, high knees, shadow boxing',
    config: { warmup: 120, work: 50, rest: 10, rounds: 16 },
    color: 'from-yellow-500 to-orange-500',
    icon: '🥊',
    exercises: workoutExercises['no-equipment'],
  },
];

export default function HIITCardioGuide({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'workouts' | 'analytics'>('workouts');
  const [hiitData, setHiitData] = useState<HIITData>(() => {
    const saved = localStorage.getItem('hiit-cardio-data');
    return saved ? JSON.parse(saved) : {
      workoutLogs: [],
      totalWorkouts: 0,
      totalHighIntensityMinutes: 0,
      averageRPE: 0,
    };
  });

  // Timer state
  const [timerConfig, setTimerConfig] = useState<TimerConfig>({ warmup: 120, work: 40, rest: 20, rounds: 8 });
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalIntervalsCompleted, setTotalIntervalsCompleted] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [showBeep, setShowBeep] = useState(false);

  // Logging state
  const [rpeScore, setRpeScore] = useState(5);
  const [userWeight, setUserWeight] = useState(70);

  // Workout Player state
  const [activeWorkout, setActiveWorkout] = useState<typeof presetWorkouts[0] | null>(null);
  const [selectedWorkoutPreview, setSelectedWorkoutPreview] = useState<typeof presetWorkouts[0] | null>(null);
  const [selectedRounds, setSelectedRounds] = useState(8);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercisesCompleted, setExercisesCompleted] = useState<string[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [countdownBeep, setCountdownBeep] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('hiit-cardio-data', JSON.stringify(hiitData));
  }, [hiitData]);

  // Load from Neon DB on mount
  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('hiit_cardio');
      const workoutLogs = dbLogs
        .filter(log => log.action_type === 'log_workout')
        .map(log => {
          const p = log.payload;
          return {
            id: log.id.toString(),
            workoutName: p.workout_type,
            actualDuration: p.actual_duration_min,
            rpeScore: p.rpe_score,
            totalCaloriesWithEpoc: p.total_calories_with_epoc,
            intervalsCompleted: p.intervals_completed,
            exercisesCompleted: p.exercises_completed,
            timestamp: p.timestamp,
          } as WorkoutLog;
        });

      if (workoutLogs.length > 0) {
        const totalWorkouts = workoutLogs.length;
        const totalMinutes = workoutLogs.reduce((sum, log) => sum + log.actualDuration, 0);
        const averageRPE = workoutLogs.reduce((sum, log) => sum + log.rpeScore, 0) / totalWorkouts;

        setHiitData({
          workoutLogs,
          totalWorkouts,
          totalHighIntensityMinutes: totalMinutes,
          averageRPE,
        });
      }
    };
    loadDbLogs();
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Audio functions
  const playBeep = (frequency: number, duration: number) => {
    if (!audioEnabled || !audioContext.current) return;

    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);

    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  };

  const playCountdownBeep = () => {
    playBeep(800, 0.1);
  };

  const playGoWhistle = () => {
    if (!audioEnabled || !audioContext.current) return;
    // Two-tone whistle effect
    playBeep(1200, 0.1);
    setTimeout(() => playBeep(1500, 0.15), 100);
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handlePhaseTransition();
            return 0;
          }
          // Beep at 3-2-1
          if (prev <= 3 && prev > 0) {
            playCountdownBeep();
            setCountdownBeep(prev);
            setShowBeep(true);
            setTimeout(() => setShowBeep(false), 200);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeRemaining]);

  const handlePhaseTransition = () => {
    if (phase === 'warmup') {
      setPhase('work');
      if (activeWorkout && activeWorkout.exercises.length > 0) {
        setTimeRemaining(activeWorkout.exercises[0].duration);
      } else {
        setTimeRemaining(timerConfig.work);
      }
      setCurrentRound(1);
      playGoWhistle();
    } else if (phase === 'work') {
      setTotalIntervalsCompleted(prev => prev + 1);

      // Track exercise completed
      if (activeWorkout && currentExerciseIndex < activeWorkout.exercises.length) {
        const completedExercise = activeWorkout.exercises[currentExerciseIndex].name;
        setExercisesCompleted(prev => [...prev, completedExercise]);
      }

      // Always go to rest after work
      setPhase('rest');
      setTimeRemaining(timerConfig.rest);
    } else if (phase === 'rest') {
      // Move to next exercise if in workout mode
      if (activeWorkout && currentExerciseIndex < activeWorkout.exercises.length - 1) {
        setPhase('work');
        setCurrentExerciseIndex(prev => prev + 1);
        setTimeRemaining(activeWorkout.exercises[currentExerciseIndex + 1].duration);
        playGoWhistle();
      } else if (activeWorkout) {
        // Completed all exercises - check if we've done enough rounds
        if (currentRound >= timerConfig.rounds) {
          completeWorkout();
        } else {
          // Increment round and loop back to first exercise
          setPhase('work');
          setCurrentExerciseIndex(0);
          setTimeRemaining(activeWorkout.exercises[0].duration);
          setCurrentRound(prev => prev + 1);
          playGoWhistle();
        }
      } else {
        if (currentRound >= timerConfig.rounds) {
          completeWorkout();
        } else {
          setPhase('work');
          setTimeRemaining(timerConfig.work);
          setCurrentRound(prev => prev + 1);
          playGoWhistle();
        }
      }
    }
  };

  const startWorkout = (workout: typeof presetWorkouts[0], customRounds?: number) => {
    setActiveWorkout(workout);
    const configWithRounds = { ...workout.config, rounds: customRounds || workout.config.rounds };
    setTimerConfig(configWithRounds);
    setCurrentExerciseIndex(0);
    setExercisesCompleted([]);
    setWorkoutStartTime(Date.now());

    if (workout.config.warmup > 0) {
      setPhase('warmup');
      setTimeRemaining(workout.config.warmup);
    } else {
      setPhase('work');
      setTimeRemaining(workout.exercises[0].duration);
      setCurrentRound(1);
    }
    setIsRunning(true);
  };

  const startTimer = () => {
    if (phase === 'idle') {
      setWorkoutStartTime(Date.now());
      if (timerConfig.warmup > 0) {
        setPhase('warmup');
        setTimeRemaining(timerConfig.warmup);
      } else {
        setPhase('work');
        if (activeWorkout && activeWorkout.exercises.length > 0) {
          setTimeRemaining(activeWorkout.exercises[0].duration);
        } else {
          setTimeRemaining(timerConfig.work);
        }
        setCurrentRound(1);
      }
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('idle');
    setTimeRemaining(0);
    setCurrentRound(0);
    setTotalIntervalsCompleted(0);
    setWorkoutStartTime(null);
    setActiveWorkout(null);
    setCurrentExerciseIndex(0);
    setExercisesCompleted([]);
  };

  const skipExercise = () => {
    if (!activeWorkout || phase !== 'work') return;

    // Move to rest phase immediately
    setTotalIntervalsCompleted(prev => prev + 1);

    // Track skipped exercise as completed
    if (currentExerciseIndex < activeWorkout.exercises.length) {
      const completedExercise = activeWorkout.exercises[currentExerciseIndex].name;
      setExercisesCompleted(prev => [...prev, `${completedExercise} (skipped)`]);
    }

    // Always go to rest after skipping work
    setPhase('rest');
    setTimeRemaining(timerConfig.rest);
  };

  const skipRest = () => {
    if (phase !== 'rest') return;

    // Move to next exercise if in workout mode
    if (activeWorkout && currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setPhase('work');
      setCurrentExerciseIndex(prev => prev + 1);
      setTimeRemaining(activeWorkout.exercises[currentExerciseIndex + 1].duration);
      playGoWhistle();
    } else if (activeWorkout) {
      // Completed all exercises - check if we've done enough rounds
      if (currentRound >= timerConfig.rounds) {
        completeWorkout();
      } else {
        // Increment round and loop back to first exercise
        setPhase('work');
        setCurrentExerciseIndex(0);
        setTimeRemaining(activeWorkout.exercises[0].duration);
        setCurrentRound(prev => prev + 1);
        playGoWhistle();
      }
    } else {
      if (currentRound >= timerConfig.rounds) {
        completeWorkout();
      } else {
        setPhase('work');
        setTimeRemaining(timerConfig.work);
        setCurrentRound(prev => prev + 1);
        playGoWhistle();
      }
    }
  };

  const completeWorkout = () => {
    setPhase('complete');
    setIsRunning(false);

    // Celebrate
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#F97316', '#EA580C', '#FB923C'],
    });
  };

  const logWorkout = (workoutName: string = 'Custom HIIT') => {
    const actualDuration = workoutStartTime ? Math.round((Date.now() - workoutStartTime) / 60000) : 0;
    const totalSeconds = workoutStartTime ? Math.round((Date.now() - workoutStartTime) / 1000) : 0;

    // Calculate calories with EPOC - use exercise-specific MET values if available
    let activeCalories = 0;
    if (activeWorkout && exercisesCompleted.length > 0) {
      // Calculate based on specific exercises
      const uniqueExercises = [...new Set(exercisesCompleted.map(e => e.replace(' (skipped)', '')))];
      const avgMET = uniqueExercises.reduce((sum, exerciseName) => {
        const exercise = activeWorkout.exercises.find(e => e.name === exerciseName);
        return sum + (exercise?.metValue || 10.0);
      }, 0) / Math.max(uniqueExercises.length, 1);

      activeCalories = (avgMET * 3.5 * userWeight / 200) * actualDuration;
    } else {
      const MET = 10.0;
      activeCalories = (MET * 3.5 * userWeight / 200) * actualDuration;
    }

    const epocBonus = activeCalories * 0.10;
    const totalCaloriesWithEpoc = Math.round(activeCalories + epocBonus);

    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      workoutName,
      actualDuration,
      rpeScore,
      totalCaloriesWithEpoc,
      intervalsCompleted: totalIntervalsCompleted,
      exercisesCompleted: exercisesCompleted,
      timestamp: new Date().toISOString(),
    };

    const newTotalMinutes = hiitData.totalHighIntensityMinutes + actualDuration;
    const newTotalWorkouts = hiitData.totalWorkouts + 1;
    const newAverageRPE = ((hiitData.averageRPE * hiitData.totalWorkouts) + rpeScore) / newTotalWorkouts;

    setHiitData(prev => ({
      workoutLogs: [newLog, ...prev.workoutLogs],
      totalWorkouts: newTotalWorkouts,
      totalHighIntensityMinutes: newTotalMinutes,
      averageRPE: newAverageRPE,
    }));

    // Log to console for database integration
    logUserActivity('hiit_cardio', 'log_workout', {
      workout_type: workoutName,
      exercises_completed: exercisesCompleted,
      total_time_sec: totalSeconds,
      actual_duration_min: actualDuration,
      rpe_score: rpeScore,
      total_calories_with_epoc: totalCaloriesWithEpoc,
      intervals_completed: totalIntervalsCompleted,
      timestamp: new Date().toISOString(),
    });

    // Show Sweat Equity badge for high RPE
    if (rpeScore >= 8) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FCD34D', '#F59E0B', '#D97706'],
        });
      }, 500);
    }

    resetTimer();
    setRpeScore(5);

    // Auto-navigate to Burn Analytics
    setTimeout(() => {
      setActiveTab('analytics');
    }, 1500);
  };

  const loadPreset = (preset: typeof presetWorkouts[0]) => {
    setSelectedWorkoutPreview(preset);
    setSelectedRounds(preset.config.rounds);
  };

  const skipWarmup = () => {
    if (phase !== 'warmup') return;
    setPhase('work');
    if (activeWorkout && activeWorkout.exercises.length > 0) {
      setTimeRemaining(activeWorkout.exercises[0].duration);
    } else {
      setTimeRemaining(timerConfig.work);
    }
    setCurrentRound(1);
    playGoWhistle();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    if (phase === 'work') return 'from-orange-500 to-red-600';
    if (phase === 'rest') return 'from-gray-400 to-slate-500';
    if (phase === 'warmup') return 'from-blue-400 to-cyan-500';
    if (phase === 'complete') return 'from-green-500 to-emerald-600';
    return 'from-gray-200 to-gray-300';
  };

  const shouldShake = phase === 'work' && timeRemaining <= 3 && timeRemaining > 0;

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
            <span className="text-sm lg:text-base">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-2 lg:p-3">
              <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">HIIT & Cardio</h1>
              <p className="text-xs lg:text-sm text-gray-500">High-intensity interval training toolkit</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'workouts'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Analytics
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Workouts Tab */}
          {activeTab === 'workouts' && (
            <motion.div
              key="workouts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Workout Player Display */}
              {activeWorkout && phase !== 'idle' && (
                <motion.div
                  animate={shouldShake ? {
                    x: [0, -10, 10, -10, 10, 0],
                    transition: { duration: 0.5, repeat: Infinity }
                  } : {}}
                  className={`relative bg-gradient-to-br ${getPhaseColor()} rounded-2xl overflow-hidden`}
                >
                  {showBeep && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 3, opacity: 0 }}
                      className="absolute inset-0 bg-white rounded-2xl z-50"
                    />
                  )}

                  {/* Progress Bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-black/20">
                    <motion.div
                      className="h-full bg-white/50"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentRound / timerConfig.rounds) * 100}%` }}
                    />
                  </div>

                  <div className="relative z-10 p-4 lg:p-8">
                    {/* Exercise Animation Area */}
                    <div className="relative min-h-[300px] lg:min-h-[400px] flex flex-col items-center justify-center">
                      {phase === 'work' && currentExerciseIndex < activeWorkout.exercises.length && (
                        <>
                          {/* Exercise Visual */}
                          <motion.div
                            key={currentExerciseIndex}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-7xl lg:text-9xl mb-4 lg:mb-6"
                          >
                            {activeWorkout.exercises[currentExerciseIndex].emoji}
                          </motion.div>

                          {/* Exercise Name Overlay */}
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-center px-4"
                          >
                            <h3 className="text-2xl lg:text-4xl font-bold text-white mb-2">
                              {activeWorkout.exercises[currentExerciseIndex].name}
                            </h3>
                            <div className="text-6xl lg:text-8xl font-bold text-white tabular-nums">
                              {timeRemaining}
                            </div>
                            {countdownBeep > 0 && countdownBeep <= 3 && (
                              <motion.div
                                initial={{ scale: 1.5, opacity: 1 }}
                                animate={{ scale: 1, opacity: 0 }}
                                className="text-6xl font-bold text-yellow-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                              >
                                {countdownBeep}
                              </motion.div>
                            )}
                          </motion.div>
                        </>
                      )}

                      {phase === 'rest' && (
                        <>
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl lg:text-8xl mb-4 lg:mb-6"
                          >
                            💧
                          </motion.div>
                          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 lg:mb-4">Rest & Hydrate</h3>
                          <div className="text-6xl lg:text-8xl font-bold text-white tabular-nums">
                            {timeRemaining}
                          </div>
                          <button
                            onClick={skipRest}
                            className="mt-4 lg:mt-6 px-4 lg:px-6 py-2 lg:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all text-sm lg:text-base"
                          >
                            Skip Rest
                          </button>
                        </>
                      )}

                      {phase === 'warmup' && (
                        <>
                          <motion.div
                            animate={{
                              rotate: [0, 10, -10, 0],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-6xl lg:text-8xl mb-4 lg:mb-6"
                          >
                            🔥
                          </motion.div>
                          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 lg:mb-4">Warm Up</h3>
                          {activeWorkout && warmupInstructions[activeWorkout.id] && (
                            <p className="text-sm lg:text-lg text-white/90 mb-3 lg:mb-4 max-w-md text-center px-4">
                              {warmupInstructions[activeWorkout.id]}
                            </p>
                          )}
                          <div className="text-6xl lg:text-8xl font-bold text-white tabular-nums">
                            {timeRemaining}
                          </div>
                          <button
                            onClick={skipWarmup}
                            className="mt-4 lg:mt-6 px-4 lg:px-6 py-2 lg:py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all text-sm lg:text-base"
                          >
                            Skip Warmup
                          </button>
                        </>
                      )}

                      {phase === 'complete' && (
                        <>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                            className="text-7xl lg:text-9xl mb-4 lg:mb-6"
                          >
                            🎉
                          </motion.div>
                          <h3 className="text-2xl lg:text-4xl font-bold text-white mb-2">Workout Complete!</h3>
                          <p className="text-lg lg:text-2xl text-white/90">{totalIntervalsCompleted} intervals done</p>
                        </>
                      )}

                      {/* Round Counter */}
                      {phase !== 'complete' && (
                        <div className="absolute top-2 lg:top-4 right-2 lg:right-4 bg-black/30 backdrop-blur-sm rounded-lg px-3 lg:px-4 py-1.5 lg:py-2">
                          <p className="text-white font-semibold text-sm lg:text-base">
                            Round {currentRound}/{timerConfig.rounds}
                          </p>
                        </div>
                      )}

                      {/* Audio Toggle */}
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="absolute top-2 lg:top-4 left-2 lg:left-4 bg-black/30 backdrop-blur-sm rounded-lg p-2 hover:bg-black/50 transition-colors"
                      >
                        <Volume2 className={`w-4 h-4 lg:w-5 lg:h-5 ${audioEnabled ? 'text-white' : 'text-white/40'}`} />
                      </button>

                      {/* Next Up Card */}
                      {phase === 'work' && currentExerciseIndex < activeWorkout.exercises.length - 1 && (
                        <motion.div
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="absolute bottom-2 lg:bottom-4 right-2 lg:right-4 bg-black/40 backdrop-blur-md rounded-xl p-2 lg:p-4 border border-white/20 max-w-[180px] lg:max-w-none"
                        >
                          <p className="text-xs text-white/70 mb-1">Next Up</p>
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className="text-2xl lg:text-3xl">
                              {activeWorkout.exercises[currentExerciseIndex + 1].emoji}
                            </div>
                            <p className="text-xs lg:text-sm font-semibold text-white line-clamp-2">
                              {activeWorkout.exercises[currentExerciseIndex + 1].name}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {phase === 'rest' && currentExerciseIndex < activeWorkout.exercises.length - 1 && (
                        <motion.div
                          initial={{ x: 100, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="absolute bottom-2 lg:bottom-4 right-2 lg:right-4 bg-black/40 backdrop-blur-md rounded-xl p-2 lg:p-4 border border-white/20 max-w-[180px] lg:max-w-none"
                        >
                          <p className="text-xs text-white/70 mb-1">Next Up</p>
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className="text-2xl lg:text-3xl">
                              {activeWorkout.exercises[currentExerciseIndex + 1].emoji}
                            </div>
                            <p className="text-xs lg:text-sm font-semibold text-white line-clamp-2">
                              {activeWorkout.exercises[currentExerciseIndex + 1].name}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Workout Controls */}
              {activeWorkout && phase !== 'idle' && phase !== 'complete' && (
                <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
                  {isRunning ? (
                    <button
                      onClick={pauseTimer}
                      className="flex-1 py-3 lg:py-4 px-4 lg:px-6 bg-yellow-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <Pause className="w-5 h-5 lg:w-6 lg:h-6" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={startTimer}
                      className="flex-1 py-3 lg:py-4 px-4 lg:px-6 bg-green-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <Play className="w-5 h-5 lg:w-6 lg:h-6" />
                      Resume
                    </button>
                  )}
                  {phase === 'work' && (
                    <button
                      onClick={skipExercise}
                      className="py-3 lg:py-4 px-4 lg:px-6 bg-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <SkipForward className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="hidden sm:inline">Skip</span>
                    </button>
                  )}
                  {phase === 'rest' && (
                    <button
                      onClick={skipRest}
                      className="py-3 lg:py-4 px-4 lg:px-6 bg-blue-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <SkipForward className="w-5 h-5 lg:w-6 lg:h-6" />
                      <span className="hidden sm:inline">Skip</span>
                    </button>
                  )}
                  <button
                    onClick={resetTimer}
                    className="flex-1 py-3 lg:py-4 px-4 lg:px-6 bg-gray-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    <RotateCcw className="w-5 h-5 lg:w-6 lg:h-6" />
                    End Workout
                  </button>
                </div>
              )}

              {/* Post-Workout Logging */}
              {phase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200"
                >
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Log Your Workout</h3>
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                        Weight (kg) - for calorie calculation
                      </label>
                      <input
                        type="number"
                        value={userWeight}
                        onChange={(e) => setUserWeight(parseInt(e.target.value) || 70)}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2 lg:mb-3">
                        Rate of Perceived Exertion (RPE): {rpeScore}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={rpeScore}
                        onChange={(e) => setRpeScore(parseInt(e.target.value))}
                        className="w-full h-2 lg:h-3 bg-gradient-to-r from-green-200 via-yellow-200 to-red-500 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #86EFAC 0%, #FDE047 50%, #EF4444 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1 - Easy</span>
                        <span className="hidden sm:inline">5 - Moderate</span>
                        <span>10 - Max</span>
                      </div>
                    </div>
                    <button
                      onClick={() => logWorkout(activeWorkout?.name || 'Custom HIIT')}
                      className="w-full py-3 lg:py-4 px-4 lg:px-6 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-sm lg:text-base"
                    >
                      💪 Log Workout & Calculate Burn
                    </button>
                  </div>
                </motion.div>
              )}

              {selectedWorkoutPreview ? (
                /* Workout Preview */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 lg:space-y-6"
                >
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedWorkoutPreview(null)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Workouts</span>
                  </button>

                  {/* Workout Header */}
                  <div className={`bg-gradient-to-br ${selectedWorkoutPreview.color} rounded-2xl p-6 lg:p-8`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl lg:text-7xl">{selectedWorkoutPreview.icon}</div>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-white text-sm lg:text-base font-semibold">{selectedWorkoutPreview.duration} minutes</span>
                      </div>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">{selectedWorkoutPreview.name}</h2>
                    <p className="text-lg lg:text-xl text-white/90 mb-6">{selectedWorkoutPreview.description}</p>

                    {/* Workout Info */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {selectedWorkoutPreview.config.warmup > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                          <p className="text-xs text-white/70">Warmup</p>
                          <p className="text-lg font-bold text-white">{selectedWorkoutPreview.config.warmup}s</p>
                        </div>
                      )}
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <p className="text-xs text-white/70">Work</p>
                        <p className="text-lg font-bold text-white">{selectedWorkoutPreview.config.work}s</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                        <p className="text-xs text-white/70">Rest</p>
                        <p className="text-lg font-bold text-white">{selectedWorkoutPreview.config.rest}s</p>
                      </div>
                    </div>

                    {/* Warmup Info */}
                    {selectedWorkoutPreview.config.warmup > 0 && warmupInstructions[selectedWorkoutPreview.id] && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
                        <p className="text-sm font-semibold text-white mb-2">Warmup Routine:</p>
                        <p className="text-sm text-white/90">{warmupInstructions[selectedWorkoutPreview.id]}</p>
                      </div>
                    )}

                    {/* Rounds Selector */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20">
                      <label className="block text-sm font-semibold text-white mb-3">
                        Number of Rounds: {selectedRounds}
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={selectedRounds}
                          onChange={(e) => setSelectedRounds(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRounds(Math.max(1, selectedRounds - 1))}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-white transition-all"
                          >
                            -
                          </button>
                          <div className="w-16 h-10 bg-white/30 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                            {selectedRounds}
                          </div>
                          <button
                            onClick={() => setSelectedRounds(Math.min(20, selectedRounds + 1))}
                            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-white transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-white/70 mt-2">
                        Recommended: {selectedWorkoutPreview.config.rounds} rounds
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        startWorkout(selectedWorkoutPreview, selectedRounds);
                        setSelectedWorkoutPreview(null);
                      }}
                      className="w-full py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-base lg:text-lg"
                    >
                      <Play className="w-5 h-5 lg:w-6 lg:h-6" />
                      Start Workout ({selectedRounds} Rounds)
                    </button>
                  </div>

                  {/* Exercise List */}
                  <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 text-base lg:text-lg">Exercises in This Workout</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedWorkoutPreview.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex flex-col items-center text-center"
                        >
                          <div className="text-3xl lg:text-4xl mb-2">{exercise.emoji}</div>
                          <p className="text-xs lg:text-sm font-semibold text-gray-900">{exercise.name}</p>
                          <p className="text-xs text-gray-600">{exercise.duration}s</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : !activeWorkout && (
                <>
                  {/* Info Box - Moved Above Workouts */}
                  <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2 lg:mb-3 text-sm lg:text-base">What is HIIT?</h3>
                    <p className="text-xs lg:text-sm text-gray-700 mb-3 lg:mb-4">
                      High-Intensity Interval Training alternates short bursts of intense exercise with recovery periods.
                      This method maximizes calorie burn, improves cardiovascular fitness, and triggers the "afterburn effect"
                      (EPOC) - meaning you continue burning calories for hours after your workout ends.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                      <div className="bg-orange-50 rounded-lg p-3 lg:p-4 border border-orange-200">
                        <div className="text-xl lg:text-2xl mb-2">⏱️</div>
                        <p className="text-xs font-semibold text-gray-900">Time Efficient</p>
                        <p className="text-xs text-gray-600 mt-1">20 mins = 45 mins steady cardio</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 lg:p-4 border border-red-200">
                        <div className="text-xl lg:text-2xl mb-2">🔥</div>
                        <p className="text-xs font-semibold text-gray-900">Afterburn Effect</p>
                        <p className="text-xs text-gray-600 mt-1">Burns calories for 24+ hours</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 lg:p-4 border border-amber-200">
                        <div className="text-xl lg:text-2xl mb-2">💪</div>
                        <p className="text-xs font-semibold text-gray-900">Preserves Muscle</p>
                        <p className="text-xs text-gray-600 mt-1">Unlike long steady cardio</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                    {presetWorkouts.map((workout) => (
                      <motion.div
                        key={workout.id}
                        whileHover={{ scale: 1.03 }}
                        onClick={() => loadPreset(workout)}
                        className={`bg-gradient-to-br ${workout.color} rounded-2xl p-4 lg:p-6 cursor-pointer border-2 border-transparent hover:border-orange-300 transition-all`}
                      >
                        <div className="flex items-start justify-between mb-3 lg:mb-4">
                          <div className="text-4xl lg:text-6xl">{workout.icon}</div>
                          <div className="bg-white/20 backdrop-blur-sm px-2 lg:px-3 py-1 rounded-full">
                            <span className="text-white text-xs lg:text-sm font-semibold">{workout.duration} mins</span>
                          </div>
                        </div>
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-1 lg:mb-2">{workout.name}</h3>
                        <p className="text-sm lg:text-base text-white/90 mb-3 lg:mb-4">{workout.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3 lg:mb-4">
                          {workout.config.warmup > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm px-2 lg:px-3 py-1 rounded-lg">
                              <span className="text-white text-xs lg:text-sm">Warmup: {workout.config.warmup}s</span>
                            </div>
                          )}
                          <div className="bg-white/20 backdrop-blur-sm px-2 lg:px-3 py-1 rounded-lg">
                            <span className="text-white text-xs lg:text-sm">Work: {workout.config.work}s</span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm px-2 lg:px-3 py-1 rounded-lg">
                            <span className="text-white text-xs lg:text-sm">Rest: {workout.config.rest}s</span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm px-2 lg:px-3 py-1 rounded-lg">
                            <span className="text-white text-xs lg:text-sm">Rounds: {workout.config.rounds}</span>
                          </div>
                        </div>
                        <button className="mt-2 lg:mt-4 w-full py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-white/90 transition-all text-sm lg:text-base">
                          View Workout
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Tab 3: Burn Analytics */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 lg:p-6 border-2 border-orange-200">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-orange-600" />
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900">Total Workouts</h3>
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold text-orange-600">{hiitData.totalWorkouts}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-4 lg:p-6 border-2 border-red-200">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2">
                    <Flame className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" />
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900">High-Intensity Minutes</h3>
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold text-red-600">{hiitData.totalHighIntensityMinutes}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 lg:p-6 border-2 border-amber-200">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2">
                    <Award className="w-5 h-5 lg:w-6 lg:h-6 text-amber-600" />
                    <h3 className="text-sm lg:text-base font-semibold text-gray-900">Average RPE</h3>
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold text-amber-600">{hiitData.averageRPE.toFixed(1)}/10</p>
                </div>
              </div>

              {/* EPOC Explainer */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 lg:p-6 text-white">
                <div className="flex flex-col sm:flex-row items-start gap-3 lg:gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 lg:p-3 flex-shrink-0">
                    <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg lg:text-xl font-bold mb-2">The Afterburn Effect (EPOC)</h3>
                    <p className="text-sm lg:text-base text-white/90 mb-3 lg:mb-4">
                      Excess Post-Exercise Oxygen Consumption means your body continues burning calories at an elevated
                      rate for up to 24-48 hours after your HIIT workout. We add a 10% EPOC bonus to your active calorie
                      burn to give you the full picture of your total energy expenditure.
                    </p>
                    <div className="bg-white/10 rounded-lg p-3 lg:p-4 border border-white/20">
                      <p className="text-xs lg:text-sm font-semibold">💡 Formula Used:</p>
                      <p className="text-xs lg:text-sm mt-2">
                        Active Calories = (MET × 3.5 × Weight kg / 200) × Duration min
                      </p>
                      <p className="text-xs lg:text-sm mt-1">
                        Total Burn = Active Calories + 10% EPOC Bonus
                      </p>
                      <p className="text-xs mt-2 lg:mt-3 text-white/70">
                        * Using MET value of 10.0 for high-intensity intervals
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Workouts */}
              {hiitData.workoutLogs.length > 0 && (
                <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">Recent Workouts</h3>
                  <div className="space-y-3">
                    {hiitData.workoutLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 lg:p-4 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex flex-col items-center justify-center text-white flex-shrink-0`}>
                            <div className="text-xs font-semibold">BURN</div>
                            <div className="text-base lg:text-lg font-bold">{log.totalCaloriesWithEpoc}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{log.workoutName}</p>
                            <p className="text-xs text-gray-600">
                              {log.actualDuration} mins • {log.intervalsCompleted} intervals • RPE: {log.rpeScore}/10
                            </p>
                            {log.exercisesCompleted && log.exercisesCompleted.length > 0 && (
                              <p className="text-xs text-gray-500 truncate max-w-full sm:max-w-md">
                                Exercises: {[...new Set(log.exercisesCompleted.map(e => e.replace(' (skipped)', '')))].join(', ')}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {log.rpeScore >= 8 && (
                          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full px-3 lg:px-4 py-1.5 lg:py-2 flex items-center gap-2 self-start sm:self-auto">
                            <Award className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                            <span className="text-xs font-bold text-white">Sweat Equity</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hiitData.workoutLogs.length === 0 && (
                <div className="bg-white rounded-2xl p-8 lg:p-12 border border-gray-200 text-center">
                  <Timer className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3 lg:mb-4" />
                  <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">No workouts logged yet</h3>
                  <p className="text-sm text-gray-600">Complete a workout to see your burn analytics here</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
