import React from 'react';
import { Target, CheckCircle } from 'lucide-react';
import type { StudentStats } from '../types';

interface StudentWeakTopicsProps {
  weakTopics?: StudentStats['weak_topics'];
}

export const StudentWeakTopics: React.FC<StudentWeakTopicsProps> = ({ weakTopics }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
          <Target className="w-5 h-5 text-red-500" /> Điểm yếu cần khắc phục
        </h2>
        <p className="text-sm text-gray-500 mt-1">Các chủ đề có tỷ lệ chính xác dưới 60%</p>
      </div>
      <div className="p-5 md:p-6 flex-1 bg-white">
        {weakTopics && weakTopics.length > 0 ? (
          <div className="space-y-5">
            {weakTopics.map((t, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between items-center text-sm font-medium mb-2">
                  <span className="text-gray-900 group-hover:text-red-600 transition-colors">{t.topic}</span>
                  <span className="text-red-700 bg-red-50 px-2.5 py-0.5 rounded border border-red-100 font-semibold">{t.accuracy_pct?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div
                    className="bg-red-500 hover:bg-red-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${t.accuracy_pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">Không có chủ đề yếu nào.</p>
            <p className="text-sm text-gray-500 mt-1">Tuyệt vời! Học sinh đang nắm vững các kiến thức cơ bản.</p>
          </div>
        )}
      </div>
    </div>
  );
};
