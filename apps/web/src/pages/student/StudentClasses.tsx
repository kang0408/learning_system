import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Users, Search, Plus, BookOpen, CheckCircle } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-12 py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Lớp học của tôi
        </h1>
        <button
          onClick={() => setShowJoinModal(true)}
          className="inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Plus className="w-5 h-5 mr-1" /> Tham gia lớp
        </button>
      </div>

      {/* Success Toast / Error at the top level */}
      {successMsg && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl font-medium flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {successMsg}
        </div>
      )}

      {/* Class List */}
      <div>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : classes.length > 0 ? (
          <div className="space-y-2">
            {classes.map((cls) => (
              <Link key={cls.id} to={`/student/classes/${cls.class_id}`} className="block group p-4 sm:p-6 -mx-4 sm:-mx-6 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{cls.class?.name || cls.name}</h4>
                    <p className="text-gray-500 mt-1 line-clamp-1">{cls.class?.description || cls.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center text-sm font-medium text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mr-2">
                      {(cls.class?.teacher?.full_name || cls.teacher_name || 'G').charAt(0)}
                    </div>
                    <span>{cls.class?.teacher?.full_name || cls.teacher_name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold text-gray-500 mb-2">Chưa tham gia lớp nào</p>
            <p>Nhấn "Tham gia lớp" ở góc trên để bắt đầu.</p>
          </div>
        )}
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Tham gia lớp học</h3>
            <p className="text-gray-500 mb-8">Nhập mã 6 ký tự do giáo viên cung cấp. Ví dụ: ENG8A2.</p>

            <form onSubmit={handleJoinClass} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="MÃ LỚP"
                  maxLength={6}
                  className="w-full bg-gray-50 border-0 rounded-2xl py-4 px-6 text-center tracking-[0.3em] font-black text-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none uppercase"
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setError('');
                    setJoinCode('');
                  }}
                  className="flex-1 py-3 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={joining || joinCode.trim().length === 0}
                  className="flex-1 flex justify-center items-center py-3 text-white bg-blue-600 font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
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
