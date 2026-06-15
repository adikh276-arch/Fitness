import { useState, useEffect } from 'react';
import { ArrowLeft, User, Search, Clock, TrendingUp, Smile, Meh, Frown, Heart, Sparkles, X, Info, Play, Pause, SkipForward, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { logUserActivity } from '@/lib/db';

interface YogaSession {
  id: string;
  duration: number;
  style: string;
  moodScore: number;
  timestamp: string;
  date: string;
}

interface YogaData {
  sessions: YogaSession[];
  currentStreak: number;
  weeklyGoal: number;
}

interface Pose {
  name: string;
  category: string;
  alignment: string;
  mistakes: string;
  benefits: string;
  emoji: string;
}

const flows = [
  {
    id: 'sunrise',
    name: 'Sunrise Flow',
    duration: 15,
    focus: 'Energy and spinal mobility',
    vibe: 'Energizing',
    vibeColor: 'from-orange-500 to-yellow-500',
    bgColor: 'from-orange-50 to-yellow-50',
    icon: '🌅',
  },
  {
    id: 'desk-relief',
    name: 'Desk Relief',
    duration: 10,
    focus: 'Neck, shoulders, and wrists',
    vibe: 'Relaxing',
    vibeColor: 'from-cyan-500 to-teal-500',
    bgColor: 'from-cyan-50 to-teal-50',
    icon: '💻',
  },
  {
    id: 'deep-sleep',
    name: 'Deep Sleep Yin',
    duration: 20,
    focus: 'Long-hold stretches for relaxation',
    vibe: 'Calming',
    vibeColor: 'from-indigo-500 to-purple-500',
    bgColor: 'from-indigo-50 to-purple-50',
    icon: '🌙',
  },
  {
    id: 'power',
    name: 'Power Yoga',
    duration: 30,
    focus: 'Strength and balance',
    vibe: 'Sweaty',
    vibeColor: 'from-red-500 to-orange-500',
    bgColor: 'from-red-50 to-orange-50',
    icon: '💪',
  },
];

const poses: Pose[] = [
  {
    name: 'Pigeon Pose',
    category: 'Hips',
    alignment: 'Front knee at 90°, back leg extended straight, hips square to the front',
    mistakes: 'Twisting hips to one side, collapsing into the front hip, forcing the stretch',
    benefits: 'Opens hip flexors, releases tension in glutes, improves hip mobility',
    emoji: '🕊️',
  },
  {
    name: 'Butterfly Pose',
    category: 'Hips',
    alignment: 'Soles of feet together, knees falling to sides, spine long',
    mistakes: 'Rounding the back excessively, forcing knees down, bouncing',
    benefits: 'Opens inner thighs and groin, stimulates abdominal organs, calms the mind',
    emoji: '🦋',
  },
  {
    name: 'Cobra Pose',
    category: 'Back',
    alignment: 'Hands under shoulders, elbows close to ribs, lift through the chest',
    mistakes: 'Hunching shoulders to ears, hyperextending neck, pushing too high',
    benefits: 'Strengthens spine, opens chest and lungs, relieves stress',
    emoji: '🐍',
  },
  {
    name: 'Cat-Cow',
    category: 'Back',
    alignment: 'Hands under shoulders, knees under hips, alternate arching and rounding spine',
    mistakes: 'Moving too quickly, not engaging core, overarching lower back',
    benefits: 'Warms up spine, improves posture, relieves back tension',
    emoji: '🐱',
  },
  {
    name: 'Forward Fold',
    category: 'Hamstrings',
    alignment: 'Hinge at hips, keep spine long, slight bend in knees if needed',
    mistakes: 'Rounding from lower back, locking knees, forcing the stretch',
    benefits: 'Stretches hamstrings and calves, calms nervous system, relieves headaches',
    emoji: '🙇',
  },
  {
    name: 'Downward Dog',
    category: 'Hamstrings',
    alignment: 'Hands shoulder-width, feet hip-width, hips high, heels reaching toward floor',
    mistakes: 'Rounding shoulders, arching lower back, locking elbows',
    benefits: 'Full body stretch, strengthens arms and legs, energizes body',
    emoji: '🐕',
  },
  {
    name: 'Child\'s Pose',
    category: 'Back',
    alignment: 'Knees wide, big toes touching, forehead to floor, arms extended',
    mistakes: 'Tensing shoulders, holding breath, forcing hips to heels',
    benefits: 'Releases back tension, calms mind, gentle hip opener',
    emoji: '🧘',
  },
  {
    name: 'Triangle Pose',
    category: 'Hips',
    alignment: 'Front foot forward, back foot at 90°, reach forward then down, both sides of torso long',
    mistakes: 'Collapsing into bottom side, hyperextending front knee, twisting torso forward',
    benefits: 'Strengthens legs, opens hips and chest, improves balance',
    emoji: '🔺',
  },
];

const moodEmojis = [
  { score: 1, emoji: '😤', label: 'Frustrated' },
  { score: 2, emoji: '😕', label: 'Tense' },
  { score: 3, emoji: '😊', label: 'Calm' },
  { score: 4, emoji: '😌', label: 'Peaceful' },
  { score: 5, emoji: '🧘', label: 'Zen' },
];

const deskStretches = [
  'Neck Tilts',
  'Shoulder Rolls',
  'Wrist Circles',
  'Seated Spinal Twist',
  'Shoulder Blade Squeeze',
];

const flowPoses = {
  sunrise: [
    { name: 'Cat-Cow', duration: 60, emoji: '🐱' },
    { name: 'Downward Dog', duration: 45, emoji: '🐕' },
    { name: 'Forward Fold', duration: 45, emoji: '🙇' },
    { name: 'Mountain Pose', duration: 30, emoji: '🏔️' },
    { name: 'Sun Salutation Flow', duration: 90, emoji: '☀️' },
    { name: 'Warrior I', duration: 45, emoji: '⚔️' },
    { name: 'Triangle Pose', duration: 45, emoji: '🔺' },
    { name: 'Child\'s Pose', duration: 60, emoji: '🧘' },
  ],
  'deep-sleep': [
    { name: 'Butterfly Pose', duration: 120, emoji: '🦋' },
    { name: 'Pigeon Pose', duration: 120, emoji: '🕊️' },
    { name: 'Supine Twist', duration: 90, emoji: '🌀' },
    { name: 'Legs Up the Wall', duration: 180, emoji: '🦵' },
    { name: 'Child\'s Pose', duration: 90, emoji: '🧘' },
    { name: 'Reclined Butterfly', duration: 120, emoji: '🦋' },
    { name: 'Corpse Pose', duration: 180, emoji: '💤' },
  ],
  power: [
    { name: 'Plank Hold', duration: 45, emoji: '🏋️' },
    { name: 'Chaturanga', duration: 30, emoji: '💪' },
    { name: 'Upward Dog', duration: 30, emoji: '🐕' },
    { name: 'Downward Dog', duration: 45, emoji: '🐕' },
    { name: 'Warrior II', duration: 45, emoji: '⚔️' },
    { name: 'Triangle Pose', duration: 45, emoji: '🔺' },
    { name: 'Chair Pose', duration: 45, emoji: '🪑' },
    { name: 'Crow Pose', duration: 30, emoji: '🦅' },
    { name: 'Boat Pose', duration: 30, emoji: '⛵' },
    { name: 'Side Plank', duration: 30, emoji: '🏋️' },
    { name: 'Headstand Prep', duration: 45, emoji: '🤸' },
    { name: 'Warrior III', duration: 30, emoji: '⚔️' },
    { name: 'Tree Pose', duration: 30, emoji: '🌳' },
    { name: 'Camel Pose', duration: 45, emoji: '🐫' },
    { name: 'Wheel Pose', duration: 30, emoji: '🎡' },
    { name: 'Shoulder Stand', duration: 45, emoji: '🤸' },
    { name: 'Fish Pose', duration: 30, emoji: '🐠' },
    { name: 'Corpse Pose', duration: 60, emoji: '💤' },
  ],
};

export default function YogaFlexibilityGuide({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'flows' | 'library' | 'log'>('flows');
  const [yogaData, setYogaData] = useState<YogaData>(() => {
    const saved = localStorage.getItem('yoga-flexibility-data');
    return saved ? JSON.parse(saved) : {
      sessions: [],
      currentStreak: 0,
      weeklyGoal: 150,
    };
  });

  const [duration, setDuration] = useState('');
  const [style, setStyle] = useState('');
  const [moodScore, setMoodScore] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPose, setSelectedPose] = useState<Pose | null>(null);
  const [showBreathGuide, setShowBreathGuide] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Flow Player State
  const [activeFlow, setActiveFlow] = useState<string | null>(null);
  const [flowTimer, setFlowTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [poseTimer, setPoseTimer] = useState(0);
  const [currentStretch, setCurrentStretch] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionMood, setCompletionMood] = useState(0);

  useEffect(() => {
    localStorage.setItem('yoga-flexibility-data', JSON.stringify(yogaData));
  }, [yogaData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('yoga_flexibility');
      const sessions = dbLogs
        .filter(l => l.action_type === 'flow_completion' || l.action_type === 'log_session')
        .map(log => {
          const p = log.payload;
          if (log.action_type === 'flow_completion') {
            const moodObj = moodEmojis.find(m => m.label === p.mood_after);
            return {
              id: log.id.toString(),
              duration: p.minutes_completed,
              style: p.flow_name,
              moodScore: moodObj ? moodObj.score : 3,
              timestamp: p.timestamp,
              date: new Date(p.timestamp).toISOString().split('T')[0]
            };
          } else {
            return {
              id: log.id.toString(),
              duration: p.session.duration_min,
              style: p.session.style,
              moodScore: p.session.mood_score,
              timestamp: p.session.timestamp,
              date: new Date(p.session.timestamp).toISOString().split('T')[0]
            };
          }
        });

      if (sessions.length > 0) {
        const currentStreak = calculateStreak(sessions);
        setYogaData(prev => ({
          ...prev,
          sessions,
          currentStreak,
        }));
      }
    };
    loadDbLogs();
  }, []);

  useEffect(() => {
    if (showBreathGuide) {
      const interval = setInterval(() => {
        setBreathPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [showBreathGuide]);

  // Flow Player Timer Logic
  useEffect(() => {
    if (!activeFlow || isPaused || showCompletion) return;

    const flow = flows.find(f => f.id === activeFlow);
    if (!flow) return;

    const interval = setInterval(() => {
      setFlowTimer(prev => {
        const newTime = prev + 1;
        if (newTime >= flow.duration * 60) {
          setShowCompletion(true);
          return prev;
        }
        return newTime;
      });

      if (activeFlow === 'desk-relief') {
        // Change stretch every 2 minutes (120 seconds)
        if (flowTimer % 120 === 0 && flowTimer > 0) {
          setCurrentStretch(prev => (prev + 1) % deskStretches.length);
        }
      } else {
        // Pose timer logic
        setPoseTimer(prev => {
          const currentPoses = flowPoses[activeFlow as keyof typeof flowPoses];
          if (!currentPoses) return prev;

          const newPoseTime = prev + 1;
          const currentPose = currentPoses[currentPoseIndex];

          if (newPoseTime >= currentPose.duration) {
            // Move to next pose
            if (currentPoseIndex < currentPoses.length - 1) {
              setCurrentPoseIndex(prevIndex => prevIndex + 1);
              return 0;
            }
            return prev;
          }
          return newPoseTime;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeFlow, isPaused, flowTimer, currentPoseIndex, showCompletion]);

  const startFlow = (flowId: string) => {
    setActiveFlow(flowId);
    setFlowTimer(0);
    setIsPaused(false);
    setCurrentPoseIndex(0);
    setPoseTimer(0);
    setCurrentStretch(0);
    setShowCompletion(false);
    setCompletionMood(0);
  };

  const closeFlow = () => {
    setActiveFlow(null);
    setFlowTimer(0);
    setIsPaused(false);
    setCurrentPoseIndex(0);
    setPoseTimer(0);
    setCurrentStretch(0);
    setShowCompletion(false);
    setCompletionMood(0);
  };

  const skipPose = () => {
    if (!activeFlow || activeFlow === 'desk-relief') return;
    const currentPoses = flowPoses[activeFlow as keyof typeof flowPoses];
    if (!currentPoses) return;

    if (currentPoseIndex < currentPoses.length - 1) {
      setCurrentPoseIndex(prev => prev + 1);
      setPoseTimer(0);
    }
  };

  const logFlowCompletion = () => {
    if (!activeFlow || !completionMood) return;

    const flow = flows.find(f => f.id === activeFlow);
    if (!flow) return;

    const minutesCompleted = Math.floor(flowTimer / 60);

    // Console log for database
    logUserActivity('yoga_flexibility', 'flow_completion', {
      flow_name: flow.name,
      minutes_completed: minutesCompleted,
      mood_after: moodEmojis.find(m => m.score === completionMood)?.label || '',
      timestamp: new Date().toISOString(),
    });

    // Also log to existing sessions
    const newSession: YogaSession = {
      id: Date.now().toString(),
      duration: minutesCompleted,
      style: flow.name,
      moodScore: completionMood,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
    };

    const updatedSessions = [newSession, ...yogaData.sessions];
    const newStreak = calculateStreak(updatedSessions);

    setYogaData(prev => ({
      ...prev,
      sessions: updatedSessions,
      currentStreak: newStreak,
    }));

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#14B8A6', '#06B6D4', '#10B981'],
    });

    closeFlow();
    setActiveTab('log');
  };

  const calculateStreak = (sessions: YogaSession[]) => {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].date);
      sessionDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        const dayDuration = sortedSessions
          .filter(s => s.date === sortedSessions[i].date)
          .reduce((sum, s) => sum + s.duration, 0);

        if (dayDuration >= 10) {
          streak++;
        } else {
          break;
        }
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  };

  const getWeeklyProgress = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekSessions = yogaData.sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekStart;
    });

    return weekSessions.reduce((sum, session) => sum + session.duration, 0);
  };

  const logSession = () => {
    if (!duration || !style || !moodScore) return;

    const durationNum = parseInt(duration);
    const today = new Date().toISOString().split('T')[0];

    const newSession: YogaSession = {
      id: Date.now().toString(),
      duration: durationNum,
      style,
      moodScore,
      timestamp: new Date().toISOString(),
      date: today,
    };

    const updatedSessions = [newSession, ...yogaData.sessions];
    const newStreak = calculateStreak(updatedSessions);

    setYogaData(prev => ({
      ...prev,
      sessions: updatedSessions,
      currentStreak: newStreak,
    }));

    // Log to console for database integration
    logUserActivity('yoga_flexibility', 'log_session', {
      session: {
        duration_min: durationNum,
        style: style,
        mood_score: moodScore,
        timestamp: new Date().toISOString(),
      },
      weekly_progress: getWeeklyProgress() + durationNum,
      current_streak: newStreak,
    });

    // Show Namaste notification
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#06B6D4', '#14B8A6', '#10B981'],
    });

    // Reset form
    setDuration('');
    setStyle('');
    setMoodScore(0);
  };

  const filteredPoses = poses.filter(pose =>
    pose.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pose.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const posesByCategory = poses.reduce((acc, pose) => {
    if (!acc[pose.category]) acc[pose.category] = [];
    acc[pose.category].push(pose);
    return acc;
  }, {} as Record<string, Pose[]>);

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
            <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl p-2 lg:p-3">
              <User className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Yoga & Flexibility</h1>
              <p className="text-xs lg:text-sm text-gray-500">Find your flow and build consistency</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          <button
            onClick={() => setActiveTab('flows')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'flows'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Your Flow
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pose Library
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-2 px-2 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-xs lg:text-base ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Practice Log
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: Choose Your Flow */}
          {activeTab === 'flows' && (
            <motion.div
              key="flows"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {flows.map((flow) => (
                  <motion.div
                    key={flow.id}
                    whileHover={{ scale: 1.03 }}
                    className={`bg-gradient-to-br ${flow.bgColor} rounded-xl lg:rounded-2xl p-4 lg:p-6 border-2 border-gray-200 hover:border-cyan-300 transition-all cursor-pointer`}
                    onClick={() => startFlow(flow.id)}
                  >
                    <div className="flex items-start justify-between mb-3 lg:mb-4">
                      <div className="text-4xl lg:text-5xl">{flow.icon}</div>
                      <div className={`px-2 lg:px-3 py-1 rounded-full bg-gradient-to-r ${flow.vibeColor} text-white text-xs font-semibold`}>
                        {flow.vibe}
                      </div>
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">{flow.name}</h3>
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{flow.duration} minutes</span>
                    </div>
                    <p className="text-xs lg:text-sm text-gray-700">{flow.focus}</p>
                  </motion.div>
                ))}
              </div>

              {/* Flow Player Modal */}
              <AnimatePresence>
                {activeFlow && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                  >
                    {(() => {
                      const flow = flows.find(f => f.id === activeFlow);
                      if (!flow) return null;

                      const totalSeconds = flow.duration * 60;
                      const progressPercent = (flowTimer / totalSeconds) * 100;

                      if (showCompletion) {
                        return (
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
                          >
                            <div className="text-center mb-6">
                              <div className="mb-4">
                                <Award className="w-16 h-16 text-teal-500 mx-auto" />
                              </div>
                              <h2 className="text-2xl font-bold text-gray-900 mb-2">Well Done! 🎉</h2>
                              <p className="text-gray-600">
                                You completed {Math.floor(flowTimer / 60)} minutes of {flow.name}
                              </p>
                            </div>

                            <div className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                How do you feel?
                              </label>
                              <div className="flex justify-between gap-2">
                                {moodEmojis.map((mood) => (
                                  <motion.button
                                    key={mood.score}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setCompletionMood(mood.score)}
                                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                                      completionMood === mood.score
                                        ? 'border-teal-500 bg-teal-50 shadow-lg'
                                        : 'border-gray-200 hover:border-teal-300'
                                    }`}
                                  >
                                    <div className="text-2xl mb-1">{mood.emoji}</div>
                                    <div className="text-xs font-medium text-gray-600">{mood.label}</div>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <button
                                onClick={logFlowCompletion}
                                disabled={!completionMood}
                                className="w-full py-3 px-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                              >
                                🙏 Log to Practice Log
                              </button>
                              <button
                                onClick={closeFlow}
                                className="w-full py-3 px-6 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                              >
                                Close
                              </button>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="bg-white rounded-2xl w-full max-w-2xl mx-4 overflow-hidden"
                        >
                          {/* Progress Bar */}
                          <div className="h-2 bg-gray-200">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500"
                            />
                          </div>

                          {/* Header */}
                          <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="text-4xl">{flow.icon}</div>
                                <div>
                                  <h2 className="text-xl font-semibold text-gray-900">{flow.name}</h2>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm text-gray-600">
                                      {Math.floor(flowTimer / 60)}:{(flowTimer % 60).toString().padStart(2, '0')} / {flow.duration}:00
                                    </span>
                                    <div className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${flow.vibeColor} text-white text-xs font-semibold`}>
                                      {flow.vibe}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={closeFlow}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <X className="w-6 h-6 text-gray-500" />
                              </button>
                            </div>
                          </div>

                          {/* Content Area */}
                          <div className="p-8">
                            {activeFlow === 'desk-relief' ? (
                              // Desk Relief: Breath Guide with Stretch Overlay
                              <div className="space-y-6">
                                <div className="text-center mb-8">
                                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                                    Current Stretch: {deskStretches[currentStretch]}
                                  </h3>
                                  <p className="text-sm text-gray-600">Follow the breathing guide below</p>
                                </div>

                                <div className="flex flex-col items-center justify-center py-12">
                                  <motion.div
                                    animate={{
                                      scale: breathPhase === 'inhale' ? 1.5 : 1,
                                      opacity: breathPhase === 'inhale' ? 0.8 : 0.4,
                                    }}
                                    transition={{ duration: 4, ease: 'easeInOut' }}
                                    className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500"
                                  />
                                  <motion.p
                                    key={breathPhase}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6 text-2xl font-semibold text-gray-900"
                                  >
                                    {breathPhase === 'inhale' ? 'Breathe In...' : 'Breathe Out...'}
                                  </motion.p>
                                  <p className="text-sm text-gray-600 mt-2">4 seconds {breathPhase}</p>
                                </div>
                              </div>
                            ) : (
                              // Other Flows: Pose Carousel
                              (() => {
                                const currentPoses = flowPoses[activeFlow as keyof typeof flowPoses];
                                if (!currentPoses) return null;
                                const currentPose = currentPoses[currentPoseIndex];
                                const remainingTime = currentPose.duration - poseTimer;

                                return (
                                  <div className="space-y-6">
                                    <div className="text-center">
                                      <div className="text-7xl mb-4">{currentPose.emoji}</div>
                                      <h3 className="text-3xl font-bold text-gray-900 mb-2">{currentPose.name}</h3>
                                      <p className="text-gray-600">
                                        Pose {currentPoseIndex + 1} of {currentPoses.length}
                                      </p>
                                    </div>

                                    <div className="flex flex-col items-center">
                                      <div className="text-6xl font-bold text-teal-600 mb-2">
                                        {remainingTime}s
                                      </div>
                                      <div className="w-full max-w-xs bg-gray-200 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                          animate={{ width: `${(poseTimer / currentPose.duration) * 100}%` }}
                                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>

                          {/* Controls */}
                          <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-center gap-4">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-4 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:shadow-lg transition-all"
                              >
                                {isPaused ? (
                                  <Play className="w-6 h-6" fill="white" />
                                ) : (
                                  <Pause className="w-6 h-6" fill="white" />
                                )}
                              </motion.button>

                              {activeFlow !== 'desk-relief' && (
                                <motion.button
                                  whileTap={{ scale: 0.9 }}
                                  onClick={skipPose}
                                  className="p-4 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all"
                                >
                                  <SkipForward className="w-6 h-6" />
                                </motion.button>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-4">
                              {isPaused ? 'Paused - Press Play to continue' : activeFlow === 'desk-relief' ? 'Stretch changes every 2 minutes' : 'Focus on your breath and alignment'}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Getting Started Tips */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-3 lg:mb-4">Getting Started</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Start Small</p>
                      <p className="text-sm text-gray-600">Even 10 minutes daily builds lasting flexibility</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Listen to Your Body</p>
                      <p className="text-sm text-gray-600">Stretch should feel good, never painful</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Breathe Deeply</p>
                      <p className="text-sm text-gray-600">Deep breathing enhances every pose</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Stay Consistent</p>
                      <p className="text-sm text-gray-600">Regular practice yields the best results</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Pose Library */}
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Search Bar */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search poses..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Poses by Category */}
              {Object.entries(posesByCategory).map(([category, categoryPoses]) => (
                <div key={category} className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">{category}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {categoryPoses
                      .filter(pose => filteredPoses.includes(pose))
                      .map((pose) => (
                        <motion.div
                          key={pose.name}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedPose(pose)}
                          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 cursor-pointer hover:border-cyan-400 transition-all"
                        >
                          <div className="text-3xl">{pose.emoji}</div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{pose.name}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Info className="w-3 h-3" />
                              Click for details
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}

              {/* Pose Detail Modal */}
              <AnimatePresence>
                {selectedPose && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedPose(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="bg-white rounded-2xl p-8 max-w-2xl w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="text-5xl">{selectedPose.emoji}</div>
                          <div>
                            <h3 className="text-2xl font-semibold text-gray-900">{selectedPose.name}</h3>
                            <p className="text-sm text-gray-600">{selectedPose.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPose(null)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-6 h-6 text-gray-500" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-cyan-50 rounded-xl p-5 border border-cyan-200">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-cyan-600">✓</span> Proper Alignment
                          </h4>
                          <p className="text-sm text-gray-700">{selectedPose.alignment}</p>
                        </div>

                        <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-red-600">✗</span> Common Mistakes
                          </h4>
                          <p className="text-sm text-gray-700">{selectedPose.mistakes}</p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-green-600">★</span> Benefits
                          </h4>
                          <p className="text-sm text-gray-700">{selectedPose.benefits}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Tab 3: Practice Log */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              {/* Logger Form */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Log Your Practice</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="30"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Yoga Style
                      </label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                      >
                        <option value="">Select style...</option>
                        <option value="Hatha">Hatha</option>
                        <option value="Vinyasa">Vinyasa</option>
                        <option value="Yin">Yin</option>
                        <option value="Restorative">Restorative</option>
                        <option value="Power">Power</option>
                        <option value="Ashtanga">Ashtanga</option>
                      </select>
                    </div>
                  </div>

                  {/* Mood Scale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Post-Yoga Mood
                    </label>
                    <div className="flex justify-between gap-3">
                      {moodEmojis.map((mood) => (
                        <motion.button
                          key={mood.score}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setMoodScore(mood.score)}
                          className={`flex-1 py-4 rounded-xl border-2 transition-all ${
                            moodScore === mood.score
                              ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                              : 'border-gray-200 hover:border-cyan-300'
                          }`}
                        >
                          <div className="text-3xl mb-1">{mood.emoji}</div>
                          <div className="text-xs font-medium text-gray-600">{mood.label}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={logSession}
                    disabled={!duration || !style || !moodScore}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    🙏 Log Session (Namaste)
                  </button>
                </div>
              </div>

              {/* Weekly Progress */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Weekly Progress</h3>
                  <TrendingUp className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Minutes Practiced</span>
                    <span className="font-semibold text-gray-900">
                      {getWeeklyProgress()} / {yogaData.weeklyGoal} mins
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((getWeeklyProgress() / yogaData.weeklyGoal) * 100, 100)}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full"
                    />
                  </div>
                </div>
                {getWeeklyProgress() >= yogaData.weeklyGoal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-4 border border-cyan-200"
                  >
                    <p className="text-sm font-medium text-cyan-900 text-center">
                      🎉 Weekly goal achieved! Namaste!
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Zen Streak */}
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-cyan-200">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl p-4">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Zen Streak</p>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
                      {yogaData.currentStreak} days
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Practice 10+ minutes daily to maintain</p>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              {yogaData.sessions.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
                  <div className="space-y-3">
                    {yogaData.sessions.slice(0, 5).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold">
                            {session.duration}m
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{session.style}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-2xl">
                          {moodEmojis.find(m => m.score === session.moodScore)?.emoji}
                        </div>
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
