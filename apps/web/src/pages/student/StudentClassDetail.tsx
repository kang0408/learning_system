import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, BookOpen, Clock, Target, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

export default function StudentClassDetail() {
  const { id } = useParams<{ id: string }>(); // class_id
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [classRes, assignRes] = await Promise.all([
          api.get(`/api/classes/my`), // we will filter from this
          api.get(`/api/assignments/my?class_id=${id}`)
        ]);
        
        const myClasses = classRes.data.data || classRes.data;
        const currentClassMembership = myClasses.find((c: any) => c.class_id === id);
        
        if (currentClassMembership) {
          setClassData(currentClassMembership.class || currentClassMembership);
        }
        
        setAssignments(assignRes.data.data || assignRes.data);
      } catch (err) {
        setError('Failed to load class details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchDetail();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error) return <div className="text-red-500 p-4 font-medium">{error}</div>;
  if (!classData) return <div className="text-gray-500 py-20 text-center font-medium">Lớp học không tồn tại.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      <div className="flex flex-col mb-12">
        <Link to="/student/classes" className="inline-flex items-center text-gray-500 hover:text-gray-900 font-bold mb-8 text-sm w-fit transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Trở về danh sách lớp
        </Link>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">{classData.name}</h1>
        <p className="text-xl text-gray-500 max-w-2xl">{classData.description}</p>
        
        <div className="mt-8 flex items-center text-gray-600">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
            {classData.teacher?.full_name?.charAt(0) || 'G'}
          </div>
          <div>
            <span className="font-bold text-gray-900 block">{classData.teacher?.full_name}</span>
            <span className="text-sm">Giáo viên phụ trách</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight border-b border-gray-100 pb-4">
          Bài tập ({assignments.length})
        </h2>
        
        {assignments.length > 0 ? (
          <div className="space-y-2 pt-2">
            {assignments.map(assignment => {
              const isOverdue = assignment.deadline ? new Date(assignment.deadline) < new Date() : false;
              const sessions = assignment.quiz_sessions || [];
              const completedSessions = sessions.filter((s: any) => s.status === 'completed');
              const bestScore = completedSessions.length > 0 ? Math.max(...completedSessions.map((s: any) => s.score)) : null;
              const attemptsCount = completedSessions.length;
              const maxAttempts = assignment.max_attempts || 0;
              const isLocked = maxAttempts > 0 && attemptsCount >= maxAttempts;
              
              return (
                <div 
                  key={assignment.id} 
                  className={`group flex items-start gap-4 sm:gap-6 p-4 sm:p-6 -mx-4 sm:-mx-6 rounded-2xl hover:bg-gray-50 transition-all ${isLocked ? 'opacity-70' : ''}`}
                >
                  <div className="mt-1 shrink-0">
                    {bestScore !== null ? (
                      <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-gray-300 group-hover:border-blue-400 transition-colors" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                      <h4 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {assignment.title}
                        {isOverdue && <span className="ml-3 text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full inline-block align-middle">Quá hạn</span>}
                      </h4>
                      <div className="shrink-0 text-sm font-bold text-gray-500">
                        {assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'Không hạn'}
                      </div>
                    </div>
                    
                    <p className="text-gray-500 mt-1 mb-4 line-clamp-2">{assignment.description || 'Không có mô tả chi tiết'}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm font-bold">
                      {isLocked ? (
                        <span className="text-gray-400">Đã nộp</span>
                      ) : (
                        <Link to={`/quiz?assignment=${assignment.id}`} className="text-blue-600 hover:text-blue-800 transition-colors">
                          {bestScore !== null ? 'Làm lại →' : 'Bắt đầu làm →'}
                        </Link>
                      )}
                      
                      {bestScore !== null && (
                        <Link to={`/session-result?id=${completedSessions[0].id}`} className="text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 px-3 py-1 rounded-lg">
                          Điểm cao nhất: {bestScore.toFixed(0)} (Xem kết quả)
                        </Link>
                      )}
                      
                      {maxAttempts > 0 && (
                        <span className="text-gray-400 ml-auto">{attemptsCount} / {maxAttempts} lượt</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <CheckCircle className="w-16 h-16 text-gray-300 mb-4 mx-auto opacity-50" />
            <p className="text-xl font-bold text-gray-500 mb-2">Chưa có bài tập nào!</p>
            <p>Giáo viên chưa giao bài tập nào cho lớp này.</p>
          </div>
        )}
      </div>
    </div>
  );
}
