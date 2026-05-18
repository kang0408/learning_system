import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import api from '../api/axios';

interface ClassItem {
  id: string;
  name: string;
}

interface Question {
  id: string;
  type: string;
  content: string;
}

export default function AssignmentWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clsRes, qRes] = await Promise.all([
          api.get('/api/classes'),
          api.get('/api/questions')
        ]);
        setClasses(clsRes.data);
        setQuestions(qRes.data);
        if (clsRes.data.length > 0) {
          setClassId(clsRes.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleQuestion = (id: string) => {
    const next = new Set(selectedQuestions);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedQuestions(next);
  };

  const handlePublish = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/assignments', {
        title,
        due_date: dueDate,
        class_id: classId,
        question_ids: Array.from(selectedQuestions)
      });
      navigate('/teacher');
    } catch (err) {
      alert('Failed to publish assignment');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
        <div className="text-sm font-medium text-gray-500">Step {step} of 3</div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-purple-100">
          <div style={{ width: `${(step / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500 transition-all duration-300"></div>
        </div>
      </div>

      <div className="bg-white shadow-sm border rounded-xl p-6 min-h-[400px] flex flex-col">
        {step === 1 && (
          <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900">Assignment Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
                placeholder="e.g. Midterm Review"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Class</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border bg-white"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm py-2 px-3 border"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900 flex justify-between items-center">
              <span>Select Questions</span>
              <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                {selectedQuestions.size} selected
              </span>
            </h2>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
              {questions.map(q => (
                <label key={q.id} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${selectedQuestions.has(q.id) ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(q.id)}
                    onChange={() => toggleQuestion(q.id)}
                    className="mt-1 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">{q.content}</span>
                    <span className="block text-xs text-gray-500 capitalize mt-1">{q.type.replace('_', ' ')}</span>
                  </div>
                </label>
              ))}
              {questions.length === 0 && (
                <div className="text-center text-gray-500 py-8">No questions found in bank.</div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>
            
            <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-500">Title</span>
                <span className="font-semibold text-gray-900">{title}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-500">Class</span>
                <span className="font-semibold text-gray-900">{classes.find(c => c.id === classId)?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-4">
                <span className="text-gray-500">Due Date</span>
                <span className="font-semibold text-gray-900">{dueDate}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-gray-500">Questions</span>
                <span className="font-semibold text-purple-600">{selectedQuestions.size} included</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1 || submitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              disabled={
                (step === 1 && (!title || !dueDate || !classId)) ||
                (step === 2 && selectedQuestions.size === 0)
              }
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
