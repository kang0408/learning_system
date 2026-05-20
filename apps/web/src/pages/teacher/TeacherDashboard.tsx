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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-1" /> Create Class
        </button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{cls.name}</h3>
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                Code: {cls.join_code}
              </span>
            </div>
            <p className="text-gray-500 text-sm flex-1 mb-4">{cls.description}</p>
            <div className="flex items-center text-gray-600 mb-6">
              <Users className="w-5 h-5 mr-2" />
              {cls._count?.members || 0} students
            </div>
            <Link
              to={`/teacher/classes/${cls.id}`}
              className="mt-auto w-full inline-flex justify-center items-center px-4 py-2 border border-purple-200 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              View Analytics <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-500">
            You don't have any classes yet. Click "Create Class" to get started.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newClassName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
