import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ChevronRight } from 'lucide-react';

export interface TreeSelectOption {
  label: string;
  value: string;
  children?: TreeSelectOption[];
}

interface TreeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: TreeSelectOption[];
  placeholder?: string;
  className?: string;
}

export const TreeSelect: React.FC<TreeSelectProps> = ({ value, onChange, options, placeholder = 'Select...', className = '' }) => {
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

  const renderOptions = (opts: TreeSelectOption[], depth = 0) => {
    return opts.map(option => {
      const hasChildren = option.children && option.children.length > 0;
      const isExpanded = expanded[option.value];

      return (
        <React.Fragment key={option.value}>
          <div
            className={`w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer ${
              value === option.value ? 'bg-indigo-50/50 text-indigo-700' : 'text-zinc-700'
            }`}
            style={{ paddingLeft: `${16 + depth * 24}px` }}
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(e, option.value)}
                  className="p-0.5 rounded-md hover:bg-zinc-200 text-zinc-500 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="w-5" /> // spacer
              )}
              <span className="font-medium text-sm">{option.label}</span>
            </div>
            {value === option.value && <Check className="w-4 h-4 text-indigo-600" />}
          </div>
          {hasChildren && isExpanded && renderOptions(option.children!, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-4 pr-10 py-3.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 flex items-center justify-between text-left"
      >
        <span className={`block truncate ${!selectedLabel ? 'text-zinc-400' : 'text-zinc-900'}`}>
          {selectedLabel || placeholder}
        </span>
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 top-full bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 py-2 max-h-80 overflow-y-auto animate-in fade-in duration-200">
          {renderOptions(options)}
        </div>
      )}
    </div>
  );
};
