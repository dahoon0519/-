import React from 'react';
import { Language, SiteContent } from '../types';
import { translations } from '../i18n/translations';
import { EditableText } from './EditableText';

interface ValuesSectionProps {
  currentLang: Language;
  siteValues?: SiteContent['values'];
  isEditMode?: boolean;
  onUpdateValuesText?: (field: 'title' | 'subtitle' | 'closing' | 'itemTitle' | 'itemDesc', value: string, index?: number) => void;
}

export const ValuesSection: React.FC<ValuesSectionProps> = ({
  currentLang,
  siteValues,
  isEditMode = false,
  onUpdateValuesText,
}) => {
  const t = translations[currentLang];

  const title = siteValues?.title[currentLang] || t.values.title;
  const subtitle = siteValues?.subtitle[currentLang] ?? t.values.subtitle;
  const items = siteValues?.items[currentLang] || t.values.items;
  const closing = siteValues?.closing[currentLang] ?? t.values.closing;

  return (
    <section id="values" className="py-20 md:py-28 border-b border-[#EDE8DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14 sm:mb-18">
          <p className="text-xs tracking-[0.2em] text-[#8F887C] uppercase font-sans-jp mb-2">
            Values & Mindset
          </p>
          <EditableText
            isEditMode={isEditMode}
            value={title}
            onChange={(val) => onUpdateValuesText?.('title', val)}
            as="h2"
            className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
          />
          {(subtitle?.trim() || isEditMode) && (
            <div className="mt-2">
              <EditableText
                isEditMode={isEditMode}
                value={subtitle}
                onChange={(val) => onUpdateValuesText?.('subtitle', val)}
                as="p"
                className="text-sm text-[#736D64] max-w-xl block"
              />
            </div>
          )}
          <div className="w-12 h-[1px] bg-[#B0A799] mt-4" />
        </div>

        {/* 4 Core Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
          {items.map((val, idx) => (
            <div
              key={(val as any).id || `val-item-${idx + 1}`}
              className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg p-6 sm:p-8 flex flex-col justify-between"
            >
              <div>
                <span className="text-xs text-[#9E978C] font-mono tracking-widest block mb-2">
                  0{idx + 1}
                </span>
                <EditableText
                  isEditMode={isEditMode}
                  value={val.title}
                  onChange={(newTitle) => onUpdateValuesText?.('itemTitle', newTitle, idx)}
                  as="h3"
                  className="text-lg sm:text-xl font-serif-jp text-[#24211E] font-medium mb-3 block"
                />
                <EditableText
                  isEditMode={isEditMode}
                  value={val.description}
                  onChange={(newDesc) => onUpdateValuesText?.('itemDesc', newDesc, idx)}
                  as="p"
                  multiline
                  className="text-sm text-[#544E45] leading-relaxed block"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Final Reflective Message */}
        {(closing?.trim() || isEditMode) && (
          <div className="mt-14 sm:mt-18 p-8 rounded-lg bg-[#F5F0E6] border border-[#E0D7C9] text-center max-w-2xl mx-auto">
            <span className="font-serif-jp text-base sm:text-lg text-[#2E2822] leading-relaxed">
              {closing?.trim() ? '「' : ''}
              <EditableText
                isEditMode={isEditMode}
                value={closing}
                onChange={(val) => onUpdateValuesText?.('closing', val)}
                as="span"
                className="inline"
              />
              {closing?.trim() ? '」' : ''}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
