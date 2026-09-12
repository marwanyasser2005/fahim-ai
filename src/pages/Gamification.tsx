import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Zap, Flame, Star, Crown, Medal, Target, BrainCircuit,
  Volume2, VolumeX, ChevronUp, Lock, Unlock, Award
} from 'lucide-react';

interface GamificationProps {
  language: 'ar' | 'en';
}

interface Badge {
  id: number;
  name: string;
  description: string;
  earned: boolean;
  icon: React.ReactNode;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LeaderboardEntry {
  id: number;
  rank: number;
  name: string;
  points: number;
  level: number;
  avatar: string;
  isCurrentUser?: boolean;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  active: boolean;
}

/**
 * Component: Gamification (Startup-Grade)
 * Description: A fully immersive, gamified learning adventure with XP, animated badges,
 * dynamic leaderboard, interactive challenges, and epic sound effects. Built with
 * startup-level UX, performance optimization, and RTL support.
 */
const Gamification: React.FC<GamificationProps> = ({ language }) => {
  const isRTL = language === 'ar';

  // === State Management ===
  const [points, setPoints] = useState(2850);
  const [level, setLevel] = useState(7);
  const [streak, setStreak] = useState(12);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const [badges, setBadges] = useState<Badge[]>([
    { id: 1, name: language === 'ar' ? 'مستكشف مبتدئ' : 'Beginner Explorer', description: language === 'ar' ? 'أكمل أول دورة' : 'Complete first course', earned: true, icon: <BrainCircuit className="w-6 h-6" />, xpReward: 100, rarity: 'common' },
    { id: 2, name: language === 'ar' ? 'محترف المهارات' : 'Skill Master', description: language === 'ar' ? 'أكمل 10 دروس' : 'Complete 10 lessons', earned: true, icon: <Flame className="w-6 h-6" />, xpReward: 250, rarity: 'rare' },
    { id: 3, name: language === 'ar' ? 'ملك التعلم' : 'Learning King', description: language === 'ar' ? 'احصل على 3000 نقطة' : 'Reach 3000 points', earned: false, icon: <Crown className="w-6 h-6" />, xpReward: 500, rarity: 'legendary' },
    { id: 4, name: language === 'ar' ? 'بطل الأسبوع' : 'Weekly Champion', description: language === 'ar' ? 'احتل المركز الأول' : 'Top weekly leaderboard', earned: false, icon: <Trophy className="w-6 h-6" />, xpReward: 1000, rarity: 'epic' }
  ]);

  const [challenges] = useState<Challenge[]>([
    { id: 1, title: language === 'ar' ? 'سلسلة 7 أيام' : '7-Day Streak', description: language === 'ar' ? 'تعلم 7 أيام متتالية' : 'Learn 7 days in a row', reward: 300, progress: 5, target: 7, active: true },
    { id: 2, title: language === 'ar' ? 'محترف البرمجة' : 'Code Pro', description: language === 'ar' ? 'أكمل 5 مشاريع' : 'Complete 5 projects', reward: 400, progress: 3, target: 5, active: true },
    { id: 3, title: language === 'ar' ? 'ماراثون العلوم' : 'Science Marathon', description: language === 'ar' ? 'أكمل 20 درس STEM' : 'Complete 20 STEM lessons', reward: 600, progress: 12, target: 20, active: false }
  ]);

  const leaderboard: LeaderboardEntry[] = [
    { id: 1, rank: 1, name: 'أحمد النجار', points: 4850, level: 12, avatar: 'A', isCurrentUser: false },
    { id: 2, rank: 2, name: 'سارة محمد', points: 4200, level: 11, avatar: 'S', isCurrentUser: false },
    { id: 3, rank: 3, name: 'أنت', points: points, level: level, avatar: 'Y', isCurrentUser: true },
    { id: 4, rank: 4, name: 'فاطمة علي', points: 3100, level: 9, avatar: 'F', isCurrentUser: false },
    { id: 5, rank: 5, name: 'محمد خالد', points: 2950, level: 8, avatar: 'M', isCurrentUser: false }
  ];

  const content = {
    ar: {
      title: 'مغامرة التعليم الملحمية',
      subtitle: 'اكسب، ارتقِ، وتألق في عالم المعرفة!',
      points: 'نقاط القوة',
      level: 'المستوى',
      streak: 'سلسلة الأيام',
      badges: 'أوسمة البطولة',
      challenges: 'تحديات الأبطال',
      leaderboard: 'ساحة الأبطال',
      earnPoints: 'اكسب نقاطًا عبر إكمال الدروس والتحديات!',
      bonusChallenge: 'تحدي فوري: اضغط لتفوز بـ 100 نقطة!',
      backToHome: 'العودة للمغامرة',
      sound: 'الصوت',
      rank: 'المركز',
      xp: 'XP'
    },
    en: {
      title: 'Epic Learning Adventure',
      subtitle: 'Earn, Level Up, and Shine in the World of Knowledge!',
      points: 'Power Points',
      level: 'Level',
      streak: 'Day Streak',
      badges: 'Champion Medals',
      challenges: 'Hero Challenges',
      leaderboard: 'Champions Arena',
      earnPoints: 'Earn points by completing lessons and challenges!',
      bonusChallenge: 'Instant Challenge: Click to win 100 XP!',
      backToHome: 'Back to Adventure',
      sound: 'Sound',
      rank: 'Rank',
      xp: 'XP'
    }
  };

  const t = content[language];

  // === Dynamic Effects ===
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setPoints(prev => prev + 25);
        triggerConfetti();
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleBonusChallenge = useCallback(() => {
    setPoints(prev => prev + 100);
    setLevel(prev => Math.floor((prev + 100) / 500) + 1);
    triggerConfetti();
  }, []);

  // === Memoized Values ===
  const totalEarnedXP = useMemo(() => 
    badges.filter(b => b.earned).reduce((sum, b) => sum + b.xpReward, 0),
    [badges]
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-cyan-600';
      case 'epic': return 'from-purple-400 to-pink-600';
      case 'legendary': return 'from-yellow-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const currentUserRank = leaderboard.find(e => e.isCurrentUser)?.rank || 0;

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 ${isRTL ? 'rtl' : 'ltr'} py-8 sm:py-12 overflow-hidden relative`}>
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-400 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-3 rounded-full text-lg font-bold mb-6 shadow-2xl">
              <Flame className="w-6 h-6 animate-pulse" />
              <span>{t.streak}: {streak} {language === 'ar' ? 'أيام' : 'days'}</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-3 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">{t.subtitle}</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: <Zap className="w-8 h-8" />, label: t.points, value: points.toLocaleString(), color: 'from-yellow-400 to-orange-500' },
              { icon: <Target className="w-8 h-8" />, label: t.level, value: level, color: 'from-purple-500 to-pink-600' },
              { icon: <Trophy className="w-8 h-8" />, label: t.rank, value: `#${currentUserRank}`, color: 'from-cyan-500 to-teal-600' },
              { icon: <Star className="w-8 h-8" />, label: 'Total XP', value: totalEarnedXP, color: 'from-emerald-500 to-green-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 hover:scale-105 transition-all group">
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center text-white mb-4 group-hover:animate-pulse`}>
                  {stat.icon}
                </div>
                <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Badges Section */}
            <section className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
                  <Medal className="w-7 h-7" />
                  {t.badges}
                </h2>
                <span className="text-sm text-gray-400">
                  {badges.filter(b => b.earned).length}/{badges.length} {language === 'ar' ? 'مكتسبة' : 'earned'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {badges.map((badge, i) => (
                  <div
                    key={badge.id}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-500 ${
                      badge.earned 
                        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 hover:border-yellow-400 shadow-xl' 
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white transition-all group-hover:scale-110 ${
                        badge.earned ? `bg-gradient-to-r ${getRarityColor(badge.rarity)}` : 'bg-gray-700'
                      }`}>
                        {badge.icon}
                      </div>
                      {badge.earned && (
                        <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          <Unlock className="w-3 h-3" />
                          <span>{badge.xpReward} XP</span>
                        </div>
                      )}
                    </div>
                    <h3 className={`font-bold text-lg ${badge.earned ? 'text-white' : 'text-gray-500'}`}>
                      {badge.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">{badge.description}</p>
                    <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${
                      badge.earned ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {badge.earned ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{badge.earned ? (language === 'ar' ? 'مكتسبة!' : 'Earned!') : (language === 'ar' ? 'مقفلة' : 'Locked')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Instant Challenge */}
              <section className="bg-gradient-to-r from-red-600 to-pink-600 rounded-3xl shadow-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Zap className="w-6 h-6 animate-pulse" />
                  {t.bonusChallenge}
                </h3>
                <button
                  onClick={handleBonusChallenge}
                  className="w-full bg-white text-red-600 font-bold py-3 rounded-2xl hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95"
                >
                  {language === 'ar' ? 'اضغط لتفوز!' : 'Click to Win!'}
                </button>
              </section>

              {/* Active Challenges */}
              <section className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  {t.challenges}
                </h3>
                <div className="space-y-4">
                  {challenges.filter(c => c.active).map(challenge => (
                    <div key={challenge.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{challenge.title}</h4>
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                          +{challenge.reward} XP
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{challenge.description}</p>
                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-full transition-all duration-1000"
                          style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">
                        {challenge.progress}/{challenge.target}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Leaderboard */}
              <section className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <Crown className="w-6 h-6" />
                  {t.leaderboard}
                </h3>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map(entry => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        entry.isCurrentUser 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' 
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          entry.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          entry.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                          entry.rank === 3 ? 'bg-gradient-to-r from-orange-600 to-red-600' :
                          'bg-gray-700'
                        }`}>
                          {entry.rank <= 3 ? <Trophy className="w-5 h-5" /> : entry.avatar}
                        </div>
                        <div>
                          <p className={`font-semibold ${entry.isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                            {entry.name}
                          </p>
                          <p className="text-xs text-gray-400">Lv. {entry.level}</p>
                        </div>
                      </div>
                      <p className="font-bold text-cyan-400">{entry.points.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-6">
            <Link
              to="/"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
            >
              <Award className="w-6 h-6" />
              {t.backToHome}
            </Link>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-green-400" /> : <VolumeX className="w-5 h-5 text-red-400" />}
              <span className="text-white font-medium">{t.sound}: {soundEnabled ? (language === 'ar' ? 'مفعل' : 'On') : (language === 'ar' ? 'مغلق' : 'Off')}</span>
            </button>
          </div>
        </div>

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  backgroundColor: ['#fbbf24', '#f87171', '#34d399', '#60a5fa'][Math.floor(Math.random() * 4)],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
        @keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.4; } }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </>
  );
};

export default Gamification;