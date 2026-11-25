import { EditableText } from './EditableText';
import { createContext, useContext } from 'react';
import type { Language } from '../types';
import { resolvePageCopy, type PageCopyKey, type PageCopyOverrides } from '../data/pageCopy';

export const PageCopyContext = createContext<PageCopyOverrides | undefined>(undefined);

export function usePageCopy(lang: Language) {
  const overrides = useContext(PageCopyContext);
  return (key: PageCopyKey) => resolvePageCopy(overrides, key, lang);
}

export const PageLabelEditor = createContext<((key: PageCopyKey, value: string) => void) | null>(null);
export function PageLabel({ name, lang }: { name: PageCopyKey; lang: Language }) {
  const change = useContext(PageLabelEditor);
  const value = usePageCopy(lang)(name);
  return <EditableText isEditMode={!!change} value={value} onChange={text => change?.(name, text)} />;
}
