import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, BookOpen, Home as HomeIcon } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = localStorage.getItem('role') === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans flex flex-col" dir="rtl">
      {/* Header with Saudi Historical Theme */}
      <header className="bg-[#2A5C43] text-[#E8DCC4] shadow-md border-b-4 border-[#D4AF37]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            >
              <BookOpen className="h-8 w-8 text-[#D4AF37]" />
              <div>
                <h1 className="text-xl font-bold tracking-wide">بوابة التاريخ</h1>
                <p className="text-xs text-[#D4AF37] opacity-90">أ/ دلال العلوي - الثانوية السابعة والأربعون</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {location.pathname !== '/' && (
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-[#E8DCC4] hover:text-white transition-colors"
                >
                  <HomeIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">الرئيسية</span>
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-[#1E4330] hover:bg-[#153022] px-4 py-2 rounded-lg transition-colors border border-[#3A7A59]"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-[#1E4330] text-[#E8DCC4] py-6 text-center text-sm mt-auto border-t-4 border-[#D4AF37]">
        <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} - بوابة التاريخ للثانوية السابعة والأربعون</p>
      </footer>
    </div>
  );
}
