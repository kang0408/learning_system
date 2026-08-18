import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, label, id, ...props }, ref) => {
    const inputId = id || (label ? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);

    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={inputId}
            checked={checked}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded-md border border-slate-300 bg-white transition-all duration-150',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2',
              'peer-checked:bg-indigo-600 peer-checked:border-indigo-600',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              className
            )}
          />
          <Check className="absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100 pointer-events-none" />
        </div>
        {label && <span className="text-sm font-semibold text-slate-700">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
