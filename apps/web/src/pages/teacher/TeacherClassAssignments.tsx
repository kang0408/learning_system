import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, FileText, Trash2, Edit, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherClassAssignments() {
  const { id } = useParams<{ id: string }>();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/assignments?class_id=${id}&page=${page}&limit=${limit}`);
      setAssignments(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAssignments();
  }, [id, page]);

  const handleDelete = async (assignmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài tập này?')) return;
    try {
      await api.delete(`/api/assignments/${assignmentId}`);
      fetchAssignments(); // refresh
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleTogglePublish = async (assignmentId: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        if (!confirm('Bạn có chắc muốn NGỪNG PHÁT HÀNH bài tập này? Học sinh sẽ không thể làm bài tập nữa.')) return;
        await api.post(`/api/assignments/${assignmentId}/unpublish`);
      } else {
        if (!confirm('Bạn có chắc muốn PHÁT HÀNH bài tập này? Học sinh sẽ nhận được bài tập ngay lập tức.')) return;
        await api.post(`/api/assignments/${assignmentId}/publish`);
      }
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center">
          <Link to={`/teacher/classes/${id}`} className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-green-500" />
            Danh sách Bài tập
          </h1>
        </div>
        <Link
          to={`/teacher/classes/${id}/assignments/new`}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> Giao bài tập mới
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading && assignments.length === 0 ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold text-gray-600">Tiêu đề</th>
                    <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                    <th className="p-4 font-semibold text-gray-600">Hạn chót</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {assignments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.is_all_students ? 'Giao cho cả lớp' : 'Giao cho nhóm riêng'}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                          {a.is_published ? 'Đã phát hành' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {a.deadline ? new Date(a.deadline).toLocaleString() : 'Không thời hạn'}
                      </td>
                      <td className="p-4 text-right space-x-2 flex items-center justify-end">
                        {/* Cập nhật trạng thái / chỉnh sửa */}
                        <button
                          onClick={() => handleTogglePublish(a.id, a.is_published)}
                          className={`p-2 rounded-lg inline-flex transition ${a.is_published ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                          title={a.is_published ? 'Ngừng phát hành' : 'Phát hành'}
                        >
                          {a.is_published ? <span className="font-semibold text-xs border border-orange-500 px-2 py-1 rounded">Hủy phát hành</span> : <span className="font-semibold text-xs bg-green-600 text-white px-2 py-1 rounded">Phát hành</span>}
                        </button>

                        <Link
                          to={`/teacher/classes/${id}/assignments/${a.id}/edit`}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg inline-flex transition"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-lg inline-flex transition"
                          title="Xóa bài tập"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chưa có bài tập nào.</td></tr>
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
