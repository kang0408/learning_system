import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface AuthSelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface AuthSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: AuthSelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const AuthSelect: React.FC<AuthSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedHeight = 20 + options.length * 48;

      if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
        setDirection('up');
      } else {
        setDirection('down');
      }
    }
  }, [isOpen, options.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${
          icon ? 'pl-11' : 'pl-4'
        } pr-10 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 flex items-center justify-between text-left shadow-xs`}
      >
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            {icon}
          </div>
        )}

        <span className={`block truncate ${!selectedOption ? 'text-zinc-400' : 'text-zinc-900 font-normal'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown
            className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180 text-zinc-600' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 py-2 overflow-hidden animate-in fade-in duration-200 ${
            direction === 'up' ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'
          }`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                value === option.value ? 'bg-indigo-50/50 text-indigo-700 font-medium' : 'text-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {option.icon && <span className="text-zinc-400">{option.icon}</span>}
                <span className="text-sm">{option.label}</span>
              </div>
              {value === option.value && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
