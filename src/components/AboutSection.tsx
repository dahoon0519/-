import React from 'react';
import { Language, SiteContent } from '../types';
import { translations } from '../i18n/translations';
import { EditableText } from './EditableText';

interface AboutSectionProps {
  currentLang: Language;
  siteAbout?: SiteContent['about'];
  isEditMode?: boolean;
  onUpdateAboutField?: (field: string, value: string) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  currentLang,
  siteAbout,
  isEditMode = false,
  onUpdateAboutField,
}) => {
  const t = translations[currentLang];

  const title = siteAbout?.title[currentLang] || t.about.title;
  const intro1_heading = siteAbout?.intro1_heading[currentLang] || t.about.intro1_heading;
  const intro1_body = siteAbout?.intro1_body[currentLang] || t.about.intro1_body;
  const intro2_heading = siteAbout?.intro2_heading[currentLang] || t.about.intro2_heading;
  const intro2_body = siteAbout?.intro2_body[currentLang] || t.about.intro2_body;
  const intro3_heading = siteAbout?.intro3_heading[currentLang] || t.about.intro3_heading;
  const intro3_body = siteAbout?.intro3_body[currentLang] || t.about.intro3_body;
  const intro4_heading = siteAbout?.intro4_heading[currentLang] || t.about.intro4_heading;
  const intro4_body = siteAbout?.intro4_body[currentLang] || t.about.intro4_body;
  const closing = siteAbout?.closing[currentLang] || t.about.closing;

  const stories = [
    {
      num: '01',
      fieldHeading: 'intro1_heading',
      fieldBody: 'intro1_body',
      heading: intro1_heading,
      body: intro1_body,
    },
    {
      num: '02',
      fieldHeading: 'intro2_heading',
      fieldBody: 'intro2_body',
      heading: intro2_heading,
      body: intro2_body,
    },
    {
      num: '03',
      fieldHeading: 'intro3_heading',
      fieldBody: 'intro3_body',
      heading: intro3_heading,
      body: intro3_body,
    },
    {
      num: '04',
      fieldHeading: 'intro4_heading',
      fieldBody: 'intro4_body',
      heading: intro4_heading,
      body: intro4_body,
    },
  ];

  return (
    <section id="about" className="py-20 md:py-28 border-b border-[#EDE8DF]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-14 sm:mb-18">
          <p className="text-xs tracking-[0.2em] text-[#8F887C] uppercase font-sans-jp mb-2">
            About Me
          </p>
          <EditableText
            isEditMode={isEditMode}
            value={title}
            onChange={(val) => onUpdateAboutField?.('title', val)}
            as="h2"
            className="text-2xl sm:text-3xl font-serif-jp text-[#1C1A19] font-normal tracking-wide block"
          />
          <div className="w-12 h-[1px] bg-[#B0A799] mt-4" />
        </div>

        {/* Narrative Flow: 4 Chapters */}
        <div className="space-y-12 sm:space-y-16">
          {stories.map((story) => (
            <article key={story.num} className="group">
              <div className="flex items-baseline gap-4 mb-3">
                <span className="text-xs text-[#9E978C] font-mono tracking-widest shrink-0">
                  {story.num}
                </span>
                <div className="flex-1">
                  <EditableText
                    isEditMode={isEditMode}
                    value={story.heading}
                    onChange={(val) => onUpdateAboutField?.(story.fieldHeading, val)}
                    as="h3"
                    className="text-lg sm:text-xl font-serif-jp text-[#2E2B27] font-medium leading-snug block"
                  />
                </div>
              </div>
              <div className="pl-8 border-l border-[#EBE5DB]">
                <EditableText
                  isEditMode={isEditMode}
                  value={story.body}
                  onChange={(val) => onUpdateAboutField?.(story.fieldBody, val)}
                  as="p"
                  multiline
                  className="text-sm sm:text-[15px] text-[#544E45] leading-relaxed sm:leading-loose block"
                />
              </div>
            </article>
          ))}
        </div>

        {/* Closing Thought */}
        <div className="mt-16 sm:mt-20 pt-10 border-t border-[#EDE7DD] text-center">
          <span className="font-serif-jp text-base sm:text-lg text-[#3B362F] italic tracking-wide leading-relaxed">
            「
            <EditableText
              isEditMode={isEditMode}
              value={closing}
              onChange={(val) => onUpdateAboutField?.('closing', val)}
              as="span"
              className="inline"
            />
            」
          </span>
        </div>
      </div>
    </section>
  );
};
