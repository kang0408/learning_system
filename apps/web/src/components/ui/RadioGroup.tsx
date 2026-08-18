import React from 'react';
import { cn } from '@/utils/cn';

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  options: RadioGroupOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  className,
  orientation = 'vertical',
}) => {
  return (
    <div
      className={cn(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const inputId = `${name}-${opt.value}`;

        return (
          <label
            key={opt.value}
            htmlFor={inputId}
            className={cn(
              'relative flex cursor-pointer rounded-xl border p-3.5 shadow-sm transition-all duration-200',
              isSelected
                ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            )}
          >
            <input
              type="radio"
              id={inputId}
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div className="flex w-full items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all',
                  isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                )}
              >
                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                {opt.description && <span className="text-xs font-medium text-slate-500 mt-0.5">{opt.description}</span>}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
};
