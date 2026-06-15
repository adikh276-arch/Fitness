import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Clock, Flame, Trophy, CheckCircle2, Info, Calendar, Zap, Moon, Sun, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { logUserActivity } from '@/lib/db';

type Protocol = '16:8' | '18:6' | 'OMAD' | 'Circadian';

interface FastLog {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  goalAchieved: boolean;
  date: string;
}

interface FastingData {
  activeProtocol: Protocol;
  logs: FastLog[];
  streakDays: number;
}

export default function IntermittentFastingGuide({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation('IntermittentFasting');
  
  const protocols = useMemo(() => [
    {
      id: '16:8' as Protocol,
      name: '16:8 (Leangains)',
      fastHours: 16,
      eatHours: 8,
      description: t('lab.tips.tip1.desc'),
      icon: <Clock className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      id: '18:6' as Protocol,
      name: '18:6 (Warrior Lite)',
      fastHours: 18,
      eatHours: 6,
      description: t('lab.tips.tip2.desc'),
      icon: <Zap className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-600',
    },
    {
      id: 'OMAD' as Protocol,
      name: 'OMAD',
      fastHours: 23,
      eatHours: 1,
      description: t('lab.tips.tip3.desc'),
      icon: <Flame className="w-6 h-6" />,
      color: 'from-violet-600 to-purple-700',
    },
    {
      id: 'Circadian' as Protocol,
      name: 'Circadian Rhythm',
      fastHours: 12,
      eatHours: 12,
      description: t('lab.tips.tip4.desc'),
      icon: <Moon className="w-6 h-6" />,
      color: 'from-indigo-600 to-blue-600',
    },
  ], [t]);

  const fastingStages = useMemo(() => [
    {
      hours: t('lab.timeline.stages.0.hours'),
      title: t('lab.timeline.stages.0.title'),
      description: t('lab.timeline.stages.0.description'),
      color: 'bg-blue-500',
    },
    {
      hours: t('lab.timeline.stages.1.hours'),
      title: t('lab.timeline.stages.1.title'),
      description: t('lab.timeline.stages.1.description'),
      color: 'bg-indigo-500',
    },
    {
      hours: t('lab.timeline.stages.2.hours'),
      title: t('lab.timeline.stages.2.title'),
      description: t('lab.timeline.stages.2.description'),
      color: 'bg-purple-500',
    },
    {
      hours: t('lab.timeline.stages.3.hours'),
      title: t('lab.timeline.stages.3.title'),
      description: t('lab.timeline.stages.3.description'),
      color: 'bg-violet-600',
    },
  ], [t]);
  const [activeTab, setActiveTab] = useState<'lab' | 'log'>('lab');
  const [fastingData, setFastingData] = useState<FastingData>(() => {
    const saved = localStorage.getItem('intermittent-fasting-data');
    return saved ? JSON.parse(saved) : {
      activeProtocol: '16:8' as Protocol,
      logs: [],
      streakDays: 0,
    };
  });
  const [lastMealTime, setLastMealTime] = useState('');
  const [firstMealTime, setFirstMealTime] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    localStorage.setItem('intermittent-fasting-data', JSON.stringify(fastingData));
  }, [fastingData]);

  useEffect(() => {
    const loadDbLogs = async () => {
      const dbLogs = await fetchUserActivityLogs('intermittent_fasting');
      
      const protocolLog = dbLogs.find(l => l.action_type === 'protocol_changed' || l.action_type === 'log_fast');
      const activeProtocol = protocolLog ? (protocolLog.payload.active_protocol as Protocol) : '16:8';

      const logs = dbLogs
        .filter(log => log.action_type === 'log_fast')
        .map(log => {
          const p = log.payload;
          // Calculate start and end time based on timestamp
          const logDate = new Date(p.timestamp);
          const yesterday = new Date(logDate);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const todayStr = logDate.toISOString().split('T')[0];
          
          return {
            id: log.id.toString(),
            startTime: `${yesterdayStr}T${p.last_fast.start_time}`,
            endTime: `${todayStr}T${p.last_fast.end_time}`,
            durationMinutes: p.last_fast.duration_minutes,
            goalAchieved: p.last_fast.goal_achieved,
            date: todayStr
          } as FastLog;
        });

      const latestFastLog = dbLogs.find(l => l.action_type === 'log_fast');
      const streakDays = latestFastLog ? latestFastLog.payload.streak_days : 0;

      if (logs.length > 0 || protocolLog) {
        setFastingData({
          activeProtocol,
          logs,
          streakDays,
        });
      }
    };
    loadDbLogs();
  }, []);

  const setProtocol = (protocol: Protocol) => {
    setFastingData(prev => ({ ...prev, activeProtocol: protocol }));

    // Log to console for database integration
    logUserActivity('intermittent_fasting', 'protocol_changed', {
      active_protocol: protocol,
      timestamp: new Date().toISOString(),
    });
  };

  const calculateDuration = () => {
    if (!lastMealTime || !firstMealTime) return null;

    // Create datetime strings for yesterday's last meal and today's first meal
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const start = new Date(`${yesterdayStr}T${lastMealTime}`);
    const end = new Date(`${today}T${firstMealTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return { hours, minutes, totalMinutes: diffMinutes };
  };

  const logFast = () => {
    const duration = calculateDuration();
    if (!duration) return;

    // Assume 16-hour fast as default goal
    const targetMinutes = 16 * 60;
    const goalAchieved = duration.totalMinutes >= targetMinutes;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newLog: FastLog = {
      id: Date.now().toString(),
      startTime: `${yesterdayStr}T${lastMealTime}`,
      endTime: `${today}T${firstMealTime}`,
      durationMinutes: duration.totalMinutes,
      goalAchieved,
      date: today,
    };

    // Calculate streak - logging today starts with 1
    const todayHasLog = fastingData.logs.some(log => log.date === today && log.goalAchieved);
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayHasLog = fastingData.logs.some(log => log.date === yesterdayDate && log.goalAchieved);

    let newStreak = fastingData.streakDays;
    if (goalAchieved && !todayHasLog) {
      // If logging today and it's successful, increment or start at 1
      newStreak = yesterdayHasLog ? fastingData.streakDays + 1 : 1;
    }

    setFastingData(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs],
      streakDays: newStreak,
    }));

    // Log to console for database integration
    logUserActivity('intermittent_fasting', 'log_fast', {
      active_protocol: fastingData.activeProtocol,
      last_fast: {
        start_time: lastMealTime,
        end_time: firstMealTime,
        duration_minutes: duration.totalMinutes,
        goal_achieved: goalAchieved,
      },
      streak_days: newStreak,
      timestamp: new Date().toISOString(),
    });

    // Celebrate if goal achieved
    if (goalAchieved) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366F1', '#8B5CF6', '#A855F7'],
      });
    }

    // Reset form
    setLastMealTime('');
    setFirstMealTime('');
  };

  const getLast30Days = () => {
    const daysArray = [];
    const todayDate = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      const hasGoalLog = fastingData.logs.some(log => log.date === dateStr && log.goalAchieved);
      const dayNumber = i === 29 ? t('log.tracker.today') : t('log.tracker.dayLabel', { val: i + 1 });

      daysArray.push({
        dayNumber,
        hasGoalLog,
        isToday: i === 29,
        date: dateStr
      });
    }

    return daysArray;
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
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-2 lg:p-3">
              <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
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
            onClick={() => setActiveTab('lab')}
            className={`flex-1 py-2 px-3 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-sm lg:text-base ${
              activeTab === 'lab'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.lab')}
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`flex-1 py-2 px-3 lg:py-3 lg:px-4 rounded-lg transition-all font-medium text-sm lg:text-base ${
              activeTab === 'log'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('tabs.log')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Tab 1: The Fasting Lab */}
          {activeTab === 'lab' && (
            <motion.div
              key="lab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 lg:space-y-6"
            >
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4 lg:mb-6">{t('lab.timeline.title')}</h2>
                <div className="space-y-3 lg:space-y-4">
                  {fastingStages.map((stage, index) => (
                    <motion.div
                      key={stage.hours}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 lg:gap-4"
                    >
                      <div className="flex-shrink-0 w-24 lg:w-32">
                        <div className={`${stage.color} text-white px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg text-center text-xs lg:text-sm font-semibold`}>
                          {stage.hours}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-1">{stage.title}</h3>
                        <p className="text-xs lg:text-sm text-gray-600">{stage.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-purple-100">
                <div className="flex items-start gap-2 lg:gap-3 mb-3 lg:mb-4">
                  <Info className="w-5 h-5 lg:w-6 lg:h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-2 lg:mb-3">{t('lab.breaksFast.title')}</h3>
                    <div className="space-y-2 lg:space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs lg:text-sm font-medium text-gray-900">{t('lab.breaksFast.safe')}</p>
                          <p className="text-xs lg:text-sm text-gray-600">{t('lab.breaksFast.safeList')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">✕</span>
                        </div>
                        <div>
                          <p className="text-xs lg:text-sm font-medium text-gray-900">{t('lab.breaksFast.breaks')}</p>
                          <p className="text-xs lg:text-sm text-gray-600">{t('lab.breaksFast.breaksList')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-gray-200">
                <h3 className="font-semibold text-sm lg:text-base text-gray-900 mb-3 lg:mb-4">{t('lab.tips.title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('lab.tips.tip1.title')}</p>
                      <p className="text-sm text-gray-600">{t('lab.tips.tip1.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('lab.tips.tip2.title')}</p>
                      <p className="text-sm text-gray-600">{t('lab.tips.tip2.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('lab.tips.tip3.title')}</p>
                      <p className="text-sm text-gray-600">{t('lab.tips.tip3.desc')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('lab.tips.tip4.title')}</p>
                      <p className="text-sm text-gray-600">{t('lab.tips.tip4.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Success Log */}
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Logging Form */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('log.form.title')}</h2>
                <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                  <p className="text-sm text-indigo-900">
                    <strong>{t('log.form.dateLabel')}</strong> {new Date().toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('log.form.lastMeal')}
                      </label>
                      <input
                        type="time"
                        value={lastMealTime}
                        onChange={(e) => setLastMealTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('log.form.firstMeal')}
                      </label>
                      <input
                        type="time"
                        value={firstMealTime}
                        onChange={(e) => setFirstMealTime(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Duration Display */}
                  {calculateDuration() && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{t('log.form.duration')}</p>
                          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            {calculateDuration()!.hours}h {calculateDuration()!.minutes}m
                          </p>
                        </div>
                        {calculateDuration()!.totalMinutes >= 16 * 60 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                          >
                            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-4">
                              <Trophy className="w-8 h-8 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {calculateDuration()!.totalMinutes >= 16 * 60 && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 text-sm font-medium text-purple-600"
                        >
                          🎉 {t('log.form.goalAchieved')}
                        </motion.p>
                      )}
                    </motion.div>
                  )}

                  <button
                    onClick={logFast}
                    disabled={!lastMealTime || !firstMealTime}
                    className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {t('log.form.submit')}
                  </button>
                </div>
              </div>

              {/* 30-Day Streak Tracker */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t('log.tracker.title')}</h2>
                    <p className="text-sm text-gray-500">{t('log.tracker.streak')} <span className="font-bold text-purple-600">{t('log.tracker.streakDays', { count: fastingData.streakDays })}</span></p>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                    <Trophy className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">{t('log.tracker.last30')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-10 gap-2 mb-6">
                  {getLast30Days().map((day, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                        day.hasGoalLog
                          ? 'bg-purple-600 text-white'
                          : day.isToday
                          ? 'bg-purple-100 border-2 border-purple-400 text-purple-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      title={`${day.dayNumber} - ${new Date(day.date).toLocaleDateString(i18n.language)}`}
                    >
                      {day.hasGoalLog ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-[10px] font-bold">{day.isToday ? '→' : index + 1}</span>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-600">{t('log.tracker.legend.goalMet')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-100 border-2 border-purple-400 flex items-center justify-center">
                      <span className="text-purple-600 text-[10px] font-bold">→</span>
                    </div>
                    <span className="text-gray-600">{t('log.tracker.legend.today')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-[10px] font-bold">1</span>
                    </div>
                    <span className="text-gray-600">{t('log.tracker.legend.missed')}</span>
                  </div>
                </div>
              </div>

              {/* Recent Logs */}
              {fastingData.logs.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('log.recentFasts.title')}</h2>
                  <div className="space-y-3">
                    {fastingData.logs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${log.goalAchieved ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-300'} flex items-center justify-center`}>
                            {log.goalAchieved ? (
                              <Trophy className="w-5 h-5 text-white" />
                            ) : (
                              <Clock className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(log.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        {log.goalAchieved && (
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            {t('log.recentFasts.goalMet')}
                          </span>
                        )}
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
