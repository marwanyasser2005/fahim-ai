// src/pages/Contact.tsx
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Github, Linkedin, Facebook, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ContactProps {
  language: 'ar' | 'en';
}

export const Contact: React.FC<ContactProps> = ({ language }) => {
  const isRTL = language === 'ar';

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState<'success' | 'error' | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const content = {
    ar: {
      title: 'تواصل معنا',
      subtitle: 'نحن هنا لدعمك في رحلتك التعليمية الملحمية',
      form: {
        name: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        message: 'الرسالة',
        send: 'إرسال الرسالة',
        namePlaceholder: 'أدخل اسمك الكامل',
        emailPlaceholder: 'أدخل بريدك الإلكتروني',
        messagePlaceholder: 'اكتب رسالتك هنا...'
      },
      contact: {
        title: 'معلومات التواصل',
        email: 'marwan@fahimai.com',
        phone: '+20 100 123 4567',
        address: 'جامعة حلوان، كلية العلوم، القاهرة، مصر'
      },
      social: {
        title: 'تابعنا على وسائل التواصل',
        description: 'ابق على اطلاع بآخر التحديثات والمحتوى التعليمي الحصري'
      },
      validation: {
        nameRequired: 'الاسم مطلوب',
        nameMin: 'الاسم يجب أن يكون 3 أحرف على الأقل',
        emailRequired: 'البريد الإلكتروني مطلوب',
        emailInvalid: 'البريد الإلكتروني غير صالح',
        messageRequired: 'الرسالة مطلوبة',
        messageMin: 'الرسالة يجب أن تكون 10 أحرف على الأقل'
      },
      success: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
      error: 'حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.'
    },
    en: {
      title: 'Contact Us',
      subtitle: 'We\'re here to support you on your epic educational journey',
      form: {
        name: 'Full Name',
        email: 'Email Address',
        message: 'Message',
        send: 'Send Message',
        namePlaceholder: 'Enter your full name',
        emailPlaceholder: 'Enter your email address',
        messagePlaceholder: 'Write your message here...'
      },
      contact: {
        title: 'Contact Information',
        email: 'marwan@fahimai.com',
        phone: '+20 100 123 4567',
        address: 'Helwan University, Faculty of Science, Cairo, Egypt'
      },
      social: {
        title: 'Follow Us on Social Media',
        description: 'Stay updated with exclusive educational content and latest updates'
      },
      validation: {
        nameRequired: 'Name is required',
        nameMin: 'Name must be at least 3 characters',
        emailRequired: 'Email is required',
        emailInvalid: 'Invalid email address',
        messageRequired: 'Message is required',
        messageMin: 'Message must be at least 10 characters'
      },
      success: 'Your message has been sent successfully! We\'ll get back to you soon.',
      error: 'An error occurred while sending the message. Please try again.'
    }
  };

  const t = content[language];
  const v = content[language].validation;

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = v.nameRequired;
    } else if (formData.name.trim().length < 3) {
      newErrors.name = v.nameMin;
    }

    if (!formData.email.trim()) {
      newErrors.email = v.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = v.emailInvalid;
    }

    if (!formData.message.trim()) {
      newErrors.message = v.messageRequired;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = v.messageMin;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error on typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success
      setShowToast('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setShowToast('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-6 right-6 z-50 animate-slide-in-right`}>
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
            showToast === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-300' 
              : 'bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-300'
          }`}>
            {showToast === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            <p className="font-semibold">
              {showToast === 'success' ? t.success : t.error}
            </p>
          </div>
        </div>
      )}

      <div className={`min-h-screen py-16 sm:py-20 lg:py-24 ${isRTL ? 'rtl' : 'ltr'} bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50 overflow-hidden relative`}>
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-300 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-300 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-full text-lg font-bold mb-6 shadow-xl">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span>{language === 'ar' ? 'دعم 24/7' : '24/7 Support'}</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              {t.title}
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/50">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <Send className="w-8 h-8 text-teal-600" />
                {language === 'ar' ? 'أرسل رسالتك' : 'Send Us a Message'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    {t.form.name}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.form.namePlaceholder}
                    className={`w-full px-5 py-4 rounded-2xl border ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    } focus:outline-none focus:ring-2 transition-all duration-300 bg-gray-50 placeholder-gray-400 text-base`}
                    required
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    {t.form.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.form.emailPlaceholder}
                    className={`w-full px-5 py-4 rounded-2xl border ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    } focus:outline-none focus:ring-2 transition-all duration-300 bg-gray-50 placeholder-gray-400 text-base`}
                    required
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    {t.form.message}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t.form.messagePlaceholder}
                    rows={6}
                    className={`w-full px-5 py-4 rounded-2xl border ${
                      errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'
                    } focus:outline-none focus:ring-2 transition-all duration-300 bg-gray-50 placeholder-gray-400 text-base resize-y`}
                    required
                  />
                  {errors.message && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-gradient-to-r from-teal-600 via-blue-600 to-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 ${
                    isSubmitting ? 'animate-pulse' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      {t.form.send}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Details */}
              <div className="bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/60">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  {t.contact.title}
                </h2>

                <div className="space-y-8">
                  <div className="group flex items-center gap-5 p-4 rounded-2xl hover:bg-white/50 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{t.form.email}</p>
                      <a
                        href={`mailto:${t.contact.email}`}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {t.contact.email}
                      </a>
                    </div>
                  </div>

                  <div className="group flex items-center gap-5 p-4 rounded-2xl hover:bg-white/50 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Phone className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{language === 'ar' ? 'الهاتف' : 'Phone'}</p>
                      <a
                        href={`tel:${t.contact.phone}`}
                        className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {t.contact.phone}
                      </a>
                    </div>
                  </div>

                  <div className="group flex items-start gap-5 p-4 rounded-2xl hover:bg-white/50 transition-all duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{language === 'ar' ? 'العنوان' : 'Address'}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {t.contact.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-12 border border-white/50">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
                  {t.social.title}
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {t.social.description}
                </p>

                <div className="flex gap-6">
                  <a
                    href="https://github.com/marwanyasser2005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-16 h-16 bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                    aria-label="GitHub"
                  >
                    <Github className="w-8 h-8 text-white group-hover:animate-spin" />
                  </a>
                  <a
                    href="https://linkedin.com/in/marwan-abdelghaffar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-8 h-8 text-white group-hover:animate-pulse" />
                  </a>
                  <a
                    href="https://facebook.com/marwanyasser"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group w-16 h-16 bg-gradient-to-r from-blue-700 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-8 h-8 text-white group-hover:animate-bounce" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center">
            <p className="text-sm text-gray-500">
              © 2025 EduQuest • {language === 'ar' ? 'رحلة تعليمية ملحمية' : 'An Epic Learning Journey'}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slide-in-right 0.5s ease-out; }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.5; } }
        .delay-1000 { animation-delay: 1s; }
        .delay-2000 { animation-delay: 2s; }
      `}</style>
    </>
  );
};

export default Contact;