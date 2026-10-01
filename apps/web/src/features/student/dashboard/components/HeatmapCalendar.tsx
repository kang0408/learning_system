import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Info } from 'lucide-react';
import type { CalendarEvent } from '../types';

interface HeatmapCalendarProps {
  calendar?: CalendarEvent[];
  currentStreakDays?: number;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ 
  calendar = [], 
  currentStreakDays: _currentStreakDays = 0 
}) => {
  const { t, i18n } = useTranslation();
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    questions: number;
    sessions: number;
    accuracy: number;
  } | null>(null);

  // Generate the last 30 days up to today
  const { days, activeDaysCount, totalQuestions30Days } = useMemo(() => {
    const list: {
      date: Date;
      dateStr: string;
      dayNum: number;
      dayOfWeek: number; // 0: Sun, 1: Mon, ...
      questions: number;
      sessions: number;
      accuracy: number;
      level: 0 | 1 | 2 | 3;
    }[] = [];

    const dateMap = new Map<string, CalendarEvent>();
    calendar.forEach(c => {
      // Normalize to YYYY-MM-DD
      const key = c.date ? c.date.slice(0, 10) : '';
      if (key) dateMap.set(key, c);
    });

    const now = new Date();
    let activeDays = 0;
    let totalQuestions = 0;

    // Generate 35 days (5 full weeks) to make a clean grid
    for (let i = 34; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const event = dateMap.get(dateStr);
      const questions = Number(event?.questions_count || 0);
      const sessions = Number(event?.sessions_count || event?.sessions || 0);
      const accuracy = Math.round(Number(event?.accuracy || 0));

      let level: 0 | 1 | 2 | 3 = 0;
      if (questions > 15 || sessions >= 3) {
        level = 3;
      } else if (questions >= 6 || sessions >= 2) {
        level = 2;
      } else if (questions > 0 || sessions > 0) {
        level = 1;
      }

      if (level > 0) {
        activeDays++;
        totalQuestions += questions;
      }

      list.push({
        date: d,
        dateStr,
        dayNum: d.getDate(),
        dayOfWeek: d.getDay(),
        questions,
        sessions,
        accuracy,
        level,
      });
    }

    return {
      days: list,
      activeDaysCount: activeDays,
      totalQuestions30Days: totalQuestions,
    };
  }, [calendar]);

  const weekDayLabels = i18n.language?.startsWith('vi')
    ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCellColor = (level: 0 | 1 | 2 | 3) => {
    switch (level) {
      case 3:
        return 'bg-indigo-600 border-indigo-700 text-white shadow-[1px_1px_0_0_#18181b]';
      case 2:
        return 'bg-indigo-400 border-indigo-500 text-white';
      case 1:
        return 'bg-indigo-200 border-indigo-300 text-zinc-900';
      default:
        return 'bg-zinc-100 border-zinc-200 text-zinc-400 hover:border-zinc-400';
    }
  };

  return (
    <div className="border-2 border-zinc-900 p-5 bg-white col-span-2 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#4f46e5] transition-all space-y-4">
      {/* Header */}
      <div className="border-b-2 border-zinc-900 pb-3">
        <span className="font-bold text-[10px] uppercase tracking-widest text-indigo-600 block">
          {t('student.dashboard.activityHeatmapSubtitle', 'TIẾN TRÌNH LUYỆN TẬP VÀ DUY TRÌ CHUỖI HỌC')}
        </span>
        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2 mt-0.5">
          <Calendar className="w-5 h-5 text-zinc-900" />
          <span>{t('student.dashboard.activityHeatmap', 'LỊCH HOẠT ĐỘNG 30 NGÀY')}</span>
        </h3>
      </div>

      {/* Heatmap Grid */}
      <div className="space-y-2">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {weekDayLabels.map((lbl, idx) => (
            <span key={idx} className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              {lbl}
            </span>
          ))}
        </div>

        {/* 35 Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((item, idx) => {
            const isToday = idx === days.length - 1;
            return (
              <div
                key={item.dateStr}
                onMouseEnter={() => setHoveredDay({
                  dateStr: item.dateStr,
                  questions: item.questions,
                  sessions: item.sessions,
                  accuracy: item.accuracy,
                })}
                onMouseLeave={() => setHoveredDay(null)}
                className={`relative aspect-square flex flex-col items-center justify-center border transition-all cursor-pointer select-none ${getCellColor(item.level)} ${
                  isToday ? 'ring-2 ring-indigo-600 ring-offset-1 font-black' : ''
                }`}
              >
                <span className="text-[11px] font-bold">
                  {item.dayNum}
                </span>

                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Info Tooltip Bar */}
      <div className="min-h-[32px] px-3 py-1.5 bg-zinc-50 border border-zinc-200 text-xs font-bold flex items-center">
        {hoveredDay ? (
          hoveredDay.questions > 0 || hoveredDay.sessions > 0 ? (
            <div className="flex items-center gap-1.5 text-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong className="text-indigo-600">{hoveredDay.dateStr}</strong>: {hoveredDay.questions} {t('student.dashboard.questionsAnswered', 'câu hỏi')} • {hoveredDay.sessions} phiên • Chính xác: {hoveredDay.accuracy}%
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>
                <strong>{hoveredDay.dateStr}</strong>: {t('student.dashboard.heatmapNoActivity', 'Không có hoạt động học tập')}
              </span>
            </div>
          )
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500 font-medium text-[11px]">
            <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              {t('student.dashboard.heatmapHint', 'Di chuột qua từng ô ngày để xem chi tiết số câu đã làm và độ chính xác.')}
            </span>
          </div>
        )}
      </div>

      {/* Footer Summary & Legend */}
      <div className="pt-2 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 font-bold text-zinc-600">
          <span>
            {t('student.dashboard.heatmapActiveDays', { count: activeDaysCount, defaultValue: `${activeDaysCount} ngày học tập` })}
          </span>
          <span>•</span>
          <span className="text-indigo-600">
            {t('student.dashboard.heatmapTotalQuestions', { count: totalQuestions30Days, defaultValue: `${totalQuestions30Days} câu đã làm` })}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 font-bold text-[10px] text-zinc-500 uppercase tracking-wider">
          <span>{t('student.dashboard.heatmapLegendLess', 'Ít')}</span>
          <div className="w-3 h-3 bg-zinc-100 border border-zinc-200" />
          <div className="w-3 h-3 bg-indigo-200 border border-indigo-300" />
          <div className="w-3 h-3 bg-indigo-400 border border-indigo-500" />
          <div className="w-3 h-3 bg-indigo-600 border border-indigo-700" />
          <span>{t('student.dashboard.heatmapLegendMore', 'Nhiều')}</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapCalendar;
