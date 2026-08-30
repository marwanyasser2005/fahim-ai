import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface CTAProps {
  language: 'ar' | 'en';
}

const CTA: React.FC<CTAProps> = ({ language }) => {
  const content = {
    ar: {
      title: 'ابدأ رحلتك التعليمية اليوم',
      subtitle: 'انضم لآلاف الطلاب الذين يطورون مهاراتهم في التقنية والذكاء الاصطناعي',
      features: [
        'تقييم مجاني لتحديد مستواك',
        'مسار تعليمي مخصص',
        'دعم فني على مدار 24/7',
        'شهادات معتمدة'
      ],
      startFree: 'ابدأ مجاناً',
      contactUs: 'تواصل معنا'
    },
    en: {
      title: 'Start Your Learning Journey Today',
      subtitle: 'Join thousands of students developing their skills in technology and artificial intelligence',
      features: [
        'Free assessment to determine your level',
        'Personalized learning path',
        '24/7 technical support',
        'Certified certificates'
      ],
      startFree: 'Start Free',
      contactUs: 'Contact Us'
    }
  };

  const isRTL = language === 'ar';

  return (
    <section className={`py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 ${isRTL ? 'rtl' : 'ltr'}`} id="contact">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-white">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {content[language].title}
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {content[language].subtitle}
            </p>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {content[language].features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-blue-100">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center">
              <span>{content[language].startFree}</span>
              <ArrowRight className={`h-5 w-5 group-hover:translate-x-1 transition-transform ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </button>
            <button className="group bg-transparent text-white px-8 py-4 rounded-xl border-2 border-white hover:bg-white hover:text-blue-600 transition-all duration-300 font-semibold">
              {content[language].contactUs}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;