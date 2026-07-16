import { useEffect, useState } from 'react';

interface UseAntiCheatOptions {
  onForceSubmit: () => void;
  onWarning: (warnings: number, maxWarnings: number) => void;
  maxWarnings?: number;
  enabled?: boolean;
}

export function useAntiCheat({ onForceSubmit, onWarning, maxWarnings = 3, enabled = true }: UseAntiCheatOptions) {
  const [warnings, setWarnings] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    // Chặn chuột phải
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Chặn copy, cut, paste
    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // Chặn F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault();
      }
      if (e.ctrlKey && e.key.toUpperCase() === 'U') {
        e.preventDefault();
      }
    };

    // Cảnh báo khi chuyển tab, thu nhỏ trình duyệt, hoặc click ra ngoài cửa sổ
    const handleVisibilityOrBlur = () => {
      // document.hidden cho tab chuyển đi, !document.hasFocus() hoặc sự kiện blur khi ấn sang cửa sổ app khác
      if (document.hidden || !document.hasFocus()) {
        setWarnings(prev => {
          const next = prev + 1;
          if (next >= maxWarnings) {
            onForceSubmit();
          } else {
            onWarning(next, maxWarnings);
          }
          return next;
        });
      }
    };

    // Đảm bảo không bị trigger blur nhiều lần cùng 1 lúc
    let timeout: ReturnType<typeof setTimeout>;
    const debounceBlur = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleVisibilityOrBlur, 200);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', debounceBlur);
    window.addEventListener('blur', debounceBlur);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', debounceBlur);
      window.removeEventListener('blur', debounceBlur);
    };
  }, [enabled, maxWarnings, onForceSubmit, onWarning]);

  return { warnings, maxWarnings };
}
