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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!classData) return <div className="text-gray-500 p-4">Lớp học không tồn tại.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center bg-white p-6 rounded-xl shadow-sm border">
        <Link to="/student/classes" className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{classData.description}</p>
          <div className="mt-2 inline-flex items-center text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">
            Giáo viên: {classData.teacher?.full_name}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-indigo-500" /> Bài tập của lớp ({assignments.length})
        </h2>
        
        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  className={`flex flex-col bg-white rounded-xl shadow-sm border p-5 transition-all group ${isLocked ? 'opacity-80' : 'hover:border-indigo-400 hover:shadow-md'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 line-clamp-2">{assignment.title}</h4>
                    {isOverdue && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" />}
                  </div>
                  
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">{assignment.description || 'Không có mô tả'}</p>
                  
                  <div className="flex items-center justify-between text-sm font-medium mt-auto pt-4 border-t border-gray-100">
                    <div className="flex flex-col gap-1">
                      {bestScore !== null ? (
                        <Link to={`/session-result?id=${completedSessions[0].id}`} className="flex items-center hover:underline group-hover:text-green-700">
                          <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                          <span className="text-green-600 font-bold">Đã làm: {bestScore.toFixed(0)} điểm (Xem)</span>
                        </Link>
                      ) : (
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span className="text-gray-600">Chưa làm</span>
                        </div>
                      )}
                      {maxAttempts > 0 && (
                        <span className="text-xs text-gray-500">{attemptsCount} / {maxAttempts} lượt</span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span className={isOverdue ? 'text-red-600' : 'text-gray-600'}>
                        {assignment.deadline 
                          ? new Date(assignment.deadline).toLocaleDateString()
                          : 'Không hạn'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {isLocked ? (
                      <button disabled className="w-full py-2 bg-gray-100 text-gray-500 font-bold rounded-lg cursor-not-allowed">
                        Hết lượt làm bài
                      </button>
                    ) : (
                      <Link 
                        to={`/quiz?assignment=${assignment.id}`}
                        className="w-full text-center py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors"
                      >
                        {bestScore !== null ? 'Làm lại' : 'Bắt đầu làm'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
            <CheckCircle className="w-12 h-12 text-emerald-400 mb-3 mx-auto" />
            <p className="text-lg font-medium text-gray-700 mb-1">Chưa có bài tập nào!</p>
            <p>Giáo viên chưa giao bài tập nào cho lớp này.</p>
          </div>
        )}
      </div>
    </div>
  );
}
