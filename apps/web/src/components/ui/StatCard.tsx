import React from 'react';
import { cn } from '@/utils/cn';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
}) => {
  return (
    <Card className={cn('p-6 flex flex-col justify-between transition-all hover:shadow-lg border-gray-100', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <div className="p-2.5 bg-indigo-50/80 rounded-xl text-indigo-600 border border-indigo-100/50">{icon}</div>}
      </div>
      <div>
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
            {trend && (
              <span className={cn('px-1.5 py-0.5 rounded-md font-bold', trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
            )}
            {description && <span className="text-slate-500 font-medium">{description}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};
