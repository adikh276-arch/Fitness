import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Move, Play, Award, TrendingUp, Calendar, CheckCircle2, AlertCircle, Sparkles, Pause, RotateCcw, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logUserActivity, fetchUserActivityLogs } from '@/lib/db';

interface Stretch {
  name: string;
  duration: number;
  description: string;
  gif: string;
  isBilateral: boolean;
}

interface StretchRoutine {
  id: string;
  name: string;
  duration: number;
  focusArea: string;
  description: string;
  stretches: Stretch[];
  emoji: string;
  color: string;
}

interface MobilityTest {
  id: string;
  name: string;
  description: string;
  passDescription: string;
  failDescription: string;
  emoji: string;
}

interface MobilityScore {
  testId: string;
  score: 'pass' | 'fail' | 'partial';
  details: string;
  date: string;
}

interface RecoverySession {
  id: string;
  duration: number;
  focusAreas: string[];
  sorenessLevel: number;
  timestamp: string;
  date: string;
}

interface FlexibilityData {
  mobilityScores: MobilityScore[];
  recoverySessions: RecoverySession[];
}

const routines: StretchRoutine[] = [
  {
    id: 'upper-body',
    name: 'Upper Body Open',
    duration: 8,
    focusArea: 'Chest, Shoulders, Mid-Back',
    description: 'Release tension from desk work and phone use',
    emoji: '💪',
    color: 'from-violet-400 to-purple-500',
    stretches: [
      {
        name: 'Doorway Chest Stretch',
        duration: 45,
        description: 'Stand in doorway, place forearms on frame, lean forward to feel chest stretch.',
        gif: '🚪',
        isBilateral: false,
      },
      {
        name: 'Shoulder Rolls',
        duration: 30,
        description: 'Roll shoulders backward in large circles, 10 reps.',
        gif: '🔃',
        isBilateral: false,
      },
      {
        name: 'Thoracic Rotation',
        duration: 60,
        description: 'On hands and knees, rotate upper body side to side, opening chest.',
        gif: '🌀',
        isBilateral: true,
      },
      {
        name: 'Neck Stretch',
        duration: 60,
        description: 'Gently tilt head to each side, holding for 30 seconds per side.',
        gif: '👤',
        isBilateral: true,
      },
      {
        name: 'Tricep Stretch',
        duration: 45,
        description: 'Reach arm overhead, bend elbow, gently pull with other hand.',
        gif: '💪',
        isBilateral: false,
      },
    ],
  },
  {
    id: 'lower-body',
    name: 'Lower Body Release',
    duration: 10,
    focusArea: 'Hamstrings, Glutes, Hip Flexors',
    description: 'Deep stretches for tight legs and hips from sitting',
    emoji: '🦵',
    color: 'from-purple-400 to-violet-500',
    stretches: [
      {
        name: 'Pigeon Pose',
        duration: 60,
        description: 'Bring one leg forward bent, extend back leg straight, sink hips down.',
        gif: '🦆',
        isBilateral: true,
      },
      {
        name: 'Hamstring Stretch',
        duration: 45,
        description: 'Sit with one leg extended, reach toward toes, keep back straight.',
        gif: '🦵',
        isBilateral: true,
      },
      {
        name: 'Hip Flexor Lunge',
        duration: 60,
        description: 'Lunge position, push hips forward to feel stretch in front hip.',
        gif: '🏃',
        isBilateral: true,
      },
      {
        name: 'Glute Stretch',
        duration: 45,
        description: 'Lying on back, cross ankle over opposite knee, pull toward chest.',
        gif: '🍑',
        isBilateral: true,
      },
      {
        name: 'Calf Stretch',
        duration: 40,
        description: 'Step forward in lunge, keep back heel down to stretch calf.',
        gif: '🦿',
        isBilateral: true,
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body Flow',
    duration: 15,
    focusArea: 'Total Body Maintenance',
    description: 'Complete head-to-toe flexibility routine',
    emoji: '🧘',
    color: 'from-indigo-400 to-purple-500',
    stretches: [
      {
        name: 'Cat-Cow',
        duration: 45,
        description: 'On hands and knees, alternate arching and rounding spine.',
        gif: '🐱',
        isBilateral: false,
      },
      {
        name: 'Downward Dog',
        duration: 60,
        description: 'Hands and feet planted, hips high, forming an inverted V.',
        gif: '🐕',
        isBilateral: false,
      },
      {
        name: 'Child\'s Pose',
        duration: 45,
        description: 'Knees wide, sit back on heels, arms extended forward.',
        gif: '🧘',
        isBilateral: false,
      },
      {
        name: 'Seated Twist',
        duration: 60,
        description: 'Sit cross-legged, rotate torso to each side, hand behind back.',
        gif: '🌀',
        isBilateral: true,
      },
      {
        name: 'Forward Fold',
        duration: 60,
        description: 'Standing, hinge at hips, reach toward toes, let head hang.',
        gif: '🙇',
        isBilateral: false,
      },
      {
        name: 'Hip Circles',
        duration: 40,
        description: 'Hands on hips, make large circles with hips in both directions.',
        gif: '⭕',
        isBilateral: false,
      },
      {
        name: 'Arm Circles',
        duration: 30,
        description: 'Extend arms wide, make large circles forward then backward.',
        gif: '🔄',
        isBilateral: false,
      },
    ],
  },
  {
    id: 'dynamic-warmup',
    name: 'Dynamic Warm-up',
    duration: 5,
    focusArea: 'Pre-Workout Activation',
    description: 'Prepare your body before exercise',
    emoji: '⚡',
    color: 'from-purple-500 to-pink-500',
    stretches: [
      {
        name: 'Leg Swings',
        duration: 40,
        description: 'Hold wall, swing leg forward and back, then side to side.',
        gif: '🦵',
        isBilateral: true,
      },
      {
        name: 'Arm Circles',
        duration: 30,
        description: 'Small to large circles, forward and backward.',
        gif: '🔄',
        isBilateral: false,
      },
      {
        name: 'Torso Twists',
        duration: 30,
        description: 'Rotate upper body side to side with arms loose.',
        gif: '🌀',
        isBilateral: false,
      },
      {
        name: 'Walking Lunges',
        duration: 40,
        description: 'Step forward into lunge, alternate legs while moving forward.',
        gif: '🚶',
        isBilateral: false,
      },
      {
        name: 'High Knees',
        duration: 30,
        description: 'March in place bringing knees to hip height.',
        gif: '🏃',
        isBilateral: false,
      },
    ],
  },
];

const mobilityTests: MobilityTest[] = [
  {
    id: 'sit-reach',
    name: 'Sit & Reach Test',
    description: 'Sit with legs straight, reach toward toes',
    passDescription: 'Can touch or pass toes',
    failDescription: 'More than 6 inches from toes',
    emoji: '🙇',
  },
  {
    id: 'shoulder-pass',
    name: 'Shoulder Pass-Through',
    description: 'Hold a band/stick, raise arms overhead and behind back',
    passDescription: 'Can pass through smoothly',
    failDescription: 'Cannot complete motion',
    emoji: '🔄',
  },
  {
    id: 'deep-squat',
    name: 'Deep Squat Hold',
    description: 'Squat down with heels flat, hold for 30 seconds',
    passDescription: 'Can hold 30s, heels down',
    failDescription: 'Heels lift or cannot hold',
    emoji: '🏋️',
  },
];

const focusAreaOptions = ['Neck', 'Shoulders', 'Back', 'Hips', 'Legs', 'Full Body'];

export default function FlexibilityMobilityGuide({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'stretches' | 'tests' | 'log'>('stretches');
  const [flexibilityData, setFlexibilityData] = useState<FlexibilityData>(() => {
    const saved = localStorage.getItem('flexibility-mobility-data');
    return saved ? JSON.parse(saved) : {
      mobilityScores: [],
      recoverySessions: [],
    };
  });

  // Stretch player state
  const [selectedRoutine, setSelectedRoutine] = useState<StretchRoutine | null>(null);
  const [showRoutinePreview, setShowRoutinePreview] = useState(false);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [currentStretchIndex, setCurrentStretchIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showRoutineComplete, setShowRoutineComplete] = useState(false);
  const [feelBetterRating, setFeelBetterRating] = useState(5);

  // Recovery log state
  const [duration, setDuration] = useState('');
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [sorenessLevel, setSorenessLevel] = useState(5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const routineStartTime = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem('flexibility-mobility-data', JSON.stringify(flexibilityData));
  }, [flexibilityData]);

  // Load from Neon DB on mount
  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('flexibility_mobility');
      
      // Reconstruct mobilityScores from the latest test results log
      const latestTestLog = dbLogs.find(l => l.action_type === 'mobility_test');
      let scores: MobilityScore[] = [];
      if (latestTestLog) {
        const results = latestTestLog.payload.test_results;
        scores = Object.entries(results).map(([testId, score]) => {
          const test = mobilityTests.find(t => t.id === testId);
          const details = score === 'pass' ? test?.passDescription : score === 'partial' ? 'Partial completion' : test?.failDescription;
          return {
            testId,
            score,
            details: details || '',
            date: new Date(latestTestLog.payload.timestamp).toISOString().split('T')[0]
          } as MobilityScore;
        });
      }

      // Reconstruct recoverySessions
      const sessions: RecoverySession[] = dbLogs
        .filter(l => l.action_type === 'routine_session' || l.action_type === 'recovery_session')
        .map(log => {
          const p = log.payload;
          if (log.action_type === 'routine_session') {
            const routine = routines.find(r => r.name === p.routine_name);
            return {
              id: log.id.toString(),
              duration: p.duration_mins,
              focusAreas: routine ? [routine.focusArea] : ['Full Body'],
              sorenessLevel: p.feel_better_rating,
              timestamp: p.timestamp,
              date: new Date(p.timestamp).toISOString().split('T')[0]
            };
          } else {
            return {
              id: log.id.toString(),
              duration: p.recovery_minutes,
              focusAreas: p.focus_areas,
              sorenessLevel: p.soreness_level,
              timestamp: p.timestamp,
              date: new Date(p.timestamp).toISOString().split('T')[0]
            };
          }
        });

      if (scores.length > 0 || sessions.length > 0) {
        setFlexibilityData(prev => ({
          mobilityScores: scores.length > 0 ? scores : prev.mobilityScores,
          recoverySessions: sessions.length > 0 ? sessions : prev.recoverySessions,
        }));
      }
    };
    loadDbLogs();
  }, []);

  // Stretch timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayerActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleStretchComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayerActive, isPaused, timeRemaining]);

  const playSwitchCue = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 600;
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  };

  const playCompletionChime = () => {
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

  const loadRoutine = (routine: StretchRoutine) => {
    setSelectedRoutine(routine);
    setShowRoutinePreview(true);
    setIsPlayerActive(false);
    setShowRoutineComplete(false);
  };

  const startRoutine = () => {
    if (!selectedRoutine) return;
    setShowRoutinePreview(false);
    setIsPlayerActive(true);
    setCurrentStretchIndex(0);
    setTimeRemaining(selectedRoutine.stretches[0].duration);
    setIsPaused(false);
    routineStartTime.current = Date.now();
  };

  const pauseRoutine = () => {
    setIsPaused(true);
  };

  const resumeRoutine = () => {
    setIsPaused(false);
  };

  const cancelRoutine = () => {
    setIsPlayerActive(false);
    setShowRoutinePreview(false);
    setSelectedRoutine(null);
    setCurrentStretchIndex(0);
    setTimeRemaining(0);
    setIsPaused(false);
  };

  const skipStretch = () => {
    if (!selectedRoutine) return;
    if (currentStretchIndex < selectedRoutine.stretches.length - 1) {
      setCurrentStretchIndex(prev => prev + 1);
      setTimeRemaining(selectedRoutine.stretches[currentStretchIndex + 1].duration);
    } else {
      completeRoutine();
    }
  };

  const handleStretchComplete = () => {
    if (!selectedRoutine) return;

    const currentStretch = selectedRoutine.stretches[currentStretchIndex];

    // Play "switch sides" cue for bilateral stretches
    if (currentStretch.isBilateral) {
      playSwitchCue();
    }

    if (currentStretchIndex < selectedRoutine.stretches.length - 1) {
      setCurrentStretchIndex(prev => prev + 1);
      setTimeRemaining(selectedRoutine.stretches[currentStretchIndex + 1].duration);
    } else {
      completeRoutine();
    }
  };

  const completeRoutine = () => {
    if (!selectedRoutine) return;

    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - routineStartTime.current) / 60000);

    setIsPlayerActive(false);
    setShowRoutineComplete(true);
    playCompletionChime();

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#A78BFA', '#C084FC', '#E9D5FF'],
    });
  };

  const saveRoutineSession = () => {
    if (!selectedRoutine) return;

    const today = new Date().toISOString().split('T')[0];
    const actualDuration = Math.round((Date.now() - routineStartTime.current) / 60000);

    const newSession: RecoverySession = {
      id: Date.now().toString(),
      duration: actualDuration,
      focusAreas: [selectedRoutine.focusArea],
      sorenessLevel: feelBetterRating,
      timestamp: new Date().toISOString(),
      date: today,
    };

    setFlexibilityData(prev => ({
      ...prev,
      recoverySessions: [newSession, ...prev.recoverySessions],
    }));

    // Database log
    logUserActivity('flexibility_mobility', 'routine_session', {
      routine_name: selectedRoutine.name,
      duration_mins: actualDuration,
      feel_better_rating: feelBetterRating,
      timestamp: new Date().toISOString(),
    });

    setShowRoutineComplete(false);
    setSelectedRoutine(null);
    setFeelBetterRating(5);
    setActiveTab('log');
  };

  const updateMobilityScore = (testId: string, score: 'pass' | 'fail' | 'partial') => {
    const today = new Date().toISOString().split('T')[0];
    const test = mobilityTests.find(t => t.id === testId);
    if (!test) return;

    const details = score === 'pass' ? test.passDescription : score === 'partial' ? 'Partial completion' : test.failDescription;

    const newScore: MobilityScore = {
      testId,
      score,
      details,
      date: today,
    };

    setFlexibilityData(prev => {
      const filteredScores = prev.mobilityScores.filter(s => s.testId !== testId);
      return {
        ...prev,
        mobilityScores: [newScore, ...filteredScores],
      };
    });

    // Calculate overall status
    const allScores = [newScore, ...flexibilityData.mobilityScores.filter(s => s.testId !== testId)];
    const totalPoints = allScores.reduce((sum, s) => {
      if (s.score === 'pass') return sum + 2;
      if (s.score === 'partial') return sum + 1;
      return sum;
    }, 0);

    // Database log
    logUserActivity('flexibility_mobility', 'mobility_test', {
      test_results: Object.fromEntries(allScores.map(s => [s.testId, s.score])),
      overall_status: totalPoints >= 6 ? 'Elite Mobility' : totalPoints >= 4 ? 'Good Mobility' : 'Limited Mobility',
      total_points: totalPoints,
      timestamp: new Date().toISOString(),
    });
  };

  const logRecoverySession = () => {
    if (!duration || selectedFocusAreas.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const durationNum = parseInt(duration);

    const newSession: RecoverySession = {
      id: Date.now().toString(),
      duration: durationNum,
      focusAreas: selectedFocusAreas,
      sorenessLevel,
      timestamp: new Date().toISOString(),
      date: today,
    };

    setFlexibilityData(prev => ({
      ...prev,
      recoverySessions: [newSession, ...prev.recoverySessions],
    }));

    // Database log
    logUserActivity('flexibility_mobility', 'recovery_session', {
      recovery_minutes: durationNum,
      focus_areas: selectedFocusAreas,
      soreness_level: sorenessLevel,
      timestamp: new Date().toISOString(),
    });

    // Celebrate
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#A78BFA', '#C084FC', '#E9D5FF'],
    });

    // Reset form
    setDuration('');
    setSelectedFocusAreas([]);
    setSorenessLevel(5);
  };

  const getThisWeekSessions = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return flexibilityData.recoverySessions.filter(session => new Date(session.date) >= weekStart);
  };

  const getWeeklyHeatmap = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    return days.map((day, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      const hasSession = flexibilityData.recoverySessions.some(s => s.date === dateStr);
      return { day, hasSession };
    });
  };

  const getMobilityStatus = () => {
    const latestScores = flexibilityData.mobilityScores.slice(0, 3);
    if (latestScores.length === 0) return { status: 'Not Tested', color: 'text-gray-600', points: 0 };

    const totalPoints = latestScores.reduce((sum, s) => {
      if (s.score === 'pass') return sum + 2;
      if (s.score === 'partial') return sum + 1;
      return sum;
    }, 0);

    if (totalPoints >= 6) return { status: 'Elite Mobility', color: 'text-green-600', points: totalPoints };
    if (totalPoints >= 4) return { status: 'Good Mobility', color: 'text-yellow-600', points: totalPoints };
    return { status: 'Limited Mobility', color: 'text-orange-600', points: totalPoints };
  };

  const toggleFocusArea = (area: string) => {
    setSelectedFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const getTotalMinutes = () => {
    return flexibilityData.recoverySessions.reduce((sum, session) => sum + session.duration, 0);
  };

  const getProgressPercentage = () => {
    if (!selectedRoutine) return 0;
    const totalStretches = selectedRoutine.stretches.length;
    return ((currentStretchIndex + 1) / totalStretches) * 100;
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
            <span className="text-sm lg:text-base">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-2.5 lg:p-3">
              <Move className="w-6 lg:w-8 h-6 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Flexibility & Mobility</h1>
              <p className="text-xs lg:text-sm text-gray-500">Improve range of motion and prevent injuries</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stretches')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'stretches'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Daily Stretches
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mobility Tests
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-sm whitespace-nowrap ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Recovery Log
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: Daily Stretches */}
          {activeTab === 'stretches' && (
            <motion.div
              key="stretches"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Routine Preview */}
              {showRoutinePreview && selectedRoutine ? (
                <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{selectedRoutine.name}</h2>
                    <button
                      onClick={() => {
                        setShowRoutinePreview(false);
                        setSelectedRoutine(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm lg:text-base">{selectedRoutine.description}</p>
                  <p className="text-purple-600 font-semibold mb-6 text-sm lg:text-base">{selectedRoutine.focusArea}</p>

                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">{selectedRoutine.stretches.length} Stretches ({selectedRoutine.duration} min total):</h3>
                    <div className="space-y-2">
                      {selectedRoutine.stretches.map((stretch, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
                        >
                          <div className="text-2xl lg:text-3xl">{stretch.gif}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm lg:text-base">{stretch.name}</div>
                            <div className="text-xs lg:text-sm text-gray-600 mb-1">{stretch.description}</div>
                            <div className="text-xs text-purple-600 font-medium">{stretch.duration}s</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowRoutinePreview(false);
                        setSelectedRoutine(null);
                      }}
                      className="flex-1 py-3 lg:py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm lg:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startRoutine}
                      className="flex-1 py-3 lg:py-4 px-6 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                    >
                      <Play className="w-5 h-5" />
                      Start {selectedRoutine.duration}-Min Routine
                    </button>
                  </div>
                </div>
              ) : showRoutineComplete && selectedRoutine ? (
                <div className="bg-white rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-gray-200">
                  <div className="text-center">
                    <div className="text-6xl lg:text-7xl mb-4">✨</div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Routine Complete!</h2>
                    <p className="text-gray-600 mb-6 text-sm lg:text-base">
                      Great job completing {selectedRoutine.name}!
                    </p>

                    <div className="mb-6 max-w-md mx-auto">
                      <label className="block text-sm lg:text-base font-medium text-gray-700 mb-3">
                        Feel Better? Rate your improvement: {feelBetterRating}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={feelBetterRating}
                        onChange={(e) => setFeelBetterRating(parseInt(e.target.value))}
                        className="w-full h-2 lg:h-3 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #EF4444 0%, #FDE047 50%, #10B981 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1 - Worse</span>
                        <span>5 - Same</span>
                        <span>10 - Much Better</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <button
                        onClick={saveRoutineSession}
                        className="flex-1 py-3 lg:py-4 px-6 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-bold hover:scale-105 transition-all text-sm lg:text-base"
                      >
                        Save Session
                      </button>
                      <button
                        onClick={() => {
                          setShowRoutineComplete(false);
                          setSelectedRoutine(null);
                        }}
                        className="flex-1 py-3 lg:py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm lg:text-base"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : isPlayerActive && selectedRoutine ? (
                // Stretch Player
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-purple-600">
                  {/* Progress Bar */}
                  <div className="mb-6 lg:mb-8">
                    <div className="w-full bg-purple-400/30 rounded-full h-2 lg:h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        className="h-full bg-white rounded-full transition-all duration-300"
                      />
                    </div>
                    <p className="text-white text-xs lg:text-sm mt-2 text-center">
                      Stretch {currentStretchIndex + 1} of {selectedRoutine.stretches.length}
                    </p>
                  </div>

                  <div className="text-center text-white">
                    <div className="text-6xl lg:text-7xl mb-4 lg:mb-6">{selectedRoutine.stretches[currentStretchIndex].gif}</div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-3">{selectedRoutine.stretches[currentStretchIndex].name}</h2>
                    <p className="text-purple-100 mb-6 lg:mb-8 text-sm lg:text-base max-w-2xl mx-auto">
                      {selectedRoutine.stretches[currentStretchIndex].description}
                    </p>

                    {/* Timer */}
                    <div className="text-5xl lg:text-6xl font-bold mb-6 lg:mb-8">{timeRemaining}s</div>

                    <div className="flex gap-2 lg:gap-3 justify-center flex-wrap">
                      {isPaused ? (
                        <button
                          onClick={resumeRoutine}
                          className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white text-purple-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                        >
                          <Play className="w-4 lg:w-5 h-4 lg:h-5" />
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={pauseRoutine}
                          className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white text-purple-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                        >
                          <Pause className="w-4 lg:w-5 h-4 lg:h-5" />
                          Pause
                        </button>
                      )}
                      <button
                        onClick={skipStretch}
                        className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white/90 text-purple-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                      >
                        <ChevronRight className="w-4 lg:w-5 h-4 lg:h-5" />
                        Skip
                      </button>
                      <button
                        onClick={cancelRoutine}
                        className="py-2 lg:py-2.5 px-4 lg:px-6 bg-white/90 text-purple-600 rounded-lg lg:rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-xs lg:text-sm"
                      >
                        <X className="w-4 lg:w-5 h-4 lg:h-5" />
                        Cancel
                      </button>
                    </div>

                    {selectedRoutine.stretches[currentStretchIndex].isBilateral && (
                      <p className="text-xs lg:text-sm text-purple-100 mt-4">
                        💡 Remember to switch sides when the timer ends
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    {routines.map((routine) => (
                      <motion.div
                        key={routine.id}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-gray-200 hover:border-purple-300 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`inline-flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${routine.color} text-3xl lg:text-4xl`}>
                            {routine.emoji}
                          </div>
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-purple-600" />
                            <span className="text-xs lg:text-sm font-semibold text-purple-600">{routine.duration} min</span>
                          </div>
                        </div>

                        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">{routine.name}</h3>
                        <p className="text-xs lg:text-sm text-purple-600 font-medium mb-2">{routine.focusArea}</p>
                        <p className="text-xs lg:text-sm text-gray-600 mb-4">{routine.description}</p>

                        <button
                          onClick={() => loadRoutine(routine)}
                          className="w-full py-2.5 lg:py-3 px-4 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg lg:rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-xs lg:text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Start {routine.duration}-Min Routine
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {/* Benefits Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-purple-200">
                    <div className="flex items-start gap-4">
                      <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-2.5 lg:p-3 flex-shrink-0">
                        <Sparkles className="w-5 lg:w-6 h-5 lg:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">Why Daily Stretching Matters</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-3">
                          <div className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span>Reduces injury risk by up to 50%</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span>Improves athletic performance</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span>Relieves muscle tension and stress</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs lg:text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <span>Enhances blood circulation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Tab 2: Mobility Tests */}
          {activeTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Mobility Status */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">Your Mobility Status</h3>
                    <p className="text-xs lg:text-sm text-gray-600">
                      {getMobilityStatus().points > 0 ? `Based on ${Math.min(flexibilityData.mobilityScores.length, 3)} test results` : 'Complete tests below'}
                    </p>
                  </div>
                  <div className={`text-2xl lg:text-3xl font-bold ${getMobilityStatus().color}`}>
                    {getMobilityStatus().status}
                  </div>
                </div>
                {getMobilityStatus().points > 0 && (
                  <div className="mt-4 bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <p className="text-xs lg:text-sm text-purple-900">
                      Score: {getMobilityStatus().points}/6 points (Pass=2, Partial=1, Needs Work=0)
                    </p>
                  </div>
                )}
              </div>

              {/* Mobility Tests */}
              <div className="space-y-4">
                {mobilityTests.map((test) => {
                  const latestScore = flexibilityData.mobilityScores.find(s => s.testId === test.id);

                  return (
                    <div
                      key={test.id}
                      className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-4xl lg:text-5xl">{test.emoji}</div>
                        <div className="flex-1">
                          <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2">{test.name}</h3>
                          <p className="text-xs lg:text-sm text-gray-600 mb-4">{test.description}</p>

                          <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-4">
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-semibold text-green-900 mb-1">✓ Pass</p>
                              <p className="text-xs text-green-700">{test.passDescription}</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                              <p className="text-xs font-semibold text-red-900 mb-1">✗ Needs Work</p>
                              <p className="text-xs text-red-700">{test.failDescription}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => updateMobilityScore(test.id, 'pass')}
                              className={`flex-1 py-2 px-3 lg:px-4 rounded-lg font-medium transition-all text-xs lg:text-sm ${
                                latestScore?.score === 'pass'
                                  ? 'bg-green-500 text-white shadow-lg'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              ✓ Pass
                            </button>
                            <button
                              onClick={() => updateMobilityScore(test.id, 'partial')}
                              className={`flex-1 py-2 px-3 lg:px-4 rounded-lg font-medium transition-all text-xs lg:text-sm ${
                                latestScore?.score === 'partial'
                                  ? 'bg-yellow-500 text-white shadow-lg'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}
                            >
                              ~ Partial
                            </button>
                            <button
                              onClick={() => updateMobilityScore(test.id, 'fail')}
                              className={`flex-1 py-2 px-3 lg:px-4 rounded-lg font-medium transition-all text-xs lg:text-sm ${
                                latestScore?.score === 'fail'
                                  ? 'bg-red-500 text-white shadow-lg'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              ✗ Needs Work
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">Testing Tips</h3>
                    <ul className="space-y-1 text-xs lg:text-sm text-gray-700">
                      <li>• Perform tests after a light warm-up, not cold</li>
                      <li>• Retest every 2-4 weeks to track progress</li>
                      <li>• Focus on areas that need work with targeted stretching</li>
                      <li>• Consult a professional for persistent limitations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Recovery Log */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Session Logger */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">Log Recovery Session</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="15"
                      className="w-full px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm lg:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-3">
                      Focus Areas (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {focusAreaOptions.map(area => (
                        <motion.button
                          key={area}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleFocusArea(area)}
                          className={`py-2 px-4 rounded-lg text-xs lg:text-sm font-medium transition-all ${
                            selectedFocusAreas.includes(area)
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {area}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-3">
                      Soreness Before Session: {sorenessLevel}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={sorenessLevel}
                      onChange={(e) => setSorenessLevel(parseInt(e.target.value))}
                      className="w-full h-2 lg:h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #FDE047 50%, #EF4444 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1 - No Pain</span>
                      <span>5 - Moderate</span>
                      <span>10 - Very Sore</span>
                    </div>
                  </div>

                  <button
                    onClick={logRecoverySession}
                    disabled={!duration || selectedFocusAreas.length === 0}
                    className="w-full py-3 lg:py-4 px-6 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm lg:text-base"
                  >
                    🧘 Log Session
                  </button>
                </div>
              </div>

              {/* Weekly Heatmap */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Recovery Heatmap</h3>
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {getWeeklyHeatmap().map((day, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-600 mb-2">{day.day}</div>
                      <div
                        className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                          day.hasSession
                            ? 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg'
                            : 'bg-gray-100'
                        }`}
                      >
                        {day.hasSession && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 lg:w-3 h-2 lg:h-3 rounded-full bg-white"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs lg:text-sm text-gray-500 mt-4 text-center">
                  Purple dots mark days with recovery sessions
                </p>
              </div>

              {/* Injury Proof Badge */}
              {getThisWeekSessions().length >= 3 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl lg:rounded-2xl p-6 text-center"
                >
                  <Award className="w-12 lg:w-16 h-12 lg:h-16 text-white mx-auto mb-3" />
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Injury Proof!</h3>
                  <p className="text-yellow-50 text-sm lg:text-base">
                    You've completed {getThisWeekSessions().length} recovery sessions this week!
                  </p>
                </motion.div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 lg:p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6 text-purple-600" />
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Total Minutes</h3>
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold text-purple-600">{getTotalMinutes()}</p>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 lg:p-6 border-2 border-violet-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 lg:w-6 h-5 lg:h-6 text-violet-600" />
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">This Week</h3>
                  </div>
                  <p className="text-3xl lg:text-4xl font-bold text-violet-600">{getThisWeekSessions().length}</p>
                </div>
              </div>

              {/* Recent Sessions */}
              {flexibilityData.recoverySessions.length > 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm lg:text-base">Recent Sessions</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {flexibilityData.recoverySessions.slice(0, 5).map(session => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 lg:p-4 rounded-lg lg:rounded-xl bg-purple-50 border border-purple-100"
                      >
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-10 lg:w-12 h-10 lg:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm lg:text-base">
                            {session.duration}m
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-900">
                              {session.focusAreas.join(', ')}
                            </p>
                            <p className="text-xs text-gray-600">
                              Soreness: {session.sorenessLevel}/10
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
