import React from 'react';
import { ArrowRight, Play, Brain, Code, Users } from 'lucide-react';

interface HeroProps {
  language: 'ar' | 'en';
}

const Hero: React.FC<HeroProps> = ({ language }) => {
  const content = {
    ar: {
      title: 'مستقبل التعليم بالذكاء الاصطناعي',
      subtitle: 'منصة تعليمية ذكية تجمع بين علوم STEM والبرمجة والذكاء الاصطناعي باللغة العربية',
      description: 'اكتشف عالم التقنية من خلال مسارات تعليمية مخصصة، ودروس تفاعلية، ومشاريع عملية تنمي مهاراتك في المستقبل',
      startJourney: 'ابدأ رحلتك التعليمية',
      watchDemo: 'شاهد العرض التوضيحي',
      stats: {
        students: 'طالب',
        courses: 'دورة تدريبية',
        projects: 'مشروع منجز'
      }
    },
    en: {
      title: 'The Future of AI-Powered Education',
      subtitle: 'Smart educational platform combining STEM, programming, and AI in Arabic',
      description: 'Discover technology through personalized learning paths, interactive lessons, and practical projects that develop your future skills',
      startJourney: 'Start Your Learning Journey',
      watchDemo: 'Watch Demo',
      stats: {
        students: 'Students',
        courses: 'Courses',
        projects: 'Completed Projects'
      }
    }
  };

  const isRTL = language === 'ar';

  return (
    <section className={`relative bg-gradient-to-br from-blue-50 via-white to-teal-50 ${isRTL ? 'rtl' : 'ltr'}`} id="home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {content[language].title}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                {content[language].subtitle}
              </p>
              <p className="text-lg text-gray-500 leading-relaxed">
                {content[language].description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="group bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center">
                <span className="font-semibold">{content[language].startJourney}</span>
                <ArrowRight className={`h-5 w-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </button>
              <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 flex items-center justify-center">
                <Play className={`h-5 w-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                <span className="font-semibold">{content[language].watchDemo}</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">5000+</span>
                </div>
                <p className="text-gray-600">{content[language].stats.students}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="h-6 w-6 text-teal-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">150+</span>
                </div>
                <p className="text-gray-600">{content[language].stats.courses}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Code className="h-6 w-6 text-orange-600 mr-2" />
                  <span className="text-3xl font-bold text-gray-900">1200+</span>
                </div>
                <p className="text-gray-600">{content[language].stats.projects}</p>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl p-8 shadow-2xl">
              <div className="bg-white rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Brain className="h-6 w-6 text-blue-600" />
                  <div className="h-3 bg-gray-200 rounded flex-1"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-blue-100 rounded w-3/4"></div>
                  <div className="h-4 bg-teal-100 rounded w-1/2"></div>
                  <div className="h-4 bg-orange-100 rounded w-2/3"></div>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex space-x-1 rtl:space-x-reverse">
                    <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
                    <div className="w-8 h-8 bg-teal-500 rounded-full"></div>
                    <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
                  </div>
                  <Code className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500 rounded-full opacity-80 animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-teal-500 rounded-full opacity-60 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;