import React from 'react';
import { Brain, Code, Users, BarChart, BookOpen, Zap } from 'lucide-react';

interface FeaturesProps {
  language: 'ar' | 'en';
}

const Features: React.FC<FeaturesProps> = ({ language }) => {
  const content = {
    ar: {
      title: 'لماذا تختار فهيم AI؟',
      subtitle: 'منصة شاملة تجمع بين التقنيات الحديثة والتعليم المخصص',
      features: [
        {
          icon: Brain,
          title: 'ذكاء اصطناعي متقدم',
          description: 'تقييم ذكي يحدد مستواك ويصمم مسار تعليمي مخصص لك'
        },
        {
          icon: Code,
          title: 'تعلم البرمجة تفاعلياً',
          description: 'محرر أكواد متقدم ومشاريع عملية تنمي مهاراتك التقنية'
        },
        {
          icon: BookOpen,
          title: 'محتوى عربي متخصص',
          description: 'دروس وموارد تعليمية باللغة العربية لعلوم STEM والتقنية'
        },
        {
          icon: Users,
          title: 'مجتمع تفاعلي',
          description: 'تواصل مع زملائك والمدرسين وشارك مشاريعك'
        },
        {
          icon: BarChart,
          title: 'تتبع التقدم',
          description: 'تحليلات مفصلة لتقدمك ونقاط القوة والضعف'
        },
        {
          icon: Zap,
          title: 'تعلم سريع وفعال',
          description: 'طرق تعليمية حديثة تضمن الفهم السريع والاحتفاظ بالمعلومات'
        }
      ]
    },
    en: {
      title: 'Why Choose Fahim AI?',
      subtitle: 'Comprehensive platform combining modern technology with personalized education',
      features: [
        {
          icon: Brain,
          title: 'Advanced AI',
          description: 'Smart assessment that determines your level and creates a personalized learning path'
        },
        {
          icon: Code,
          title: 'Interactive Programming',
          description: 'Advanced code editor and practical projects that develop your technical skills'
        },
        {
          icon: BookOpen,
          title: 'Specialized Arabic Content',
          description: 'Lessons and educational resources in Arabic for STEM and technology sciences'
        },
        {
          icon: Users,
          title: 'Interactive Community',
          description: 'Connect with peers and teachers, share your projects'
        },
        {
          icon: BarChart,
          title: 'Progress Tracking',
          description: 'Detailed analytics of your progress, strengths, and areas for improvement'
        },
        {
          icon: Zap,
          title: 'Fast & Effective Learning',
          description: 'Modern teaching methods ensuring quick understanding and information retention'
        }
      ]
    }
  };

  const isRTL = language === 'ar';

  return (
    <section className={`py-20 bg-white ${isRTL ? 'rtl' : 'ltr'}`} id="features">
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content[language].features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center space-x-4 rtl:space-x-reverse mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl group-hover:from-blue-100 group-hover:to-teal-100 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;