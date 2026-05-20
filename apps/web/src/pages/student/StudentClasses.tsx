import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Users, Search, Plus, BookOpen } from 'lucide-react';
import api from '../../api/axios';

interface ClassItem {
  id: string;
  class_id: string;
  name?: string;
  description?: string;
  teacher_name?: string;
  class?: any;
}

export default function StudentClasses() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes/my');
      setClasses(res.data.data || res.data);
    } catch (err) {
      setError('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/api/classes/join', { join_code: joinCode });
      setSuccessMsg('Đã tham gia lớp thành công!');
      setJoinCode('');
      setShowJoinModal(false); // Đóng modal
      fetchClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join class. Invalid code?');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="mr-3 text-indigo-600" /> Lớp học của tôi
        </h1>
        <button
          onClick={() => setShowJoinModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" /> Nhập mã lớp
        </button>
      </div>

      {/* Success Toast / Error at the top level */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center shadow-sm">
          {successMsg}
        </div>
      )}

      {/* Class List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center">
          <Users className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-700">Enrolled Classes</h3>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : classes.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {classes.map((cls) => (
              <Link key={cls.id} to={`/student/classes/${cls.class_id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-indigo-600">{cls.class?.name || cls.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{cls.class?.description || cls.description}</p>
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    Giáo viên: <span className="font-medium text-gray-900">{cls.class?.teacher?.full_name || cls.teacher_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900 mb-1">Chưa tham gia lớp nào</p>
            <p>Nhấn "Nhập mã lớp" ở góc trên để tham gia một lớp học do giáo viên cung cấp.</p>
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nhập mã lớp</h3>
            <p className="text-sm text-gray-500 mb-6">Mã lớp gồm 6 ký tự do giáo viên cung cấp. Ví dụ: ENG8A2.</p>

            <form onSubmit={handleJoinClass} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã 6 ký tự"
                  maxLength={6}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3 px-4 border uppercase text-center tracking-[0.2em] font-bold text-lg"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600 text-center">{error}</p>}

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setError('');
                    setJoinCode('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={joining || joinCode.trim().length === 0}
                  className="inline-flex justify-center items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 min-w-[120px]"
                >
                  {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tham gia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
