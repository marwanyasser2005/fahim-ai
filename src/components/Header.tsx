import React, { useState } from 'react';
import { Menu, X, Globe, User, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom'; // Assuming React Router is used; fallback to <a> if not
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  user?: any;
  onAuthClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ language, setLanguage, user, onAuthClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const content = {
    ar: {
      home: 'الرئيسية',
      about: 'من نحن',
      courses: 'الدورات',
      resources: 'الموارد',
      contact: 'تواصل معنا',
      login: 'تسجيل دخول',
      register: 'إنشاء حساب',
      dashboard: 'لوحة التحكم',
      logout: 'تسجيل خروج',
      profile: 'الملف الشخصي'
    },
    en: {
      home: 'Home',
      about: 'About',
      courses: 'Courses',
      resources: 'Resources',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      logout: 'Logout',
      profile: 'Profile'
    }
  };

  const isRTL = language === 'ar';

  const NavLink = ({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) => (
    <Link
      to={to}
      className={`relative group text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 ${className}`}
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
    </Link>
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
  };

  return (
    <header className={`bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200/50 ${isRTL ? 'rtl' : 'ltr'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse group">
            <img
              src="/brand/fahim-logo.svg"
              alt={language === 'ar' ? 'فَهيم، نظام الفهم الموثق' : 'Fahim verified learning'}
              className="h-11 w-auto max-w-[12rem] object-contain transition-transform duration-300 group-hover:-translate-y-0.5 lg:h-12"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 xl:space-x-6 rtl:space-x-reverse">
            {[
              { to: '/', label: content[language].home },
              { to: '/about', label: content[language].about },
              { to: '/courses', label: content[language].courses },
              { to: '/resources', label: content[language].resources },
              { to: '/contact', label: content[language].contact }
            ].map(({ to, label }) => (
              <NavLink key={to} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 rtl:space-x-reverse">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center space-x-1 rtl:space-x-reverse p-2 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
              aria-label={`Switch to ${language === 'ar' ? 'English' : 'العربية'}`}
            >
              <Globe className="h-4 w-4" />
              <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isRTL ? 'rotate-180' : ''}`} />
              <span className="hidden lg:inline text-sm font-medium">
                {language === 'ar' ? 'EN' : 'AR'}
              </span>
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden lg:inline text-sm font-medium truncate max-w-32">
                    {user.full_name || user.email}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <NavLink to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 w-full text-left">
                      {content[language].dashboard}
                    </NavLink>
                    <NavLink to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 w-full text-left">
                      {content[language].profile}
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 rtl:space-x-reverse"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{content[language].logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={onAuthClick}
                  className="hidden lg:inline text-gray-600 hover:text-blue-600 font-medium transition-all duration-300 px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  {content[language].login}
                </button>
                <button
                  onClick={onAuthClick}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 hidden lg:inline"
                >
                  {content[language].register}
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {[
                { to: '/', label: content[language].home },
                { to: '/about', label: content[language].about },
                { to: '/courses', label: content[language].courses },
                { to: '/resources', label: content[language].resources },
                { to: '/contact', label: content[language].contact }
              ].map(({ to, label }) => (
                <NavLink key={to} to={to} className="block px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md font-medium">
                  {label}
                </NavLink>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <button
                  onClick={() => {
                    setLanguage(language === 'ar' ? 'en' : 'ar');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md"
                >
                  <span>
                    <Globe className="h-4 w-4 inline mr-2 rtl:ml-2" />
                    {language === 'ar' ? 'English' : 'العربية'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {user ? (
                  <>
                    <NavLink to="/dashboard" className="block w-full px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md">
                      {content[language].dashboard}
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-start px-3 py-2 text-red-600 hover:text-red-700 rounded-md"
                    >
                      <LogOut className="h-4 w-4 mr-2 rtl:ml-2" />
                      {content[language].logout}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onAuthClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-gray-700 hover:text-blue-600 rounded-md text-left"
                    >
                      {content[language].login}
                    </button>
                    <button
                      onClick={() => {
                        onAuthClick?.();
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-md font-semibold mt-2 shadow-md hover:shadow-lg"
                    >
                      {content[language].register}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
