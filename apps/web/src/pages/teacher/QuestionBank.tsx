import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Save, Folder, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function QuestionBank() {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);

  // Form states for Topic
  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

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
      const res = await api.get('/api/questions/topics');
      setTopics(res.data.data || []);
    } catch (err) {
      setError('Failed to load question sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;
    setCreatingTopic(true);
    try {
      await api.post('/api/questions/topics', { name: topicName, description: topicDescription });
      setShowTopicModal(false);
      setTopicName('');
      setTopicDescription('');
      fetchTopics();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo chủ đề');
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

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  const handleOpenQuestionModal = () => {
    if (topics.length === 0) {
      alert('Vui lòng tạo ít nhất 1 Chủ đề trước khi tạo câu hỏi!');
      return;
    }
    setSelectedTopicId(topics[0].id);
    setShowQuestionModal(true);
  };

  if (loading && topics.length === 0) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition duration-300">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Ngân hàng câu hỏi</h1>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
              {topics.length} chủ đề
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Quản lý các chủ đề và danh sách câu hỏi trắc nghiệm, tự luận.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowTopicModal(true)}
            className="flex items-center justify-center px-5 py-2.5 bg-purple-50 text-purple-700 font-bold rounded-xl hover:bg-purple-100 transition duration-300 shadow-sm border border-purple-100"
          >
            <Folder className="w-5 h-5 mr-2" /> Tạo chủ đề
          </button>
          <button
            onClick={handleOpenQuestionModal}
            className="flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition duration-300 shadow-md shadow-purple-200"
          >
            <Plus className="w-5 h-5 mr-2" /> Tạo câu hỏi
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex gap-4 items-center">
          <div className="relative flex-grow max-w-lg">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm chủ đề..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        {error && <div className="p-4 text-red-500 bg-red-50">{error}</div>}

        {topics.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {topics.map(topic => (
              <li key={topic.id} className="hover:bg-purple-50/50 transition-colors group">
                <Link to={`/teacher/questions/topics/${topic.id}`} className="block p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3.5 bg-purple-100 text-purple-700 rounded-xl mr-5 border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{topic.name}</h3>
                        {topic.description && <p className="text-sm text-gray-500 mt-1.5">{topic.description}</p>}
                        <div className="mt-2.5 flex items-center text-sm text-gray-500 font-medium">
                          <span className="text-purple-700 bg-purple-100/50 px-2.5 py-1 rounded-md border border-purple-100">
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
        ) : (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có chủ đề nào</h3>
            <p className="text-gray-500">Hãy tạo một chủ đề mới để bắt đầu thêm câu hỏi.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Topic */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Tạo Chủ đề mới</h2>
            <p className="text-sm text-gray-500 mb-6">Thêm chủ đề để phân loại các câu hỏi của bạn dễ dàng hơn.</p>
            <form onSubmit={handleCreateTopic} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên chủ đề *</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="Ví dụ: Bài tập Unit 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                  rows={3}
                  placeholder="Mô tả chi tiết về chủ đề này (không bắt buộc)"
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
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
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
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Thêm Câu Hỏi Mới</h2>
            <p className="text-sm text-gray-500 mb-6">Điền thông tin và đáp án cho câu hỏi mới của bạn.</p>
            <form onSubmit={handleCreateQuestion} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chọn Chủ đề *</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  >
                    {topics.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại câu hỏi</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
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
                      <div key={i} className={`flex items-center gap-4 p-2 rounded-xl border transition-colors ${newCorrectOption === i ? 'border-purple-200 bg-purple-50/50' : 'border-transparent'}`}>
                        <div className="flex-shrink-0 ml-2">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={newCorrectOption === i}
                            onChange={() => setNewCorrectOption(i)}
                            className="text-purple-600 focus:ring-purple-500 w-5 h-5 border-gray-300 cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-grow px-4 py-2.5 border border-gray-200 bg-white focus:bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
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
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
                >
                  {creatingQuestion ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                  Lưu Câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
