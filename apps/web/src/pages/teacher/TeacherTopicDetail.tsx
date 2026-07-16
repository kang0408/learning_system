import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Save, ArrowLeft, Trash2, Edit, Star } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function TeacherTopicDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [error, setError] = useState('');
  
  // Modals state
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // Form states for Question
  const [newType, setNewType] = useState('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectOption, setNewCorrectOption] = useState(0);
  const [isTrueStatement, setIsTrueStatement] = useState(true);
  const [newDifficulty, setNewDifficulty] = useState(3);
  const [newExplanation, setNewExplanation] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Edit Topic State
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicDescription, setEditTopicDescription] = useState('');
  const [editTopicCode, setEditTopicCode] = useState('');
  const [enableEditCustomCode, setEnableEditCustomCode] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [setRes, questionsRes] = await Promise.all([
        api.get(`/api/questions/topics/${topicId}`),
        api.get(`/api/questions?topic_id=${topicId}&limit=1000&search=${encodeURIComponent(debouncedSearchTerm)}`)
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
    api.get('/api/questions/topics?limit=1000').then(res => {
      setAllTopics(res.data.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (topicId) fetchDetail();
  }, [topicId, debouncedSearchTerm]);

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const payload: any = { 
      question_type: newType, 
      content: newContent, 
      difficulty: newDifficulty,
      explanation: newExplanation,
      topic_id: selectedTopicId === '' ? null : selectedTopicId
    };

    if (newType === 'multiple_choice') {
      payload.answer_options = newOptions.map((opt, index) => ({
        content: opt,
        is_correct: index === newCorrectOption,
        order_index: index
      }));
    } else if (newType === 'true_false') {
      payload.answer_options = [
        { content: 'Đúng', is_correct: isTrueStatement, order_index: 0 },
        { content: 'Sai', is_correct: !isTrueStatement, order_index: 1 }
      ];
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
      setIsTrueStatement(true);
      setNewDifficulty(3);
      setNewExplanation('');
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
    setSelectedTopicId(q.topic_id || topicId || '');
    setNewType(q.question_type);
    setNewContent(q.content);
    setNewExplanation(q.explanation || '');
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
    } else if (q.question_type === 'true_false') {
      const opts = q.answer_options || [];
      const correctOpt = opts.find((o: any) => o.is_correct);
      setIsTrueStatement(correctOpt?.content === 'Đúng');
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

  const handleOpenEditTopic = () => {
    setEditTopicName(topic?.name || '');
    setEditTopicDescription(topic?.description || '');
    setEditTopicCode(topic?.code || '');
    setEnableEditCustomCode(false);
    setShowEditTopicModal(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTopicName.trim()) return;
    
    if (enableEditCustomCode && editTopicCode.trim().length !== 6) {
      alert('Mã chủ đề phải có đúng 6 ký tự.');
      return;
    }

    setSavingTopic(true);
    try {
      const payload: any = {
        name: editTopicName,
        description: editTopicDescription
      };
      if (enableEditCustomCode) {
        payload.code = editTopicCode.trim().toUpperCase();
      }
      await api.put(`/api/questions/topics/${topicId}`, payload);
      setShowEditTopicModal(false);
      fetchDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error?.message || 'Không thể cập nhật chủ đề');
    } finally {
      setSavingTopic(false);
    }
  };

  if (loading && !topic) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-700" /></div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header card with rich colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={() => navigate('/teacher/questions')} className="mr-5 p-2 rounded-full hover:bg-slate-100 text-gray-400 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 tracking-tight">{topic?.name}</h1>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-semibold rounded-full border border-slate-200">
                Chủ đề
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{topic?.description || 'Không có mô tả'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingQuestionId(null);
              setSelectedTopicId(topicId || '');
              setNewContent('');
              setNewOptions(['', '', '', '']);
              setNewDifficulty(3);
              setNewExplanation('');
              setShowQuestionModal(true);
            }}
            className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900"
          >
            <Plus className="w-5 h-5 mr-2" /> Thêm câu hỏi
          </button>
          <button
            onClick={handleOpenEditTopic}
            className="flex items-center justify-center px-5 py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition duration-300 shadow-sm border border-blue-100"
          >
            <Edit className="w-4 h-4 mr-2" /> Sửa chủ đề
          </button>
          <button
            onClick={handleDeleteSet}
            className="flex items-center justify-center px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition duration-300 shadow-sm border border-red-100"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Xóa
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <h2 className="font-bold text-gray-900 text-lg">Danh sách câu hỏi <span className="ml-2 text-sm bg-slate-200 text-slate-900 px-2.5 py-0.5 rounded-full">{questions.length}</span></h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm câu hỏi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {questions.length > 0 ? (
          <div className="p-4 bg-gray-50/50">
            <ul className="space-y-4">
              {questions.map(q => (
                <li key={q.id} className="p-6 bg-white border border-gray-100 rounded-xl hover:border-slate-300 hover:shadow-md transition-all shadow-sm group">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-grow">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg border ${
                          q.question_type === 'multiple_choice' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'
                        }`}>
                          {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                        </span>
                        <div className="inline-flex items-center gap-0.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3.5 h-3.5 ${q.difficulty >= star ? 'fill-current' : 'text-yellow-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.content}</p>
                      {q.question_type === 'multiple_choice' && q.answer_options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {q.answer_options.map((opt: any, i: number) => (
                            <div key={i} className={`flex items-center px-4 py-3 text-sm rounded-xl border transition-all ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-800 shadow-sm' : 'bg-white border-gray-200 text-gray-600'}`}>
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 border border-gray-300 text-transparent'}`}>
                                {opt.is_correct && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                              </div>
                              <span className={opt.is_correct ? 'font-bold' : 'font-medium'}>{opt.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.question_type === 'true_false' && q.answer_options && q.answer_options.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 shadow-sm rounded-xl text-sm flex items-center">
                          <span className="font-medium text-gray-600 mr-2">Đáp án:</span> 
                          <span className="font-bold text-green-800 text-base">{q.answer_options.find((o: any) => o.is_correct)?.content}</span>
                        </div>
                      )}
                      
                      {q.explanation && (
                        <div className="mt-4 p-4 bg-slate-100/50 border border-slate-200 shadow-sm rounded-xl text-sm">
                          <span className="font-bold text-purple-800 block mb-1">Giải thích:</span> 
                          <span className="text-gray-700">{q.explanation}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditQuestion(q)}
                        className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Sửa"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : debouncedSearchTerm ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy câu hỏi</h3>
            <p className="text-gray-500">Không có câu hỏi nào khớp với từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chủ đề này chưa có câu hỏi</h3>
            <p className="text-gray-500 mb-6">Nhấn "Thêm câu hỏi" để bắt đầu bổ sung ngân hàng câu hỏi của bạn.</p>
            <button
              onClick={() => {
                setEditingQuestionId(null);
                setSelectedTopicId(topicId || '');
                setNewContent('');
                setNewOptions(['', '', '', '']);
                setNewDifficulty(3);
                setNewExplanation('');
                setShowQuestionModal(true);
              }}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900"
            >
              <Plus className="w-5 h-5 mr-2" /> Thêm câu hỏi
            </button>
          </div>
        )}
      </div>

      {/* Modal: Create Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">{editingQuestionId ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}</h2>
            <p className="text-sm text-gray-500 mb-6">Điền thông tin và đáp án cho câu hỏi của bạn.</p>
            <form onSubmit={handleSaveQuestion} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Chủ đề câu hỏi</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors mb-4"
                >
                  {!allTopics.some(t => t.name === 'Chưa phân loại') && (
                    <option value="">Không phân loại (Hoặc tạo mới mặc định)</option>
                  )}
                  {allTopics.map(t => (
                    <option key={t.id} value={t.id}>{t.name} {t.code ? `(${t.code})` : ''}</option>
                  ))}
                </select>

                <label className="block text-sm font-bold text-gray-700 mb-2">Loại câu hỏi</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                >
                  <option value="multiple_choice">Trắc nghiệm (4 lựa chọn)</option>
                  <option value="true_false">Đúng / Sai</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nội dung câu hỏi *</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Nhập nội dung câu hỏi..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giải thích (Tùy chọn)</label>
                <textarea
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  rows={2}
                  placeholder="Giải thích thêm cho câu trả lời..."
                />
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Độ khó (1-5 sao)</label>
                  <div className="flex items-center gap-1.5 mt-2 bg-gray-50 w-fit px-4 py-2 rounded-xl border border-gray-100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewDifficulty(star)}
                        className={`p-1 rounded-full transition-all duration-300 transform hover:scale-110 ${newDifficulty >= star ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-yellow-200'}`}
                      >
                        <Star className="w-7 h-7 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {newType === 'multiple_choice' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Các đáp án (Chọn đáp án đúng)</label>
                  <div className="space-y-4">
                    {newOptions.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-4 p-2 rounded-xl border transition-colors ${newCorrectOption === i ? 'border-slate-300 bg-slate-100/50' : 'border-transparent'}`}>
                        <div className="flex-shrink-0 ml-2">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={newCorrectOption === i}
                            onChange={() => setNewCorrectOption(i)}
                            className="text-slate-900 focus:ring-slate-900 w-5 h-5 border-gray-300 cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-grow px-4 py-2.5 border border-gray-200 bg-white focus:bg-white rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                          placeholder={`Nhập đáp án ${i + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : newType === 'true_false' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Đáp án đúng là gì?</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsTrueStatement(true)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${isTrueStatement ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                      Đúng
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTrueStatement(false)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all ${!isTrueStatement ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                      Sai
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingQuestion}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
                >
                  {creatingQuestion ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  {editingQuestionId ? 'Lưu Thay Đổi' : 'Lưu Câu Hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Topic */}
      {showEditTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 border border-gray-100">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Sửa Chủ Đề</h2>
            <p className="text-sm text-gray-500 mb-6">Cập nhật thông tin cơ bản cho chủ đề này.</p>
            <form onSubmit={handleSaveTopic} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên chủ đề *</label>
                <input
                  type="text"
                  value={editTopicName}
                  onChange={(e) => setEditTopicName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  placeholder="Ví dụ: Bài tập Unit 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={editTopicDescription}
                  onChange={(e) => setEditTopicDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Mô tả chi tiết về chủ đề này (không bắt buộc)"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Chỉnh sửa Mã Chủ đề (Code)</label>
                    <p className="text-xs text-gray-500 mt-1">Chỉ bật nếu bạn thực sự cần thay đổi mã.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableEditCustomCode}
                      onChange={(e) => setEnableEditCustomCode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <input
                  type="text"
                  maxLength={6}
                  value={editTopicCode}
                  onChange={(e) => setEditTopicCode(e.target.value.toUpperCase())}
                  disabled={!enableEditCustomCode}
                  className={`w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors font-mono uppercase tracking-wider ${!enableEditCustomCode ? 'opacity-50 bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Mã 6 ký tự"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditTopicModal(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
                >
                  {savingTopic ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
