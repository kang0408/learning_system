import { useTranslation } from 'react-i18next';

interface QuizHeaderProps {
  progress: number;
  currentIndex: number;
  totalQuestions: number;
  timeLeft: number | null;
  warnings: number;
  maxWarnings: number;
  onLeaveQuiz?: () => void;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  progress,
  currentIndex,
  totalQuestions,
  timeLeft,
  warnings,
  maxWarnings,
  onLeaveQuiz,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="h-4 w-full bg-zinc-200">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center px-8 py-6 gap-6 md:gap-0">
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <button 
            onClick={onLeaveQuiz}
            className="flex items-center justify-center font-black uppercase tracking-widest text-xs md:text-sm text-zinc-900 border-2 border-zinc-900 px-4 py-2 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:translate-y-1 hover:shadow-none"
          >
            {t('student.quiz.leaveQuiz')}
          </button>
          <div className="font-mono font-black text-xl md:text-2xl text-indigo-600 bg-indigo-50 px-4 py-2 border-2 border-indigo-600">
            {String(currentIndex + 1).padStart(2, '0')} <span className="text-indigo-300">/</span> {String(totalQuestions).padStart(2, '0')}
          </div>
        </div>
        
        {timeLeft !== null && (
          <div className="flex gap-4">
            {warnings > 0 && (
              <div className="flex items-center font-bold text-sm md:text-base text-red-600 bg-red-50 border-2 border-red-600 px-4 py-2 shadow-[4px_4px_0_0_#dc2626]">
                {t('student.quiz.violation')} {warnings}/{maxWarnings}
              </div>
            )}
            <div className={`font-mono font-black text-2xl md:text-3xl bg-white border-2 px-4 py-2 transition-colors ${
              timeLeft < 60 
                ? 'text-red-600 border-red-600 animate-pulse shadow-[4px_4px_0_0_#dc2626]' 
                : 'text-zinc-900 border-zinc-900 shadow-[4px_4px_0_0_rgba(24,24,27,1)]'
            }`}>
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
