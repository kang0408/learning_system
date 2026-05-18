import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, XCircle } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const mockQuestion = {
    content: 'Which language is known as the "Mother of all languages"?',
    options: [
      { id: 1, text: 'Sanskrit' },
      { id: 2, text: 'Latin' },
      { id: 3, text: 'Greek' },
      { id: 4, text: 'Hebrew' },
    ]
  };

  const handleSelect = (id: number) => {
    if (feedback) return; // prevent changing answer
    setSelectedOption(id);
    
    // Mock validation
    const isCorrect = id === 1;
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      // Move to next question or exit
      navigate('/student');
    }, 2000);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b bg-white">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div className="w-full max-w-md mx-4 h-3 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-secondary w-1/3 transition-all"></div>
        </div>
        <div className="text-warning font-bold">1/3</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl w-full mx-auto p-6 flex flex-col justify-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">{mockQuestion.content}</h2>
        
        <div className="space-y-4">
          {mockQuestion.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all cursor-pointer ${
                selectedOption === opt.id 
                  ? feedback === 'correct' 
                    ? 'border-secondary bg-emerald-50 text-secondary' 
                    : feedback === 'incorrect'
                      ? 'border-danger bg-red-50 text-danger'
                      : 'border-primary bg-indigo-50 text-primary'
                  : 'border-slate-200 hover:border-primary hover:bg-slate-50 text-slate-700'
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Panel */}
      <div className={`absolute bottom-0 left-0 w-full p-6 bg-white border-t-2 transition-transform duration-300 ${
        feedback ? 'translate-y-0' : 'translate-y-full'
      } ${feedback === 'correct' ? 'border-secondary' : 'border-danger'}`}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {feedback === 'correct' ? (
            <CheckCircle className="w-8 h-8 text-secondary" />
          ) : (
            <XCircle className="w-8 h-8 text-danger" />
          )}
          <div>
            <h3 className={`text-xl font-bold ${feedback === 'correct' ? 'text-secondary' : 'text-danger'}`}>
              {feedback === 'correct' ? 'Excellent!' : 'Incorrect'}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}
