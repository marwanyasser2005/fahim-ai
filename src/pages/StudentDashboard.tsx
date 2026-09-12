import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Trophy, Target, Zap, Clock, Users, Star, Bell, BookOpen,
  Flame, Award, TrendingUp, ChevronRight, Home, BrainCircuit
} from 'lucide-react';

interface StudentDashboardProps {
  language: 'ar' | 'en';
}

interface Course {
  id: number;
  title: string;
  progress: number;
  lessons: number;
  totalLessons: number;
  lastAccessed: string;
  badge?: string;
  xp: number;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
  read: boolean;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  date?: string;
}

/**
 * Component: StudentDashboard (Startup-Grade)
 * Description: A fully immersive, gamified, and responsive student command center.
 * Features real-time updates, achievements, XP system, dynamic progress, and RTL support.
 * Built with startup-level UX, animations, and performance optimization.
 */
const StudentDashboard: React.FC<StudentDashboardProps> = ({ language }) => {
  const location = useLocation();
  const isRTL = language === 'ar';

  // Dynamic Mock Data with Realistic Behavior
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, title: language === 'ar' ? 'أساسيات البرمجة مع Python' : 'Programming Basics with Python', progress: 78, lessons: 8, totalLessons: 10, lastAccessed: '2025-10-27', xp: 780, badge: 'Hot Streak' },
    { id: 2, title: language === 'ar' ? 'الفيزياء التطبيقية' : 'Applied Physics', progress: 45, lessons: 5, totalLessons: 11, lastAccessed: '2025-10-26', xp: 450 },
    { id: 3, title: language === 'ar' ? 'الذكاء الاصطناعي التطبيقي' : 'Applied AI', progress: 22, lessons: 3, totalLessons: 14, lastAccessed: '2025-10-25', xp: 220 }
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, message: language === 'ar' ? 'تم فتح درس جديد في البرمجة!' : 'New lesson unlocked in Programming!', time: '10:15 AM', type: 'success', read: false },
    { id: 2, message: language === 'ar' ? 'لقد حصلت على 50 نقطة XP!' : 'You earned 50 XP!', time: '09:45 AM', type: 'achievement', read: false },
    { id: 3, message: language === 'ar' ? 'اختبار قادم غدًا في الفيزياء' : 'Quiz tomorrow in Physics', time: '08:30 AM', type: 'warning', read: true }
  ]);

  const [achievements] = useState<Achievement[]>([
    { id: 1, title: language === 'ar' ? 'البداية الأسطورية' : 'Legendary Start', description: language === 'ar' ? 'أكمل أول درس' : 'Complete first lesson', icon: <Trophy className="w-6 h-6" />, unlocked: true, date: '2025-10-20' },
    { id: 2, title: language === 'ar' ? 'سلسلة 7 أيام' : '7-Day Streak', description: language === 'ar' ? 'تعلم 7 أيام متتالية' : 'Learn 7 days in a row', icon: <Flame className="w-6 h-6" />, unlocked: true, date: '2025-10-27' },
    { id: 3, title: language === 'ar' ? 'محترف البرمجة' : 'Code Master', description: language === 'ar' ? 'أكمل 10 دروس برمجة' : 'Complete 10 programming lessons', icon: <Zap className="w-6 h-6" />, unlocked: false }
  ]);

  const [totalXP, setTotalXP] = useState(1450);
  const [streak, setStreak] = useState(7);
  const [rank, setRank] = useState('Bronze Explorer');

  const content = {
    ar: {
      title: 'مركز قيادة الطالب الملحمي',
      subtitle: 'تحكم بمستقبلك الأكاديمي بذكاء',
      courses: 'مسارات التميّز',
      progress: 'التقدم',
      continue: 'استمر',
      notifications: 'الإشعارات الفورية',
      achievements: 'الإنجازات الأسطورية',
      stats: 'إحصائيات الأداء',
      totalXP: 'إجمالي XP',
      streak: 'سلسلة الأيام',
      rank: 'الرتبة',
      viewAll: 'عرض الكل',
      backToHome: 'العودة للمغامرة',
      lastUpdated: 'آخر تحديث',
      noNotifications: 'لا توجد إشعارات... استعد للتحدي!'
    },
    en: {
      title: 'Epic Student Command Center',
      subtitle: 'Master Your Academic Destiny',
      courses: 'Excellence Tracks',
      progress: 'Progress',
      continue: 'Continue',
      notifications: 'Live Alerts',
      achievements: 'Legendary Achievements',
      stats: 'Performance Stats',
      totalXP: 'Total XP',
      streak: 'Day Streak',
      rank: 'Rank',
      viewAll: 'View All',
      backToHome: 'Back to Adventure',
      lastUpdated: 'Last Updated',
      noNotifications: 'No alerts... Gear up!'
    }
  };

  const t = content[language];

  // Real-time Simulation: New Notification + XP
  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const randomCourse = courses[Math.floor(Math.random() * courses.length)];
      const messages = language === 'ar' ? [
        `تم فتح درس جديد في ${randomCourse.title}!`,
        `لقد حصلت على 25 XP!`,
        `تحديث في ${randomCourse.title}`
      ] : [
        `New lesson in ${randomCourse.title}!`,
        `You earned 25 XP!`,
        `Update in ${randomCourse.title}`
      ];

      setNotifications(prev => [{
        id: Date.now(),
        message: messages[Math.floor(Math.random() * messages.length)],
        time,
        type: ['success', 'achievement', 'info'][Math.floor(Math.random() * 3)] as any,
        read: false
      }, ...prev].slice(0, 5));

      setTotalXP(prev => prev + 25);
    }, 15000);

    return () => clearInterval(interval);
  }, [courses, language]);

  // Auto-mark notifications as read after 10s
  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true }));
    }, 10000);
    return () => clearTimeout(timer);
  }, [notifications]);

  // Progress Color Logic
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-emerald-500 to-teal-600';
    if (progress >= 50) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  // Memoized Stats
  const stats = useMemo(() => ({
    activeCourses: courses.length,
    completedLessons: courses.reduce((a, c) => a + c.lessons, 0),
    avgProgress: Math.round(courses.reduce((a, c) => a + c.progress, 0) / courses.length)
  }), [courses]);

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-teal-900 ${isRTL ? 'rtl' : 'ltr'} py-8 sm:py-12 overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-400 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            <BrainCircuit className="w-4 h-4" />
            <span>{t.streak}: {streak} {language === 'ar' ? 'أيام' : 'days'}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-xl text-gray-300">{t.subtitle}</p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { icon: <Trophy className="w-6 h-6" />, label: t.totalXP, value: totalXP.toLocaleString(), color: 'from-yellow-400 to-orange-500' },
            { icon: <Target className="w-6 h-6" />, label: t.rank, value: rank, color: 'from-purple-500 to-pink-600' },
            { icon: <BookOpen className="w-6 h-6" />, label: language === 'ar' ? 'الدروس' : 'Lessons', value: stats.completedLessons, color: 'from-teal-500 to-cyan-600' },
            { icon: <TrendingUp className="w-6 h-6" />, label: language === 'ar' ? 'التقدم' : 'Avg Progress', value: `${stats.avgProgress}%`, color: 'from-emerald-500 to-green-600' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:scale-105 transition-all">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white mb-3`}>
                {stat.icon}
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Courses Section */}
          <section className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <Zap className="w-6 h-6" />
                {t.courses}
              </h2>
              <Link to="/courses" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1">
                {t.viewAll} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-5">
              {courses.map((course, i) => (
                <div key={course.id} className="bg-white/5 rounded-2xl p-5 border border-white/10 hover:border-cyan-500 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {course.badge && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">{course.badge}</span>}
                        {course.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {language === 'ar' ? `آخر دخول: ${course.lastAccessed}` : `Last accessed: ${course.lastAccessed}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-cyan-400">{course.progress}%</p>
                      <p className="text-xs text-gray-400">{course.lessons}/{course.totalLessons} {language === 'ar' ? 'درس' : 'lessons'}</p>
                    </div>
                  </div>

                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getProgressColor(course.progress)} rounded-full transition-all duration-1000`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">+{course.xp} XP</span>
                    <Link
                      to={`/course/${course.id}`}
                      className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:from-cyan-600 hover:to-teal-700 transition-all flex items-center gap-1"
                    >
                      {t.continue} <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Sidebar: Notifications + Achievements */}
          <div className="space-y-6">
            {/* Notifications */}
            <section className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t.notifications}
                </h2>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.length > 0 ? notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border ${
                      notif.read ? 'bg-white/5 border-white/10' : 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-cyan-500/50'
                    } transition-all`}
                  >
                    <p className={`text-sm ${notif.read ? 'text-gray-300' : 'text-white font-medium'}`}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notif.time}
                    </p>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 py-6">{t.noNotifications}</p>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-3 text-right">{t.lastUpdated}: {currentTime}</div>
            </section>

            {/* Achievements */}
            <section className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                {t.achievements}
              </h2>
              <div className="space-y-3">
                {achievements.map(ach => (
                  <div
                    key={ach.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      ach.unlocked ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      ach.unlocked ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gray-700 text-gray-500'
                    }`}>
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>
                        {ach.title}
                      </p>
                      <p className="text-xs text-gray-400">{ach.description}</p>
                      {ach.unlocked && ach.date && (
                        <p className="text-xs text-cyan-400 mt-1">{ach.date}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
          >
            <Home className="w-5 h-5" />
            {t.backToHome}
          </Link>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-pulse { animation: pulse 2s infinite; }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

export default StudentDashboard;