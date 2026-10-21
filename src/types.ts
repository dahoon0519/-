export type Language = 'ja' | 'ko' | 'en';

export interface LatteArtPhoto {
  id: string;
  title: string;
  description: string;
  date?: string;
  type?: string;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  technique?: string;
  milkTexturingNotes?: string;
  altText?: string;
  titleI18n?: Partial<Record<Language, string>>;
  descriptionI18n?: Partial<Record<Language, string>>;
  typeI18n?: Partial<Record<Language, string>>;
  techniqueI18n?: Partial<Record<Language, string>>;
  milkNotesI18n?: Partial<Record<Language, string>>;
  altTextI18n?: Partial<Record<Language, string>>;
}

export interface CafeVisit {
  id: string;
  name: string;
  location: string;
  coffee: string;
  notes: string;
  date?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  altText?: string;
  beanOrigin?: string;
  variety?: string;
  processingMethod?: string;
  brewingMethod?: string;
  personalImpressions?: string;
  nameI18n?: Partial<Record<Language, string>>;
  locationI18n?: Partial<Record<Language, string>>;
  coffeeI18n?: Partial<Record<Language, string>>;
  notesI18n?: Partial<Record<Language, string>>;
  beanOriginI18n?: Partial<Record<Language, string>>;
  varietyI18n?: Partial<Record<Language, string>>;
  processingMethodI18n?: Partial<Record<Language, string>>;
  brewingMethodI18n?: Partial<Record<Language, string>>;
  personalImpressionsI18n?: Partial<Record<Language, string>>;
  altTextI18n?: Partial<Record<Language, string>>;
}

export interface FoodPhoto {
  id: string;
  title: string;
  dishName?: string;
  description: string;
  category: string;
  date?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  altText?: string;
  ingredients?: string;
  preparationMethod?: string;
  cookingTechniques?: string;
  titleI18n?: Partial<Record<Language, string>>;
  dishNameI18n?: Partial<Record<Language, string>>;
  descriptionI18n?: Partial<Record<Language, string>>;
  categoryI18n?: Partial<Record<Language, string>>;
  dateI18n?: Partial<Record<Language, string>>;
  ingredientsI18n?: Partial<Record<Language, string>>;
  preparationMethodI18n?: Partial<Record<Language, string>>;
  cookingTechniquesI18n?: Partial<Record<Language, string>>;
  altTextI18n?: Partial<Record<Language, string>>;
}

export interface CoffeeSectionContent {
  sectionTitle?: string;
  sectionSubtitle?: string;
  espresso: {
    title: string;
    tag: string;
    body: string;
    points: string[];
    note?: string;
  };
  sensory: {
    title: string;
    tag: string;
    body: string;
    points: string[];
  };
  handDrip: {
    title: string;
    tag: string;
    body: string;
    points: string[];
    photoNote?: string;
  };
  cafeVisitsIntro: {
    title: string;
    tag: string;
    body: string;
  };
}

export interface FoodOverviewContent {
  title: string;
  subtitle: string;
  roleBadge: string;
  roleTitle: string;
  roleDesc: string;
  pastNote: string;
}

export interface ProfileInfo {
  name: string;
  email: string;
  instagram: string;
  location: string;
}

export interface HeroPhotoInfo {
  imageUrl: string;
  title: string;
  type?: string;
  description?: string;
  mediaType?: 'image' | 'video';
}

export interface SiteCategoryItem {
  id: string;
  label: Record<Language, string>;
  targetId: string;
  enabled: boolean;
  order: number;
}

export interface ContactInquiry {
  id: string;
  name: string;
  phone?: string;
  email: string;
  message: string;
  company?: string;
  createdAt: string;
  targetEmail?: string;
  notificationStatus?: 'sent' | 'failed' | 'not_configured' | 'pending';
  notificationError?: string | null;
  notifiedAt?: string | null;
}

export interface SiteContent {
  version: string;
  updatedAt: string;
  categories: SiteCategoryItem[];
  hero: {
    name: string;
    title: Record<Language, string>;
    keywords: Record<Language, string[]>;
    subtext: Record<Language, string>;
    viewWork: Record<Language, string>;
    contactMe: Record<Language, string>;
  };
  about: {
    title: Record<Language, string>;
    intro1_heading: Record<Language, string>;
    intro1_body: Record<Language, string>;
    intro2_heading: Record<Language, string>;
    intro2_body: Record<Language, string>;
    intro3_heading: Record<Language, string>;
    intro3_body: Record<Language, string>;
    intro4_heading: Record<Language, string>;
    intro4_body: Record<Language, string>;
    closing: Record<Language, string>;
  };
  coffee: {
    title: Record<Language, string>;
    subtitle: Record<Language, string>;
    espresso: Record<
      Language,
      {
        title: string;
        tag: string;
        body: string;
        points: string[];
        note?: string;
      }
    >;
    sensory: Record<
      Language,
      {
        title: string;
        tag: string;
        body: string;
        points: string[];
      }
    >;
    handDrip: Record<
      Language,
      {
        title: string;
        tag: string;
        body: string;
        points: string[];
        photoNote?: string;
      }
    >;
    roasting: Record<
      Language,
      {
        title: string;
        tag: string;
        body: string;
      }
    >;
    cafeVisits: Record<
      Language,
      {
        title: string;
        tag: string;
        body: string;
        emptyNote: string;
        addBtn: string;
      }
    >;
  };
  latteArt: {
    title: Record<Language, string>;
    subtitle: Record<Language, string>;
    body: Record<Language, string>;
    note: Record<Language, string>;
    manageBtn: Record<Language, string>;
  };
  food: {
    title: Record<Language, string>;
    subtitle: Record<Language, string>;
    currentRole: Record<Language, string>;
    currentDesc: Record<Language, string>;
    pastNote: Record<Language, string>;
    foodPhotoNote: Record<Language, string>;
  };
  experience: {
    title: Record<Language, string>;
    subtitle: Record<Language, string>;
    rolesLabel: Record<Language, string>;
    roles: Record<
      Language,
      Array<{
        id?: string;
        period: string;
        company: string;
        role: string;
        part: string;
        description: string;
        highlights: string[];
      }>
    >;
  };
  values: {
    title: Record<Language, string>;
    subtitle: Record<Language, string>;
    items: Record<
      Language,
      Array<{
        id?: string;
        title: string;
        description: string;
      }>
    >;
    closing: Record<Language, string>;
  };
  contact: {
    title: Record<Language, string>;
    subtitle: Record<Language, string>;
    name: string;
    titleText: Record<Language, string>;
    skillsText: Record<Language, string>;
    emailLabel: Record<Language, string>;
    emailValue: string;
    copyEmail: Record<Language, string>;
    copied: Record<Language, string>;
    locationLabel: Record<Language, string>;
    locationValue: Record<Language, string>;
    instagramLabel: Record<Language, string>;
    instagramPlaceholder: string;
    portfolioLabel: Record<Language, string>;
    note: Record<Language, string>;
    formTitle: Record<Language, string>;
    formSubtitle: Record<Language, string>;
    nameField: Record<Language, string>;
    namePlaceholder: Record<Language, string>;
    phoneField: Record<Language, string>;
    phonePlaceholder: Record<Language, string>;
    emailField: Record<Language, string>;
    emailPlaceholder: Record<Language, string>;
    messageField: Record<Language, string>;
    messagePlaceholder: Record<Language, string>;
    sendButton: Record<Language, string>;
    sendingButton: Record<Language, string>;
    sentSuccess: Record<Language, string>;
    directMailButton: Record<Language, string>;
    statements: Record<Language, string[]>;
  };
  footer: {
    text: Record<Language, string>;
    quote: Record<Language, string>;
  };
  lattePhotos?: LatteArtPhoto[];
  cafeVisits?: CafeVisit[];
  foodPhotos?: FoodPhoto[];
  handDripPhotoUrl?: string | null;
  heroPhoto?: HeroPhotoInfo;
}

export interface ContentVersion {
  id: string;
  versionNumber: number;
  timestamp: string;
  author: string;
  summary: string;
  content: SiteContent;
}

export interface ContentEnvelope {
  published: SiteContent;
  draft: SiteContent | null;
  history: ContentVersion[];
}

export const isVideoMedia = (
  url?: string,
  mediaType?: 'image' | 'video'
): boolean => {
  if (mediaType === 'video') return true;
  if (!url) return false;
  return (
    url.startsWith('data:video/') ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov') ||
    url.endsWith('.ogg') ||
    url.includes('blob:')
  );
};
