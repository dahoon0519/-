import type { Language } from '../types';

type PatternLabels = Record<Language, string>;

export const lattePatterns: Record<string, PatternLabels> = {
  Swan: { ja: 'スワン', ko: '스완', en: 'Swan' },
  'Wing Swan': { ja: 'ウィングスワン', ko: '윙 스완', en: 'Wing Swan' },
  Rosetta: { ja: 'ロゼッタ', ko: '로제타', en: 'Rosetta' },
  Tulip: { ja: 'チューリップ', ko: '튤립', en: 'Tulip' },
  Heart: { ja: 'ハート', ko: '하트', en: 'Heart' },
  'Wave Heart': { ja: 'ウェーブハート', ko: '물결 하트', en: 'Wave Heart' },
  'Wave Tulip': { ja: 'ウェーブとチューリップ', ko: '물결과 튤립', en: 'Wave and Tulip' },
  'Slow Pour': { ja: 'スローポア', ko: '슬로우 푸어', en: 'Slow Pour' },
  'Free Pour': { ja: 'フリーポア', ko: '프리 푸어', en: 'Free Pour' },
  Other: { ja: 'その他', ko: '기타', en: 'Other' },
};

export const findLattePattern = (name: string): string | undefined => {
  const normalised = name.trim().toLocaleLowerCase();
  return Object.entries(lattePatterns).find(([pattern, translations]) =>
    pattern.toLocaleLowerCase() === normalised ||
    Object.values(translations).some((label) => label.toLocaleLowerCase() === normalised)
  )?.[0];
};

// Unlisted names remain intact and fall back to the text the user entered.
export const labelsForLattePattern = (name: string): PatternLabels => {
  const pattern = findLattePattern(name);
  const labels = pattern ? lattePatterns[pattern] : undefined;
  return labels ? { ...labels } : { ja: '', ko: '', en: '' };
};
