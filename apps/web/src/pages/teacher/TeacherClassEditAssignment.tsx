import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, ChevronDown, ChevronUp, Star } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherClassEditAssignment() {
  const { id, assignmentId } = useParams<{ id: string, assignmentId: string }>();
  const navigate = useNavigate();
  

  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    topic_ids: [] as string[],
    question_ids: [] as string[],
    deadline: '',
    mode: 'adaptive',
    max_attempts: 0,
    time_limit: 0,
    assignToAll: true,
    student_ids: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);
  const [topicQuestionsCache, setTopicQuestionsCache] = useState<Record<string, any[]>>({});
  const [loadingTopics, setLoadingTopics] = useState<Record<string, boolean>>({});
  const [classMembers, setClassMembers] = useState<any[]>([]);

  const toggleTopicExpand = async (topicId: string) => {
    if (expandedTopics.includes(topicId)) {
      setExpandedTopics(prev => prev.filter(id => id !== topicId));
      return;
    }
    
    setExpandedTopics(prev => [...prev, topicId]);
    
    if (!topicQuestionsCache[topicId]) {
      setLoadingTopics(prev => ({ ...prev, [topicId]: true }));
      try {
        const res = await api.get(`/api/questions/topics/${topicId}`);
        setTopicQuestionsCache(prev => ({
          ...prev,
          [topicId]: res.data.data.questions || []
        }));
      } catch (err) {
        console.error('Failed to fetch topic questions');
      } finally {
        setLoadingTopics(prev => ({ ...prev, [topicId]: false }));
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, assignRes, membersRes] = await Promise.all([
          api.get('/api/questions/topics'),
          api.get(`/api/assignments/${assignmentId}`),
          api.get(`/api/classes/${id}/members?limit=1000`)
        ]);
        
        setAvailableTopics(topicsRes.data.data || []);
        setClassMembers(membersRes.data.data || []);
        
        const currentData = assignRes.data.data;
        const assignedQs = currentData.assignment_questions || [];
        
        const topicCounts: Record<string, number> = {};
        const allQuestionIds: string[] = [];
        const questionIdToTopicId: Record<string, string> = {};
        
        assignedQs.forEach((aq: any) => {
           allQuestionIds.push(aq.question_id);
           if (aq.question && aq.question.topic_id) {
               const tId = aq.question.topic_id;
               topicCounts[tId] = (topicCounts[tId] || 0) + 1;
               questionIdToTopicId[aq.question_id] = tId;
           }
        });

        const initialTopicIds: string[] = [];
        const initialQuestionIds: string[] = [];

        const topicsData = topicsRes.data.data || [];
        
        topicsData.forEach((topic: any) => {
            const assignedCount = topicCounts[topic.id] || 0;
            const totalCount = topic._count?.questions || 0;
            
            if (totalCount > 0 && assignedCount === totalCount) {
                initialTopicIds.push(topic.id);
            }
        });

        allQuestionIds.forEach(qId => {
            const tId = questionIdToTopicId[qId];
            if (tId && initialTopicIds.includes(tId)) {
               // covered by topic
            } else {
               initialQuestionIds.push(qId);
            }
        });
        
        setAssignForm({
          title: currentData.title || '',
          description: currentData.description || '',
          topic_ids: initialTopicIds,
          question_ids: initialQuestionIds,
          deadline: currentData.deadline ? new Date(currentData.deadline).toISOString().slice(0, 16) : '',
          mode: currentData.mode || 'adaptive',
          max_attempts: currentData.max_attempts || 0,
          time_limit: currentData.time_limit || 0,
          assignToAll: currentData.is_all_students ?? true,
          student_ids: (currentData.assigned_students || []).map((s: any) => s.student_id)
        });

      } catch (err) {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assignmentId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload_topic_ids: string[] = [...assignForm.topic_ids];
    const payload_question_ids: string[] = [...(assignForm.question_ids || [])];

    setSubmitting(true);
    try {
      if (payload_topic_ids.length === 0 && payload_question_ids.length === 0) {
        alert('Vui lòng chọn ít nhất 1 câu hỏi hoặc 1 chủ đề');
        setSubmitting(false);
        return;
      }

      const payload: any = {
        title: assignForm.title,
        description: assignForm.description,
        mode: assignForm.mode,
        max_attempts: Number(assignForm.max_attempts),
        time_limit: assignForm.time_limit ? Number(assignForm.time_limit) : null,
        deadline: assignForm.deadline ? new Date(assignForm.deadline).toISOString() : null,
        topic_ids: payload_topic_ids,
        question_ids: payload_question_ids,
        student_ids: assignForm.assignToAll ? [] : assignForm.student_ids
      };

      await api.patch(`/api/assignments/${assignmentId}`, payload);
      navigate(`/teacher/classes/${id}/assignments`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài tập');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header card with rich colors */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition duration-300">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={() => navigate(-1)} className="mr-5 p-2 rounded-full hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Chỉnh sửa bài tập</h1>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
                Sửa bài
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin và danh sách câu hỏi cho bài tập.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề *</label>
              <input 
                required
                type="text" 
                value={assignForm.title}
                onChange={e => setAssignForm({...assignForm, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Nhập tiêu đề bài tập..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
              <textarea 
                value={assignForm.description}
                onChange={e => setAssignForm({...assignForm, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Mô tả chi tiết bài tập (không bắt buộc)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chế độ làm bài</label>
                <select 
                  value={assignForm.mode}
                  onChange={e => setAssignForm({...assignForm, mode: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                >
                  <option value="adaptive">Thích ứng (Adaptive/SM-2)</option>
                  <option value="standard">Tiêu chuẩn (Standard)</option>
                  <option value="exam">Thi cử (Exam)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số lần tối đa</label>
                <input 
                  type="number" 
                  min="0"
                  value={assignForm.max_attempts}
                  onChange={e => setAssignForm({...assignForm, max_attempts: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="0 = Không giới hạn"
                />
                <p className="text-xs text-gray-500 mt-1.5 font-medium">Nhập 0 để không giới hạn</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Giới hạn thời gian (Phút)</label>
                <input 
                  type="number" 
                  min="0"
                  value={assignForm.time_limit}
                  onChange={e => setAssignForm({...assignForm, time_limit: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="0 = Không giới hạn"
                />
                <p className="text-xs text-gray-500 mt-1.5 font-medium">Nhập 0 để không giới hạn</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hạn chót nộp bài</label>
                <input 
                  type="datetime-local" 
                  value={assignForm.deadline}
                  onChange={e => setAssignForm({...assignForm, deadline: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Đối tượng giao bài</label>
                <select 
                  value={assignForm.assignToAll ? 'all' : 'specific'}
                  onChange={e => {
                    const isAll = e.target.value === 'all';
                    setAssignForm({...assignForm, assignToAll: isAll, student_ids: isAll ? [] : assignForm.student_ids});
                  }}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-colors"
                >
                  <option value="all">Tất cả học sinh trong lớp</option>
                  <option value="specific">Chọn học sinh cụ thể</option>
                </select>
              </div>
            </div>

            {!assignForm.assignToAll && (
              <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                <label className="block text-sm font-bold text-purple-900 mb-3">Chọn học sinh ({assignForm.student_ids.length}/{classMembers.length})</label>
                <div className="border border-purple-100 rounded-xl p-3 bg-white max-h-[220px] overflow-y-auto space-y-2 shadow-sm">
                  {classMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center p-4">Lớp chưa có học sinh nào.</p>
                  ) : (
                    classMembers.map((member: any) => (
                      <label key={member.student.id} className="flex items-center p-3 bg-white rounded-lg border border-transparent hover:border-purple-200 hover:bg-purple-50 cursor-pointer transition-colors">
                        <input 
                          type="checkbox"
                          checked={assignForm.student_ids.includes(member.student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignForm(prev => ({
                                ...prev,
                                student_ids: [...prev.student_ids, member.student.id]
                              }));
                            } else {
                              setAssignForm(prev => ({
                                ...prev,
                                student_ids: prev.student_ids.filter(id => id !== member.student.id)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mr-4 border-gray-300"
                        />
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold mr-3 border border-purple-200">
                            {member.student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">{member.student.full_name}</span>
                            <span className="block text-xs text-gray-500">{member.student.email}</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Danh sách chủ đề (Topics)</label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-3 border border-gray-200">
                Lưu ý: Các câu hỏi đã có trong bài tập sẽ được tích sẵn. Bạn có thể chọn thêm hoặc bỏ chọn để cập nhật danh sách câu hỏi cho bài tập này.
              </p>
              <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50 max-h-[500px] overflow-y-auto">
                {availableTopics.map(topic => (
                  <div key={topic.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm transition hover:border-purple-200 hover:shadow-md">
                    <div className="flex items-center p-3 hover:bg-purple-50 transition-colors">
                      <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                          checked={assignForm.topic_ids.includes(topic.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignForm(prev => {
                                const newTopicIds = [...prev.topic_ids, topic.id];
                                // Remove all individual questions of this topic from question_ids
                                const topicQIds = topicQuestionsCache[topic.id]?.map(q => q.id) || [];
                                const newQIds = (prev.question_ids || []).filter(qid => !topicQIds.includes(qid));
                                return { ...prev, topic_ids: newTopicIds, question_ids: newQIds };
                              });
                            } else {
                              setAssignForm(prev => ({ 
                                ...prev, 
                                topic_ids: prev.topic_ids.filter(tid => tid !== topic.id) 
                              }));
                            }
                          }}
                        />
                      </div>
                      <div 
                        className="flex-1 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleTopicExpand(topic.id)}
                      >
                        <div>
                          <div className="font-medium text-gray-800">{topic.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{topic._count?.questions || 0} câu hỏi</div>
                        </div>
                        <div className="text-gray-400">
                          {expandedTopics.includes(topic.id) ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                        </div>
                      </div>
                    </div>
                    
                    {expandedTopics.includes(topic.id) && (
                      <div className="border-t bg-gray-50 p-3 space-y-3">
                        {loadingTopics[topic.id] ? (
                          <div className="flex items-center text-sm text-gray-500"><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Đang tải...</div>
                        ) : topicQuestionsCache[topic.id]?.map(q => {
                          const isTopicChecked = assignForm.topic_ids.includes(topic.id);
                          const isIndividuallyChecked = assignForm.question_ids?.includes(q.id);
                          
                          const isChecked = isTopicChecked || isIndividuallyChecked;

                          return (
                            <label key={q.id} className="flex items-start cursor-pointer text-sm">
                              <input 
                                type="checkbox"
                                className="mt-1 mr-2 w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setAssignForm(prev => {
                                    let newTopicIds = [...prev.topic_ids];
                                    let newQIds = [...(prev.question_ids || [])];
                                    
                                    const allTopicQIds = topicQuestionsCache[topic.id]?.map(tq => tq.id) || [];

                                    if (isTopicChecked) {
                                      if (!checked) {
                                        // Uncheck one question from a fully checked topic
                                        newTopicIds = newTopicIds.filter(id => id !== topic.id);
                                        // Add all OTHER questions to question_ids
                                        const otherQIds = allTopicQIds.filter(id => id !== q.id);
                                        newQIds = [...newQIds, ...otherQIds];
                                      }
                                    } else {
                                      if (checked) {
                                        newQIds.push(q.id);
                                        // Check if now all questions are selected
                                        const allChecked = allTopicQIds.length > 0 && allTopicQIds.every(id => newQIds.includes(id));
                                        if (allChecked) {
                                           newTopicIds.push(topic.id);
                                           newQIds = newQIds.filter(id => !allTopicQIds.includes(id));
                                        }
                                      } else {
                                        newQIds = newQIds.filter(id => id !== q.id);
                                      }
                                    }

                                    return {
                                      ...prev,
                                      topic_ids: newTopicIds,
                                      question_ids: newQIds
                                    };
                                  });
                                }}
                              />
                              <div className="flex-1 mt-0.5">
                                <span className="text-gray-800 block mb-1">{q.content}</span>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  <span className={`px-2 py-0.5 rounded border ${
                                    q.question_type === 'multiple_choice' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'
                                  }`}>
                                    Loại: <span className="font-medium">{q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Đúng/Sai'}</span>
                                  </span>
                                  {topic.name && (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">
                                      Chủ đề: <span className="font-medium">{topic.name}</span>
                                    </span>
                                  )}
                                  {q.difficulty !== undefined && q.difficulty !== null && (
                                    <span className="flex items-center gap-0.5 bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded border border-yellow-100">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star key={star} className={`w-3 h-3 ${q.difficulty >= star ? 'fill-current' : 'text-yellow-200'}`} />
                                      ))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                        {topicQuestionsCache[topic.id]?.length === 0 && (
                          <p className="text-xs text-gray-500">Chủ đề này không có câu hỏi nào.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {availableTopics.length === 0 && (
                  <p className="text-sm text-gray-500 p-4 text-center bg-white rounded border">
                    Bạn chưa có chủ đề nào. Hãy tạo chủ đề trước nhé.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl font-semibold transition mr-3"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition duration-300 disabled:opacity-50 flex items-center shadow-md font-bold"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
