import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Shield, AlertCircle, Star, Award } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BADGES_INFO } from '../lib/badges';

interface HonorRollEntry {
  id: string;
  name: string;
  section: string;
  year: string;
}

export default function Home() {
  const navigate = useNavigate();
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [honorRoll, setHonorRoll] = useState<HonorRollEntry[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'honorRoll'), (snapshot) => {
      const hd: HonorRollEntry[] = [];
      snapshot.forEach(doc => hd.push({ id: doc.id, ...doc.data() } as HonorRollEntry));
      setHonorRoll(hd);
    });
    return () => unsubscribe();
  }, []);

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // رمز دخول بسيط للمعلمة (يمكن تغييره لاحقاً)
    if (passcode === '7541') {
      localStorage.setItem('role', 'admin');
      navigate('/dashboard');
    } else {
      setError('رمز الدخول غير صحيح');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden py-12" dir="rtl">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#2A5C43] rounded-b-[50%] opacity-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl opacity-10 translate-x-1/2 translate-y-1/2"></div>
      
      <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E8DCC4] relative z-10 mb-12">
        <div className="text-center mb-10">
          <div className="bg-[#2A5C43] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-[#D4AF37]">
            <BookOpen className="h-10 w-10 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-bold text-[#2A5C43] mb-2">بوابة التاريخ</h1>
          <p className="text-gray-600 text-lg">أ/ دلال العلوي - الثانوية السابعة والأربعون</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Parent/Student Access */}
          <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-center hover:shadow-md transition-shadow">
            <Users className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-900 mb-2">دخول الطالبات وأولياء الأمور</h2>
            <p className="text-amber-700 text-sm mb-6">
              للاطلاع على نتائج الطالبات، الملاحظات، وإضافة ردود أولياء الأمور.
            </p>
            <button
              onClick={() => navigate('/students')}
              className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm"
            >
              الدخول للبوابة
            </button>
          </div>

          {/* Teacher Access */}
          <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 text-center hover:shadow-md transition-shadow">
            <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-emerald-900 mb-2">دخول المعلمة</h2>
            <p className="text-emerald-700 text-sm mb-6">
              لإدارة بيانات الطالبات، إضافة النتائج، وإرسال الملاحظات.
            </p>
            
            {!showTeacherLogin ? (
              <button
                onClick={() => setShowTeacherLogin(true)}
                className="w-full bg-[#2A5C43] text-white py-3 rounded-lg hover:bg-[#1E4330] transition-colors font-medium shadow-sm"
              >
                تسجيل الدخول
              </button>
            ) : (
              <form onSubmit={handleTeacherLogin} className="space-y-3">
                <input
                  type="password"
                  placeholder="أدخلي رمز الدخول"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-[#2A5C43] outline-none text-center"
                  required
                />
                {error && (
                  <div className="flex items-center gap-1 text-red-600 text-sm justify-center">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#2A5C43] text-white py-2 rounded-lg hover:bg-[#1E4330] transition-colors text-sm"
                  >
                    دخول
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherLogin(false);
                      setError('');
                      setPasscode('');
                    }}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Honor Roll Section */}
      <div className="max-w-5xl w-full px-4 relative z-10 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#D4AF37] mb-2 flex items-center justify-center gap-3">
            <Award className="w-8 h-8" />
            لوحة الشرف
            <Award className="w-8 h-8" />
          </h2>
          <p className="text-gray-600">نفخر بطالباتنا المتميزات اللاتي سطرن أسماءهن في لوحة الشرف</p>
        </div>
        
        {honorRoll.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {honorRoll.map((student, index) => (
              <div key={student.id} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DCC4] transform hover:-translate-y-2 transition-transform duration-300 relative group">
                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-[#D4AF37] to-[#F1DE88]"></div>
                <div className="p-6 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#2A5C43] to-[#1E4330] rounded-full flex items-center justify-center mb-4 text-white shadow-lg border-4 border-[#F1DE88]">
                    <span className="text-2xl font-bold">{index + 1}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{student.name}</h3>
                  <div className="bg-[#E8DCC4]/30 px-3 py-1 rounded-full text-sm text-[#2A5C43] font-medium inline-block mb-2">
                    {student.year}
                  </div>
                  <p className="text-gray-500 text-sm">الشعبة: {student.section}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-dashed border-[#D4AF37] shadow-sm">
            <Award className="w-12 h-12 text-[#D4AF37] opacity-50 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">لا توجد طالبات في لوحة الشرف حالياً</h3>
            <p className="text-gray-500 mt-2">ننتظر تألق المزيد من الطالبات لإضافتهن إلى لوحة الشرف</p>
          </div>
        )}
      </div>

      {/* Badges Section */}
      <div className="max-w-5xl w-full px-4 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-[#2A5C43] mb-2">أوسمة التميز في بوابة التاريخ</h2>
          <p className="text-gray-600">تُمنح هذه الأوسمة للطالبات المتميزات تقديراً لجهودهن</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BADGES_INFO.map(badge => (
            <div key={badge.id} className={`bg-white p-6 rounded-2xl shadow-md border ${badge.borderClass} flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300`}>
              <div className={`${badge.bgClass} p-4 rounded-full mb-4`}>
                <Star className={`w-12 h-12 ${badge.colorClass} ${badge.fillClass}`} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${badge.colorClass.replace('text-', 'text-').replace('500', '700')}`}>
                {badge.title}
              </h3>
              <p className="text-sm text-gray-500 opacity-80 leading-relaxed">
                "{badge.description}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
