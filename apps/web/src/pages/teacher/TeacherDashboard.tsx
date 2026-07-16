import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Loader2, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

interface ClassItem {
  id: string;
  name: string;
  description: string;
  join_code: string;
  _count?: { members: number };
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data.data || res.data);
    } catch (err) {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setCreating(true);
    try {
      await api.post('/api/classes', {
        name: newClassName,
        subject: newClassSubject,
        description: newClassDesc
      });
      setShowModal(false);
      setNewClassName('');
      setNewClassSubject('English');
      setNewClassDesc('');
      fetchClasses();
    } catch (err) {
      alert('Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-700" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header card with rich colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 tracking-tight">Quản lý Lớp học</h1>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-semibold rounded-full border border-slate-200">
              Tổng số: {classes.length}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Theo dõi, tạo mới và quản lý tất cả các lớp học của bạn.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-4 md:mt-0 flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900"
        >
          <Plus className="w-5 h-5 mr-2" /> Tạo lớp học
        </button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition duration-300 hover:border-slate-300 group">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-slate-900 transition-colors">{cls.name}</h3>
              <span className="bg-slate-100/50 text-slate-900 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200/50 select-all cursor-pointer">
                Mã: {cls.join_code}
              </span>
            </div>
            <p className="text-gray-500 text-sm flex-1 mb-5">{cls.description || 'Không có mô tả'}</p>
            <div className="flex items-center text-gray-600 mb-6 bg-gray-50 px-3 py-2 rounded-xl w-fit font-medium">
              <Users className="w-4 h-4 mr-2 text-slate-700" />
              {cls._count?.members || 0} học sinh
            </div>
            <Link
              to={`/teacher/classes/${cls.id}`}
              className="mt-auto w-full inline-flex justify-center items-center px-4 py-2.5 font-bold rounded-xl text-slate-900 bg-slate-100 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300"
            >
              Xem chi tiết <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có lớp học nào</h3>
            <p className="text-gray-500 mb-6">Hãy tạo lớp học đầu tiên của bạn để bắt đầu giảng dạy.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900"
            >
              <Plus className="w-5 h-5 mr-2" /> Tạo lớp học ngay
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 border border-gray-100">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Tạo Lớp học mới</h2>
            <p className="text-sm text-gray-500 mb-6">Điền thông tin cơ bản để khởi tạo lớp học của bạn.</p>
            <form onSubmit={handleCreateClass} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên lớp học *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  placeholder="Ví dụ: Tiếng Anh giao tiếp K1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Môn học *</label>
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  placeholder="Ví dụ: Tiếng Anh"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  placeholder="Mô tả ngắn gọn về lớp học này (không bắt buộc)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating || !newClassName.trim()}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
                >
                  {creating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Khởi tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
