import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  size?: 'default' | 'sm' | 'lg';
  error?: boolean;
  disabled?: boolean;
  direction?: 'auto' | 'down' | 'up';
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  icon,
  size = 'default',
  error,
  disabled = false,
  direction: customDirection = 'auto',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (customDirection && customDirection !== 'auto') {
        setDirection(customDirection);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(240, 20 + options.length * 38);
      
      // Check nearest modal or scrollable parent
      const parentContainer = containerRef.current.closest('.overflow-hidden, .overflow-y-auto, [role="dialog"]') as HTMLElement | null;
      let spaceBelow = window.innerHeight - rect.bottom;
      
      if (parentContainer) {
        const parentRect = parentContainer.getBoundingClientRect();
        spaceBelow = Math.min(spaceBelow, parentRect.bottom - rect.bottom);
      }
      
      if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
        setDirection('up');
      } else {
        setDirection('down');
      }
    }
  }, [isOpen, options.length, customDirection]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    default: 'h-10 px-3 text-sm rounded-lg',
    lg: 'h-12 px-4 text-base rounded-xl',
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between border bg-white text-left transition-colors shadow-sm select-none',
          'focus-visible:outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 hover:border-slate-400',
          sizeClasses[size],
          icon && 'pl-9'
        )}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        
        <span className={cn('block truncate font-normal', !selectedOption ? 'text-slate-400' : 'text-slate-900')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2', isOpen && 'rotate-180 text-slate-600')} />
      </button>

      {isOpen && (
        <div 
          className={cn(
            'absolute z-[60] w-full bg-white border border-slate-200 rounded-xl shadow-xl p-1 overflow-y-auto max-h-60 animate-in fade-in zoom-in-95 duration-150',
            direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-3 py-2 flex items-center justify-between rounded-lg transition-colors text-left text-sm',
                value === option.value
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-normal'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                {option.icon && <span className="text-slate-400 shrink-0">{option.icon}</span>}
                <span className="truncate">{option.label}</span>
              </div>
              {value === option.value && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
