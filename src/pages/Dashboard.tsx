import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { Plus, Trash2, Edit, Search, User, FileText, Award, MessageSquare, Upload, X, AlertCircle, CheckCircle2, Key, Star } from 'lucide-react';
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
  createdAt: string;
}

interface HonorRollEntry {
  id: string;
  name: string;
  section: string;
  year: string;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [honorRoll, setHonorRoll] = useState<HonorRollEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'honorRoll'>('students');
  const [loading, setLoading] = useState(true);
  const [loadingHonor, setLoadingHonor] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  const [isAddingHonor, setIsAddingHonor] = useState(false);
  const [editingHonor, setEditingHonor] = useState<HonorRollEntry | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  
  // Custom modals and notifications
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [honorToDelete, setHonorToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    passcode: '',
    parentEmail: '',
    results: '',
    notes: '',
    parentReply: '',
    parentInquiry: '',
    teacherReply: '',
    certificates: [] as string[],
    badges: [] as string[],
  });

  const [honorFormData, setHonorFormData] = useState({
    name: '',
    section: '',
    year: '',
  });

  useEffect(() => {
    // Check if admin
    if (localStorage.getItem('role') !== 'admin') {
      navigate('/');
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() } as Student);
      });
      // Sort alphabetically by name
      studentsData.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });

    const unsubscribeHonor = onSnapshot(collection(db, 'honorRoll'), (snapshot) => {
      const honorData: HonorRollEntry[] = [];
      snapshot.forEach((doc) => {
        honorData.push({ id: doc.id, ...doc.data() } as HonorRollEntry);
      });
      setHonorRoll(honorData);
      setLoadingHonor(false);
    }, (error) => {
      console.error("Error fetching honor roll:", error);
      setLoadingHonor(false);
    });

    return () => {
      unsubscribe();
      unsubscribeHonor();
    };
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    try {
      const newCerts = [...formData.certificates];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await compressImage(file);
          newCerts.push(base64);
        }
      }
      setFormData({ ...formData, certificates: newCerts });
    } catch (error) {
      console.error("Error uploading image:", error);
      showNotification("حدث خطأ أثناء معالجة الصورة", "error");
    }
    setIsUploading(false);
    // Reset file input
    e.target.value = '';
  };

  const removeCertificate = (index: number) => {
    const newCerts = [...formData.certificates];
    newCerts.splice(index, 1);
    setFormData({ ...formData, certificates: newCerts });
  };

  const generateRandomPasscode = () => {
    const newPasscode = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData({ ...formData, passcode: newPasscode });
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateDoc(doc(db, 'students', editingStudent.id), {
          name: formData.name,
          passcode: formData.passcode,
          parentEmail: formData.parentEmail,
          results: formData.results,
          notes: formData.notes,
          parentReply: formData.parentReply,
          parentInquiry: formData.parentInquiry,
          teacherReply: formData.teacherReply,
          certificates: formData.certificates,
          badges: formData.badges,
        });
        setEditingStudent(null);
        showNotification("تم تحديث بيانات الطالبة بنجاح", "success");
      } else {
        await addDoc(collection(db, 'students'), {
          name: formData.name,
          passcode: formData.passcode,
          parentEmail: formData.parentEmail,
          results: formData.results,
          notes: formData.notes,
          parentReply: formData.parentReply,
          parentInquiry: formData.parentInquiry,
          teacherReply: formData.teacherReply,
          certificates: formData.certificates,
          badges: formData.badges,
          createdAt: new Date().toISOString()
        });
        setIsAdding(false);
        showNotification("تم إضافة الطالبة بنجاح", "success");
      }
      
      setFormData({ name: '', passcode: '', parentEmail: '', results: '', notes: '', parentReply: '', parentInquiry: '', teacherReply: '', certificates: [], badges: [] });
    } catch (error) {
      console.error("Error saving student:", error);
      showNotification("حدث خطأ أثناء حفظ بيانات الطالبة", "error");
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteDoc(doc(db, 'students', studentToDelete));
      showNotification("تم حذف الطالبة بنجاح", "success");
    } catch (error) {
      console.error("Error deleting student:", error);
      showNotification("حدث خطأ أثناء الحذف", "error");
    }
    setStudentToDelete(null);
  };

  const handleAddOrUpdateHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHonor) {
        await updateDoc(doc(db, 'honorRoll', editingHonor.id), {
          name: honorFormData.name,
          section: honorFormData.section,
          year: honorFormData.year,
        });
        setEditingHonor(null);
        showNotification("تم تحديث بيانات طالبة لوحة الشرف بنجاح", "success");
      } else {
        if (honorRoll.length >= 4) {
          showNotification("عذراً، لوحة الشرف تتسع لـ 4 طالبات فقط", "error");
          return;
        }
        await addDoc(collection(db, 'honorRoll'), {
          name: honorFormData.name,
          section: honorFormData.section,
          year: honorFormData.year,
        });
        setIsAddingHonor(false);
        showNotification("تم الإضافة للوحة الشرف بنجاح", "success");
      }
      
      setHonorFormData({ name: '', section: '', year: '' });
    } catch (error) {
      console.error("Error saving honor roll entry:", error);
      showNotification("حدث خطأ أثناء الحفظ", "error");
    }
  };

  const confirmDeleteHonor = async () => {
    if (!honorToDelete) return;
    try {
      await deleteDoc(doc(db, 'honorRoll', honorToDelete));
      showNotification("تم الحذف من لوحة الشرف بنجاح", "success");
    } catch (error) {
      console.error("Error deleting honor roll entry:", error);
      showNotification("حدث خطأ أثناء الحذف", "error");
    }
    setHonorToDelete(null);
  };

  const startEditHonor = (entry: HonorRollEntry) => {
    setEditingHonor(entry);
    setHonorFormData({
      name: entry.name,
      section: entry.section,
      year: entry.year
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      passcode: student.passcode || '',
      parentEmail: student.parentEmail || '',
      results: student.results || '',
      notes: student.notes || '',
      parentReply: student.parentReply || '',
      parentInquiry: student.parentInquiry || '',
      teacherReply: student.teacherReply || '',
      certificates: student.certificates || [],
      badges: student.badges || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || (s.parentEmail && s.parentEmail.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A5C43] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 z-50 text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-2xl font-bold">تأكيد الحذف</h3>
            </div>
            <p className="text-gray-600 mb-8 text-lg">هل أنت متأكدة من حذف بيانات هذه الطالبة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#2A5C43] mb-4">لوحة تحكم المعلمة</h2>
          <div className="flex bg-[#E8DCC4] p-1 rounded-lg w-fit">
            <button 
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'students' ? 'bg-[#2A5C43] text-white shadow-sm' : 'text-[#2A5C43] hover:bg-white/50'}`}
            >
              بيانات الطالبات
            </button>
            <button 
              onClick={() => setActiveTab('honorRoll')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'honorRoll' ? 'bg-[#2A5C43] text-white shadow-sm' : 'text-[#2A5C43] hover:bg-white/50'}`}
            >
              لوحة الشرف {honorRoll.length > 0 && `(${honorRoll.length}/4)`}
            </button>
          </div>
        </div>

        {activeTab === 'students' ? (
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingStudent(null);
              setFormData({ name: '', passcode: '', parentEmail: '', results: '', notes: '', parentReply: '', parentInquiry: '', teacherReply: '', certificates: [], badges: [] });
            }}
            className="bg-[#D4AF37] text-white px-6 py-2 rounded-lg hover:bg-[#B8962E] transition-colors flex items-center gap-2 font-medium shadow-md"
          >
            {isAdding ? 'إلغاء' : <><Plus className="w-5 h-5" /> إضافة طالبة جديدة</>}
          </button>
        ) : (
          <button
            onClick={() => {
              setIsAddingHonor(!isAddingHonor);
              setEditingHonor(null);
              setHonorFormData({ name: '', section: '', year: '' });
            }}
            disabled={honorRoll.length >= 4 && !isAddingHonor && !editingHonor}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium shadow-md ${
              honorRoll.length >= 4 && !isAddingHonor && !editingHonor
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#D4AF37] text-white hover:bg-[#B8962E]'
            }`}
          >
            {isAddingHonor ? 'إلغاء' : <><Plus className="w-5 h-5" /> إضافة للوحة الشرف</>}
          </button>
        )}
      </div>

      {activeTab === 'students' && (
        <>
          {(isAdding || editingStudent) && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-[#E8DCC4]">
          <h3 className="text-xl font-bold text-[#2A5C43] mb-6 border-b border-gray-100 pb-4">
            {editingStudent ? 'تعديل بيانات الطالبة' : 'إضافة طالبة جديدة'}
          </h3>
          <form onSubmit={handleAddOrUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الطالبة</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
                  placeholder="الاسم الرباعي"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الرقم السري للطالبة</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.passcode}
                    onChange={e => setFormData({...formData, passcode: e.target.value})}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
                    placeholder="مثال: 1234"
                  />
                  <button
                    type="button"
                    onClick={generateRandomPasscode}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                    title="توليد رقم عشوائي"
                  >
                    <Key className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني لولي الأمر (اختياري)</label>
                <input
                  type="email"
                  value={formData.parentEmail}
                  onChange={e => setFormData({...formData, parentEmail: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أوسمة الطالبة</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BADGES_INFO.map(badge => (
                  <label key={badge.id} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.badges.includes(badge.id) ? badge.bgClass + ' ' + badge.borderClass : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={formData.badges.includes(badge.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, badges: [...formData.badges, badge.id]});
                        } else {
                          setFormData({...formData, badges: formData.badges.filter(id => id !== badge.id)});
                        }
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className={`w-4 h-4 ${badge.colorClass} ${badge.fillClass}`} />
                        <span className="font-bold text-sm text-gray-800">{badge.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 opacity-80">{badge.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نتيجة الطالبة</label>
              <textarea
                value={formData.results}
                onChange={e => setFormData({...formData, results: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none h-24"
                placeholder="تفاصيل الدرجات والمستوى الأكاديمي..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات وتوصيات</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none h-24"
                placeholder="توصيات لتحسين المستوى..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رد ولي الأمر (للقراءة فقط)</label>
                <textarea
                  value={formData.parentReply}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-600 outline-none h-24"
                  placeholder="لا يوجد رد من ولي الأمر..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">استفسارات ولي الأمر (للقراءة فقط)</label>
                <textarea
                  value={formData.parentInquiry}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-600 outline-none h-24"
                  placeholder="لا توجد استفسارات..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رد المعلمة على الاستفسارات</label>
              <textarea
                value={formData.teacherReply}
                onChange={e => setFormData({...formData, teacherReply: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none h-24 bg-blue-50"
                placeholder="اكتبي ردك على استفسارات ولي الأمر هنا..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">شهادات الشكر (صور)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                  <Upload className="w-8 h-8 text-[#2A5C43]" />
                  <span className="font-medium">
                    {isUploading ? 'جاري معالجة الصور...' : 'اضغطي هنا لاختيار صور الشهادات أو اسحبي الصور'}
                  </span>
                  <span className="text-xs text-gray-400">يمكنك اختيار أكثر من صورة</span>
                </div>
              </div>
              
              {formData.certificates.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.certificates.map((cert, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <img 
                        src={cert} 
                        alt={`شهادة ${index + 1}`} 
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors z-10"
                        title="حذف الشهادة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingStudent(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2 bg-[#2A5C43] text-white rounded-lg hover:bg-[#1E4330] transition-colors shadow-md disabled:opacity-70"
              >
                حفظ البيانات
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-[#E8DCC4] overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-bold text-gray-800">قائمة الطالبات</h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث باسم الطالبة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد طالبات مطابقة للبحث
            </div>
          ) : (
            filteredStudents.map(student => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#E8DCC4] p-2 rounded-full text-[#2A5C43]">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{student.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>الرقم السري: {student.passcode || 'غير محدد'}</span>
                          {student.parentEmail && <span>• {student.parentEmail}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-[#2A5C43] font-medium mb-1">
                          <FileText className="w-4 h-4" /> النتيجة
                        </div>
                        <p className="text-gray-600 line-clamp-2">{student.results || 'لا يوجد'}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-[#2A5C43] font-medium mb-1">
                          <MessageSquare className="w-4 h-4" /> رد ولي الأمر
                        </div>
                        <p className="text-gray-600 line-clamp-2">{student.parentReply || 'لا يوجد رد'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex md:flex-col gap-2 justify-end">
                    <button
                      onClick={() => startEdit(student)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" /> <span className="hidden sm:inline">تعديل</span>
                    </button>
                    <button
                      onClick={() => setStudentToDelete(student.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
          </>
        )}

      {activeTab === 'honorRoll' && (
        <div className="space-y-8">
          {(isAddingHonor || editingHonor) && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-[#E8DCC4]">
              <h3 className="text-xl font-bold text-[#2A5C43] mb-6 border-b border-gray-100 pb-4">
                {editingHonor ? 'تعديل بيانات طالبة الشرف' : 'إضافة للوحة الشرف'}
              </h3>
              
              <form onSubmit={handleAddOrUpdateHonor} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم الطالبة *</label>
                    <input
                      type="text"
                      value={honorFormData.name}
                      onChange={e => setHonorFormData({...honorFormData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الشعبة *</label>
                    <input
                      type="text"
                      value={honorFormData.section}
                      onChange={e => setHonorFormData({...honorFormData, section: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
                      required
                      placeholder="امثلة: شعبة ١ أو ١٠١"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">السنة *</label>
                    <input
                      type="text"
                      value={honorFormData.year}
                      onChange={e => setHonorFormData({...honorFormData, year: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none"
                      required
                      placeholder="امثلة: ١٤٤٥ أو أول ثانوي"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingHonor(false);
                      setEditingHonor(null);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#2A5C43] text-white rounded-lg hover:bg-[#1E4330] transition-colors shadow-md"
                  >
                    حفظ البيانات
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {honorRoll.map(entry => (
              <div key={entry.id} className="bg-white rounded-xl shadow-md border border-[#D4AF37] p-6 relative group transform hover:scale-105 transition-transform overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37] opacity-10 rounded-bl-full"></div>
                <div className="flex justify-between items-start mb-4">
                  <Award className="w-10 h-10 text-[#D4AF37]" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditHonor(entry)}
                      className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4 z-10 relative" />
                    </button>
                    <button
                      onClick={() => setHonorToDelete(entry.id)}
                      className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors z-10 relative"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-[#2A5C43] mb-2">{entry.name}</h4>
                <div className="text-gray-600 space-y-1 text-sm">
                  <p>الشعبة: {entry.section}</p>
                  <p>السنة: {entry.year}</p>
                </div>
              </div>
            ))}
            {honorRoll.length === 0 && !isAddingHonor && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                لا توجد طالبات في لوحة الشرف
              </div>
            )}
          </div>

          {honorToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                  <AlertCircle className="w-8 h-8" />
                  <h3 className="text-2xl font-bold">تأكيد الحذف</h3>
                </div>
                <p className="text-gray-600 mb-8 text-lg">هل أنت متأكدة من إزالة الطالبة من لوحة الشرف؟</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setHonorToDelete(null)}
                    className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmDeleteHonor}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md"
                  >
                    نعم، أزل
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
