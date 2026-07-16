import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
      setSuccessMsg('Successfully joined the class.');
      setJoinCode('');
      setShowJoinModal(false);
      fetchClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join class. Invalid code?');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-zinc-900 pb-8">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
          My<br/><span className="text-indigo-600">Classes.</span>
        </h1>
        <button
          onClick={() => setShowJoinModal(true)}
          className="bg-indigo-600 text-white font-bold uppercase tracking-widest px-8 py-4 hover:bg-indigo-700 transition-colors border-2 border-indigo-600 whitespace-nowrap shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:translate-y-1 hover:shadow-none"
        >
          + Join Class
        </button>
      </div>

      {successMsg && (
        <div className="bg-indigo-50 border-2 border-indigo-600 text-indigo-900 p-6 font-bold uppercase tracking-widest text-sm">
          {successMsg}
        </div>
      )}

      <div>
        {loading ? (
          <div className="font-black text-4xl uppercase tracking-tighter animate-pulse text-indigo-600">Loading...</div>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Link key={cls.id} to={`/student/classes/${cls.class_id}`} className="group block border-2 border-zinc-900 p-8 hover:-translate-y-2 hover:shadow-[8px_8px_0_0_#4f46e5] hover:border-indigo-600 transition-all bg-[#FDFBF7]">
                <div className="flex flex-col h-full justify-between gap-12">
                  <div>
                    <h4 className="text-3xl font-black tracking-tighter uppercase group-hover:text-indigo-600 transition-colors mb-4">{cls.class?.name || cls.name}</h4>
                    <p className="text-zinc-600 font-medium text-lg leading-relaxed line-clamp-3">{cls.class?.description || cls.description}</p>
                  </div>
                  <div className="pt-6 border-t-2 border-zinc-200 group-hover:border-indigo-600 transition-colors flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 group-hover:text-indigo-400">Instructor</p>
                      <p className="font-black text-xl uppercase tracking-tight">{cls.class?.teacher?.full_name || cls.teacher_name}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-zinc-400">
            <p className="text-3xl font-black uppercase tracking-tighter text-zinc-400">No Classes Yet</p>
          </div>
        )}
      </div>

      {/* Join Class Modal - Brutalist */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border-4 border-indigo-600 bg-[#FDFBF7] shadow-[16px_16px_0_0_#4f46e5] max-w-xl w-full p-8 md:p-12 animate-in zoom-in-95 duration-200">
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-indigo-600">Join<br/>Class</h3>
            <p className="text-lg font-medium text-zinc-600 mb-8">Enter the 6-character code provided by your instructor.</p>

            <form onSubmit={handleJoinClass} className="space-y-8">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={6}
                className="w-full bg-transparent border-b-4 border-zinc-900 focus:border-indigo-600 py-4 text-center tracking-[0.5em] font-black text-5xl md:text-6xl outline-none uppercase placeholder:text-zinc-300 transition-colors"
                autoFocus
              />

              {error && <p className="text-lg font-bold text-red-600 uppercase tracking-widest text-center">{error}</p>}

              <div className="flex flex-col-reverse md:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setError('');
                    setJoinCode('');
                  }}
                  className="flex-1 py-4 text-zinc-900 font-bold uppercase tracking-widest border-2 border-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || joinCode.trim().length === 0}
                  className="flex-1 py-4 text-white bg-indigo-600 font-bold uppercase tracking-widest border-2 border-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {joining ? 'Connecting...' : 'Join Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
