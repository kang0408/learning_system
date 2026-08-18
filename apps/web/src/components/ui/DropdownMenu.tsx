import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from '@/utils/cn';

interface DropdownContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

export const DropdownMenu: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={menuRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, onClick, ...props }) => {
  const context = useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        context?.setIsOpen(!context.isOpen);
      }}
      className={cn('inline-flex items-center justify-center focus:outline-none', className)}
      {...props}
    >
      {children}
    </button>
  );
};

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right';
}

export const DropdownMenuContent: React.FC<DropdownMenuContentProps> = ({ className, align = 'right', children, ...props }) => {
  const context = useContext(DropdownContext);
  if (!context?.isOpen) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50 animate-in fade-in-50 zoom-in-95 duration-150',
        align === 'right' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({ className, destructive, children, onClick, ...props }) => {
  const context = useContext(DropdownContext);

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        context?.setIsOpen(false);
      }}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none',
        destructive
          ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuLabel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider', className)} {...props} />
);

export const DropdownMenuSeparator: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('-mx-1.5 my-1 h-px bg-slate-100', className)} {...props} />
);
