import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Save } from 'lucide-react';
import api from '../api/axios';

interface Question {
  id: string;
  question_type: string;
  content: string;
  answer_options?: any[];
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType] = useState('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectOption, setNewCorrectOption] = useState(0);
  const [newFillInAnswer, setNewFillInAnswer] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await api.get('/api/questions');
      setQuestions(res.data.data || res.data);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const payload: any = { question_type: newType, content: newContent, topic: 'General', difficulty: 3 };
    if (newType === 'multiple_choice') {
      payload.answer_options = newOptions.map((opt, index) => ({
        content: opt,
        is_correct: index === newCorrectOption,
        order_index: index
      }));
    } else {
      payload.answer_options = [{
        content: newFillInAnswer,
        is_correct: true,
        order_index: 0
      }];
    }

    setCreating(true);
    try {
      await api.post('/api/questions', payload);
      setShowModal(false);
      setNewContent('');
      setNewOptions(['', '', '', '']);
      setNewFillInAnswer('');
      fetchQuestions();
    } catch (err) {
      alert('Failed to create question');
    } finally {
      setCreating(false);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm"
        >
          <Plus className="w-5 h-5 mr-1" /> Add Question
        </button>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        
        {questions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {questions.map(q => (
              <li key={q.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
                      q.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {q.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Fill In Blank'}
                    </span>
                    <p className="font-medium text-gray-900">{q.content}</p>
                    {q.question_type === 'multiple_choice' && q.answer_options && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {q.answer_options.map((opt: any, i: number) => (
                          <div key={i} className={`text-sm p-2 rounded border ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                            {opt.content}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.question_type === 'fill_blank' && q.answer_options && q.answer_options.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Correct answer: <span className="font-semibold text-green-700">{q.answer_options[0].content}</span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500">
            No questions found. Add some questions to your bank to create assignments.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create Question</h2>
            <form onSubmit={handleCreate} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="fill_blank">Fill In Blank</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                  rows={3}
                  required
                />
              </div>

              {newType === 'multiple_choice' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="space-y-3">
                    {newOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={newCorrectOption === i}
                          onChange={() => setNewCorrectOption(i)}
                          className="text-purple-600 focus:ring-purple-500 w-4 h-4"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-grow border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                          placeholder={`Option ${i + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Select the radio button next to the correct answer.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer (Text)</label>
                  <input
                    type="text"
                    value={newFillInAnswer}
                    onChange={(e) => setNewFillInAnswer(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
