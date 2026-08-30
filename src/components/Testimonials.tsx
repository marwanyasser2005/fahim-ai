import React from 'react';
import { Star, Quote } from 'lucide-react';

interface TestimonialsProps {
  language: 'ar' | 'en';
}

const Testimonials: React.FC<TestimonialsProps> = ({ language }) => {
  const content = {
    ar: {
      title: 'ماذا يقول طلابنا؟',
      subtitle: 'آراء حقيقية من طلاب نجحوا في تطوير مهاراتهم معنا',
      testimonials: [
        {
          name: 'أحمد محمد',
          role: 'طالب هندسة برمجيات',
          image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150',
          rating: 5,
          text: 'منصة رائعة غيرت نظرتي للبرمجة تماماً. الدروس واضحة والمشاريع العملية ساعدتني كثيراً في فهم المفاهيم.'
        },
        {
          name: 'فاطمة العلي',
          role: 'طالبة ثانوية',
          image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150',
          rating: 5,
          text: 'التقييم الذكي حدد مستواي بدقة ووضع لي خطة مخصصة. أصبحت أفهم الرياضيات والعلوم بطريقة أفضل.'
        },
        {
          name: 'سارة أحمد',
          role: 'مطورة مواقع',
          image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
          rating: 5,
          text: 'بدأت كمبتدئة تماماً والآن أعمل كمطورة مواقع. المحتوى العربي المتخصص كان نقطة تحول في مسيرتي.'
        }
      ]
    },
    en: {
      title: 'What Our Students Say?',
      subtitle: 'Real feedback from students who succeeded in developing their skills with us',
      testimonials: [
        {
          name: 'Ahmed Mohammed',
          role: 'Software Engineering Student',
          image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150',
          rating: 5,
          text: 'An amazing platform that completely changed my view of programming. The lessons are clear and practical projects helped me understand concepts.'
        },
        {
          name: 'Fatima Al-Ali',
          role: 'High School Student',
          image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150',
          rating: 5,
          text: 'The smart assessment accurately determined my level and created a personalized plan. I now understand math and science much better.'
        },
        {
          name: 'Sarah Ahmed',
          role: 'Web Developer',
          image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
          rating: 5,
          text: 'I started as a complete beginner and now I work as a web developer. The specialized Arabic content was a turning point in my journey.'
        }
      ]
    }
  };

  const isRTL = language === 'ar';

  return (
    <section className={`py-20 bg-white ${isRTL ? 'rtl' : 'ltr'}`}>
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

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content[language].testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-teal-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative"
            >
              <Quote className={`h-8 w-8 text-blue-400 mb-4 ${isRTL ? '' : ''}`} />
              
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;