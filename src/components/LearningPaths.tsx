import React from 'react';
import { ArrowRight, Clock, Users, Star } from 'lucide-react';

interface LearningPathsProps {
  language: 'ar' | 'en';
}

const LearningPaths: React.FC<LearningPathsProps> = ({ language }) => {
  const content = {
    ar: {
      title: 'مسارات التعلم المتخصصة',
      subtitle: 'اختر المسار المناسب لك وابدأ رحلتك في عالم التقنية',
      paths: [
        {
          title: 'أساسيات البرمجة',
          description: 'تعلم مفاهيم البرمجة الأساسية والخوارزميات',
          level: 'مبتدئ',
          duration: '8 أسابيع',
          students: '2,500',
          rating: '4.9',
          color: 'from-blue-500 to-blue-600',
          image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          title: 'الذكاء الاصطناعي',
          description: 'اكتشف عالم الذكاء الاصطناعي وتطبيقاته',
          level: 'متوسط',
          duration: '12 أسبوع',
          students: '1,800',
          rating: '4.8',
          color: 'from-teal-500 to-teal-600',
          image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          title: 'تطوير الويب',
          description: 'بناء مواقع وتطبيقات ويب تفاعلية',
          level: 'متوسط',
          duration: '10 أسابيع',
          students: '3,200',
          rating: '4.9',
          color: 'from-orange-500 to-orange-600',
          image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ],
      viewAll: 'عرض جميع المسارات'
    },
    en: {
      title: 'Specialized Learning Paths',
      subtitle: 'Choose the right path for you and start your journey in the world of technology',
      paths: [
        {
          title: 'Programming Fundamentals',
          description: 'Learn basic programming concepts and algorithms',
          level: 'Beginner',
          duration: '8 weeks',
          students: '2,500',
          rating: '4.9',
          color: 'from-blue-500 to-blue-600',
          image: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          title: 'Artificial Intelligence',
          description: 'Discover the world of AI and its applications',
          level: 'Intermediate',
          duration: '12 weeks',
          students: '1,800',
          rating: '4.8',
          color: 'from-teal-500 to-teal-600',
          image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=400'
        },
        {
          title: 'Web Development',
          description: 'Build interactive websites and web applications',
          level: 'Intermediate',
          duration: '10 weeks',
          students: '3,200',
          rating: '4.9',
          color: 'from-orange-500 to-orange-600',
          image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=400'
        }
      ],
      viewAll: 'View All Paths'
    }
  };

  const isRTL = language === 'ar';

  return (
    <section className={`py-20 bg-gradient-to-br from-gray-50 to-blue-50 ${isRTL ? 'rtl' : 'ltr'}`} id="courses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {content[language].title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {content[language].subtitle}
          </p>
        </div>

        {/* Learning Paths Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {content[language].paths.map((path, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={path.image}
                  alt={path.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${path.color} opacity-80`}></div>
                <div className="absolute top-4 right-4">
                  <span className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    {path.level}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {path.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {path.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{path.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{path.students}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    <span>{path.rating}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="group w-full bg-gray-100 hover:bg-blue-600 text-gray-700 hover:text-white px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-center font-medium">
                  <span>{language === 'ar' ? 'ابدأ الآن' : 'Start Now'}</span>
                  <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl border-2 border-blue-200 hover:bg-blue-600 hover:text-white transition-all duration-300 font-semibold flex items-center mx-auto">
            <span>{content[language].viewAll}</span>
            <ArrowRight className={`h-5 w-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default LearningPaths;