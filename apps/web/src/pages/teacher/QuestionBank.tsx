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
  const [newFillInAnswer, setNewFillInAnswer] = useState('');
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
    } else {
      payload.answer_options = [{
        content: newFillInAnswer,
        is_correct: true,
        order_index: 0
      }];
    }

    setCreatingQuestion(true);
    try {
      await api.post('/api/questions', payload);
      setShowQuestionModal(false);
      setNewContent('');
      setNewOptions(['', '', '', '']);
      setNewFillInAnswer('');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Ngân hàng câu hỏi</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTopicModal(true)}
            className="inline-flex items-center px-4 py-2 border border-purple-200 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition shadow-sm"
          >
            <Folder className="w-5 h-5 mr-2" /> Tạo chủ đề
          </button>
          <button
            onClick={handleOpenQuestionModal}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5 mr-1" /> Tạo câu hỏi
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm chủ đề..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        
        {error && <div className="p-4 text-red-500">{error}</div>}

        {topics.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {topics.map(topic => (
              <li key={topic.id} className="hover:bg-gray-50 transition-colors">
                <Link to={`/teacher/questions/topics/${topic.id}`} className="block p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{topic.name}</h3>
                        {topic.description && <p className="text-sm text-gray-500 mt-1">{topic.description}</p>}
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span className="font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                            {topic._count?.questions || 0} câu hỏi
                          </span>
                          <span className="mx-2">•</span>
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
          <div className="p-12 text-center text-gray-500">
            Bạn chưa có chủ đề nào. Hãy tạo một chủ đề để bắt đầu.
          </div>
        )}
      </div>

      {/* Modal: Create Topic */}
      {showTopicModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tạo Chủ Đề Mới</h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  className="w-full border rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3"
                  placeholder="Ví dụ: Bài tập Unit 1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  className="w-full border rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3"
                  rows={3}
                  placeholder="Mô tả chi tiết về chủ đề này"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowTopicModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingTopic}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {creatingTopic ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Tạo Chủ đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Question */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tạo Câu Hỏi Mới</h2>
            <form onSubmit={handleCreateQuestion} className="space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề *</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                    required
                  >
                    {topics.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

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
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
