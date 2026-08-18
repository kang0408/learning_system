import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TreeSelectOption {
  label: string;
  value: string;
  children?: TreeSelectOption[];
}

export interface TreeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TreeSelectOption[];
  placeholder?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  error?: boolean;
  disabled?: boolean;
}

export const TreeSelect: React.FC<TreeSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  size = 'default',
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-expand all by default, or just root
  useEffect(() => {
    const expandAll = (opts: TreeSelectOption[], acc: Record<string, boolean>) => {
      opts.forEach(o => {
        if (o.children && o.children.length > 0) {
          acc[o.value] = true;
          expandAll(o.children, acc);
        }
      });
      return acc;
    };
    setExpanded(expandAll(options, {}));
  }, [options]);

  const findLabel = (opts: TreeSelectOption[], val: string): string | null => {
    for (const o of opts) {
      if (o.value === val) return o.label;
      if (o.children) {
        const found = findLabel(o.children, val);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedLabel = findLabel(options, value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [val]: !prev[val] }));
  };

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-md',
    default: 'h-10 px-3 text-sm rounded-lg',
    lg: 'h-12 px-4 text-base rounded-xl',
  };

  const renderOptions = (opts: TreeSelectOption[], depth = 0) => {
    return opts.map(option => {
      const hasChildren = option.children && option.children.length > 0;
      const isExpanded = expanded[option.value];

      return (
        <React.Fragment key={option.value}>
          <div
            className={cn(
              'w-full px-3 py-2 flex items-center justify-between rounded-md transition-colors cursor-pointer text-sm',
              value === option.value
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-normal'
            )}
            style={{ paddingLeft: `${12 + depth * 20}px` }}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-2 truncate">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, option.value)}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-500 transition-colors shrink-0"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              ) : (
                <div className="w-4 shrink-0" />
              )}
              <span className="truncate">{option.label}</span>
            </div>
            {value === option.value && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
          </div>
          {hasChildren && isExpanded && renderOptions(option.children!, depth + 1)}
        </React.Fragment>
      );
    });
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
          sizeClasses[size]
        )}
      >
        <span className={cn('block truncate font-normal', !selectedLabel ? 'text-slate-400' : 'text-slate-900')}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2', isOpen && 'rotate-180 text-slate-600')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 top-full bg-white border border-slate-200 rounded-lg shadow-lg p-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {renderOptions(options)}
        </div>
      )}
    </div>
  );
};
