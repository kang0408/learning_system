import React, { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Generates clean uppercase initials from a user's name or email.
 * For example:
 * - "Thầy David Trần" -> "DT"
 * - "David Trần" -> "DT"
 * - "David" -> "D"
 * - "teacher.david@system.com" -> "TD"
 */
export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const cleaned = name.trim();
  if (!cleaned) return 'U';

  const isEmail = cleaned.includes('@');
  const baseString = isEmail ? cleaned.split('@')[0].replace(/[._-]+/g, ' ') : cleaned;

  const rawWords = baseString.split(/\s+/).filter((w) => w.length > 0);
  if (rawWords.length === 0) return 'U';

  const titleRegex = /^(thầy|cô|bác|anh|chị|em|ông|bà|mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)$/i;
  const meaningfulWords =
    rawWords.length > 1 ? rawWords.filter((w) => !titleRegex.test(w)) : rawWords;

  const words = meaningfulWords.length > 0 ? meaningfulWords : rawWords;

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  const firstChar = words[0].charAt(0).toUpperCase();
  const lastChar = words[words.length - 1].charAt(0).toUpperCase();
  return `${firstChar}${lastChar}`;
}

/**
 * Safely resolves an avatar URL, handling absolute URLs, blob URLs, and relative paths.
 */
export function getAvatarUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string' || !url.trim()) return undefined;
  const clean = url.trim();
  if (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('blob:') ||
    clean.startsWith('data:')
  ) {
    return clean;
  }
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const path = clean.startsWith('/') ? clean : `/${clean}`;
  return apiBase ? `${apiBase}${path}` : path;
}

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
  showIconIfEmpty?: boolean;
}

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({
  className,
  name,
  showIconIfEmpty = true,
  children,
  ...props
}) => {
  const initials = name ? getInitials(name) : '';

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 font-bold text-white select-none',
        className
      )}
      {...props}
    >
      {children || (initials ? initials : showIconIfEmpty ? <UserIcon className="w-1/2 h-1/2 text-white/90" /> : 'U')}
    </div>
  );
};
