import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Save, ArrowLeft, Trash2, Edit, Star, Globe, EyeOff } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function TeacherTopicDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Form states for Question
  const [newType, setNewType] = useState('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectOption, setNewCorrectOption] = useState(0);
  const [newFillInAnswer, setNewFillInAnswer] = useState('');
  const [newDifficulty, setNewDifficulty] = useState(3);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [setRes, questionsRes] = await Promise.all([
        api.get(`/api/questions/topics/${topicId}`),
        api.get(`/api/questions?topic_id=${topicId}`)
      ]);
      setTopic(setRes.data.data);
      setQuestions(questionsRes.data.data || []);
    } catch (err) {
      setError('Failed to load question set details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (topicId) fetchDetail();
  }, [topicId]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const payload: any = { 
      question_type: newType, 
      content: newContent, 
      difficulty: newDifficulty,
      topic_id: topicId // Auto assign to this set
    };

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

    setCreatingQuestion(true);
    try {
      if (editingQuestionId) {
        await api.put(`/api/questions/${editingQuestionId}`, payload);
      } else {
        await api.post('/api/questions', payload);
      }
      setShowQuestionModal(false);
      setNewContent('');
      setNewOptions(['', '', '', '']);
      setNewFillInAnswer('');
      setNewDifficulty(3);
      setEditingQuestionId(null);
      fetchDetail(); // Refetch
    } catch (err) {
      alert('Failed to save question');
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setNewType(q.question_type);
    setNewContent(q.content);
    setNewDifficulty(q.difficulty);
    if (q.question_type === 'multiple_choice') {
      const opts = q.answer_options || [];
      setNewOptions([
        opts[0]?.content || '',
        opts[1]?.content || '',
        opts[2]?.content || '',
        opts[3]?.content || ''
      ]);
      const correctIdx = opts.findIndex((o: any) => o.is_correct);
      setNewCorrectOption(correctIdx >= 0 ? correctIdx : 0);
    } else {
      setNewFillInAnswer(q.answer_options?.[0]?.content || '');
    }
    setShowQuestionModal(true);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  const handleDeleteQuestion = async (id: string) => {
    if(!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;
    try {
      await api.delete(`/api/questions/${id}`);
      fetchDetail();
    } catch (e) {
      alert('Không thể xóa câu hỏi');
    }
  }


  const handleDeleteSet = async () => {
    if(!confirm('Bạn có chắc muốn xóa TOÀN BỘ chủ đề này không?')) return;
    try {
      await api.delete(`/api/questions/topics/${topicId}`);
      navigate('/teacher/questions');
    } catch (e) {
      alert('Không thể xóa chủ đề');
    }
  }

  if (loading && !topic) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center">
          <button onClick={() => navigate('/teacher/questions')} className="mr-4 p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{topic?.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{topic?.description || 'Không có mô tả'}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setEditingQuestionId(null);
              setNewContent('');
              setNewOptions(['', '', '', '']);
              setNewDifficulty(3);
              setShowQuestionModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5 mr-1" /> Thêm câu hỏi vào chủ đề này
          </button>
          <button
            onClick={handleDeleteSet}
            className="inline-flex items-center px-4 py-2 border border-red-200 text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition shadow-sm"
          >
            Xóa chủ đề
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
          <h2 className="font-semibold text-gray-700">Danh sách câu hỏi ({questions.length})</h2>
        </div>
        
        {questions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {questions.map(q => (
              <li key={q.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-grow">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
                      q.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Điền khuyết'}
                    </span>
                    <div className="ml-2 inline-flex items-center gap-0.5 px-2 py-1 text-xs font-semibold rounded-full mb-2 bg-yellow-100 text-yellow-800">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${q.difficulty >= star ? 'fill-current' : 'text-yellow-200'}`} />
                      ))}
                    </div>
                    <p className="font-medium text-gray-900">{q.content}</p>
                    {q.question_type === 'multiple_choice' && q.answer_options && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {q.answer_options.map((opt: any, i: number) => (
                          <div key={i} className={`text-sm p-2 rounded border ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                            {opt.content} {opt.is_correct && '✓'}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.question_type === 'fill_blank' && q.answer_options && q.answer_options.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        Đáp án đúng: <span className="font-semibold text-green-700">{q.answer_options[0].content}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditQuestion(q)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-gray-500">
            Chủ đề này chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
          </div>
        )}
      </div>

      {/* Modal: Create Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingQuestionId ? 'Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới'}</h2>
            <form onSubmit={handleSaveQuestion} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                >
                  <option value="multiple_choice">Trắc nghiệm (Nhiều lựa chọn)</option>
                  <option value="fill_blank">Điền vào chỗ trống</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi *</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó (1-5)</label>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewDifficulty(star)}
                        className={`p-1 rounded-full transition-colors ${newDifficulty >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {newType === 'multiple_choice' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Các đáp án</label>
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
                          placeholder={`Đáp án ${i + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Chọn nút tròn bên cạnh đáp án đúng.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án đúng (Văn bản)</label>
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
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {creatingQuestion ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingQuestionId ? 'Lưu Thay Đổi' : 'Tạo Câu Hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
