import React, { useState } from 'react';
import { cn } from '@/utils/cn';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ className, size = 'md', children, ...props }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full shadow-sm border border-slate-200/80 select-none',
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({ className, src, alt, ...props }) => {
  const [hasError, setHasError] = useState(!src);

  if (hasError || !src) return null;

  return (
    <img
      src={src}
      alt={alt || 'Avatar'}
      onError={() => setHasError(true)}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
};

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className, name, children, ...props }) => {
  const fallbackChar = (name?.trim().charAt(0) || 'U').toUpperCase();

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 font-bold text-white',
        className
      )}
      {...props}
    >
      {children || fallbackChar}
    </div>
  );
};
