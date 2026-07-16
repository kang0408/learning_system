import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/axios';

export default function StudentClassDetail() {
  const { id } = useParams<{ id: string }>(); 
  const [classData, setClassData] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [classRes, assignRes] = await Promise.all([
          api.get(`/api/classes/my`),
          api.get(`/api/assignments/my?class_id=${id}&status=all`)
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

  if (loading) return <div className="text-4xl font-black uppercase tracking-tighter animate-pulse pt-20 text-indigo-600">Loading...</div>;
  if (error) return <div className="text-red-600 font-bold border-2 border-red-600 p-6">{error}</div>;
  if (!classData) return <div className="text-3xl font-black uppercase tracking-tighter text-zinc-400 pt-20">Class not found.</div>;

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      
      {/* Editorial Header */}
      <div className="border-b-4 border-indigo-600 pb-12">
        <Link to="/student/classes" className="inline-flex items-center text-indigo-600 font-bold uppercase tracking-widest text-sm mb-12 hover:bg-indigo-600 hover:text-white px-3 py-1 border-2 border-transparent hover:border-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Classes
        </Link>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8 text-zinc-900">{classData.name}</h1>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12 pt-8 border-t-2 border-zinc-200">
          <p className="text-xl md:text-2xl font-medium max-w-2xl leading-relaxed text-zinc-700">{classData.description}</p>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-1">Instructor</p>
            <p className="text-3xl font-black tracking-tighter uppercase">{classData.teacher?.full_name}</p>
          </div>
        </div>
      </div>

      {/* Assignments List - Stark Boxes */}
      <div className="space-y-8">
        <h2 className="text-4xl font-black tracking-tighter uppercase mb-8">Assignments ({assignments.length})</h2>
        
        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
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
                  className={`border-2 border-zinc-900 p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-8 transition-all ${isLocked ? 'bg-zinc-100 opacity-60' : 'hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#4f46e5] hover:border-indigo-600 bg-white group'}`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h4 className="text-3xl font-black tracking-tighter uppercase group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                      {isOverdue && <span className="bg-red-600 text-white font-bold uppercase tracking-widest text-xs px-2 py-1">Overdue</span>}
                    </div>
                    <p className="text-lg font-medium text-zinc-600 mb-6">{assignment.description || 'No description provided.'}</p>
                    <div className="font-mono font-bold text-sm bg-indigo-50 text-indigo-900 inline-block px-3 py-1 border border-indigo-200">
                      {assignment.deadline ? `DUE: ${new Date(assignment.deadline).toLocaleDateString()}` : 'NO DEADLINE'}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end mr-4">
                       {bestScore !== null && (
                         <div className="text-right">
                           <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Best Score</p>
                           <Link to={`/session-result?id=${completedSessions[0].id}`} className="text-4xl font-black hover:underline text-indigo-600">{bestScore.toFixed(0)}</Link>
                         </div>
                       )}
                       {maxAttempts > 0 && (
                         <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Attempts: {attemptsCount}/{maxAttempts}</p>
                       )}
                    </div>

                    {isLocked ? (
                      <span className="font-bold border-2 border-zinc-900 px-6 py-4 uppercase tracking-widest text-center">Completed</span>
                    ) : (
                      <Link 
                        to={`/quiz?assignment=${assignment.id}`} 
                        className="font-bold bg-indigo-600 text-white border-2 border-indigo-600 px-8 py-4 text-center hover:bg-zinc-900 hover:border-zinc-900 transition-colors uppercase tracking-widest"
                      >
                        {bestScore !== null ? 'Retry' : 'Begin'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 border-2 border-dashed border-zinc-400 text-center">
            <p className="text-3xl font-black uppercase tracking-tighter text-zinc-400">No assignments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
