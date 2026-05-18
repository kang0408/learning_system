import { useState, useEffect } from 'react';
import { Loader2, Users, Search, Plus, BookOpen } from 'lucide-react';
import api from '../api/axios';

interface ClassItem {
  id: string;
  name: string;
  description: string;
  teacher_name: string;
}

export default function StudentClasses() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchClasses = async () => {
    try {
      const res = await api.get('/api/classes');
      setClasses(res.data);
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
      await api.post('/api/classes/join', { code: joinCode });
      setSuccessMsg('Successfully joined class!');
      setJoinCode('');
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
          <BookOpen className="mr-3 text-blue-600" /> My Classes
        </h1>
      </div>

      {/* Join Class Form */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Join a new class</h3>
        <form onSubmit={handleJoinClass} className="flex gap-3 max-w-md">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter class code (e.g. ABCDEF)"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 border uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={joining || !joinCode.trim()}
            className="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 min-w-[100px]"
          >
            {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5 mr-1"/> Join</>}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {successMsg && <p className="mt-2 text-sm text-green-600">{successMsg}</p>}
      </div>

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
              <li key={cls.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-medium text-blue-600">{cls.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{cls.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Teacher: <span className="font-medium text-gray-900">{cls.teacher_name}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500">
            You haven't joined any classes yet. Use a code from your teacher to join.
          </div>
        )}
      </div>
    </div>
  );
}
