import React, { useRef, useEffect } from 'react';
import { Language } from '../types';

interface EditableTextProps {
  isEditMode: boolean;
  value: string;
  onChange: (newValue: string) => void;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'blockquote';
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  lang?: Language;
}

export const EditableText: React.FC<EditableTextProps> = ({
  isEditMode,
  value,
  onChange,
  as: Component = 'span',
  className = '',
  multiline = false,
  placeholder = '',
  lang,
}) => {
  const contentRef = useRef<HTMLElement | null>(null);

  // Sync content with value when value changes externally
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== value) {
      contentRef.current.innerText = value || '';
    }
  }, [value]);

  if (!isEditMode) {
    return <Component className={className}>{value || placeholder}</Component>;
  }

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText;
    if (text !== value) {
      onChange(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const activeLang: Language =
    lang ||
    (typeof document !== 'undefined' && (document.documentElement.lang as Language)) ||
    'ja';

  const tooltipText =
    activeLang === 'ja'
      ? 'クリックして直接編集 (Enter: 確定, Shift+Enter: 改行)'
      : activeLang === 'ko'
      ? '클릭하여 바로 수정 (Enter: 완료, 줄바꿈: Shift+Enter)'
      : 'Click to edit directly (Enter: Done, Shift+Enter: Newline)';

  return (
    <Component
      // @ts-expect-error dynamic component ref
      ref={contentRef}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`${className} outline-dashed outline-1 outline-amber-600/50 hover:outline-amber-600 hover:bg-amber-100/25 focus:outline-2 focus:outline-amber-600 focus:bg-amber-50/40 rounded-xs px-0.5 transition-all cursor-text relative group/editable`}
      title={tooltipText}
    >
      {value || placeholder}
    </Component>
  );
};

