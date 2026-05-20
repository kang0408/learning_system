import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Users, UserMinus, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherClassMembers() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/classes/${id}/members?page=${page}&limit=${limit}`);
      setMembers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      setError('Failed to load class members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchMembers();
  }, [id, page]);

  const handleRemove = async (studentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;
    try {
      await api.delete(`/api/classes/${id}/members/${studentId}`);
      fetchMembers(); // refresh
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center bg-white p-6 rounded-xl shadow-sm border">
        <Link to={`/teacher/classes/${id}`} className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="w-6 h-6 mr-3 text-blue-500" />
          Danh sách Học sinh
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading && members.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold text-gray-600">Học sinh</th>
                    <th className="p-4 font-semibold text-gray-600">Email</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map((m: any) => (
                    <tr key={m.student?.id} className="hover:bg-gray-50">
                      <td className="p-4 flex items-center">
                        <Link 
                          to={`/teacher/classes/${id}/members/${m.student?.id}`}
                          className="flex items-center hover:text-purple-600 transition"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4">
                            {m.student?.full_name?.charAt(0) || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{m.student?.full_name}</span>
                        </Link>
                      </td>
                      <td className="p-4 text-gray-500">{m.student?.email}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleRemove(m.student?.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg flex items-center inline-flex transition"
                          title="Xóa khỏi lớp"
                        >
                          <UserMinus className="w-4 h-4 mr-1" /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-500">Chưa có học sinh nào trong lớp.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <span className="text-sm text-gray-500">
                  Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, total)} trong {total}
                </span>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border rounded hover:bg-white disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border rounded hover:bg-white disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
