import React from 'react';
import { Quote, BookOpen } from 'lucide-react';

interface AiEvidenceQuoteBoxProps {
  quote?: string;
}

export const AiEvidenceQuoteBox: React.FC<AiEvidenceQuoteBoxProps> = ({ quote }) => {
  if (!quote || !quote.trim()) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 space-y-1">
      <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px] uppercase tracking-wider">
        <Quote className="w-3 h-3 text-amber-600" />
        <span>Căn Cứ Trích Dẫn Từ Bài Học</span>
      </div>
      <p className="italic font-serif leading-relaxed text-slate-700 pl-4 border-l-2 border-amber-300">
        "{quote}"
      </p>
    </div>
  );
};
