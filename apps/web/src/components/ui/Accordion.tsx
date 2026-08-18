import React, { useState, createContext, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

export interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  children: React.ReactNode;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  type = 'single',
  defaultValue,
  children,
  className,
}) => {
  const initialOpen = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
    ? [defaultValue]
    : [];
  const [openItems, setOpenItems] = useState<string[]>(initialOpen);

  const toggleItem = (val: string) => {
    if (type === 'single') {
      setOpenItems(openItems.includes(val) ? [] : [val]);
    } else {
      setOpenItems(
        openItems.includes(val) ? openItems.filter((i) => i !== val) : [...openItems, val]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn('divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-sm', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemContextValue {
  value: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | undefined>(undefined);

export const AccordionItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value,
  children,
  className,
}) => {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn('overflow-hidden first:rounded-t-xl last:rounded-b-xl', className)}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

export const AccordionTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  const isOpen = item?.value ? accordion?.openItems.includes(item.value) : false;

  return (
    <button
      type="button"
      onClick={() => item?.value && accordion?.toggleItem(item.value)}
      className={cn(
        'flex w-full items-center justify-between px-5 py-4 text-left font-bold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn('h-5 w-5 text-slate-400 transition-transform duration-200', isOpen && 'rotate-180 text-indigo-600')}
      />
    </button>
  );
};

export const AccordionContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  const isOpen = item?.value ? accordion?.openItems.includes(item.value) : false;

  if (!isOpen) return null;

  return (
    <div
      className={cn('px-5 pb-4 pt-1 text-sm text-slate-600 animate-in fade-in duration-150 border-t border-slate-50', className)}
      {...props}
    >
      {children}
    </div>
  );
};
