import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Save, Folder, Star, Upload, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function QuestionBank() {
  const [topics, setTopics] = useState<any[]>([]);
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
  const [showTopicModal, setShowTopicModal] = useState(false);

  // Form states for Topic
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);
  const [enableCustomCode, setEnableCustomCode] = useState(false);
  const [topicCode, setTopicCode] = useState('');

  // Form states for Import CSV
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{importedCount: number, errors: string[]} | null>(null);

  // Form states for Question
  const [newType, setNewType] = useState('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectOption, setNewCorrectOption] = useState(0);
  const [isTrueStatement, setIsTrueStatement] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [newDifficulty, setNewDifficulty] = useState(3);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/questions/topics?limit=1000&search=${encodeURIComponent(debouncedSearchTerm)}`);
      setTopics(res.data.data || []);
    } catch (err) {
      setError('Failed to load question sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [debouncedSearchTerm]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    
    if (enableCustomCode && topicCode.trim().length !== 6) {
      alert('Mã chủ đề (nếu nhập) phải có đúng 6 ký tự.');
      return;
    }

    setCreatingTopic(true);
    try {
      await api.post('/api/questions/topics', { 
        name: topicName, 
        description: topicDescription,
        code: enableCustomCode ? topicCode.trim().toUpperCase() : undefined
      });
      setShowTopicModal(false);
      setTopicName('');
      setTopicDescription('');
      setEnableCustomCode(false);
      setTopicCode('');
      fetchTopics();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error?.message || 'Có lỗi xảy ra khi tạo chủ đề');
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const payload: any = { 
      question_type: newType, 
      content: newContent, 
      difficulty: newDifficulty
    };

    if (selectedTopicId) {
      payload.topic_id = selectedTopicId;
    }

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
      await api.post('/api/questions', payload);
      setShowQuestionModal(false);
      setNewContent('');
      setNewOptions(['', '', '', '']);
      setIsTrueStatement(true);
      setSelectedTopicId('');
      setNewDifficulty(3);
      fetchTopics(); // Refetch to update question counts
    } catch (err) {
      alert('Failed to create question');
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/api/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data.data);
      if (res.data.data.importedCount > 0) {
        fetchTopics();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi import CSV');
    } finally {
      setImporting(false);
    }
  };



  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  const handleOpenQuestionModal = () => {
    if (topics.length > 0) {
      setSelectedTopicId(topics[0].id);
    } else {
      setSelectedTopicId('');
    }
    setShowQuestionModal(true);
  };

  if (loading && topics.length === 0) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-700" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 tracking-tight">Ngân hàng câu hỏi</h1>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-semibold rounded-full border border-slate-200">
              {topics.length} chủ đề
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Quản lý các chủ đề và danh sách câu hỏi trắc nghiệm, tự luận.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={() => { setShowImportModal(true); setImportResult(null); setImportFile(null); }}
            className="flex items-center justify-center px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition duration-300 shadow-sm border border-slate-200"
          >
            <Upload className="w-5 h-5 mr-2" /> Import CSV
          </button>
          <button
            onClick={() => setShowTopicModal(true)}
            className="flex items-center justify-center px-5 py-2.5 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition duration-300 shadow-sm border border-slate-200"
          >
            <Folder className="w-5 h-5 mr-2" /> Tạo chủ đề
          </button>
          <button
            onClick={handleOpenQuestionModal}
            className="flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900"
          >
            <Plus className="w-5 h-5 mr-2" /> Tạo câu hỏi
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 items-center">
          <div className="relative flex-grow max-w-lg">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {error && <div className="p-4 text-red-500 bg-red-50">{error}</div>}

        {topics.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {topics.map(topic => (
              <li key={topic.id} className="hover:bg-slate-100/50 transition-colors group">
                <Link to={`/teacher/questions/topics/${topic.id}`} className="block p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3.5 bg-slate-200 text-slate-900 rounded-xl mr-5 border border-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-slate-900 transition-colors">{topic.name}</h3>
                          {topic.code && (
                            <span className="ml-3 text-sm font-mono font-semibold bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md border border-gray-200">
                              Mã: {topic.code}
                            </span>
                          )}
                        </div>
                        {topic.description && <p className="text-sm text-gray-500 mt-1.5">{topic.description}</p>}
                        <div className="mt-2.5 flex items-center text-sm text-gray-500 font-medium">
                          <span className="text-slate-900 bg-slate-200/50 px-2.5 py-1 rounded-md border border-slate-200">
                            {topic._count?.questions || 0} câu hỏi
                          </span>
                          <span className="mx-3 text-gray-300">•</span>
                          <span>Tạo ngày {new Date(topic.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : debouncedSearchTerm ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy chủ đề</h3>
            <p className="text-gray-500">Không có chủ đề nào khớp với từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có chủ đề nào</h3>
            <p className="text-gray-500">Hãy tạo một chủ đề mới để bắt đầu thêm câu hỏi.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Topic */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 border border-gray-100">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Tạo Chủ đề mới</h2>
            <p className="text-sm text-gray-500 mb-6">Thêm chủ đề để phân loại các câu hỏi của bạn dễ dàng hơn.</p>
            <form onSubmit={handleCreateTopic} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên chủ đề *</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  placeholder="Ví dụ: Bài tập Unit 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Mô tả chi tiết về chủ đề này (không bắt buộc)"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Mã Chủ đề tự chọn (Tùy chọn)</label>
                    <p className="text-xs text-gray-500 mt-1">Giúp dễ dàng phân loại khi import file CSV.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={enableCustomCode}
                      onChange={(e) => setEnableCustomCode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <input
                  type="text"
                  maxLength={6}
                  value={topicCode}
                  onChange={(e) => setTopicCode(e.target.value.toUpperCase())}
                  disabled={!enableCustomCode}
                  className={`w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors font-mono uppercase tracking-wider ${!enableCustomCode ? 'opacity-50 bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder={enableCustomCode ? "VÍ DỤ: TOPIC1" : "Hệ thống sẽ tự động tạo mã 6 ký tự"}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-semibold transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingTopic}
                  className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
                >
                  {creatingTopic ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Lưu Chủ đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Thêm Câu Hỏi Mới</h2>
            <p className="text-sm text-gray-500 mb-6">Điền thông tin và đáp án cho câu hỏi mới của bạn.</p>
            <form onSubmit={handleCreateQuestion} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Chủ đề *</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  >
                    {!topics.some(t => t.name === 'Chưa phân loại') && (
                      <option value="">Không phân loại (Hoặc tạo mới mặc định)</option>
                    )}
                    {topics.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
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
                  Lưu Câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import CSV */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Import Bộ Câu Hỏi</h2>
                <p className="text-sm text-gray-500 mt-1">Tải lên file CSV để nhập hàng loạt câu hỏi và tự động tạo chủ đề.</p>
              </div>
              <a 
                href="/questions_import_template.csv"
                download="questions_import_template.csv"
                className="flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 transition"
              >
                <Download className="w-4 h-4 mr-1.5" /> File mẫu
              </a>
            </div>

            {importResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 text-green-800 rounded-xl border border-green-200">
                  <p className="font-bold">Nhập thành công {importResult.importedCount} câu hỏi!</p>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200">
                    <p className="font-bold mb-2">Có {importResult.errors.length} lỗi xảy ra:</p>
                    <ul className="list-disc list-inside text-sm space-y-1 max-h-40 overflow-y-auto">
                      {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold shadow-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleImportSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 space-y-2">
                  <p className="font-semibold">Lưu ý định dạng CSV:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><b>Loại câu hỏi:</b> <code className="bg-blue-100 px-1 rounded">multiple_choice</code> hoặc <code className="bg-blue-100 px-1 rounded">true_false</code></li>
                    <li><b>Độ khó:</b> Từ 1 đến 5</li>
                    <li><b>Đáp án Đúng:</b> A, B, C, D, 1, 2, 3, 4 (với trắc nghiệm) hoặc TRUE/FALSE (với Đúng/Sai)</li>
                    <li>Nếu <b>Mã Chủ đề (Code)</b> chưa tồn tại, hệ thống sẽ tự động tạo chủ đề mới.</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn file CSV *</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 border border-gray-200 rounded-xl cursor-pointer"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-semibold transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={importing || !importFile}
                    className="px-8 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
                  >
                    {importing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
                    Bắt đầu Import
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
