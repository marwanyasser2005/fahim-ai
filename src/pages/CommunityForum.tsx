import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

interface CommunityForumProps {
  language: 'ar' | 'en';
}

interface Topic {
  id: number;
  title: string;
  replies: number;
  views: number;
  lastPost: string;
}

interface User {
  id: number;
  name: string;
  posts: number;
}

/**
 * Component: CommunityForum
 * Description: An immersive and dynamic community forum that transforms user engagement with
 * interactive discussions, a vibrant topics section, and a showcase of active members. This
 * component supports internationalization for Arabic and English, featuring a highly responsive
 * and creative design optimized for all screen sizes. It includes mock data, dynamic interactions,
 * and an option to add new topics manually to mimic a real forum experience until backend
 * integration is available.
 *
 * @param {CommunityForumProps} props - Component props including the language setting.
 * @returns {JSX.Element} - Rendered React component with an engaging forum dashboard layout.
 */
const CommunityForum: React.FC<CommunityForumProps> = ({ language }) => {
  const [topics, setTopics] = useState<Topic[]>([
    { id: 1, title: 'How to Start Learning Coding', replies: 15, views: 120, lastPost: '10:00 AM' },
    { id: 2, title: 'Best Resources for AI', replies: 8, views: 75, lastPost: '09:30 AM' },
    { id: 3, title: 'Discussing Physics Concepts', replies: 5, views: 40, lastPost: '08:15 AM' }
  ]);

  const [activeUsers] = useState<User[]>([
    { id: 1, name: 'Ahmed', posts: 25 },
    { id: 2, name: 'Sara', posts: 18 },
    { id: 3, name: 'Mohamed', posts: 12 }
  ]);

  const [newTopic, setNewTopic] = useState('');
  const [showForm, setShowForm] = useState(false);

  const content = {
    ar: {
      title: 'ساحة المنتدى الملحمية',
      topics: 'مواضيع الساحة',
      replies: 'الردود الشجاعة',
      views: 'عدد المشاهدات',
      lastPost: 'آخر هجوم',
      activeUsers: 'المحاربون النشطون',
      posts: 'المنشورات',
      createTopic: 'إنشاء موضوع بطولي',
      newTopicPlaceholder: 'عنوان الموضوع الجديد...',
      addTopic: 'أضف الموضوع',
      backToHome: 'العودة للمغامرة',
      joinDiscussion: 'انضم للنقاش الآن!'
    },
    en: {
      title: 'Epic Forum Arena',
      topics: 'Arena Topics',
      replies: 'Brave Replies',
      views: 'Views',
      lastPost: 'Last Strike',
      activeUsers: 'Active Warriors',
      posts: 'Posts',
      createTopic: 'Create Epic Topic',
      newTopicPlaceholder: 'New topic title...',
      addTopic: 'Add Topic',
      backToHome: 'Back to Adventure',
      joinDiscussion: 'Join the Discussion Now!'
    }
  };

  const isRTL = language === 'ar';

  // Add new topic handler
  const handleAddTopic = () => {
    if (newTopic.trim()) {
      const newTopicId = topics.length + 1;
      const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setTopics([
        ...topics,
        { id: newTopicId, title: newTopic, replies: 0, views: 0, lastPost: currentTime }
      ]);
      setNewTopic('');
      setShowForm(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-blue-900 ${isRTL ? 'rtl' : 'ltr'} py-6 sm:py-10 overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-64 h-64 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white bg-gradient-to-r from-yellow-400 to-red-600 bg-clip-text text-transparent mb-8 relative z-10">
          {content[language].title}
        </h1>

        {/* Topics Section with Dynamic Form */}
        <section className="bg-gray-800 bg-opacity-90 rounded-2xl shadow-2xl p-6 mb-6 relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-yellow-300">{content[language].topics}</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300"
            >
              {content[language].createTopic}
            </button>
          </div>
          {showForm && (
            <div className="mb-4">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder={content[language].newTopicPlaceholder}
                className="w-full p-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTopic}
                className="mt-2 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300"
              >
                {content[language].addTopic}
              </button>
            </div>
          )}
          <div className="space-y-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors duration-300 animate-fadeIn"
                style={{ animationDelay: `${topic.id * 100}ms` }}
              >
                <h3 className="text-lg font-medium text-white">{topic.title}</h3>
                <div className="flex justify-between text-sm text-gray-300 mt-2">
                  <span>{content[language].replies}: {topic.replies}</span>
                  <span>{content[language].views}: {topic.views}</span>
                  <span>{content[language].lastPost}: {topic.lastPost}, 19 Sep 2025</span>
                </div>
                <Link
                  to={`/topic/${topic.id}`}
                  className="mt-2 inline-block text-blue-400 hover:text-blue-300 font-medium"
                >
                  {content[language].joinDiscussion}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Active Users Section with Animation */}
        <section className="bg-gray-800 bg-opacity-90 rounded-2xl shadow-2xl p-6 relative z-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-yellow-300 mb-4">{content[language].activeUsers}</h2>
          <div className="space-y-3">
            {activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors animate-slideIn"
                style={{ animationDelay: `${user.id * 100}ms` }}
              >
                <span className="text-sm font-medium text-white">{user.name}</span>
                <span className="text-sm font-semibold text-blue-400">{content[language].posts}: {user.posts}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Back to Home Button */}
        <div className="mt-6 text-center relative z-10">
          <Link
            to="/"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {content[language].backToHome}
          </Link>
        </div>
      </div>

      {/* Custom CSS for Animations */}
      <style>
        {`
          @keyframes blob {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(50px, -50px) scale(1.2); }
            66% { transform: translate(-20px, 20px) scale(0.8); }
            100% { transform: translate(0, 0) scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-blob { animation: blob 15s infinite; }
          .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
          .animate-slideIn { animation: slideIn 0.3s ease-out; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}
      </style>
    </div>
  );
};

export default CommunityForum;