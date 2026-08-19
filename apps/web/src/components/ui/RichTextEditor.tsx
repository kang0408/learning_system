import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Undo,
  Redo,
  RemoveFormatting,
  Code2,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { cn } from '@/utils/cn';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung bài học tại đây...',
  className = '',
  error = false,
  minHeight = '200px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingFromProps = useRef(false);
  const [isCodeView, setIsCodeView] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);

  // Sync value from props to editor without losing cursor when user types
  useEffect(() => {
    if (editorRef.current && !isUpdatingFromProps.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setRawHtml(value || '');
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isUpdatingFromProps.current = true;
      const html = editorRef.current.innerHTML;
      const cleanHtml = html === '<p><br></p>' || html === '<br>' ? '' : html;
      onChange(cleanHtml);
      setRawHtml(cleanHtml);
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 0);
    }
  }, [onChange]);

  const exec = (command: string, value: string | undefined = undefined) => {
    if (isCodeView) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleFormatBlock = (tag: string) => {
    exec('formatBlock', `<${tag}>`);
  };

  const handleInsertLink = () => {
    if (isCodeView) return;
    const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
    if (url && url.trim()) {
      exec('createLink', url.trim());
    }
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newHtml = e.target.value;
    setRawHtml(newHtml);
    onChange(newHtml);
  };

  return (
    <div
      className={cn(
        'w-full bg-white border rounded-xl shadow-sm transition-colors overflow-hidden flex flex-col',
        error ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-400/20' : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => exec('undo')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => handleFormatBlock('h2')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Tiêu đề lớn (H2)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock('h3')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Tiêu đề vừa (H3)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock('h4')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Tiêu đề nhỏ (H4)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Basic Styles */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => exec('bold')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors font-bold"
            title="Đậm (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors italic"
            title="Nghiêng (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors underline"
            title="Gạch chân (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors line-through"
            title="Gạch ngang"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Danh sách dấu chấm"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Danh sách số"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock('blockquote')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Trích dẫn"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormatBlock('pre')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Khối mã (Code)"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Alignments */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Căn trái"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Căn giữa"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Căn phải"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Insert Link & Clean */}
        <div className="flex items-center gap-0.5 px-1.5">
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Chèn liên kết"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            title="Xóa định dạng"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>

        {/* Code / Visual Toggle Mode */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => setIsCodeView(!isCodeView)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors',
              isCodeView
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            )}
            title={isCodeView ? 'Chuyển sang chế độ soạn thảo trực quan' : 'Chuyển sang chế độ mã HTML'}
          >
            {isCodeView ? (
              <>
                <Eye className="w-3.5 h-3.5" /> Trực quan
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5" /> Mã HTML
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative flex-1 bg-white">
        {isCodeView ? (
          <textarea
            value={rawHtml}
            onChange={handleRawHtmlChange}
            style={{ minHeight }}
            className="w-full p-4 font-mono text-xs text-slate-800 focus:outline-none resize-y leading-relaxed bg-slate-900 text-slate-100"
            placeholder="<html>Nhập mã HTML tại đây...</html>"
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            style={{ minHeight }}
            data-placeholder={placeholder}
            className={cn(
              'p-4 text-sm text-slate-800 focus:outline-none overflow-y-auto leading-relaxed prose prose-sm max-w-none',
              'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none'
            )}
          />
        )}
      </div>
    </div>
  );
};
