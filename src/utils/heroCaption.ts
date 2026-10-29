import { HeroPhotoInfo, Language } from '../types';

// Preserve the existing published caption while providing translations for
// this specific video until an editor supplies explicit localized values.
export function heroCaption(photo: HeroPhotoInfo, language: Language) {
  const legacy = photo.title === '고객님께서 찍어주셨던' && photo.type === '라떼아트 푸어 영상';
  const fallbackTitle = legacy ? {
    ko: '고객님께서 찍어주셨던', ja: 'お客様が撮影してくださった', en: 'Filmed by a guest',
  }[language] : photo.title;
  const fallbackType = legacy ? {
    ko: '라떼아트 푸어 영상', ja: 'ラテアートの動画', en: 'Latte art pour',
  }[language] : (photo.type || '');
  return {
    title: photo.titleI18n?.[language] ?? fallbackTitle,
    type: photo.typeI18n?.[language] ?? fallbackType,
  };
}
