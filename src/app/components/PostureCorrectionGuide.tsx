import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Target, Play, Pause, RotateCcw, CheckCircle2, Bell, Award, TrendingUp, AlertTriangle, Clock, Monitor, Eye, ChevronRight, X, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logUserActivity } from '@/lib/db';

interface Exercise {
  name: string;
  duration: number;
  description: string;
  targetArea: string;
  gif: string;
}

interface StretchRoutine {
  id: string;
  name: string;
  exercises: Exercise[];
  symptoms: string[];
  description: string;
}

interface FocusSession {
  id: string;
  duration: number;
  startTime: string;
  endTime: string;
  completed: boolean;
  timestamp: string;
}

interface DeskBreakLog {
  id: string;
  routineName: string;
  exercisesCompleted: string[];
  painBefore: number;
  painAfter: number;
  timestamp: string;
  date: string;
}

interface ErgonomicSetup {
  monitorHeight: boolean;
  elbowAngle: boolean;
  feetFlat: boolean;
  backSupport: boolean;
  keyboardDistance: boolean;
  screenDistance: boolean;
}

interface WorkCompanionData {
  focusSessions: FocusSession[];
  deskBreakLogs: DeskBreakLog[];
  ergonomicSetup: ErgonomicSetup;
  totalFocusMinutes: number;
}

const stretchRoutines: StretchRoutine[] = [
  {
    id: 'neck-relief',
    name: 'Neck & Shoulder Relief',
    description: 'Perfect for upper body tension and screen fatigue',
    symptoms: ['Tight neck', 'Headaches', 'Shoulder tension', 'Eye strain'],
    exercises: [
      {
        name: 'Chin Tucks',
        duration: 30,
        description: 'Pull chin back, creating a double chin. Hold for 5 seconds, repeat.',
        targetArea: 'Text Neck / Forward Head',
        gif: '👤',
      },
      {
        name: 'Neck Stretches',
        duration: 30,
        description: 'Gently tilt head to each side, hold for 10 seconds.',
        targetArea: 'Neck Tension',
        gif: '👤',
      },
      {
        name: 'Shoulder Rolls',
        duration: 30,
        description: 'Roll shoulders backward in large circles, 10 reps.',
        targetArea: 'Shoulder Mobility',
        gif: '💪',
      },
      {
        name: 'Scapular Squeezes',
        duration: 30,
        description: 'Pull shoulder blades together, squeeze. Hold for 5 seconds.',
        targetArea: 'Upper Back',
        gif: '💪',
      },
    ],
  },
  {
    id: 'back-rescue',
    name: 'Lower Back Rescue',
    description: 'Relieves sitting-related lower back pain',
    symptoms: ['Low back ache', 'Hip tightness', 'Core weakness'],
    exercises: [
      {
        name: 'Seated Spinal Twist',
        duration: 30,
        description: 'Sit tall, twist torso to each side, hold for 15 seconds.',
        targetArea: 'Spinal Mobility',
        gif: '🧘',
      },
      {
        name: 'Hip Flexor Stretch',
        duration: 30,
        description: 'Stand, lunge forward, feel stretch in front hip.',
        targetArea: 'Hip Flexors',
        gif: '🦵',
      },
      {
        name: 'Cat-Cow Stretch',
        duration: 30,
        description: 'On hands and knees, arch and round your back.',
        targetArea: 'Spine Flexibility',
        gif: '🧘',
      },
      {
        name: 'Seated Piriformis Stretch',
        duration: 30,
        description: 'Cross ankle over opposite knee, lean forward gently.',
        targetArea: 'Lower Back / Glutes',
        gif: '🧘',
      },
    ],
  },
  {
    id: 'wrist-reset',
    name: 'Wrist & Hand Reset',
    description: 'Essential for keyboard and mouse users',
    symptoms: ['Wrist pain', 'Hand numbness', 'Finger stiffness'],
    exercises: [
      {
        name: 'Wrist Circles',
        duration: 30,
        description: 'Rotate wrists in both directions, 10 circles each way.',
        targetArea: 'Wrist Mobility',
        gif: '✋',
      },
      {
        name: 'Prayer Stretch',
        duration: 30,
        description: 'Press palms together, lower hands to feel forearm stretch.',
        targetArea: 'Forearm Flexors',
        gif: '🙏',
      },
      {
        name: 'Finger Extensions',
        duration: 30,
        description: 'Spread fingers wide, hold for 5 seconds, repeat.',
        targetArea: 'Hand Flexibility',
        gif: '🖐️',
      },
      {
        name: 'Reverse Prayer',
        duration: 30,
        description: 'Press backs of hands together, raise to feel stretch.',
        targetArea: 'Forearm Extensors',
        gif: '🤲',
      },
    ],
  },
  {
    id: 'full-refresh',
    name: 'Full Body Refresh',
    description: 'Complete desk break for overall tension',
    symptoms: ['Overall stiffness', 'Fatigue', 'Poor circulation', 'Tight chest'],
    exercises: [
      {
        name: 'Standing Reach',
        duration: 30,
        description: 'Stand, reach arms overhead, stretch tall.',
        targetArea: 'Full Body',
        gif: '🙌',
      },
      {
        name: 'Torso Twists',
        duration: 30,
        description: 'Stand, rotate torso side to side, arms loose.',
        targetArea: 'Core Mobility',
        gif: '🧘',
      },
      {
        name: 'Wall Slides',
        duration: 30,
        description: 'Back against wall, arms at 90°. Slide arms up and down.',
        targetArea: 'Shoulder Mobility',
        gif: '💪',
      },
      {
        name: 'Ankle Pumps',
        duration: 30,
        description: 'Seated, pump ankles up and down, improve circulation.',
        targetArea: 'Lower Leg',
        gif: '🦶',
      },
    ],
  },
];

const allSymptoms = [
  'Tight neck', 'Headaches', 'Shoulder tension', 'Eye strain',
  'Low back ache', 'Hip tightness', 'Core weakness',
  'Wrist pain', 'Hand numbness', 'Finger stiffness',
  'Overall stiffness', 'Fatigue', 'Poor circulation', 'Tight chest',
];

const ergonomicItems = [
  { key: 'monitorHeight' as const, label: 'Monitor at eye level', tip: 'Top of screen at or slightly below eye level' },
  { key: 'elbowAngle' as const, label: 'Elbows at 90 degrees', tip: 'Arms form right angle when typing' },
  { key: 'feetFlat' as const, label: 'Feet flat on floor', tip: 'Or use footrest for proper support' },
  { key: 'backSupport' as const, label: 'Back supported by chair', tip: 'Lower back touches chair backrest' },
  { key: 'keyboardDistance' as const, label: 'Keyboard close to body', tip: 'No reaching forward required' },
  { key: 'screenDistance' as const, label: 'Screen arm\'s length away', tip: 'About 20-26 inches from eyes' },
];

export default function PostureCorrectionGuide({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'symptom-map' | 'focus-timer' | 'desk-breaks' | 'ergonomic-wizard'>('symptom-map');
  const [workData, setWorkData] = useState<WorkCompanionData>(() => {
    const saved = localStorage.getItem('work-companion-data');
    return saved ? JSON.parse(saved) : {
      focusSessions: [],
      deskBreakLogs: [],
      ergonomicSetup: {
        monitorHeight: false,
        elbowAngle: false,
        feetFlat: false,
        backSupport: false,
        keyboardDistance: false,
        screenDistance: false,
      },
      totalFocusMinutes: 0,
    };
  });

  // Symptom mapping state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  // Focus timer state
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [showFocusComplete, setShowFocusComplete] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Desk break player state
  const [selectedRoutine, setSelectedRoutine] = useState<StretchRoutine | null>(null);
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [isBreakPaused, setIsBreakPaused] = useState(false);
  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(5);
  const [showBreakComplete, setShowBreakComplete] = useState(false);

  // Ergonomic wizard state
  const [showWizardCelebration, setShowWizardCelebration] = useState(false);

  useEffect(() => {
    localStorage.setItem('work-companion-data', JSON.stringify(workData));
  }, [workData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('posture_correction');
      
      const focusSessions = dbLogs
        .filter(l => l.action_type === 'focus_session_complete')
        .map(log => {
          const p = log.payload;
          return {
            id: log.id.toString(),
            duration: p.focus_duration_minutes,
            startTime: p.start_time,
            endTime: p.end_time,
            completed: true,
            timestamp: p.timestamp,
          } as FocusSession;
        });

      const deskBreakLogs = dbLogs
        .filter(l => l.action_type === 'desk_break_complete')
        .map(log => {
          const p = log.payload;
          return {
            id: log.id.toString(),
            routineName: p.routine_name,
            exercisesCompleted: p.exercises_completed,
            painBefore: p.pain_level_before,
            painAfter: p.pain_level_after,
            timestamp: p.timestamp,
            date: new Date(p.timestamp).toISOString().split('T')[0],
          } as DeskBreakLog;
        });

      const ergoLog = dbLogs.find(l => l.action_type === 'ergonomic_setup_complete');
      let ergonomicSetup = {
        monitorHeight: false,
        elbowAngle: false,
        feetFlat: false,
        backSupport: false,
        keyboardDistance: false,
        screenDistance: false,
      };
      if (ergoLog) {
        const items = ergoLog.payload.setup_items_completed;
        ergonomicSetup = {
          monitorHeight: items.includes('Monitor at eye level'),
          elbowAngle: items.includes('Elbows at 90 degrees'),
          feetFlat: items.includes('Feet flat on floor'),
          backSupport: items.includes('Back supported by chair'),
          keyboardDistance: items.includes('Keyboard close to body'),
          screenDistance: items.includes('Screen arm\'s length away'),
        };
      }

      const totalFocusMinutes = focusSessions.reduce((sum, s) => sum + s.duration, 0);

      if (focusSessions.length > 0 || deskBreakLogs.length > 0 || ergoLog) {
        setWorkData({
          focusSessions,
          deskBreakLogs,
          ergonomicSetup,
          totalFocusMinutes,
        });
      }
    };
    loadDbLogs();
  }, []);

  // Focus timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusActive && !isFocusPaused && focusTimeRemaining > 0) {
      interval = setInterval(() => {
        setFocusTimeRemaining(prev => {
          if (prev <= 1) {
            completeFocusSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, isFocusPaused, focusTimeRemaining]);

  // Desk break timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBreakActive && !isBreakPaused && breakTimeRemaining > 0) {
      interval = setInterval(() => {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            handleExerciseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreakActive, isBreakPaused, breakTimeRemaining]);

  const playChime = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getRecommendedRoutines = () => {
    if (selectedSymptoms.length === 0) return stretchRoutines;
    return stretchRoutines.filter(routine =>
      routine.symptoms.some(symptom => selectedSymptoms.includes(symptom))
    ).sort((a, b) => {
      const aMatches = a.symptoms.filter(s => selectedSymptoms.includes(s)).length;
      const bMatches = b.symptoms.filter(s => selectedSymptoms.includes(s)).length;
      return bMatches - aMatches;
    });
  };

  // Focus Timer Functions
  const startFocusSession = () => {
    setIsFocusActive(true);
    setFocusTimeRemaining(focusDuration * 60);
    setIsFocusPaused(false);
  };

  const pauseFocusSession = () => {
    setIsFocusPaused(true);
  };

  const resumeFocusSession = () => {
    setIsFocusPaused(false);
  };

  const resetFocusSession = () => {
    setIsFocusActive(false);
    setFocusTimeRemaining(0);
    setIsFocusPaused(false);
  };

  const completeFocusSession = () => {
    const now = new Date();
    const sessionStart = new Date(now.getTime() - focusDuration * 60 * 1000);

    const newSession: FocusSession = {
      id: Date.now().toString(),
      duration: focusDuration,
      startTime: sessionStart.toISOString(),
      endTime: now.toISOString(),
      completed: true,
      timestamp: now.toISOString(),
    };

    setWorkData(prev => ({
      ...prev,
      focusSessions: [newSession, ...prev.focusSessions],
      totalFocusMinutes: prev.totalFocusMinutes + focusDuration,
    }));

    // Database log
    logUserActivity('posture_correction', 'focus_session_complete', {
      focus_duration_minutes: focusDuration,
      start_time: sessionStart.toISOString(),
      end_time: now.toISOString(),
      timestamp: now.toISOString(),
    });

    setIsFocusActive(false);
    setShowFocusComplete(true);
    playChime();

    // Confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#818CF8', '#A5B4FC'],
    });
  };

  // Desk Break Player Functions
  const startDeskBreak = (routine: StretchRoutine) => {
    setSelectedRoutine(routine);
    setIsBreakActive(true);
    setCurrentExerciseIndex(0);
    setBreakTimeRemaining(routine.exercises[0].duration);
    setIsBreakPaused(false);
    setShowBreakComplete(false);
  };

  const pauseBreak = () => {
    setIsBreakPaused(true);
  };

  const resumeBreak = () => {
    setIsBreakPaused(false);
  };

  const resetBreak = () => {
    setIsBreakActive(false);
    setCurrentExerciseIndex(0);
    setBreakTimeRemaining(0);
    setIsBreakPaused(false);
    setSelectedRoutine(null);
  };

  const handleExerciseComplete = () => {
    if (!selectedRoutine) return;

    if (currentExerciseIndex < selectedRoutine.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setBreakTimeRemaining(selectedRoutine.exercises[currentExerciseIndex + 1].duration);
    } else {
      completeDeskBreak();
    }
  };

  const completeDeskBreak = () => {
    if (!selectedRoutine) return;

    const today = new Date().toISOString().split('T')[0];
    const newLog: DeskBreakLog = {
      id: Date.now().toString(),
      routineName: selectedRoutine.name,
      exercisesCompleted: selectedRoutine.exercises.map(ex => ex.name),
      painBefore,
      painAfter,
      timestamp: new Date().toISOString(),
      date: today,
    };

    const painReduction = Math.max(0, painBefore - painAfter);

    setWorkData(prev => ({
      ...prev,
      deskBreakLogs: [newLog, ...prev.deskBreakLogs],
    }));

    // Database log
    logUserActivity('posture_correction', 'desk_break_complete', {
      routine_name: selectedRoutine.name,
      exercises_completed: selectedRoutine.exercises.map(ex => ex.name),
      pain_level_before: painBefore,
      pain_level_after: painAfter,
      pain_reduction: painReduction,
      timestamp: new Date().toISOString(),
    });

    setIsBreakActive(false);
    setShowBreakComplete(true);

    // Confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#818CF8', '#A5B4FC'],
    });
  };

  // Ergonomic Wizard Functions
  const toggleErgonomicItem = (key: keyof ErgonomicSetup) => {
    const newSetup = { ...workData.ergonomicSetup, [key]: !workData.ergonomicSetup[key] };
    const completedCount = Object.values(newSetup).filter(Boolean).length;
    const wasComplete = Object.values(workData.ergonomicSetup).filter(Boolean).length === 6;
    const isNowComplete = completedCount === 6;

    setWorkData(prev => ({
      ...prev,
      ergonomicSetup: newSetup,
    }));

    if (isNowComplete && !wasComplete) {
      setShowWizardCelebration(true);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FCD34D', '#F59E0B', '#D97706'],
      });

      // Database log
      logUserActivity('posture_correction', 'ergonomic_setup_complete', {
        setup_items_completed: ergonomicItems.map(item => item.label),
        timestamp: new Date().toISOString(),
      });

      setTimeout(() => setShowWizardCelebration(false), 5000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!selectedRoutine) return 0;
    const totalExercises = selectedRoutine.exercises.length;
    const completedExercises = currentExerciseIndex;
    const currentProgress = (breakTimeRemaining / selectedRoutine.exercises[currentExerciseIndex].duration);
    return ((completedExercises + (1 - currentProgress)) / totalExercises) * 100;
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
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-2.5 lg:p-3">
              <Monitor className="w-6 lg:w-8 h-6 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Work Companion</h1>
              <p className="text-xs lg:text-sm text-gray-500">Focus timer, desk breaks, and ergonomic guidance</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('symptom-map')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all text-xs lg:text-sm font-medium whitespace-nowrap ${
              activeTab === 'symptom-map'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Symptom Map
          </button>
          <button
            onClick={() => setActiveTab('focus-timer')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all text-xs lg:text-sm font-medium whitespace-nowrap ${
              activeTab === 'focus-timer'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Focus Timer
          </button>
          <button
            onClick={() => setActiveTab('desk-breaks')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all text-xs lg:text-sm font-medium whitespace-nowrap ${
              activeTab === 'desk-breaks'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Desk Breaks
          </button>
          <button
            onClick={() => setActiveTab('ergonomic-wizard')}
            className={`flex-1 min-w-[120px] py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg transition-all text-xs lg:text-sm font-medium whitespace-nowrap ${
              activeTab === 'ergonomic-wizard'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Ergonomic Setup
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: Symptom-to-Stretch Mapping */}
          {activeTab === 'symptom-map' && (
            <motion.div
              key="symptom-map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Self-Assessment */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">What are you feeling?</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                  {allSymptoms.map(symptom => (
                    <motion.button
                      key={symptom}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleSymptom(symptom)}
                      className={`py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg lg:rounded-xl text-xs lg:text-sm font-medium transition-all ${
                        selectedSymptoms.includes(symptom)
                          ? 'bg-indigo-500 text-white border-2 border-indigo-600'
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {symptom}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Recommended Routines */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
                  {selectedSymptoms.length > 0 ? 'Recommended Routines' : 'All Desk Break Routines'}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                  {getRecommendedRoutines().map(routine => {
                    const matchCount = routine.symptoms.filter(s => selectedSymptoms.includes(s)).length;
                    return (
                      <motion.div
                        key={routine.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 lg:p-5 border border-indigo-200 cursor-pointer"
                        onClick={() => {
                          setActiveTab('desk-breaks');
                          setSelectedRoutine(routine);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{routine.name}</h3>
                          {matchCount > 0 && (
                            <span className="px-2 py-1 bg-indigo-500 text-white rounded-full text-xs font-bold">
                              {matchCount} match{matchCount > 1 ? 'es' : ''}
                            </span>
                          )}
                        </div>
                        <p className="text-xs lg:text-sm text-gray-600 mb-3">{routine.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-600 font-medium">
                            {routine.exercises.length} exercises • {routine.exercises.reduce((sum, ex) => sum + ex.duration, 0)}s
                          </span>
                          <ChevronRight className="w-4 h-4 text-indigo-500" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Focus Timer */}
          {activeTab === 'focus-timer' && (
            <motion.div
              key="focus-timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Focus Complete Overlay */}
              <AnimatePresence>
                {showFocusComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
                    onClick={() => setShowFocusComplete(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 50 }}
                      className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 lg:p-8 text-center max-w-md w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-6xl lg:text-7xl mb-4">🎯</div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3">Time to Realign!</h2>
                      <p className="text-indigo-100 mb-6 text-sm lg:text-base">
                        You completed a {focusDuration}-minute focus session. Take a desk break to refresh!
                      </p>
                      <button
                        onClick={() => {
                          setShowFocusComplete(false);
                          setActiveTab('desk-breaks');
                        }}
                        className="w-full py-3 lg:py-4 px-6 bg-white text-indigo-600 rounded-xl font-bold hover:scale-105 transition-all mb-3"
                      >
                        Start Desk Break
                      </button>
                      <button
                        onClick={() => setShowFocusComplete(false)}
                        className="text-indigo-100 text-sm hover:text-white transition-colors"
                      >
                        Close
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timer Display */}
              {isFocusActive ? (
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-white text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="w-6 lg:w-8 h-6 lg:h-8" />
                    <h2 className="text-xl lg:text-2xl font-bold">Focus Session</h2>
                  </div>
                  <div className="text-6xl lg:text-8xl font-bold tabular-nums mb-6 lg:mb-8">{formatTime(focusTimeRemaining)}</div>
                  <div className="flex gap-3 justify-center mb-4 flex-wrap">
                    {isFocusPaused ? (
                      <button
                        onClick={resumeFocusSession}
                        className="py-2.5 lg:py-3 px-6 lg:px-8 bg-white text-indigo-600 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm lg:text-base"
                      >
                        <Play className="w-5 lg:w-6 h-5 lg:h-6" />
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={pauseFocusSession}
                        className="py-2.5 lg:py-3 px-6 lg:px-8 bg-white text-indigo-600 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm lg:text-base"
                      >
                        <Pause className="w-5 lg:w-6 h-5 lg:h-6" />
                        Pause
                      </button>
                    )}
                    <button
                      onClick={resetFocusSession}
                      className="py-2.5 lg:py-3 px-6 lg:px-8 bg-indigo-400/30 text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm lg:text-base"
                    >
                      <RotateCcw className="w-5 lg:w-6 h-5 lg:h-6" />
                      Reset
                    </button>
                  </div>
                  <p className="text-indigo-100 text-xs lg:text-sm">Stay focused. A desk break reminder will appear when time's up.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Start a Focus Session</h2>
                  <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
                    {[25, 45, 60].map(duration => (
                      <motion.button
                        key={duration}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFocusDuration(duration)}
                        className={`py-4 lg:py-6 rounded-xl text-center transition-all ${
                          focusDuration === duration
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-2 border-indigo-600 shadow-lg'
                            : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-2xl lg:text-3xl font-bold">{duration}</div>
                        <div className="text-xs lg:text-sm font-medium mt-1">minutes</div>
                      </motion.button>
                    ))}
                  </div>
                  <button
                    onClick={startFocusSession}
                    className="w-full py-3 lg:py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    <Play className="w-5 lg:w-6 h-5 lg:h-6" />
                    Start {focusDuration}-Minute Session
                  </button>
                </div>
              )}

              {/* Focus Stats */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm lg:text-base">Focus History</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-indigo-50 rounded-lg lg:rounded-xl p-4 border border-indigo-200">
                    <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-1">{workData.focusSessions.length}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Total Sessions</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg lg:rounded-xl p-4 border border-indigo-200">
                    <div className="text-2xl lg:text-3xl font-bold text-indigo-600 mb-1">{workData.totalFocusMinutes}</div>
                    <div className="text-xs lg:text-sm text-gray-600">Minutes Focused</div>
                  </div>
                </div>
                {workData.focusSessions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs lg:text-sm font-medium text-gray-700 mb-2">Recent Sessions</h4>
                    {workData.focusSessions.slice(0, 5).map(session => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 lg:w-5 h-4 lg:h-5 text-indigo-500" />
                          <span className="text-xs lg:text-sm font-medium text-gray-900">{session.duration} minutes</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(session.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Tab 3: Desk Breaks */}
          {activeTab === 'desk-breaks' && (
            <motion.div
              key="desk-breaks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Break Complete Screen */}
              <AnimatePresence>
                {showBreakComplete && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
                    onClick={() => setShowBreakComplete(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.8, y: 50 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.8, y: 50 }}
                      className="bg-white rounded-2xl p-6 lg:p-8 text-center max-w-md w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-6xl lg:text-7xl mb-4">✨</div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">Break Complete!</h2>
                      <p className="text-gray-600 mb-6 text-sm lg:text-base">
                        {selectedRoutine?.name} finished. Your spine health score improved!
                      </p>
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 mb-6 border border-indigo-200">
                        <div className="text-xs lg:text-sm text-gray-600 mb-1">Pain Reduction</div>
                        <div className="text-2xl lg:text-3xl font-bold text-indigo-600">
                          {painBefore - painAfter} point{painBefore - painAfter !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBreakComplete(false)}
                        className="w-full py-3 lg:py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl font-bold hover:scale-105 transition-all"
                      >
                        Done
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Break Player */}
              {isBreakActive && selectedRoutine ? (
                <div className="space-y-4 lg:space-y-6">
                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-white text-center">
                    <div className="text-5xl lg:text-6xl mb-4">{selectedRoutine.exercises[currentExerciseIndex].gif}</div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">{selectedRoutine.exercises[currentExerciseIndex].name}</h2>
                    <p className="text-indigo-100 mb-2 text-sm lg:text-base">{selectedRoutine.exercises[currentExerciseIndex].description}</p>
                    <p className="text-xs lg:text-sm text-indigo-200 mb-6">{selectedRoutine.exercises[currentExerciseIndex].targetArea}</p>
                    <div className="text-6xl lg:text-8xl font-bold tabular-nums mb-6">{breakTimeRemaining}s</div>

                    {/* Progress Bar */}
                    <div className="w-full bg-indigo-400/30 rounded-full h-2 lg:h-3 mb-6">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        className="h-full bg-white rounded-full transition-all duration-300"
                      />
                    </div>

                    <div className="flex gap-3 justify-center mb-4 flex-wrap">
                      {isBreakPaused ? (
                        <button
                          onClick={resumeBreak}
                          className="py-2.5 lg:py-3 px-6 lg:px-8 bg-white text-indigo-600 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm lg:text-base"
                        >
                          <Play className="w-5 lg:w-6 h-5 lg:h-6" />
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={pauseBreak}
                          className="py-2.5 lg:py-3 px-6 lg:px-8 bg-white text-indigo-600 rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm lg:text-base"
                        >
                          <Pause className="w-5 lg:w-6 h-5 lg:h-6" />
                          Pause
                        </button>
                      )}
                      <button
                        onClick={resetBreak}
                        className="py-2.5 lg:py-3 px-6 lg:px-8 bg-indigo-400/30 text-white rounded-xl font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm lg:text-base"
                      >
                        <RotateCcw className="w-5 lg:w-6 h-5 lg:h-6" />
                        Reset
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {selectedRoutine.exercises.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 lg:w-3 h-2 lg:h-3 rounded-full transition-all ${
                            index < currentExerciseIndex
                              ? 'bg-green-400'
                              : index === currentExerciseIndex
                              ? 'bg-white scale-125'
                              : 'bg-indigo-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Next Up */}
                  {currentExerciseIndex < selectedRoutine.exercises.length - 1 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-600 mb-2">
                        <Eye className="w-4 h-4" />
                        Next up
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl lg:text-3xl">{selectedRoutine.exercises[currentExerciseIndex + 1].gif}</div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm lg:text-base">{selectedRoutine.exercises[currentExerciseIndex + 1].name}</div>
                          <div className="text-xs lg:text-sm text-gray-600">{selectedRoutine.exercises[currentExerciseIndex + 1].targetArea}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedRoutine && !isBreakActive && !showBreakComplete ? (
                // Routine Preview
                <div className="space-y-4 lg:space-y-6">
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                    <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3">{selectedRoutine.name}</h2>
                    <p className="text-xs lg:text-sm text-gray-600 mb-4 lg:mb-6">{selectedRoutine.description}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-6">
                      {selectedRoutine.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg lg:rounded-xl p-3 lg:p-4 border border-indigo-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl lg:text-3xl">{exercise.gif}</div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm lg:text-base mb-1">{exercise.name}</h3>
                              <p className="text-xs text-indigo-600 mb-2">{exercise.targetArea}</p>
                              <p className="text-xs lg:text-sm text-gray-600 mb-2">{exercise.description}</p>
                              <span className="inline-block px-2 py-1 bg-indigo-200 text-indigo-700 rounded text-xs font-semibold">
                                {exercise.duration}s
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-3">
                        Current Discomfort Level: {painBefore}/10
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={painBefore}
                        onChange={(e) => setPainBefore(parseInt(e.target.value))}
                        className="w-full h-2 lg:h-3 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #10B981 0%, #FCD34D 50%, #EF4444 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>1 - No Pain</span>
                        <span>5 - Moderate</span>
                        <span>10 - Severe</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedRoutine(null)}
                        className="flex-1 py-3 lg:py-4 px-6 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm lg:text-base"
                      >
                        Back to Routines
                      </button>
                      <button
                        onClick={() => startDeskBreak(selectedRoutine)}
                        className="flex-1 py-3 lg:py-4 px-6 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 text-sm lg:text-base"
                      >
                        <Play className="w-5 lg:w-6 h-5 lg:h-6" />
                        Start Break
                      </button>
                    </div>
                  </div>

                  {/* Post-Break Pain Assessment (shown after selecting routine) */}
                  <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm lg:text-base">After the break, rate your pain level</h3>
                    <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-3">
                      Expected Pain After: {painAfter}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={painAfter}
                      onChange={(e) => setPainAfter(parseInt(e.target.value))}
                      className="w-full h-2 lg:h-3 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #FCD34D 50%, #EF4444 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1 - No Pain</span>
                      <span>5 - Moderate</span>
                      <span>10 - Severe</span>
                    </div>
                  </div>
                </div>
              ) : (
                // Routine List
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Choose a Desk Break Routine</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                    {stretchRoutines.map(routine => (
                      <motion.div
                        key={routine.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 lg:p-5 border border-indigo-200 cursor-pointer"
                        onClick={() => setSelectedRoutine(routine)}
                      >
                        <h3 className="font-semibold text-gray-900 mb-2 text-sm lg:text-base">{routine.name}</h3>
                        <p className="text-xs lg:text-sm text-gray-600 mb-3">{routine.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-600 font-medium">
                            {routine.exercises.length} exercises • {routine.exercises.reduce((sum, ex) => sum + ex.duration, 0)}s
                          </span>
                          <ChevronRight className="w-4 h-4 text-indigo-500" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Breaks */}
              {workData.deskBreakLogs.length > 0 && !isBreakActive && (
                <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 text-sm lg:text-base">Recent Desk Breaks</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {workData.deskBreakLogs.slice(0, 5).map(log => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 lg:p-4 rounded-lg lg:rounded-xl bg-indigo-50 border border-indigo-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-4 lg:w-6 h-4 lg:h-6" />
                          </div>
                          <div>
                            <p className="text-xs lg:text-sm font-medium text-gray-900">{log.routineName}</p>
                            <p className="text-xs text-gray-600">
                              Pain: {log.painBefore} → {log.painAfter} ({log.painBefore - log.painAfter >= 0 ? '-' : '+'}{Math.abs(log.painBefore - log.painAfter)})
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 4: Ergonomic Setup Wizard */}
          {activeTab === 'ergonomic-wizard' && (
            <motion.div
              key="ergonomic-wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Wizard Celebration */}
              <AnimatePresence>
                {showWizardCelebration && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl lg:rounded-2xl p-6 lg:p-8 text-center"
                  >
                    <Award className="w-12 lg:w-16 h-12 lg:h-16 text-white mx-auto mb-3" />
                    <h3 className="text-xl lg:text-2xl font-bold text-white mb-2">Perfect Setup Achieved!</h3>
                    <p className="text-yellow-50 text-sm lg:text-base">You've optimized all ergonomic factors. Your workspace is spine-friendly!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Ergonomic Checklist */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Interactive Setup Guide</h2>
                <div className="space-y-3 lg:space-y-4">
                  {ergonomicItems.map(item => (
                    <motion.div
                      key={item.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleErgonomicItem(item.key)}
                      className={`p-4 rounded-lg lg:rounded-xl border-2 cursor-pointer transition-all ${
                        workData.ergonomicSetup[item.key]
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex-shrink-0 ${
                          workData.ergonomicSetup[item.key] ? 'text-indigo-600' : 'text-gray-400'
                        }`}>
                          {workData.ergonomicSetup[item.key] ? (
                            <CheckCircle2 className="w-5 lg:w-6 h-5 lg:h-6" />
                          ) : (
                            <div className="w-5 lg:w-6 h-5 lg:h-6 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">{item.label}</h3>
                          <p className="text-xs lg:text-sm text-gray-600">{item.tip}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Progress */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-sm lg:text-base">Setup Progress</h3>
                  <span className="text-2xl lg:text-3xl font-bold text-indigo-600">
                    {Object.values(workData.ergonomicSetup).filter(Boolean).length}/6
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 lg:h-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(Object.values(workData.ergonomicSetup).filter(Boolean).length / 6) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm lg:text-base">Ergonomic Benefits</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                  <div className="bg-indigo-50 rounded-lg lg:rounded-xl p-4 border border-indigo-200">
                    <div className="text-2xl mb-2">🧘</div>
                    <p className="text-xs lg:text-sm font-semibold text-gray-900 mb-1">Prevent Strain</p>
                    <p className="text-xs text-gray-600">Proper setup reduces muscle tension</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg lg:rounded-xl p-4 border border-indigo-200">
                    <div className="text-2xl mb-2">⚡</div>
                    <p className="text-xs lg:text-sm font-semibold text-gray-900 mb-1">Boost Productivity</p>
                    <p className="text-xs text-gray-600">Comfort leads to better focus</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg lg:rounded-xl p-4 border border-indigo-200">
                    <div className="text-2xl mb-2">❤️</div>
                    <p className="text-xs lg:text-sm font-semibold text-gray-900 mb-1">Long-term Health</p>
                    <p className="text-xs text-gray-600">Protect your spine for years</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
