import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, User, ChevronLeft } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  parentEmail: string;
}

export default function StudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const studentsData: Student[] = [];
      snapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, name: doc.data().name, parentEmail: doc.data().parentEmail });
      });
      // Sort alphabetically
      studentsData.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      setStudents(studentsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2A5C43] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-[#2A5C43] mb-2">قائمة الطالبات</h2>
        <p className="text-gray-600">اضغط على اسم الطالبة للاطلاع على سجلها الأكاديمي</p>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-[#E8DCC4] overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="relative w-full max-w-md mx-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث عن اسم الطالبة..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A5C43] focus:border-transparent outline-none text-lg shadow-sm"
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              لا توجد طالبات مطابقة للبحث
            </div>
          ) : (
            filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => navigate(`/student/${student.id}`)}
                className="w-full p-6 hover:bg-amber-50 transition-colors flex items-center justify-between group text-right"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-[#E8DCC4] p-3 rounded-full text-[#2A5C43] group-hover:bg-[#2A5C43] group-hover:text-[#E8DCC4] transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{student.name}</h4>
                </div>
                <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-[#2A5C43] transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
