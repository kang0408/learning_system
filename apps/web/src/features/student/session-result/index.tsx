import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionResultData } from './hooks/useSessionResultData';
import { ScoreBoard } from './components/ScoreBoard';
import { DetailedReview } from './components/DetailedReview';

export const StudentSessionResultFeature: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  const initialData = location.state || null;

  useEffect(() => {
    // If there is no initialData (from quiz submission) and no sessionId (from query params), redirect.
    if (!initialData && !sessionId) {
      navigate('/student', { replace: true });
    }
  }, [initialData, sessionId, navigate]);

  // If redirecting, don't render anything to prevent suspense query from firing with null id (if it could)
  if (!initialData && !sessionId) {
    return null;
  }

  const { data: result } = useSessionResultData(sessionId, initialData);

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-zinc-900 selection:bg-indigo-600 selection:text-white flex flex-col justify-center py-20 px-6 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto w-full">
        <ScoreBoard result={result} sessionId={sessionId} />
        <DetailedReview answers={result.session_answers || []} />
      </div>
    </div>
  );
};

export default StudentSessionResultFeature;
