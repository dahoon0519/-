import React, { useState, useEffect } from 'react';
import {
  Language,
  LatteArtPhoto,
  CafeVisit,
  FoodPhoto,
  ProfileInfo,
  HeroPhotoInfo,
  CoffeeSectionContent,
  FoodOverviewContent,
  isVideoMedia,
  SiteContent,
} from './types';
import { translations } from './i18n/translations';
import { defaultSiteContent } from './data/defaultSiteContent';
import {
  loadPublishedContent,
  loadDraftContent,
  saveDraftContent,
  publishContent,
  discardDraftContent,
  restoreContentVersion,
  resetSiteContent,
  createCoffeeBackupSnapshot,
  getCoffeeSectionContent,
  updateCoffeeSectionInSiteContent,
  syncLegacyCoffeeStorageSingle,
} from './services/siteContentService';
import { authService, AdminUser } from './services/authService';
import {
  initialLatteArtPhotos,
  initialCafeVisits,
  initialFoodPhotos,
  initialCoffeeContentJa,
  initialCoffeeContentKo,
  initialFoodOverviewJa,
  initialFoodOverviewKo,
  initialFoodOverviewEn,
} from './data/initialData';
import { Header } from './components/Header';
import { HomeSection } from './components/HomeSection';
import { AboutSection } from './components/AboutSection';
import { CoffeeSection } from './components/CoffeeSection';
import { LatteArtSection } from './components/LatteArtSection';
import { FoodSection } from './components/FoodSection';
import { ExperienceSection } from './components/ExperienceSection';
import { ValuesSection } from './components/ValuesSection';
import { ContactSection } from './components/ContactSection';
import { LightboxModal } from './components/LightboxModal';
import { PhotoManagerModal } from './components/PhotoManagerModal';
import { AdminModal } from './components/AdminModal';
import { EditModeBar } from './components/EditModeBar';
import { EditableText } from './components/EditableText';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

function setDeepValue(obj: any, path: string, value: any) {
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!curr[p]) curr[p] = {};
    curr = curr[p];
  }
  curr[parts[parts.length - 1]] = value;
}

const defaultProfileInfo: ProfileInfo = {
  name: 'HAN DAHOON',
  email: 'dahoon0519@gmail.com',
  instagram: '@dahoon_coffee_food (準備中)',
  location: '日本国内（東京 / 近郊 / 関西等、柔軟に対応可能です）',
};

export default function App() {
  // Default language: Japanese ('ja')
  const [currentLang, setCurrentLang] = useState<Language>('ja');
  const [activeSection, setActiveSection] = useState<string>('home');

  // Synchronize document lang attribute with active language
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Published & Draft content state
  // Unauthenticated visitors strictly view publishedContent
  const [publishedContent, setPublishedContent] = useState<SiteContent>(defaultSiteContent);
  const [draftContent, setDraftContent] = useState<SiteContent | null>(null);
  const [isPreviewingDraft, setIsPreviewingDraft] = useState<boolean>(false);

  // Edit Mode state for live inline page editing (Admin only)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [savedSiteContentSnapshot, setSavedSiteContentSnapshot] = useState<SiteContent>(defaultSiteContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editStatusMessage, setEditStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Admin authentication state (Google Sign-In, single-admin: dahoon0519@gmail.com)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => authService.getCurrentAdmin());
  const [isAdmin, setIsAdmin] = useState<boolean>(() => authService.isAuthorizedAdmin());
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Initial Content & Server-Verified Session Load
  useEffect(() => {
    loadPublishedContent().then((loaded) => {
      if (loaded) {
        if (loaded.contact && loaded.contact.emailValue === 'dhgh159030@gmail.com') {
          loaded.contact.emailValue = 'dahoon0519@gmail.com';
        }
        setPublishedContent(loaded);
        setSavedSiteContentSnapshot(loaded);
        if (loaded.contact?.emailValue) {
          setProfileInfo((prev) => ({
            ...prev,
            email: loaded.contact.emailValue === 'dhgh159030@gmail.com' ? 'dahoon0519@gmail.com' : (loaded.contact.emailValue || 'dahoon0519@gmail.com'),
            name: loaded.contact.name || prev.name,
          }));
        }
      }
    });

    // Check genuine server-verified admin session
    authService.checkSession().then((res) => {
      if (res.authorized && res.user) {
        setAdminUser(res.user);
        setIsAdmin(true);
        loadDraftContent().then((draft) => {
          if (draft) {
            setDraftContent(draft);
          }
        });
      } else {
        setAdminUser(null);
        setIsAdmin(false);
      }
    });
  }, []);

  // Determine active content:
  // For unauthenticated visitors: STRICTLY publishedContent
  // For authorized admin: draftContent if editing/previewing, otherwise publishedContent
  const activeContent: SiteContent =
    isAdmin && (isEditMode || isPreviewingDraft || draftContent)
      ? draftContent || publishedContent
      : publishedContent;

  // Auto-disable edit mode if user logs out
  useEffect(() => {
    if (!isAdmin) {
      if (isEditMode) setIsEditMode(false);
      if (isPreviewingDraft) setIsPreviewingDraft(false);
      setDraftContent(null);
      setHasUnsavedChanges(false);
    }
  }, [isAdmin, isEditMode, isPreviewingDraft]);

  // Admin session handling
  const handleAdminLogin = (user?: AdminUser) => {
    if (user && user.email.toLowerCase() === authService.getAllowedAdminEmail().toLowerCase()) {
      authService.setAdminUser(user);
      setAdminUser(user);
      setIsAdmin(true);
      loadDraftContent().then((draft) => {
        if (draft) setDraftContent(draft);
      });
    }
  };

  const handleAdminLogout = async () => {
    await authService.signOut();
    setAdminUser(null);
    setIsAdmin(false);
    setIsAdminModalOpen(false);
    setIsEditMode(false);
    setIsPreviewingDraft(false);
    setDraftContent(null);
    setHasUnsavedChanges(false);
  };

  // Workflow Handlers: Draft, Preview, Publish, Discard, Restore
  const handleSaveDraft = async (newContent?: SiteContent) => {
    const target = newContent || draftContent || publishedContent;
    setIsSaving(true);
    try {
      const saved = await saveDraftContent(target);
      setDraftContent(saved);
      setSavedSiteContentSnapshot(JSON.parse(JSON.stringify(saved)));
      setHasUnsavedChanges(false);
      setEditStatusMessage({
        type: 'success',
        text:
          currentLang === 'ja'
            ? '下書きが安全に保存されました（公開サイトにはまだ反映されていません）。'
            : currentLang === 'ko'
            ? '임시저장본(Draft)이 안전하게 저장되었습니다 (방문자에게는 아직 미공개).'
            : 'Draft saved safely (not yet published to live site).',
      });
      setTimeout(() => setEditStatusMessage(null), 4000);
      return true;
    } catch (err: any) {
      setEditStatusMessage({
        type: 'error',
        text:
          currentLang === 'ja'
            ? `下書き保存に失敗しました: ${err.message || 'Error'}`
            : currentLang === 'ko'
            ? `임시저장 실패: ${err.message || 'Error'}`
            : `Failed to save draft: ${err.message || 'Error'}`,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (newContent?: SiteContent, summary?: string) => {
    const target = newContent || draftContent || publishedContent;
    setIsSaving(true);
    try {
      const published = await publishContent(target, summary);
      setPublishedContent(published);
      if (published.contact?.emailValue) {
        setProfileInfo((prev) => ({ ...prev, email: published.contact.emailValue }));
      }
      setDraftContent(null);
      setSavedSiteContentSnapshot(JSON.parse(JSON.stringify(published)));
      setHasUnsavedChanges(false);
      setIsPreviewingDraft(false);
      setEditStatusMessage({
        type: 'success',
        text:
          currentLang === 'ja'
            ? 'サイトに正常に公開・反映されました！(Published)'
            : currentLang === 'ko'
            ? '포트폴리오에 성공적으로 게시되었습니다! 방문자에게 즉시 반영됩니다.'
            : 'Portfolio successfully published live to all visitors!',
      });
      setTimeout(() => setEditStatusMessage(null), 4500);
      return true;
    } catch (err: any) {
      setEditStatusMessage({
        type: 'error',
        text:
          currentLang === 'ja'
            ? `公開に失敗しました: ${err.message || 'Error'}`
            : currentLang === 'ko'
            ? `게시 실패: ${err.message || 'Error'}`
            : `Publish failed: ${err.message || 'Error'}`,
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardDraft = async () => {
    try {
      await discardDraftContent();
      setDraftContent(null);
      setSavedSiteContentSnapshot(JSON.parse(JSON.stringify(publishedContent)));
      setHasUnsavedChanges(false);
      setIsPreviewingDraft(false);
      setEditStatusMessage({
        type: 'info',
        text:
          currentLang === 'ja'
            ? '下書きを破棄し、公開済みの状態に戻しました。'
            : currentLang === 'ko'
            ? '임시저장을 취소하고 공개된 최신 버전으로 되돌렸습니다.'
            : 'Draft discarded. Reverted back to live published version.',
      });
      setTimeout(() => setEditStatusMessage(null), 3000);
    } catch (err: any) {
      alert(
        currentLang === 'ja'
          ? `エラーが発生しました: ${err.message}`
          : currentLang === 'ko'
          ? `오류: ${err.message}`
          : `Error: ${err.message}`
      );
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const restored = await restoreContentVersion(versionId);
      setPublishedContent(restored);
      setDraftContent(null);
      setSavedSiteContentSnapshot(JSON.parse(JSON.stringify(restored)));
      setHasUnsavedChanges(false);
      setEditStatusMessage({
        type: 'success',
        text:
          currentLang === 'ja'
            ? '以前のバージョンに正常に復元され、公開されました。'
            : currentLang === 'ko'
            ? '이전 버전으로 성공적으로 복원되어 라이브 게시되었습니다.'
            : 'Successfully restored to previous version and published live.',
      });
      setTimeout(() => setEditStatusMessage(null), 4000);
    } catch (err: any) {
      alert(
        currentLang === 'ja'
          ? `復元に失敗しました: ${err.message}`
          : currentLang === 'ko'
          ? `복원 실패: ${err.message}`
          : `Restore failed: ${err.message}`
      );
    }
  };

  const handlePreviewToggle = () => {
    setIsPreviewingDraft((prev) => !prev);
  };

  const handleResetSiteContent = async () => {
    const reset = await resetSiteContent();
    setPublishedContent(reset);
    setDraftContent(null);
    setSavedSiteContentSnapshot(reset);
    setHasUnsavedChanges(false);
  };

  // Helper to mutate active content during inline editing (stores in draftContent)
  const updateActiveContent = (updater: (prev: SiteContent) => SiteContent) => {
    setHasUnsavedChanges(true);
    setDraftContent((prev) => {
      const base = prev || JSON.parse(JSON.stringify(publishedContent));
      return updater(base);
    });
  };

  // Live Edit Mode controls
  const handleToggleEditMode = () => {
    if (!isAdmin) return;
    if (!isEditMode) {
      // Entering edit mode: snapshot base
      const base = draftContent || publishedContent;
      setSavedSiteContentSnapshot(JSON.parse(JSON.stringify(base)));
      setHasUnsavedChanges(false);
      setIsEditMode(true);
      setEditStatusMessage({
        type: 'info',
        text:
          currentLang === 'ja'
            ? '編集モードがONになりました。ページ内のテキストをクリックして直接編集できます。'
            : currentLang === 'ko'
            ? '편집 모드가 켜졌습니다. 페이지의 텍스트를 클릭하여 바로 수정하세요.'
            : 'Edit Mode active. Click any text on the page to edit directly.',
      });
    } else {
      // Exiting edit mode
      if (hasUnsavedChanges) {
        const confirmMsg =
          currentLang === 'ja'
            ? '保存されていない変更があります。編集モードを終了しますか？（未保存の内容は破棄されます）'
            : currentLang === 'ko'
            ? '저장되지 않은 변경사항이 있습니다. 편집 모드를 종료하시겠습니까? (미저장 내용은 취소됩니다)'
            : 'You have unsaved changes. Exit edit mode and discard these changes?';
        if (!confirm(confirmMsg)) {
          return;
        }
        setDraftContent(JSON.parse(JSON.stringify(savedSiteContentSnapshot)));
        setHasUnsavedChanges(false);
      }
      setIsEditMode(false);
      setEditStatusMessage(null);
    }
  };

  const handleCancelEditMode = () => {
    setDraftContent(JSON.parse(JSON.stringify(savedSiteContentSnapshot)));
    setHasUnsavedChanges(false);
    setEditStatusMessage({
      type: 'info',
      text:
        currentLang === 'ja'
          ? '変更を取り消し、修正前の状態に戻しました。'
          : currentLang === 'ko'
          ? '수정을 취소하고 이전 상태로 되돌렸습니다.'
          : 'Changes discarded. Restored to previous state.',
    });
    setTimeout(() => setEditStatusMessage(null), 3000);
  };

  // Photo & Data states with LocalStorage persistence
  const [lattePhotos, setLattePhotos] = useState<LatteArtPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('dahoon_latte_photos');
      return saved ? JSON.parse(saved) : initialLatteArtPhotos;
    } catch {
      return initialLatteArtPhotos;
    }
  });

  const [heroPhoto, setHeroPhoto] = useState<HeroPhotoInfo>(() => {
    try {
      const saved = localStorage.getItem('dahoon_hero_photo');
      if (saved) return JSON.parse(saved);
    } catch {}
    const defaultItem = initialLatteArtPhotos[0];
    return {
      imageUrl: defaultItem.imageUrl,
      title: defaultItem.title,
      type: defaultItem.type || 'Swan Free Pour',
      description: defaultItem.description,
    };
  });

  const [cafeVisits, setCafeVisits] = useState<CafeVisit[]>(() => {
    try {
      const saved = localStorage.getItem('dahoon_cafe_visits');
      return saved ? JSON.parse(saved) : initialCafeVisits;
    } catch {
      return initialCafeVisits;
    }
  });

  const [foodPhotos, setFoodPhotos] = useState<FoodPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('dahoon_food_photos');
      return saved ? JSON.parse(saved) : initialFoodPhotos;
    } catch {
      return initialFoodPhotos;
    }
  });

  const [handDripPhotoUrl, setHandDripPhotoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('dahoon_hand_drip_photo');
    } catch {
      return null;
    }
  });

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>(() => {
    try {
      const saved = localStorage.getItem('dahoon_profile_info');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email === 'dhgh159030@gmail.com' || !parsed.email) {
          parsed.email = 'dahoon0519@gmail.com';
        }
        return parsed;
      }
      return defaultProfileInfo;
    } catch {
      return defaultProfileInfo;
    }
  });

  // Coffee 1~4 Explanations content derived canonically from activeContent.coffee
  const currentCoffeeContent = React.useMemo<CoffeeSectionContent>(() => {
    return getCoffeeSectionContent(activeContent.coffee, currentLang);
  }, [activeContent.coffee, currentLang]);

  const handleUpdateCoffeeContent = (newContent: CoffeeSectionContent) => {
    updateActiveContent((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.coffee = updateCoffeeSectionInSiteContent(copy.coffee, currentLang, newContent);
      return copy;
    });
    syncLegacyCoffeeStorageSingle(currentLang, newContent);
  };

  const handleResetCoffeeContent = () => {
    const defaultForLang = getCoffeeSectionContent(defaultSiteContent.coffee, currentLang);
    updateActiveContent((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.coffee = updateCoffeeSectionInSiteContent(copy.coffee, currentLang, defaultForLang);
      return copy;
    });
    syncLegacyCoffeeStorageSingle(currentLang, defaultForLang);
  };

  // Food Overview content
  const [foodOverviewJa, setFoodOverviewJa] = useState<FoodOverviewContent>(() => {
    try {
      const saved = localStorage.getItem('dahoon_food_overview_ja');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.title === '料理' ||
          parsed.title === '料理 & 퀴진' ||
          parsed.title === '料理 & 調理' ||
          parsed.title === 'Food & Culinary'
        ) {
          parsed.title = '料理 & キッチン';
        }
        return parsed;
      }
      return initialFoodOverviewJa;
    } catch {
      return initialFoodOverviewJa;
    }
  });

  const [foodOverviewKo, setFoodOverviewKo] = useState<FoodOverviewContent>(() => {
    try {
      const saved = localStorage.getItem('dahoon_food_overview_ko');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title === '요리 & 퀴진' || parsed.title === '요리' || parsed.title === 'Food & Culinary') {
          parsed.title = '요리 & 키친';
        }
        return parsed;
      }
      return initialFoodOverviewKo;
    } catch {
      return initialFoodOverviewKo;
    }
  });

  const [foodOverviewEn, setFoodOverviewEn] = useState<FoodOverviewContent>(() => {
    try {
      const saved = localStorage.getItem('dahoon_food_overview_en');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.title === 'Food & Culinary' ||
          parsed.title === 'Food' ||
          parsed.title === '요리 & 퀴진' ||
          parsed.title === '料理 & 퀴진'
        ) {
          parsed.title = 'Food & Kitchen';
        }
        return parsed;
      }
      return initialFoodOverviewEn;
    } catch {
      return initialFoodOverviewEn;
    }
  });

  const currentFoodOverview =
    currentLang === 'ko'
      ? foodOverviewKo
      : currentLang === 'en'
      ? foodOverviewEn
      : foodOverviewJa;

  const handleUpdateFoodOverview = (newOverview: FoodOverviewContent) => {
    if (currentLang === 'ko') {
      setFoodOverviewKo(newOverview);
      try {
        localStorage.setItem('dahoon_food_overview_ko', JSON.stringify(newOverview));
      } catch {}
    } else if (currentLang === 'en') {
      setFoodOverviewEn(newOverview);
      try {
        localStorage.setItem('dahoon_food_overview_en', JSON.stringify(newOverview));
      } catch {}
    } else {
      setFoodOverviewJa(newOverview);
      try {
        localStorage.setItem('dahoon_food_overview_ja', JSON.stringify(newOverview));
      } catch {}
    }
  };

  const handleResetFoodOverview = () => {
    if (currentLang === 'ko') {
      setFoodOverviewKo(initialFoodOverviewKo);
      try {
        localStorage.removeItem('dahoon_food_overview_ko');
      } catch {}
    } else if (currentLang === 'en') {
      setFoodOverviewEn(initialFoodOverviewEn);
      try {
        localStorage.removeItem('dahoon_food_overview_en');
      } catch {}
    } else {
      setFoodOverviewJa(initialFoodOverviewJa);
      try {
        localStorage.removeItem('dahoon_food_overview_ja');
      } catch {}
    }
  };

  // Modals state
  const [selectedPhoto, setSelectedPhoto] = useState<LatteArtPhoto | null>(null);
  const [isPhotoManagerOpen, setIsPhotoManagerOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('dahoon_latte_photos', JSON.stringify(lattePhotos));
    } catch {}
  }, [lattePhotos]);

  useEffect(() => {
    try {
      localStorage.setItem('dahoon_hero_photo', JSON.stringify(heroPhoto));
    } catch {}
  }, [heroPhoto]);

  useEffect(() => {
    try {
      localStorage.setItem('dahoon_cafe_visits', JSON.stringify(cafeVisits));
    } catch {}
  }, [cafeVisits]);

  useEffect(() => {
    try {
      localStorage.setItem('dahoon_food_photos', JSON.stringify(foodPhotos));
    } catch {}
  }, [foodPhotos]);

  useEffect(() => {
    try {
      localStorage.setItem('dahoon_profile_info', JSON.stringify(profileInfo));
    } catch {}
  }, [profileInfo]);

  useEffect(() => {
    try {
      if (handDripPhotoUrl) {
        localStorage.setItem('dahoon_hand_drip_photo', handDripPhotoUrl);
      } else {
        localStorage.removeItem('dahoon_hand_drip_photo');
      }
    } catch {}
  }, [handDripPhotoUrl]);

  // Direct Text Updaters (mutates activeContent -> stores in draftContent)
  const handleUpdateHeroField = (field: 'name' | 'title' | 'subtext', value: string) => {
    updateActiveContent((prev) => {
      if (field === 'name') {
        return { ...prev, hero: { ...prev.hero, name: value } };
      }
      return {
        ...prev,
        hero: {
          ...prev.hero,
          [field]: { ...prev.hero[field], [currentLang]: value },
        },
      };
    });
  };

  const handleUpdateAboutField = (field: string, value: string) => {
    updateActiveContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        [field]: { ...(prev.about as any)[field], [currentLang]: value },
      },
    }));
  };

  const handleUpdateCoffeeText = (path: string, value: string) => {
    updateActiveContent((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const sectionContent = getCoffeeSectionContent(copy.coffee, currentLang);
      setDeepValue(sectionContent, path, value);
      copy.coffee = updateCoffeeSectionInSiteContent(copy.coffee, currentLang, sectionContent);
      return copy;
    });
    try {
      const sectionContent = getCoffeeSectionContent(activeContent.coffee, currentLang);
      setDeepValue(sectionContent, path, value);
      syncLegacyCoffeeStorageSingle(currentLang, sectionContent);
    } catch {}
  };

  const handleUpdateLatteArtField = (
    field: 'title' | 'subtitle' | 'body' | 'note',
    value: string
  ) => {
    updateActiveContent((prev) => ({
      ...prev,
      latteArt: {
        ...prev.latteArt,
        [field]: { ...prev.latteArt[field], [currentLang]: value },
      },
    }));
  };

  const handleUpdateFoodText = (
    field: 'title' | 'subtitle' | 'roleTitle' | 'roleDesc' | 'pastNote',
    value: string
  ) => {
    setHasUnsavedChanges(true);
    if (currentLang === 'ja') {
      setFoodOverviewJa((prev) => ({ ...prev, [field]: value }));
    } else if (currentLang === 'en') {
      setFoodOverviewEn((prev) => ({ ...prev, [field]: value }));
    } else {
      setFoodOverviewKo((prev) => ({ ...prev, [field]: value }));
    }
    updateActiveContent((prev) => ({
      ...prev,
      food: {
        ...prev.food,
        [field === 'roleDesc' ? 'currentDesc' : field]: {
          ...(prev.food as any)[field === 'roleDesc' ? 'currentDesc' : field],
          [currentLang]: value,
        },
      },
    }));
  };

  const handleUpdateExperienceText = (
    field: 'title' | 'subtitle' | 'rolesLabel' | 'roleCompany' | 'roleTitle' | 'rolePeriod' | 'roleDesc',
    value: string,
    index?: number
  ) => {
    updateActiveContent((prev) => {
      const copy: SiteContent = JSON.parse(JSON.stringify(prev));
      if (field === 'title' || field === 'subtitle' || field === 'rolesLabel') {
        copy.experience[field][currentLang] = value;
      } else if (index !== undefined && copy.experience.roles[currentLang]?.[index]) {
        if (field === 'roleCompany') {
          copy.experience.roles[currentLang][index].company = value;
        } else if (field === 'roleTitle') {
          copy.experience.roles[currentLang][index].role = value;
        } else if (field === 'rolePeriod') {
          const parts = value.split('·').map((s) => s.trim());
          copy.experience.roles[currentLang][index].period = parts[0] || value;
          if (parts[1]) {
            copy.experience.roles[currentLang][index].part = parts[1];
          }
        } else if (field === 'roleDesc') {
          copy.experience.roles[currentLang][index].description = value;
        }
      }
      return copy;
    });
  };

  const handleUpdateValuesText = (
    field: 'title' | 'subtitle' | 'closing' | 'itemTitle' | 'itemDesc',
    value: string,
    index?: number
  ) => {
    updateActiveContent((prev) => {
      const copy: SiteContent = JSON.parse(JSON.stringify(prev));
      if (field === 'title' || field === 'subtitle' || field === 'closing') {
        copy.values[field][currentLang] = value;
      } else if (index !== undefined && copy.values.items[currentLang]?.[index]) {
        if (field === 'itemTitle') {
          copy.values.items[currentLang][index].title = value;
        } else if (field === 'itemDesc') {
          copy.values.items[currentLang][index].description = value;
        }
      }
      return copy;
    });
  };

  const handleUpdateContactText = (
    field: 'title' | 'subtitle' | 'formTitle' | 'formSubtitle' | 'titleText' | 'skillsText',
    value: string
  ) => {
    updateActiveContent((prev) => {
      const copy: SiteContent = JSON.parse(JSON.stringify(prev));
      copy.contact[field][currentLang] = value;
      return copy;
    });
  };

  const handleUpdateFooter = (field: 'text' | 'quote', value: string) => {
    updateActiveContent((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: { ...prev.footer[field], [currentLang]: value },
      },
    }));
  };

  const handleResetAllData = () => {
    const confirmMsg =
      currentLang === 'ja'
        ? 'すべての登録データ（写真・記録・説明文）を初期化しますか？（現在の状態は安全のため自動バックアップされます）'
        : currentLang === 'ko'
        ? '모든 등록 데이터(사진, 기록, 설명문)를 초기화하시겠습니까? (현재 상태는 안전을 위해 자동 백업됩니다)'
        : 'Reset all portfolio data (photos, records, texts) to defaults? (A safety backup of the current state will be created)';

    if (confirm(confirmMsg)) {
      // 1. Create a safety backup of current state BEFORE resetting
      createCoffeeBackupSnapshot(true, 'Pre-reset safety snapshot created before factory reset');
      setLattePhotos(initialLatteArtPhotos);
      setHeroPhoto({
        imageUrl: initialLatteArtPhotos[0].imageUrl,
        title: initialLatteArtPhotos[0].title,
        type: initialLatteArtPhotos[0].type || 'Swan Free Pour',
        description: initialLatteArtPhotos[0].description,
      });
      setCafeVisits(initialCafeVisits);
      setFoodPhotos(initialFoodPhotos);
      setHandDripPhotoUrl(null);
      setProfileInfo(defaultProfileInfo);
      setFoodOverviewJa(initialFoodOverviewJa);
      setFoodOverviewKo(initialFoodOverviewKo);
      updateActiveContent((prev) => ({
        ...prev,
        coffee: JSON.parse(JSON.stringify(defaultSiteContent.coffee)),
      }));

      try {
        localStorage.removeItem('dahoon_latte_photos');
        localStorage.removeItem('dahoon_hero_photo');
        localStorage.removeItem('dahoon_cafe_visits');
        localStorage.removeItem('dahoon_food_photos');
        localStorage.removeItem('dahoon_hand_drip_photo');
        localStorage.removeItem('dahoon_profile_info');
        localStorage.setItem('dahoon_coffee_content_ja', JSON.stringify(getCoffeeSectionContent(defaultSiteContent.coffee, 'ja')));
        localStorage.setItem('dahoon_coffee_content_ko', JSON.stringify(getCoffeeSectionContent(defaultSiteContent.coffee, 'ko')));
        localStorage.setItem('dahoon_coffee_content_en', JSON.stringify(getCoffeeSectionContent(defaultSiteContent.coffee, 'en')));
        localStorage.removeItem('dahoon_food_overview_ja');
        localStorage.removeItem('dahoon_food_overview_ko');
      } catch {}
    }
  };

  // Scrollspy for navigation active item
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'home',
        'about',
        'coffee',
        'latte-art',
        'food',
        'experience',
        'values',
        'contact',
      ];
      const scrollPosition = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Cafe visits handlers
  const handleAddCafeVisit = (newVisit: CafeVisit) => {
    const visit: CafeVisit = {
      ...newVisit,
      id: newVisit.id || `visit-${Date.now()}`,
    };
    setCafeVisits((prev) => [visit, ...prev]);
    updateActiveContent((prev) => ({
      ...prev,
      cafeVisits: [visit, ...(prev.cafeVisits || cafeVisits)],
    }));
  };

  const handleUpdateCafeVisit = (updatedVisit: CafeVisit) => {
    setCafeVisits((prev) =>
      prev.map((v) => (v.id === updatedVisit.id ? updatedVisit : v))
    );
    updateActiveContent((prev) => ({
      ...prev,
      cafeVisits: (prev.cafeVisits || cafeVisits).map((v) =>
        v.id === updatedVisit.id ? updatedVisit : v
      ),
    }));
  };

  const handleDeleteCafeVisit = (id: string) => {
    setCafeVisits((prev) => prev.filter((v) => v.id !== id));
    updateActiveContent((prev) => ({
      ...prev,
      cafeVisits: (prev.cafeVisits || cafeVisits).filter((v) => v.id !== id),
    }));
  };

  const handleReorderCafeVisits = (reordered: CafeVisit[]) => {
    setCafeVisits(reordered);
    updateActiveContent((prev) => ({
      ...prev,
      cafeVisits: reordered,
    }));
  };

  // 2. Latte Art handlers
  const handleAddLattePhoto = (newPhoto: LatteArtPhoto) => {
    const photo: LatteArtPhoto = {
      ...newPhoto,
      id: newPhoto.id || `latte-${Date.now()}`,
    };
    setLattePhotos((prev) => [...prev, photo]);
    updateActiveContent((prev) => ({
      ...prev,
      lattePhotos: [...(prev.lattePhotos || lattePhotos), photo],
    }));
  };

  const handleUpdateLattePhoto = (updatedPhoto: LatteArtPhoto) => {
    setLattePhotos((prev) =>
      prev.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p))
    );
    updateActiveContent((prev) => ({
      ...prev,
      lattePhotos: (prev.lattePhotos || lattePhotos).map((p) =>
        p.id === updatedPhoto.id ? updatedPhoto : p
      ),
    }));
  };

  const handleDeleteLattePhoto = (id: string) => {
    setLattePhotos((prev) => prev.filter((p) => p.id !== id));
    updateActiveContent((prev) => ({
      ...prev,
      lattePhotos: (prev.lattePhotos || lattePhotos).filter((p) => p.id !== id),
    }));
  };

  const handleReorderLattePhotos = (reordered: LatteArtPhoto[]) => {
    setLattePhotos(reordered);
    updateActiveContent((prev) => ({
      ...prev,
      lattePhotos: reordered,
    }));
  };

  const handleUpdateLattePhotos = (newPhotos: LatteArtPhoto[]) => {
    setLattePhotos(newPhotos);
    updateActiveContent((prev) => ({
      ...prev,
      lattePhotos: newPhotos,
    }));
  };

  const handleResetDefaultPhotos = () => {
    setLattePhotos(initialLatteArtPhotos);
    updateActiveContent((prev) => ({
      ...prev,
      lattePhotos: initialLatteArtPhotos,
    }));
    try {
      localStorage.removeItem('dahoon_latte_photos');
    } catch {}
  };

  // 3. Food Dishes handlers
  const handleUploadFoodPhoto = (
    id: string,
    url: string,
    mediaType?: 'image' | 'video'
  ) => {
    const updater = (items: FoodPhoto[]) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              imageUrl: url,
              mediaType: mediaType || (isVideoMedia(url) ? 'video' : 'image'),
            }
          : item
      );
    setFoodPhotos((prev) => updater(prev));
    updateActiveContent((prev) => ({
      ...prev,
      foodPhotos: updater(prev.foodPhotos || foodPhotos),
    }));
  };

  const handleAddFoodPhoto = (dish: FoodPhoto) => {
    const item: FoodPhoto = {
      ...dish,
      id: dish.id || `food-${Date.now()}`,
    };
    setFoodPhotos((prev) => [item, ...prev]);
    updateActiveContent((prev) => ({
      ...prev,
      foodPhotos: [item, ...(prev.foodPhotos || foodPhotos)],
    }));
  };

  const handleUpdateFoodPhoto = (updatedDish: FoodPhoto) => {
    setFoodPhotos((prev) =>
      prev.map((d) => (d.id === updatedDish.id ? updatedDish : d))
    );
    updateActiveContent((prev) => ({
      ...prev,
      foodPhotos: (prev.foodPhotos || foodPhotos).map((d) =>
        d.id === updatedDish.id ? updatedDish : d
      ),
    }));
  };

  const handleDeleteFoodPhoto = (id: string) => {
    setFoodPhotos((prev) => prev.filter((d) => d.id !== id));
    updateActiveContent((prev) => ({
      ...prev,
      foodPhotos: (prev.foodPhotos || foodPhotos).filter((d) => d.id !== id),
    }));
  };

  const handleReorderFoodPhotos = (reordered: FoodPhoto[]) => {
    setFoodPhotos(reordered);
    updateActiveContent((prev) => ({
      ...prev,
      foodPhotos: reordered,
    }));
  };

  const t = translations[currentLang];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2C2926] font-sans-jp flex flex-col selection:bg-[#E4DED4] selection:text-[#1F1E1D]">
      {/* Admin Draft Preview Notification Banner */}
      {isAdmin && isPreviewingDraft && (
        <div className="bg-[#1C2C42] text-[#E8F0FE] border-b border-[#2C4162] px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                DRAFT PREVIEW
              </span>
              <span className="font-medium">
                {currentLang === 'ja'
                  ? '訪問者視点でプレビュー中（現在の下書き内容が画面に反映されています）。'
                  : currentLang === 'ko'
                  ? '방문자 시점 미리보기 중입니다 (현재 임시저장된 내용이 화면에 렌더링되고 있습니다).'
                  : 'Viewing visitor preview (currently rendering draft changes).'}
              </span>
            </div>
            <button
              onClick={() => setIsPreviewingDraft(false)}
              className="text-xs text-blue-200 hover:text-white underline cursor-pointer shrink-0 font-medium"
            >
              {currentLang === 'ja'
                ? 'プレビュー終了'
                : currentLang === 'ko'
                ? '미리보기 종료'
                : 'Exit Preview'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Mode Sticky Bar (Rendered ONLY when logged in as admin and edit mode is active) */}
      {isAdmin && isEditMode && (
        <EditModeBar
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={() => handleSaveDraft()}
          onPublish={() => handlePublish()}
          onCancel={handleCancelEditMode}
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          statusMessage={editStatusMessage}
          onDismissStatus={() => setEditStatusMessage(null)}
        />
      )}

      {/* Top Header with Language Switcher and Admin Trigger */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeSection={activeSection}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        categories={activeContent.categories}
        heroName={activeContent.hero.name}
        heroTitle={activeContent.hero.title[currentLang]}
        isEditMode={isEditMode}
        onToggleEditMode={handleToggleEditMode}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Home Section with customizable hero photo / video */}
        <HomeSection
          currentLang={currentLang}
          heroPhoto={heroPhoto}
          onOpenPhoto={setSelectedPhoto}
          isAdmin={isAdmin}
          onChangeHeroPhoto={(url, mediaType) =>
            setHeroPhoto((prev) => ({
              ...prev,
              imageUrl: url,
              mediaType: mediaType || (isVideoMedia(url) ? 'video' : 'image'),
            }))
          }
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          siteHero={activeContent.hero}
          isEditMode={isAdmin && isEditMode}
          onUpdateHeroField={handleUpdateHeroField}
        />

        {/* 2. About Section */}
        <AboutSection
          currentLang={currentLang}
          siteAbout={activeContent.about}
          isEditMode={isAdmin && isEditMode}
          onUpdateAboutField={handleUpdateAboutField}
        />

        {/* 3. Coffee Section (with customizable 1~4 explanations) */}
        <CoffeeSection
          currentLang={currentLang}
          cafeVisits={activeContent.cafeVisits || cafeVisits}
          onAddCafeVisit={handleAddCafeVisit}
          onUpdateCafeVisit={handleUpdateCafeVisit}
          onDeleteCafeVisit={handleDeleteCafeVisit}
          onReorderCafeVisits={handleReorderCafeVisits}
          handDripPhotoUrl={activeContent.handDripPhotoUrl !== undefined ? activeContent.handDripPhotoUrl : handDripPhotoUrl}
          onUploadHandDripPhoto={(url) => {
            setHandDripPhotoUrl(url);
            updateActiveContent((prev) => ({ ...prev, handDripPhotoUrl: url }));
          }}
          coffeeContent={currentCoffeeContent}
          onUpdateCoffeeContent={handleUpdateCoffeeContent}
          onResetCoffeeContent={handleResetCoffeeContent}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          isEditMode={isAdmin && isEditMode}
          onUpdateCoffeeText={handleUpdateCoffeeText}
          onOpenPhoto={setSelectedPhoto}
        />

        {/* 4. Latte Art Section */}
        <LatteArtSection
          currentLang={currentLang}
          photos={activeContent.lattePhotos || lattePhotos}
          onOpenPhoto={setSelectedPhoto}
          onOpenManager={() => setIsAdminModalOpen(true)}
          onAddPhoto={handleAddLattePhoto}
          onUpdatePhoto={handleUpdateLattePhoto}
          onDeletePhoto={handleDeleteLattePhoto}
          onReorderPhotos={handleReorderLattePhotos}
          siteLatteArt={activeContent.latteArt}
          isAdmin={isAdmin}
          isEditMode={isAdmin && isEditMode}
          onUpdateLatteArtField={handleUpdateLatteArtField}
        />

        {/* 5. Food Section (with customizable dishes portfolio and role overview) */}
        <FoodSection
          currentLang={currentLang}
          foodPhotos={activeContent.foodPhotos || foodPhotos}
          onUploadFoodPhoto={handleUploadFoodPhoto}
          onAddFoodPhoto={handleAddFoodPhoto}
          onUpdateFoodPhoto={handleUpdateFoodPhoto}
          onDeleteFoodPhoto={handleDeleteFoodPhoto}
          onReorderFoodPhotos={handleReorderFoodPhotos}
          foodOverview={currentFoodOverview}
          onUpdateFoodOverview={handleUpdateFoodOverview}
          onResetFoodOverview={handleResetFoodOverview}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenPhoto={setSelectedPhoto}
          isEditMode={isAdmin && isEditMode}
          onUpdateFoodText={handleUpdateFoodText}
        />

        {/* 6. Experience Timeline */}
        <ExperienceSection
          currentLang={currentLang}
          siteExperience={activeContent.experience}
          isEditMode={isAdmin && isEditMode}
          onUpdateExperienceText={handleUpdateExperienceText}
        />

        {/* 7. What I Value */}
        <ValuesSection
          currentLang={currentLang}
          siteValues={activeContent.values}
          isEditMode={isAdmin && isEditMode}
          onUpdateValuesText={handleUpdateValuesText}
        />

        {/* 8. Contact Section (Direct Message Form & Connected Admin Email) */}
        <ContactSection
          currentLang={currentLang}
          profileInfo={profileInfo}
          siteContact={activeContent.contact}
          isEditMode={isAdmin && isEditMode}
          onUpdateContactText={handleUpdateContactText}
        />
      </main>

      {/* Lightbox Modal for enlarged view */}
      <LightboxModal
        currentLang={currentLang}
        photo={selectedPhoto}
        photos={activeContent.lattePhotos || lattePhotos}
        onClose={() => setSelectedPhoto(null)}
        onSelectPhoto={setSelectedPhoto}
      />

      {/* Legacy Photo Manager Modal */}
      <PhotoManagerModal
        currentLang={currentLang}
        photos={activeContent.lattePhotos || lattePhotos}
        isOpen={isPhotoManagerOpen}
        onClose={() => setIsPhotoManagerOpen(false)}
        onUpdatePhotos={handleUpdateLattePhotos}
        onResetDefault={handleResetDefaultPhotos}
      />

      {/* Admin Panel Modal (Google Sign-In / Admin PIN) */}
      <AdminModal
        currentLang={currentLang}
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isAdmin={isAdmin}
        adminUser={adminUser}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        heroPhoto={heroPhoto}
        onUpdateHeroPhoto={setHeroPhoto}
        lattePhotos={activeContent.lattePhotos || lattePhotos}
        onUpdateLattePhotos={handleUpdateLattePhotos}
        cafeVisits={activeContent.cafeVisits || cafeVisits}
        onUpdateCafeVisits={(visits) => {
          setCafeVisits(visits);
          updateActiveContent((prev) => ({ ...prev, cafeVisits: visits }));
        }}
        foodPhotos={activeContent.foodPhotos || foodPhotos}
        onUpdateFoodPhotos={(photos) => {
          setFoodPhotos(photos);
          updateActiveContent((prev) => ({ ...prev, foodPhotos: photos }));
        }}
        onAddFoodPhoto={handleAddFoodPhoto}
        onDeleteFoodPhoto={handleDeleteFoodPhoto}
        handDripPhotoUrl={handDripPhotoUrl}
        onUpdateHandDripPhoto={setHandDripPhotoUrl}
        coffeeContent={currentCoffeeContent}
        onUpdateCoffeeContent={handleUpdateCoffeeContent}
        onResetCoffeeContent={handleResetCoffeeContent}
        foodOverview={currentFoodOverview}
        onUpdateFoodOverview={handleUpdateFoodOverview}
        onResetFoodOverview={handleResetFoodOverview}
        profileInfo={profileInfo}
        onUpdateProfileInfo={(newInfo) => {
          const sanitizedInfo = {
            ...newInfo,
            email: newInfo.email === 'dhgh159030@gmail.com' ? 'dahoon0519@gmail.com' : newInfo.email,
          };
          setProfileInfo(sanitizedInfo);
          handlePublish({
            ...activeContent,
            contact: {
              ...activeContent.contact,
              emailValue: sanitizedInfo.email,
              name: sanitizedInfo.name,
            },
          });
        }}
        onResetAllData={handleResetAllData}
        siteContent={activeContent}
        publishedSiteContent={publishedContent}
        draftContent={draftContent}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onDiscardDraft={handleDiscardDraft}
        onRestoreVersion={handleRestoreVersion}
        onPreviewToggle={handlePreviewToggle}
        isPreviewing={isPreviewingDraft}
        onUpdateSiteContent={(content) => handlePublish(content)}
        onResetSiteContent={handleResetSiteContent}
      />

      {/* Quiet, Respectful Footer */}
      <footer className="border-t border-[#EAE4D9] py-10 bg-[#FAF8F5] text-xs text-[#857F74]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-2">
          <EditableText
            isEditMode={isAdmin && isEditMode}
            value={activeContent.footer.text[currentLang] || t.footer.text}
            onChange={(val) => handleUpdateFooter('text', val)}
            as="p"
            className="font-serif-jp text-sm text-[#4E483F] block"
          />
          <div className="text-[11px] text-[#938C80] font-serif-jp italic">
            「
            <EditableText
              isEditMode={isAdmin && isEditMode}
              value={activeContent.footer.quote[currentLang] || t.footer.quote}
              onChange={(val) => handleUpdateFooter('quote', val)}
              as="span"
              className="inline"
            />
            」
          </div>
          <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-[#A69F93]">
            <span>© {new Date().getFullYear()} {profileInfo.name}. All Rights Reserved.</span>
          </div>
        </div>
      </footer>

      {/* Discreet screen-corner Admin Login link / Status (subtle and unobtrusive) */}
      {!isAdmin ? (
        <button
          onClick={() => setIsAdminModalOpen(true)}
          style={{
            bottom: 'max(20px, calc(20px + env(safe-area-inset-bottom, 0px)))',
            left: 'max(20px, calc(20px + env(safe-area-inset-left, 0px)))',
          }}
          className="fixed z-30 text-[10px] sm:text-[11px] text-[#A8A196]/40 hover:text-[#524B40] transition-colors duration-200 cursor-pointer select-none font-sans flex items-center gap-1 opacity-70 hover:opacity-100"
          title={
            currentLang === 'ja'
              ? '管理者ログイン'
              : currentLang === 'ko'
              ? '관리자 로그인'
              : 'Admin Login'
          }
        >
          <span className="w-1 h-1 rounded-full bg-[#A8A196]/60 inline-block" />
          <span>
            {currentLang === 'ja'
              ? '管理者ログイン'
              : currentLang === 'ko'
              ? '관리자 로그인'
              : 'Admin'}
          </span>
        </button>
      ) : (
        <div
          style={{
            bottom: 'max(20px, calc(20px + env(safe-area-inset-bottom, 0px)))',
            left: 'max(20px, calc(20px + env(safe-area-inset-left, 0px)))',
          }}
          className="fixed z-30 flex items-center gap-2 bg-[#2D241E]/92 backdrop-blur-xs text-white text-[11px] px-3 py-1 rounded-full shadow-lg font-sans border border-[#524538]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] text-amber-200">
            {adminUser?.email || authService.getAllowedAdminEmail()}
          </span>
          {draftContent && (
            <span className="bg-amber-600/80 text-white text-[9px] px-1.5 py-0.2 rounded font-mono">
              DRAFT
            </span>
          )}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="hover:text-amber-200 underline cursor-pointer text-[10px] font-medium"
          >
            {currentLang === 'ja' ? '設定' : currentLang === 'ko' ? '설정' : 'Admin'}
          </button>
          <span className="text-[#8C8377]">·</span>
          <button
            onClick={handleAdminLogout}
            className="text-[#C2BBAE] hover:text-white cursor-pointer text-[10px]"
          >
            {currentLang === 'ja' ? 'ログアウト' : currentLang === 'ko' ? '로그아웃' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}
