import React from 'react';
import { Language, SiteContent } from '../types';
import { translations } from '../i18n/translations';
import { EditableText } from './EditableText';

interface ExperienceSectionProps {
  currentLang: Language;
  siteExperience?: SiteContent['experience'];
  isEditMode?: boolean;
  onUpdateExperienceText?: (
    field: 'title' | 'subtitle' | 'rolesLabel' | 'roleCompany' | 'roleTitle' | 'rolePeriod' | 'roleDesc',
    value: string,
    index?: number
  ) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  currentLang,
  siteExperience,
  isEditMode = false,
  onUpdateExperienceText,
}) => {
  const t = translations[currentLang];

  const title = siteExperience?.title[currentLang] || t.experience.title;
  const subtitle = siteExperience?.subtitle[currentLang] || t.experience.subtitle;
  const rolesLabel = siteExperience?.rolesLabel[currentLang] || (currentLang === 'ja'
    ? '実際の担当実務：'
    : currentLang === 'ko'
    ? '실제 담당 업무:'
    : 'Hands-on Responsibilities:');
  const roles = siteExperience?.roles[currentLang] || t.experience.roles;

  return (
    <section id="experience" className="py-20 md:py-28 border-b border-[#EDE8DF]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-14 sm:mb-18">
          <p className="text-xs tracking-[0.2em] text-[#8F887C] uppercase font-sans-jp mb-2">
            Experience & Career
          </p>
          <EditableText
            isEditMode={isEditMode}
            value={title}
            onChange={(val) => onUpdateExperienceText?.('title', val)}
            as="h2"
            className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
          />
          <div className="mt-2">
            <EditableText
              isEditMode={isEditMode}
              value={subtitle}
              onChange={(val) => onUpdateExperienceText?.('subtitle', val)}
              as="p"
              className="text-sm text-[#736D64] max-w-xl block"
            />
          </div>
          <div className="w-12 h-[1px] bg-[#B0A799] mt-4" />
        </div>

        {/* Timeline */}
        <div className="relative pl-6 sm:pl-8 border-l border-[#DED7CB] space-y-12 sm:space-y-14 ml-2 sm:ml-4">
          {roles.map((item, idx) => {
            const isCurrent = idx === 0;
            const roleKey = (item as any).id || `exp-role-${idx}`;
            return (
              <div key={roleKey} className="relative group">
                {/* Timeline node marker */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                    isCurrent
                      ? 'bg-[#634832] border-[#FAF8F5] ring-2 ring-[#634832]/30'
                      : 'bg-[#B0A89C] border-[#FAF8F5]'
                  }`}
                />

                {/* Role Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <div className="flex items-center gap-3">
                    <EditableText
                      isEditMode={isEditMode}
                      value={item.company}
                      onChange={(val) => onUpdateExperienceText?.('roleCompany', val, idx)}
                      as="h3"
                      className="text-lg sm:text-xl font-serif-jp text-[#1F1E1D] font-medium"
                    />
                    <EditableText
                      isEditMode={isEditMode}
                      value={item.role}
                      onChange={(val) => onUpdateExperienceText?.('roleTitle', val, idx)}
                      as="span"
                      className="text-xs text-[#80796E] font-sans-jp"
                    />
                  </div>
                  <EditableText
                    isEditMode={isEditMode}
                    value={`${item.period} · ${item.part}`}
                    onChange={(val) => onUpdateExperienceText?.('rolePeriod', val, idx)}
                    as="span"
                    className="text-xs font-mono text-[#8C8476] tracking-wider"
                  />
                </div>

                {/* Role Description */}
                <EditableText
                  isEditMode={isEditMode}
                  value={item.description}
                  onChange={(val) => onUpdateExperienceText?.('roleDesc', val, idx)}
                  as="p"
                  multiline
                  className="text-sm text-[#544E45] leading-relaxed mb-3.5 block"
                />

                {/* Practical duties list */}
                <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded p-4 text-xs text-[#635D53]">
                  <EditableText
                    isEditMode={isEditMode}
                    value={rolesLabel}
                    onChange={(val) => onUpdateExperienceText?.('rolesLabel', val)}
                    as="span"
                    className="block font-medium text-[#38332C] mb-2 font-serif-jp"
                  />
                  <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-[#5E584F]">
                    {item.highlights.map((duty, dIdx) => (
                      <React.Fragment key={`exp-duty-${(item as any).id || idx}-${dIdx}`}>
                        <span className="hover:text-[#1F1E1D] transition-colors">
                          {duty}
                        </span>
                        {dIdx < item.highlights.length - 1 && (
                          <span className="text-[#CCC4B6] select-none">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
