import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, FileText, Award, MessageSquare, Send, BookOpen, ArrowRight, CheckCircle2, AlertCircle, HelpCircle, Lock, Star } from 'lucide-react';
import { BADGES_INFO } from '../lib/badges';

interface Student {
  id: string;
  name: string;
  passcode: string;
  parentEmail: string;
  results: string;
  notes: string;
  certificates: string[];
  parentReply: string;
  parentInquiry: string;
  teacherReply: string;
  badges?: string[];
}

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [inquiryText, setInquiryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(doc(db, 'students', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Student;
        setStudent({ id: docSnap.id, ...data });
        setReplyText(data.parentReply || '');
        setInquiryText(data.parentInquiry || '');
      } else {
        setStudent(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching student details:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (student && passcode === student.passcode) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('الرقم السري غير صحيح');
    }
  };

  const handleReplySubmit = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'students', id), {
        parentReply: replyText,
        parentInquiry: inquiryText
      });
      showNotification('تم إرسال البيانات بنجاح', 'success');
    } catch (error) {
      console.error("Error updating reply:", error);
      showNotification('حدث خطأ أثناء الإرسال', 'error');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A5C43] border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">لم يتم العثور على الطالبة</h2>
        <button onClick={() => navigate('/students')} className="text-[#2A5C43] hover:underline">
          العودة للقائمة
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-2xl shadow-xl border border-[#E8DCC4]">
        <div className="text-center mb-8">
          <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">سجل الطالبة السري</h2>
          <p className="text-gray-600">الرجاء إدخال الرقم السري الخاص بالطالبة {student.name}</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="الرقم السري"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A5C43] outline-none text-center text-lg"
              required
            />
            {authError && (
              <p className="text-red-500 text-sm mt-2 text-center">{authError}</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-[#2A5C43] text-white py-3 rounded-xl hover:bg-[#1E4330] transition-colors font-medium text-lg shadow-md"
          >
            دخول
          </button>
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            العودة للقائمة
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <button
        onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-gray-600 hover:text-[#2A5C43] transition-colors mb-6"
      >
        <ArrowRight className="w-5 h-5" />
        <span>العودة لقائمة الطالبات</span>
      </button>

      <div className="bg-white rounded-2xl shadow-xl border border-[#E8DCC4] overflow-hidden">
        {/* Header */}
        <div className="bg-[#2A5C43] text-white p-6 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">{student.name}</h2>
              <p className="text-[#E8DCC4] text-lg opacity-90">سجل الطالبة الأكاديمي</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          {/* Results Section */}
          <section>
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
              <FileText className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-xl font-bold text-gray-800">النتيجة والمستوى</h3>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 text-lg">
              {student.results || 'لم يتم إضافة نتيجة بعد.'}
            </div>
          </section>

          {/* Notes Section */}
          <section>
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
              <BookOpen className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-xl font-bold text-gray-800">ملاحظات وتوصيات المعلمة</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl text-blue-900 whitespace-pre-wrap leading-relaxed border border-blue-100 text-lg">
              {student.notes || 'لا توجد ملاحظات حالياً.'}
            </div>
          </section>

          {/* Badges Section */}
          {student.badges && student.badges.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
                <Award className="w-6 h-6 text-[#D4AF37]" />
                <h3 className="text-xl font-bold text-gray-800">الأوسمة والتميز</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {student.badges.map(badgeId => {
                  const badge = BADGES_INFO.find(b => b.id === badgeId);
                  if (!badge) return null;
                  return (
                    <div key={badge.id} className={`p-4 rounded-xl border ${badge.bgClass} ${badge.borderClass} flex flex-col items-center text-center gap-2`}>
                      <Star className={`w-10 h-10 ${badge.colorClass} ${badge.fillClass}`} />
                      <h4 className="font-bold text-gray-800">{badge.title}</h4>
                      <p className="text-sm text-gray-500 opacity-80">{badge.description}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Certificates Section */}
          <section>
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
              <Award className="w-6 h-6 text-[#D4AF37]" />
              <h3 className="text-xl font-bold text-gray-800">شهادات الشكر والتقدير</h3>
            </div>
            {student.certificates && student.certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {student.certificates.map((cert, index) => {
                  const isImage = cert.startsWith('data:image/') || cert.match(/\.(jpeg|jpg|gif|png)$/) != null;
                  
                  if (isImage) {
                    return (
                      <div key={index} className="border border-[#D4AF37] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                        <a href={cert} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={cert} 
                            alt={`شهادة ${index + 1}`} 
                            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                        <div className="p-3 bg-amber-50 text-center border-t border-[#D4AF37]">
                          <span className="font-bold text-gray-800 text-sm">شهادة {index + 1}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <a 
                      key={index} 
                      href={cert} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 border border-[#D4AF37] rounded-xl hover:bg-amber-50 transition-colors group bg-white"
                    >
                      <div className="bg-amber-100 p-3 rounded-lg group-hover:bg-[#D4AF37] transition-colors">
                        <Award className="w-6 h-6 text-[#D4AF37] group-hover:text-white" />
                      </div>
                      <span className="font-bold text-gray-700 group-hover:text-gray-900">عرض الشهادة {index + 1}</span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">لا توجد شهادات مضافة حالياً.</p>
            )}
          </section>

          {/* Parent Interaction Section */}
          <section className="bg-green-50 p-8 rounded-2xl border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-[#2A5C43]" />
              <h3 className="text-2xl font-bold text-[#2A5C43]">تواصل ولي الأمر</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">رد ولي الأمر على المستوى:</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full border border-green-200 rounded-xl p-4 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none h-24 bg-white text-lg"
                  placeholder="اكتب ردك هنا..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">استفسارات ولي الأمر:</label>
                <textarea
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  className="w-full border border-green-200 rounded-xl p-4 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none h-24 bg-white text-lg"
                  placeholder="اكتب استفساراتك للمعلمة هنا..."
                />
              </div>

              {student.teacherReply && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mt-4">
                  <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold">
                    <HelpCircle className="w-5 h-5" />
                    <h4>رد المعلمة على الاستفسارات:</h4>
                  </div>
                  <p className="text-blue-900 whitespace-pre-wrap text-lg">{student.teacherReply}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleReplySubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-[#2A5C43] text-white px-8 py-3 rounded-xl hover:bg-[#1E4330] transition-colors shadow-md disabled:opacity-70 text-lg font-medium"
                >
                  <Send className="w-5 h-5" />
                  <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال البيانات'}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
