import { useState, useEffect } from 'react';
import { Loader2, Plus, User, Book, TrendingUp } from 'lucide-react';
import api from '../../api/axios';

interface ChildAnalytics {
  student_id: string;
  name: string;
  total_learned: number;
  accuracy: number;
  recent_activity: number;
}

export default function ParentDashboard() {
  const [childrenData, setChildrenData] = useState<ChildAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');

  const fetchChildren = async () => {
    try {
      const res = await api.get('/api/analytics/parent/children');
      setChildrenData(res.data.data || res.data);
    } catch (err) {
      setError('Failed to load children analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) return;
    
    setLinking(true);
    setLinkError('');
    try {
      await api.post('/api/parent/link', { code: linkCode });
      setShowLinkModal(false);
      setLinkCode('');
      fetchChildren();
    } catch (err: any) {
      setLinkError(err.response?.data?.message || 'Failed to link child. Invalid code?');
    } finally {
      setLinking(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-green-500" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <button
          onClick={() => setShowLinkModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-1" /> Link Child
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {childrenData.map(child => (
          <div key={child.student_id} className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{child.name}</h3>
                <p className="text-sm text-gray-500">Student ID: {child.student_id.slice(-6)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-gray-600">
                  <Book className="w-5 h-5 mr-2 text-blue-500" />
                  Words Learned
                </div>
                <span className="font-bold text-gray-900">{child.total_learned || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-gray-600">
                  <TrendingUp className="w-5 h-5 mr-2 text-yellow-500" />
                  Accuracy
                </div>
                <span className="font-bold text-gray-900">{child.accuracy || 0}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-gray-600">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Recent Activity (items)
                </div>
                <span className="font-bold text-gray-900">{child.recent_activity || 0}</span>
              </div>
            </div>
          </div>
        ))}
        
        {childrenData.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-500">
            You haven't linked any children yet. Click "Link Child" and enter the code provided by your child's teacher.
          </div>
        )}
      </div>

      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Link Your Child</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the linking code provided by the teacher or your child to view their progress.</p>
            
            <form onSubmit={handleLinkChild} className="space-y-4">
              {linkError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                  {linkError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Link Code</label>
                <input
                  type="text"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm py-2 px-3 border uppercase"
                  placeholder="e.g. A1B2C3"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !linkCode.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {linking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Link Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
