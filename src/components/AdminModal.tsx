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
} from '../types';
import {
  X,
  Lock,
  Unlock,
  Upload,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Coffee,
  Utensils,
  Download,
  FileText,
  User,
  Image as ImageIcon,
  Edit3,
  Calendar,
  Flame,
  Video as VideoIcon,
  Layers,
  Sparkles,
  Inbox,
  ShieldCheck,
  AlertCircle,
  LogIn,
  Mail,
} from 'lucide-react';
import { CategoriesManager } from './CategoriesManager';
import { SiteContentManager } from './SiteContentManager';
import { InquiriesManager } from './InquiriesManager';
import { ContactEmailSettingsManager } from './ContactEmailSettingsManager';
import {
  authService,
  ALLOWED_ADMIN_EMAIL,
  AdminUser,
} from '../services/authService';
import {
  restoreCoffeeFromBackup,
  createCoffeeBackupSnapshot,
  COFFEE_BACKUP_KEY,
  PRE_RESTORE_LATEST_KEY,
  RestoreResult,
} from '../services/siteContentService';

interface AdminModalProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  adminUser?: AdminUser | null;
  onLogin: (user?: AdminUser) => void;
  onLogout: () => void;
  heroPhoto: HeroPhotoInfo;
  onUpdateHeroPhoto: (photo: HeroPhotoInfo) => void;
  lattePhotos: LatteArtPhoto[];
  onUpdateLattePhotos: (photos: LatteArtPhoto[]) => void;
  cafeVisits: CafeVisit[];
  onUpdateCafeVisits: (visits: CafeVisit[]) => void;
  foodPhotos: FoodPhoto[];
  onUpdateFoodPhotos: (photos: FoodPhoto[]) => void;
  onAddFoodPhoto: (photo: FoodPhoto) => void;
  onDeleteFoodPhoto: (id: string) => void;
  handDripPhotoUrl: string | null;
  onUpdateHandDripPhoto: (url: string | null) => void;
  coffeeContent: CoffeeSectionContent;
  onUpdateCoffeeContent: (content: CoffeeSectionContent) => void;
  onResetCoffeeContent: () => void;
  foodOverview: FoodOverviewContent;
  onUpdateFoodOverview: (overview: FoodOverviewContent) => void;
  onResetFoodOverview: () => void;
  profileInfo: ProfileInfo;
  onUpdateProfileInfo: (info: ProfileInfo) => void;
  onResetAllData: () => void;
  siteContent: SiteContent;
  draftContent?: SiteContent | null;
  onSaveDraft?: (newContent: SiteContent) => Promise<void>;
  onPublish?: (newContent: SiteContent, summary?: string) => Promise<void>;
  onDiscardDraft?: () => Promise<void>;
  onRestoreVersion?: (versionId: string) => Promise<void>;
  onPreviewToggle?: () => void;
  isPreviewing?: boolean;
  onUpdateSiteContent: (content: SiteContent) => void;
  onResetSiteContent: () => void;
}

const foodCategories = [
  'Pizza',
  'Main Dish',
  'Pasta',
  'Meat',
  'Appetizer',
  'Dessert',
  'Prep / 仕込み',
  'Other',
];

export const AdminModal: React.FC<AdminModalProps> = ({
  currentLang,
  isOpen,
  onClose,
  isAdmin,
  adminUser,
  onLogin,
  onLogout,
  heroPhoto,
  onUpdateHeroPhoto,
  lattePhotos,
  onUpdateLattePhotos,
  cafeVisits,
  onUpdateCafeVisits,
  foodPhotos,
  onUpdateFoodPhotos,
  onAddFoodPhoto,
  onDeleteFoodPhoto,
  handDripPhotoUrl,
  onUpdateHandDripPhoto,
  coffeeContent,
  onUpdateCoffeeContent,
  onResetCoffeeContent,
  foodOverview,
  onUpdateFoodOverview,
  onResetFoodOverview,
  profileInfo,
  onUpdateProfileInfo,
  onResetAllData,
  siteContent,
  draftContent,
  onSaveDraft,
  onPublish,
  onDiscardDraft,
  onRestoreVersion,
  onPreviewToggle,
  isPreviewing,
  onUpdateSiteContent,
  onResetSiteContent,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [idTokenInput, setIdTokenInput] = useState('');
  const [showTokenVerifier, setShowTokenVerifier] = useState(false);
  const googleBtnRef = React.useRef<HTMLDivElement>(null);
  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  // Render Google Identity Services button if script & client ID are available
  useEffect(() => {
    if (!isOpen || isAdmin) return;

    const timer = setTimeout(() => {
      const win = window as any;
      if (win.google?.accounts?.id && googleClientId && googleBtnRef.current) {
        try {
          win.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: { credential: string }) => {
              if (response.credential) {
                await handleCredentialLogin(response.credential);
              }
            },
            auto_select: false,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            win.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              width: 300,
              text: 'signin_with',
              shape: 'rectangular',
            });
          }
        } catch (err) {
          console.warn('Google Identity Services render error:', err);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, isAdmin, googleClientId]);

  const handleCredentialLogin = async (credential: string) => {
    setIsLoggingIn(true);
    setGoogleError('');
    try {
      const user = await authService.signInWithGoogleCredential(credential);
      onLogin(user);
      showNotify(
        currentLang === 'ja'
          ? `Google管理者（${user.email}）としてサーバー認証されました`
          : currentLang === 'ko'
          ? `Google 관리자（${user.email}）로 서버 인증 완료되었습니다`
          : `Authenticated as Admin (${user.email})`
      );
    } catch (err: any) {
      setGoogleError(
        err.message ||
          (currentLang === 'ja'
            ? '認証に失敗しました'
            : currentLang === 'ko'
            ? '인증에 실패했습니다'
            : 'Authentication failed')
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [activeTab, setActiveTab] = useState<
    | 'home'
    | 'categories'
    | 'content'
    | 'inquiries'
    | 'contactSettings'
    | 'coffee'
    | 'food'
    | 'latte'
    | 'profile'
    | 'backup'
    | 'adminEmail'
  >('categories');
  const [notification, setNotification] = useState<string | null>(null);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);
  const [snapshotResult, setSnapshotResult] = useState<string | null>(null);

  const t = (ja: string, ko: string, en: string) =>
    currentLang === 'ja' ? ja : currentLang === 'ko' ? ko : en;

  // Coffee subtabs
  const [coffeeSubTab, setCoffeeSubTab] = useState<'text' | 'handdrip' | 'visits'>('text');
  const [coffeeForm, setCoffeeForm] = useState<CoffeeSectionContent>(coffeeContent);

  // Food subtabs
  const [foodSubTab, setFoodSubTab] = useState<'dishes' | 'add' | 'overview'>('dishes');
  const [foodOverviewForm, setFoodOverviewForm] = useState<FoodOverviewContent>(foodOverview);

  // New Latte state
  const [newLatteTitle, setNewLatteTitle] = useState('');
  const [newLatteDesc, setNewLatteDesc] = useState('');
  const [newLatteType, setNewLatteType] = useState('Swan');
  const [newLatteDate, setNewLatteDate] = useState('');
  const [newLatteImage, setNewLatteImage] = useState<string | null>(null);

  // New Cafe visit state
  const [newCafeName, setNewCafeName] = useState('');
  const [newCafeLoc, setNewCafeLoc] = useState('');
  const [newCafeCoffee, setNewCafeCoffee] = useState('');
  const [newCafeNotes, setNewCafeNotes] = useState('');

  // New Dish state
  const [newDishTitle, setNewDishTitle] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Pizza');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishDate, setNewDishDate] = useState('');
  const [newDishImage, setNewDishImage] = useState<string | null>(null);
  const [newDishMediaType, setNewDishMediaType] = useState<'image' | 'video'>('image');

  useEffect(() => {
    setCoffeeForm(coffeeContent);
  }, [coffeeContent]);

  useEffect(() => {
    setFoodOverviewForm(foodOverview);
  }, [foodOverview]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleVerifyIdTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idTokenInput.trim()) return;
    await handleCredentialLogin(idTokenInput.trim());
  };

  if (!isOpen) return null;

  // Hero Upload
  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string | undefined;
        if (imageUrl) {
          onUpdateHeroPhoto({
            ...heroPhoto,
            imageUrl,
            mediaType: isVideo ? 'video' : 'image',
          });
          showNotify(
            t(
              'ホーム代表メディアを更新しました',
              '홈 대표 사진·영상을 변경했습니다',
              'Updated hero media'
            )
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectLatteForHero = (photo: LatteArtPhoto) => {
    onUpdateHeroPhoto({
      imageUrl: photo.imageUrl,
      title: photo.title,
      type: photo.type,
      description: photo.description,
      mediaType: photo.mediaType,
    });
    showNotify(
      t(
        `ホーム代表メディアを「${photo.title}」に設定しました`,
        `홈 대표 사진·영상을 「${photo.title}」로 설정했습니다`,
        `Set hero media to "${photo.title}"`
      )
    );
  };

  // Latte art
  const handleLatteFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string | undefined;
        if (imageUrl) {
          const updated = [...lattePhotos];
          updated[index] = {
            ...updated[index],
            imageUrl,
            mediaType: isVideo ? 'video' : 'image',
          };
          onUpdateLattePhotos(updated);
          showNotify(
            t('写真・動画を更新しました', '사진·영상을 업데이트했습니다', 'Media updated')
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateLatteField = (
    index: number,
    field: keyof LatteArtPhoto,
    val: string
  ) => {
    const updated = [...lattePhotos];
    updated[index] = { ...updated[index], [field]: val };
    onUpdateLattePhotos(updated);
  };

  const handleDeleteLatte = (index: number) => {
    const confirmMsg = t(
      'このラテアート写真を削除しますか？',
      '이 라떼아트 사진을 삭제하시겠습니까?',
      'Delete this latte art photo?'
    );
    if (confirm(confirmMsg)) {
      const updated = lattePhotos.filter((_, idx) => idx !== index);
      onUpdateLattePhotos(updated);
      showNotify(t('削除しました', '삭제되었습니다', 'Deleted'));
    }
  };

  const handleAddLattePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLatteImage) {
      alert(t('画像を選択してください', '사진을 등록해주세요', 'Please select a photo or video'));
      return;
    }
    const isVideo = isVideoMedia(newLatteImage);
    const newItem: LatteArtPhoto = {
      id: `latte-custom-${Date.now()}`,
      title: newLatteTitle.trim() || 'スワン パターン',
      description: newLatteDesc.trim() || 'カップ内での対流と注ぎの練習。',
      type: newLatteType.trim() || 'Swan',
      date: newLatteDate.trim() || undefined,
      imageUrl: newLatteImage,
      mediaType: isVideo ? 'video' : 'image',
    };
    onUpdateLattePhotos([...lattePhotos, newItem]);
    setNewLatteTitle('');
    setNewLatteDesc('');
    setNewLatteDate('');
    setNewLatteImage(null);
    showNotify(t('写真を追加しました', '새 라떼아트 사진이 추가되었습니다', 'Latte art photo added'));
  };

  // Cafe Visits
  const handleAddCafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCafeName.trim()) return;
    const newVisit: CafeVisit = {
      id: `visit-${Date.now()}`,
      name: newCafeName.trim(),
      location: newCafeLoc.trim() || '日本',
      coffee: newCafeCoffee.trim() || '',
      notes: newCafeNotes.trim() || '',
    };
    onUpdateCafeVisits([...cafeVisits, newVisit]);
    setNewCafeName('');
    setNewCafeLoc('');
    setNewCafeCoffee('');
    setNewCafeNotes('');
    showNotify(t('訪問記録を追加しました', '카페 방문 기록이 추가되었습니다', 'Cafe visit recorded'));
  };

  const handleDeleteCafe = (id: string) => {
    onUpdateCafeVisits(cafeVisits.filter((v) => v.id !== id));
    showNotify(t('削除しました', '삭제되었습니다', 'Deleted'));
  };

  // Hand Drip File
  const handleDripFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateHandDripPhoto(event.target.result as string);
          showNotify(
            t(
              'ハンドドリップメディアを更新しました',
              '핸드드립 미디어를 업데이트했습니다',
              'Hand drip media updated'
            )
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Food Dishes
  const handleAddDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishTitle.trim()) {
      alert(t('料理名を入力してください', '요리명을 입력해주세요', 'Please enter a dish title'));
      return;
    }
    const newDish: FoodPhoto = {
      id: `food-${Date.now()}`,
      title: newDishTitle.trim(),
      category: newDishCategory.trim() || 'Main Dish',
      description: newDishDesc.trim(),
      date: newDishDate.trim() || undefined,
      imageUrl: newDishImage || undefined,
      mediaType: newDishImage ? newDishMediaType : undefined,
    };
    onAddFoodPhoto(newDish);
    setNewDishTitle('');
    setNewDishDesc('');
    setNewDishDate('');
    setNewDishImage(null);
    setFoodSubTab('dishes');
    showNotify(
      t(
        '新しい料理を登録しました',
        '새 요리가 성공적으로 등록되었습니다',
        'New dish registered successfully'
      )
    );
  };

  const handleUpdateDishField = (
    id: string,
    field: keyof FoodPhoto,
    val: any
  ) => {
    const updated = foodPhotos.map((f) => (f.id === id ? { ...f, [field]: val } : f));
    onUpdateFoodPhotos(updated);
  };

  const handleDishMediaUpload = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imageUrl = ev.target?.result as string | undefined;
        if (imageUrl) {
          const updated: FoodPhoto[] = foodPhotos.map((f) =>
            f.id === id
              ? {
                  ...f,
                  imageUrl,
                  mediaType: (isVideo ? 'video' : 'image') as 'video' | 'image',
                }
              : f
          );
          onUpdateFoodPhotos(updated);
          showNotify(
            t(
              '料理写真を更新しました',
              '요리 사진을 업데이트했습니다',
              'Dish media updated'
            )
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export / Backup
  const handleExportData = () => {
    const data = {
      version: 2,
      scope: 'local_storage_only',
      exportedAt: new Date().toISOString(),
      heroPhoto,
      profileInfo,
      lattePhotos,
      cafeVisits,
      foodPhotos,
      handDripPhotoUrl,
      coffeeContent,
      foodOverview,
      siteContent,
      firestoreStatus: {
        backedUp: false,
        reason:
          'Local client storage backup only. Remote Firestore documents are maintained separately in Google Cloud.',
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dahoon_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result;
          if (typeof content !== 'string') return;
          const parsed = JSON.parse(content);

          if (!parsed || typeof parsed !== 'object') {
            alert(
              t(
                'バックアップファイルの形式が不正です。',
                '올바르지 않은 백업 파일 형식입니다.',
                'Malformed backup file format.'
              )
            );
            return;
          }

          // Check if current edits are newer
          const lastPublishTime = localStorage.getItem('dahoon_last_publish_time');
          const lastDraftTime = localStorage.getItem('dahoon_last_draft_time');
          const currentEdit = Math.max(
            lastPublishTime ? new Date(lastPublishTime).getTime() : 0,
            lastDraftTime ? new Date(lastDraftTime).getTime() : 0
          );
          const importTime = parsed.exportedAt ? new Date(parsed.exportedAt).getTime() : 0;

          if (currentEdit > importTime && importTime > 0) {
            const proceed = confirm(
              t(
                '現在の保存データは読み込むバックアップよりも新しい編集が含まれています。上書きして復元しますか？（現在の状態は安全のため自動バックアップされます）',
                '현재 저장된 데이터가 불러오려는 백업본보다 최신입니다. 덮어쓰고 복원하시겠습니까? (현재 상태는 안전을 위해 자동 사전 백업됩니다)',
                'Current data has newer modifications than this backup file. Overwrite? (A safety backup of the current state will be created first)'
              )
            );
            if (!proceed) return;
          }

          // 1. Create safety backup of current state BEFORE overwriting
          createCoffeeBackupSnapshot(true, 'Pre-import safety snapshot created before file restore');

          // 2. Safely apply imported data
          if (parsed.heroPhoto) onUpdateHeroPhoto(parsed.heroPhoto);
          if (parsed.lattePhotos) onUpdateLattePhotos(parsed.lattePhotos);
          if (parsed.cafeVisits) onUpdateCafeVisits(parsed.cafeVisits);
          if (parsed.foodPhotos) onUpdateFoodPhotos(parsed.foodPhotos);
          if (parsed.profileInfo) onUpdateProfileInfo(parsed.profileInfo);
          if (parsed.handDripPhotoUrl !== undefined)
            onUpdateHandDripPhoto(parsed.handDripPhotoUrl);
          if (parsed.coffeeContent) onUpdateCoffeeContent(parsed.coffeeContent);
          if (parsed.foodOverview) onUpdateFoodOverview(parsed.foodOverview);
          if (parsed.siteContent) onUpdateSiteContent(parsed.siteContent);

          showNotify(
            t(
              'データを正常に復元しました（復元前の状態も安全に保存されました）',
              '데이터를 성공적으로 불러왔습니다 (이전 상태는 안전 백업본에 보관되었습니다)',
              'Data restored successfully (pre-recovery safety backup saved)'
            )
          );
        } catch (err: any) {
          alert(
            t(
              `バックアップJSONの読み込みに失敗しました: ${err.message || '構文エラー'}`,
              `백업 JSON 파일 읽기 실패: ${err.message || '문법 오류'}`,
              `Failed to parse backup JSON: ${err.message || 'Invalid JSON syntax'}`
            )
          );
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  const handleRestoreFromSafetySnapshot = (force: boolean = false) => {
    const confirmMsg = t(
      'ローカル安全スナップショットから復元しますか？（現在の状態は自動的に事前バックアップされます）',
      '로컬 안전 스냅샷으로부터 복원하시겠습니까? (현재 상태는 자동 사전 백업됩니다)',
      'Restore from local safety snapshot? (Current state will be automatically backed up first)'
    );
    if (!confirm(confirmMsg)) return;

    setIsRestoringSnapshot(true);
    try {
      const res = restoreCoffeeFromBackup({ force, lang: currentLang });
      if (res.success) {
        if (res.restoredContent) {
          onUpdateSiteContent(res.restoredContent);
        }
        showNotify(res.message);
        setSnapshotResult(res.message);
      } else {
        alert(res.message);
        setSnapshotResult(res.message);
      }
    } catch (e: any) {
      alert(`Restore error: ${e.message}`);
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#161413]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#EBE5DB] flex items-center justify-between bg-[#F5EFE6]">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Unlock className="w-4 h-4 text-[#7A583A]" />
            ) : (
              <Lock className="w-4 h-4 text-[#8C8477]" />
            )}
            <h3 className="text-sm sm:text-base font-serif-jp text-[#1C1A18] font-medium">
              {currentLang === 'ja'
                ? '管理者メニュー (Admin)'
                : currentLang === 'ko'
                ? '관리자 메뉴 (Admin)'
                : 'Administrator Settings'}
            </h3>
            {isAdmin && (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-mono flex items-center gap-1.5 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{adminUser?.email || authService.getAllowedAdminEmail()}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  onLogout();
                  showNotify(
                    t('ログアウトしました', '로그아웃되었습니다', 'Logged out successfully')
                  );
                }}
                className="text-xs text-[#7A7266] hover:text-[#23201D] px-2.5 py-1 rounded border border-[#DDD5C9] bg-white cursor-pointer transition-colors"
              >
                {t('ログアウト', '로그아웃', 'Logout')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#736C62] hover:text-[#1F1E1D] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-[#4E3B2C] text-white text-xs px-4 py-2 flex items-center gap-2 justify-center transition-all animate-fadeIn">
            <Check className="w-3.5 h-3.5 text-emerald-300" />
            <span>{notification}</span>
          </div>
        )}

        {/* Not Logged In: Google Authentication for Single Admin */}
        {!isAdmin ? (
          <div className="p-6 sm:p-10 text-center max-w-md mx-auto w-full my-auto space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#EFE9DF] text-[#634832] flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-7 h-7 text-[#735A46]" />
            </div>

            <div>
              <h4 className="text-lg font-serif-jp text-[#222] font-medium mb-1.5">
                {t(
                  '管理者 Google ログイン',
                  '관리자 Google 로그인',
                  'Administrator Google Login'
                )}
              </h4>
              <p className="text-xs text-[#7F786E] leading-relaxed">
                {t(
                  '訪問者には読み取り専用画面が表示されます。コンテンツの追加・編集を行うには許可されたGoogle管理者アカウントでログインしてください。',
                  '방문자에게는 읽기 전용 화면만 제공됩니다. 콘텐츠 수정 및 관리를 위해서는 등록된 관리자 전용 Google 계정으로 로그인해주세요.',
                  'Visitors only view read-only portfolio content. Please sign in with the authorized Google Administrator account to manage or edit content.'
                )}
              </p>
            </div>

            {/* Allowed Admin Email Badge */}
            <div className="bg-[#FAF3EB] border border-[#E4DACD] rounded-lg p-3 text-left">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B533E] mb-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {t(
                    'アクセス許可された管理者アカウント (1件のみ)',
                    '접근 허용된 단일 관리자 계정 (1개만 허용)',
                    'Authorized Single Administrator Account'
                  )}
                </span>
              </div>
              <div className="bg-white border border-[#DDD6CB] rounded px-2.5 py-1.5 font-mono text-xs text-[#2A2621] font-medium flex items-center justify-between">
                <span>{authService.getAllowedAdminEmail()}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                  {t('唯一の管理者', '유일한 관리자', 'Sole Admin')}
                </span>
              </div>
            </div>

            {/* Primary Action: Google Identity Services (GIS) */}
            <div className="space-y-3 pt-1">
              {/* Google Official Button Container rendered by Google Identity Services */}
              <div className="flex justify-center min-h-[44px]">
                <div ref={googleBtnRef} className="flex justify-center" />
              </div>

              {/* Informative helper when Client ID is pending configuration */}
              {!googleClientId && (
                <div className="p-3 bg-[#F4EFE6] border border-[#DDD3C4] rounded-lg text-left text-xs text-[#5D5347] space-y-2">
                  <div className="flex items-center gap-1.5 font-medium text-[#42372A]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{t('Google ログイン設定のご案内', 'Google 로그인 설정 안내', 'Google Sign-In Setup')}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {t(
                      'Google Cloud Consoleで作成したOAuthクライアントIDを環境変数 VITE_GOOGLE_CLIENT_ID に設定すると、公式Googleログインボタンが表示されます。',
                      'Google Cloud Console에서 발급받은 OAuth 클라이언트 ID를 환경 변수 VITE_GOOGLE_CLIENT_ID에 설정하면 공식 로그인 버튼이 렌더링됩니다.',
                      'Configure your Google OAuth Web Client ID in VITE_GOOGLE_CLIENT_ID to display the official Google Sign-In button.'
                    )}
                  </p>
                </div>
              )}

              {googleError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{googleError}</span>
                </div>
              )}
            </div>

            {/* Google ID Token Tester / Manual Verification (For tests and security audits) */}
            <div className="pt-2 border-t border-[#EAE3D7]">
              {!showTokenVerifier ? (
                <button
                  type="button"
                  onClick={() => setShowTokenVerifier(true)}
                  className="text-[11px] text-[#8C8477] hover:text-[#4A4339] underline cursor-pointer"
                >
                  {t(
                    'Google ID Token サーバー直接検証テスト (ID Token Tester)',
                    'Google ID 토큰 서버 직접 검증 테스트 (ID Token Tester)',
                    'Test Direct Server ID Token Verification'
                  )}
                </button>
              ) : (
                <form onSubmit={handleVerifyIdTokenSubmit} className="space-y-2.5 mt-2 bg-[#F3EDE3] p-3 rounded-md text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#5A4F43]">
                      {t('Google ID Token サーバー検証', 'Google ID 토큰 서버 검증', 'Server ID Token Verification')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTokenVerifier(false)}
                      className="text-[10px] text-[#8A8173] hover:text-[#333]"
                    >
                      {t('閉じる', '닫기', 'Close')}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#71695F] leading-relaxed">
                    {t(
                      'Googleが発行した署名付きIDトークン（JWT）を送信し、サーバー側で暗号署名と dahoon0519@gmail.com の一致を厳格に照合します。改ざんされたトークンや別アカウントは即座に拒否されます。',
                      'Google이 발행한 서명된 ID 토큰(JWT)을 전송하여 서버에서 암호화 서명 및 dahoon0519@gmail.com 일치 여부를 엄격히 검증합니다. 위조 토큰이나 타 계정은 즉시 차단됩니다.',
                      'Submits a Google ID token to the server to verify signature and email match. Forged tokens or other accounts are rejected.'
                    )}
                  </p>
                  <textarea
                    rows={2}
                    placeholder="eyJhbGciOiJSUzI1NiIs..."
                    value={idTokenInput}
                    onChange={(e) => {
                      setIdTokenInput(e.target.value);
                      setGoogleError('');
                    }}
                    className="w-full text-[11px] font-mono px-2.5 py-1.5 bg-white border border-[#DDD5C8] rounded text-[#222] focus:outline-none focus:border-[#735A46] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleCredentialLogin('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.forged.token')}
                      className="text-[10px] px-2.5 py-1 bg-[#E2DBD0] hover:bg-[#D5CCBE] text-[#4A4237] rounded cursor-pointer"
                    >
                      {t('偽造トークン拒否テスト', '위조 토큰 거부 테스트', 'Test Forged Token')}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoggingIn || !idTokenInput.trim()}
                      className="text-xs px-3 py-1 bg-[#665241] hover:bg-[#524133] disabled:opacity-50 text-white rounded cursor-pointer font-medium"
                    >
                      {isLoggingIn ? t('検証中...', '검증 중...', 'Verifying...') : t('トークン検証', '토큰 검증', 'Verify Token')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Logged In Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-[#E8E1D5] bg-[#F3EDE3] px-4 text-xs shrink-0 gap-1">
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'categories'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{t('カテゴリー管理', '카테고리 관리', 'Categories')}</span>
              </button>

              <button
                onClick={() => setActiveTab('content')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'content'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('全画面テキスト', '사이트 전체 문구', 'All Site Texts')}</span>
              </button>

              <button
                onClick={() => setActiveTab('inquiries')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'inquiries'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>{t('お問い合わせ受信箱', '문의 접수함', 'Inquiries Inbox')}</span>
              </button>

              <button
                onClick={() => setActiveTab('contactSettings')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'contactSettings'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{t('お問い合わせ・メール設定', '문의 및 이메일 설정', 'Contact & Email Settings')}</span>
              </button>

              <button
                onClick={() => setActiveTab('home')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'home'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                {t('ホーム代表写真', '홈 대표 사진', 'Hero Media')}
              </button>

              <button
                onClick={() => setActiveTab('coffee')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'coffee'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                {t('コーヒー (1〜4番)', '커피 (1~4번)', 'Coffee (1-4)')}
              </button>

              <button
                onClick={() => setActiveTab('food')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'food'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                {t('料理 (メニュー・紹介)', '요리 (메뉴·설명)', 'Food & Kitchen')}
              </button>

              <button
                onClick={() => setActiveTab('latte')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'latte'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                {t('ラテアート', '라떼아트', 'Latte Art')}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                {t('プロフィール', '프로필/연락처', 'Profile & Info')}
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors ${
                  activeTab === 'backup'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                {t('バックアップ & 復元', '백업 & 복원', 'Backup & Recovery')}
              </button>

              <button
                onClick={() => setActiveTab('adminEmail')}
                className={`py-2.5 px-3 font-medium whitespace-nowrap cursor-pointer border-b-2 -mb-[1px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'adminEmail'
                    ? 'border-[#614936] text-[#1F1E1D] bg-[#FAF8F5]'
                    : 'border-transparent text-[#736C62] hover:text-[#1F1E1D]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('管理者アカウント設定', '관리자 계정 설정', 'Admin Account')}</span>
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* TAB: CATEGORIES */}
              {activeTab === 'categories' && (
                <CategoriesManager
                  currentLang={currentLang}
                  categories={siteContent.categories}
                  onUpdateCategories={(newCats) =>
                    onUpdateSiteContent({ ...siteContent, categories: newCats })
                  }
                  showNotify={showNotify}
                />
              )}

              {/* TAB: SITE CONTENT (siteContent/main) */}
              {activeTab === 'content' && (
                <SiteContentManager
                  currentLang={currentLang}
                  siteContent={siteContent}
                  draftContent={draftContent}
                  onSaveDraft={onSaveDraft}
                  onPublish={onPublish}
                  onDiscardDraft={onDiscardDraft}
                  onRestoreVersion={onRestoreVersion}
                  onPreviewToggle={onPreviewToggle}
                  isPreviewing={isPreviewing}
                  onSaveSiteContent={onUpdateSiteContent}
                  onResetSiteContent={onResetSiteContent}
                  showNotify={showNotify}
                  onClose={onClose}
                />
              )}

              {/* TAB: INQUIRIES */}
              {activeTab === 'inquiries' && (
                <InquiriesManager
                  currentLang={currentLang}
                  showNotify={showNotify}
                />
              )}

              {/* TAB: CONTACT & EMAIL SETTINGS */}
              {activeTab === 'contactSettings' && (
                <ContactEmailSettingsManager
                  currentLang={currentLang}
                  siteContent={siteContent}
                  draftContent={draftContent}
                  profileInfo={profileInfo}
                  onUpdateSiteContent={onUpdateSiteContent}
                  onUpdateProfileInfo={onUpdateProfileInfo}
                  onSaveDraft={onSaveDraft}
                  onPublish={onPublish}
                  showNotify={showNotify}
                />
              )}

              {/* TAB: HOME HERO */}
              {/* TAB: HOME HERO MEDIA */}
              {activeTab === 'home' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-serif-jp text-sm font-medium text-[#222] mb-1">
                      {t(
                        'ホーム画面のメイン代表写真の変更',
                        '홈 화면 첫 메인 대표 사진 변경',
                        'Home Main Hero Media'
                      )}
                    </h4>
                    <p className="text-[11px] text-[#7A7369]">
                      {t(
                        'サイトの最初の画面に大きく表示される代表メディアです。写真または動画をアップロードできます。',
                        '사이트 첫 화면에 크게 보이는 대표 미디어입니다. 사진이나 조리/라떼아트 영상을 업로드할 수 있습니다.',
                        'The primary media displayed on the hero banner. You can upload an image or video.'
                      )}
                    </p>
                  </div>

                  <div className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-4">
                    <span className="font-medium text-[#38332B] block">
                      {t('現在の代表メディア', '현재 대표 미디어', 'Current Hero Media')}
                    </span>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="w-36 h-36 bg-[#F3EFE8] rounded-md overflow-hidden border border-[#DCD5C9] shrink-0 relative group">
                        {isVideoMedia(heroPhoto.imageUrl, heroPhoto.mediaType) ? (
                          <video
                            src={heroPhoto.imageUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={heroPhoto.imageUrl}
                            alt={heroPhoto.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] cursor-pointer transition-opacity">
                          <Upload className="w-5 h-5 mb-1" />
                          <span>{t('変更', '변경', 'Change')}</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleHeroFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <div>
                          <label className="text-[#80776C] text-[11px] block mb-1">
                            {t('作品タイトル', '작품 제목', 'Title')}
                          </label>
                          <input
                            type="text"
                            value={heroPhoto.title}
                            onChange={(e) =>
                              onUpdateHeroPhoto({ ...heroPhoto, title: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-xs bg-[#FAF8F5] text-[#222]"
                          />
                        </div>
                        <div>
                          <label className="text-[#80776C] text-[11px] block mb-1">
                            {t('パターン / 種類', '패턴 / 종류', 'Pattern / Type')}
                          </label>
                          <input
                            type="text"
                            value={heroPhoto.type || ''}
                            onChange={(e) =>
                              onUpdateHeroPhoto({ ...heroPhoto, type: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-xs bg-[#FAF8F5] text-[#222]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pick from Latte Art */}
                  <div className="space-y-3">
                    <span className="font-medium text-[#38332B] block">
                      {t(
                        '登録済みのラテアートから選ぶ',
                        '등록된 라떼아트 사진 중에서 선택하기',
                        'Select from Registered Latte Art'
                      )}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {lattePhotos.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => handleSelectLatteForHero(photo)}
                          className="bg-white border border-[#E0D8CC] hover:border-[#6B4E38] rounded p-2 text-center cursor-pointer transition-all hover:shadow-xs group"
                        >
                          <div className="aspect-square rounded overflow-hidden mb-1.5 bg-[#F6F2EC]">
                            {isVideoMedia(photo.imageUrl, photo.mediaType) ? (
                              <video
                                src={photo.imageUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={photo.imageUrl}
                                alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>
                          <p className="font-serif-jp text-[11px] text-[#222] truncate">
                            {photo.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: LATTE ART */}
              {activeTab === 'latte' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-serif-jp text-sm font-medium text-[#222] mb-1">
                      {t('ラテアート写真の管理', '라떼아트 사진 관리', 'Latte Art Management')}
                    </h4>
                    <p className="text-[11px] text-[#7A7369]">
                      {t(
                        '練習記録の写真や動画を差し替え・追加できます。',
                        '연습 기록 사진 및 영상을 교체하거나 새 사진을 추가할 수 있습니다.',
                        'Replace or add practice records, photos, and video pours.'
                      )}
                    </p>
                  </div>

                  {/* List of Photos */}
                  <div className="space-y-4">
                    {lattePhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="bg-white border border-[#E0D8CC] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-4 items-start"
                      >
                        <div className="w-24 h-24 rounded overflow-hidden bg-[#F2EDE5] border border-[#DDD5C9] shrink-0 relative group">
                          {isVideoMedia(photo.imageUrl, photo.mediaType) ? (
                            <video
                              src={photo.imageUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={photo.imageUrl}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <label className="absolute inset-0 bg-black/55 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] cursor-pointer transition-opacity text-center p-1">
                            <Upload className="w-4 h-4 mb-0.5" />
                            <span>{t('変更', '변경', 'Change')}</span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => handleLatteFileChange(idx, e)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex-1 space-y-2 w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="block text-[#827A70] text-[10px] mb-0.5">
                                {t('タイトル', '제목', 'Title')}
                              </span>
                              <input
                                type="text"
                                value={photo.title}
                                onChange={(e) =>
                                  handleUpdateLatteField(idx, 'title', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                              />
                            </div>
                            <div>
                              <span className="block text-[#827A70] text-[10px] mb-0.5">
                                {t('種類', '종류', 'Type')}
                              </span>
                              <input
                                type="text"
                                value={photo.type || ''}
                                onChange={(e) =>
                                  handleUpdateLatteField(idx, 'type', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                              />
                            </div>
                          </div>

                          <div>
                            <span className="block text-[#827A70] text-[10px] mb-0.5">
                              {t('説明文', '설명글', 'Description')}
                            </span>
                            <input
                              type="text"
                              value={photo.description}
                              onChange={(e) =>
                                handleUpdateLatteField(idx, 'description', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                            />
                          </div>

                          <div className="flex items-center justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteLatte(idx)}
                              className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t('削除', '삭제', 'Delete')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Latte Photo */}
                  <form
                    onSubmit={handleAddLattePhoto}
                    className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-3"
                  >
                    <span className="font-medium text-[#38332B] block">
                      {t(
                        '＋ 新しいラテアート写真を追加',
                        '＋ 새 라떼아트 사진 추가',
                        '＋ Add New Latte Art'
                      )}
                    </span>
                    <div>
                      {newLatteImage ? (
                        <div className="flex items-center gap-3">
                          {isVideoMedia(newLatteImage) ? (
                            <video
                              src={newLatteImage}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ) : (
                            <img
                              src={newLatteImage}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded border"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setNewLatteImage(null)}
                            className="text-red-600 underline text-xs cursor-pointer"
                          >
                            {t('変更', '변경', 'Change')}
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center p-4 border border-dashed border-[#DDD7CC] rounded cursor-pointer bg-[#F8F5EE]">
                          <Upload className="w-4 h-4 mr-2 text-[#7E776D]" />
                          <span>
                            {t(
                              '写真・動画ファイルを選択',
                              '사진/영상 파일 선택',
                              'Select image/video file'
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const r = new FileReader();
                                r.onload = (ev) =>
                                  setNewLatteImage(ev.target?.result as string);
                                r.readAsDataURL(f);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t('タイトル (例: スワン)', '제목 (예: 스완)', 'Title (e.g. Swan)')}
                        value={newLatteTitle}
                        onChange={(e) => setNewLatteTitle(e.target.value)}
                        className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                      />
                      <input
                        type="text"
                        placeholder={t('種類 (例: Swan)', '종류 (예: Swan)', 'Type (e.g. Swan)')}
                        value={newLatteType}
                        onChange={(e) => setNewLatteType(e.target.value)}
                        className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder={t('簡単な説明', '간단한 설명', 'Brief description')}
                      value={newLatteDesc}
                      onChange={(e) => setNewLatteDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#5E4735] hover:bg-[#4D3A2B] text-white rounded cursor-pointer font-medium"
                    >
                      {t('追加する', '추가하기', 'Add Photo')}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB: COFFEE (1~4 EXPLANATIONS & RECORDS) */}
              {activeTab === 'coffee' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif-jp text-sm font-medium text-[#222] mb-0.5">
                        {t(
                          'コーヒー 1〜4番 説明文 & 記録の管理',
                          '커피 1번~4번 설명글 및 기록 관리',
                          'Coffee (1-4) Texts & Records'
                        )}
                      </h4>
                      <p className="text-[11px] text-[#7A7369]">
                        {t(
                          '01エスプレッソ、02センサリー、03ハンドドリップ、04カフェ巡りの各説明文を編集できます。',
                          '01 에스프레소, 02 센서리, 03 핸드드립, 04 카페 탐방의 설명글을 자유롭게 수정할 수 있습니다.',
                          'Edit descriptions for 01 Espresso, 02 Sensory, 03 Hand Drip, and 04 Cafe Visits.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Coffee Subtabs */}
                  <div className="flex gap-2 border-b border-[#E5DFD4] pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCoffeeSubTab('text')}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        coffeeSubTab === 'text'
                          ? 'bg-[#5E4735] text-white font-medium'
                          : 'bg-[#EDE7DE] text-[#554E45] hover:bg-[#E2DBCF]'
                      }`}
                    >
                      {t(
                        '1〜4番 説明文の編集',
                        '1~4번 설명글 수정',
                        'Edit Coffee Texts'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoffeeSubTab('handdrip')}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        coffeeSubTab === 'handdrip'
                          ? 'bg-[#5E4735] text-white font-medium'
                          : 'bg-[#EDE7DE] text-[#554E45] hover:bg-[#E2DBCF]'
                      }`}
                    >
                      {t('ハンドドリップ写真', '핸드드립 사진·영상', 'Hand Drip Media')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoffeeSubTab('visits')}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        coffeeSubTab === 'visits'
                          ? 'bg-[#5E4735] text-white font-medium'
                          : 'bg-[#EDE7DE] text-[#554E45] hover:bg-[#E2DBCF]'
                      }`}
                    >
                      {t(
                        `カフェ巡り記録 (${cafeVisits.length})`,
                        `카페 방문 기록 (${cafeVisits.length})`,
                        `Cafe Visits (${cafeVisits.length})`
                      )}
                    </button>
                  </div>

                  {/* SUBTAB: COFFEE TEXTS (1 to 4) */}
                  {coffeeSubTab === 'text' && (
                    <div className="space-y-4">
                      {/* 01 Espresso */}
                      <div className="bg-white border border-[#DDD6CB] rounded-lg p-4 space-y-3">
                        <span className="font-medium text-[#2E2822] block text-xs">
                          01 · エスプレッソ抽出 (Espresso)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={coffeeForm.espresso.title}
                            placeholder="タイトル"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                espresso: { ...coffeeForm.espresso, title: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                          <input
                            type="text"
                            value={coffeeForm.espresso.tag}
                            placeholder="タグ"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                espresso: { ...coffeeForm.espresso, tag: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                        </div>
                        <textarea
                          rows={3}
                          value={coffeeForm.espresso.body}
                          placeholder="説明文"
                          onChange={(e) =>
                            setCoffeeForm({
                              ...coffeeForm,
                              espresso: { ...coffeeForm.espresso, body: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>

                      {/* 02 Sensory */}
                      <div className="bg-white border border-[#DDD6CB] rounded-lg p-4 space-y-3">
                        <span className="font-medium text-[#2E2822] block text-xs">
                          02 · センサリー / カップノート (Sensory)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={coffeeForm.sensory.title}
                            placeholder="タイトル"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                sensory: { ...coffeeForm.sensory, title: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                          <input
                            type="text"
                            value={coffeeForm.sensory.tag}
                            placeholder="タグ"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                sensory: { ...coffeeForm.sensory, tag: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                        </div>
                        <textarea
                          rows={3}
                          value={coffeeForm.sensory.body}
                          placeholder="説明文"
                          onChange={(e) =>
                            setCoffeeForm({
                              ...coffeeForm,
                              sensory: { ...coffeeForm.sensory, body: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>

                      {/* 03 Hand Drip */}
                      <div className="bg-white border border-[#DDD6CB] rounded-lg p-4 space-y-3">
                        <span className="font-medium text-[#2E2822] block text-xs">
                          03 · ハンドドリップ (Hand Drip)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={coffeeForm.handDrip.title}
                            placeholder="タイトル"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                handDrip: { ...coffeeForm.handDrip, title: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                          <input
                            type="text"
                            value={coffeeForm.handDrip.tag}
                            placeholder="タグ"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                handDrip: { ...coffeeForm.handDrip, tag: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                        </div>
                        <textarea
                          rows={3}
                          value={coffeeForm.handDrip.body}
                          placeholder="説明文"
                          onChange={(e) =>
                            setCoffeeForm({
                              ...coffeeForm,
                              handDrip: { ...coffeeForm.handDrip, body: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>

                      {/* 04 Cafe Studies */}
                      <div className="bg-white border border-[#DDD6CB] rounded-lg p-4 space-y-3">
                        <span className="font-medium text-[#2E2822] block text-xs">
                          04 · カフェ巡り紹介 (Cafe Studies Intro)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={coffeeForm.cafeVisitsIntro.title}
                            placeholder="タイトル"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                cafeVisitsIntro: {
                                  ...coffeeForm.cafeVisitsIntro,
                                  title: e.target.value,
                                },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                          <input
                            type="text"
                            value={coffeeForm.cafeVisitsIntro.tag}
                            placeholder="タグ"
                            onChange={(e) =>
                              setCoffeeForm({
                                ...coffeeForm,
                                cafeVisitsIntro: {
                                  ...coffeeForm.cafeVisitsIntro,
                                  tag: e.target.value,
                                },
                              })
                            }
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={coffeeForm.cafeVisitsIntro.body}
                          placeholder="説明文"
                          onChange={(e) =>
                            setCoffeeForm({
                              ...coffeeForm,
                              cafeVisitsIntro: {
                                ...coffeeForm.cafeVisitsIntro,
                                body: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onResetCoffeeContent();
                            showNotify(
                              t('初期状態に復元しました', '기본 내용으로 복원되었습니다', 'Restored to default content')
                            );
                          }}
                          className="text-xs text-[#8A8276] hover:text-[#222] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('初期状態に戻す', '초기 상태로 복원', 'Reset to Defaults')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateCoffeeContent(coffeeForm);
                            showNotify(
                              t('説明文を保存しました', '커피 1~4번 설명글이 저장되었습니다', 'Saved coffee descriptions')
                            );
                          }}
                          className="px-4 py-1.5 bg-[#5E4735] text-white rounded cursor-pointer font-medium hover:bg-[#4D3A2B] flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('変更を保存', '설명글 저장하기', 'Save Changes')}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: HAND DRIP MEDIA */}
                  {coffeeSubTab === 'handdrip' && (
                    <div className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-3">
                      <span className="font-medium text-[#38332C] block">
                        {t('ハンドドリップ写真・動画', '핸드드립 사진·영상', 'Hand Drip Photo / Video')}
                      </span>
                      {handDripPhotoUrl ? (
                        <div className="flex items-center gap-4">
                          {isVideoMedia(handDripPhotoUrl) ? (
                            <video
                              src={handDripPhotoUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-28 h-20 object-cover rounded border"
                            />
                          ) : (
                            <img
                              src={handDripPhotoUrl}
                              alt="Drip"
                              className="w-28 h-20 object-cover rounded border"
                            />
                          )}
                          <div className="space-y-1">
                            <label className="text-xs text-[#5E4735] hover:underline cursor-pointer block">
                              {t('メディア変更', '미디어 변경', 'Change Media')}
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleDripFile}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => onUpdateHandDripPhoto(null)}
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              {t('削除', '삭제', 'Delete')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center p-5 border border-dashed border-[#DDD7CC] rounded cursor-pointer bg-[#F8F5EE]">
                          <Upload className="w-4 h-4 mr-2 text-[#7E776D]" />
                          <span>
                            {t(
                              'ハンドドリップ写真・動画をアップロード',
                              '핸드드립 사진·동영상 업로드',
                              'Upload Hand Drip Photo / Video'
                            )}
                          </span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleDripFile}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* SUBTAB: CAFE VISITS LIST */}
                  {coffeeSubTab === 'visits' && (
                    <div className="space-y-4">
                      {/* Add Form */}
                      <form
                        onSubmit={handleAddCafe}
                        className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-2.5"
                      >
                        <span className="block font-medium text-[#38332B] mb-1">
                          {t('新しい訪問記録を追加', '새 방문 기록 추가', 'Add New Cafe Visit')}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder={t('店名 (例: FUGLEN TOKYO)', '매장명 (예: FUGLEN TOKYO)', 'Cafe Name (e.g. FUGLEN TOKYO)')}
                            value={newCafeName}
                            onChange={(e) => setNewCafeName(e.target.value)}
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                          <input
                            type="text"
                            placeholder={t('地域 / エリア (例: 東京・代々木公園)', '지역 / 위치 (예: 도쿄 요요기공원)', 'Location / Area (e.g. Tokyo Yoyogi Park)')}
                            value={newCafeLoc}
                            onChange={(e) => setNewCafeLoc(e.target.value)}
                            className="px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder={t('飲んだコーヒー (例: ノルディックロースト / エチオピア)', '마신 커피 (예: 노르딕 로스트 / 에티오피아)', 'Coffee Ordered (e.g. Nordic Roast / Ethiopia)')}
                          value={newCafeCoffee}
                          onChange={(e) => setNewCafeCoffee(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                        />
                        <textarea
                          rows={2}
                          placeholder={t('店舗の雰囲気や抽出の印象など', '매장 분위기나 추출에 대한 인상 등', 'Atmosphere, flavor impressions, etc.')}
                          value={newCafeNotes}
                          onChange={(e) => setNewCafeNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#5E4735] text-white rounded cursor-pointer font-medium hover:bg-[#4D3A2B]"
                        >
                          {t('訪問記録を保存', '방문 기록 저장', 'Save Visit Record')}
                        </button>
                      </form>

                      {/* List */}
                      <div className="space-y-2">
                        {cafeVisits.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 bg-white border border-[#DDD5C9] rounded-lg flex items-start justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <span className="font-serif-jp font-medium text-[#222]">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-[#787166] ml-2">
                                ({item.location})
                              </span>
                              {item.coffee && (
                                <p className="text-[#614E3C] text-[11px]">
                                  {item.coffee}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteCafe(item.id)}
                              className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: FOOD (DISHES, ADD, OVERVIEW) */}
              {activeTab === 'food' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif-jp text-sm font-medium text-[#222] mb-0.5">
                        {t(
                          '料理メニュー & 写真・説明の管理',
                          '요리 메뉴 및 사진·설명 관리',
                          'Food Menus & Dish Management'
                        )}
                      </h4>
                      <p className="text-[11px] text-[#7A7369]">
                        {t(
                          'これまで作ってきた料理の写真・動画を登録し、タイトルや説明を自由に変更できます。',
                          '지금까지 해온 요리 사진·영상을 등록하고 이름과 설명을 자유롭게 변경할 수 있습니다.',
                          'Manage dish photos, videos, descriptions, and roles.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Food Subtabs */}
                  <div className="flex gap-2 border-b border-[#E5DFD4] pb-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setFoodSubTab('dishes')}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        foodSubTab === 'dishes'
                          ? 'bg-[#5E4735] text-white font-medium'
                          : 'bg-[#EDE7DE] text-[#554E45] hover:bg-[#E2DBCF]'
                      }`}
                    >
                      {t(
                        `登録済み料理一覧 (${foodPhotos.length})`,
                        `등록된 요리 목록 (${foodPhotos.length})`,
                        `Dishes (${foodPhotos.length})`
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodSubTab('add')}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        foodSubTab === 'add'
                          ? 'bg-[#5E4735] text-white font-medium'
                          : 'bg-[#EDE7DE] text-[#554E45] hover:bg-[#E2DBCF]'
                      }`}
                    >
                      {t('＋ 新規料理の追加', '＋ 새 요리 추가', '＋ Add New Dish')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoodSubTab('overview')}
                      className={`px-3 py-1 rounded cursor-pointer ${
                        foodSubTab === 'overview'
                          ? 'bg-[#5E4735] text-white font-medium'
                          : 'bg-[#EDE7DE] text-[#554E45] hover:bg-[#E2DBCF]'
                      }`}
                    >
                      {t('料理カテゴリー紹介文', '요리 소개글 편집', 'Kitchen Overview Text')}
                    </button>
                  </div>

                  {/* SUBTAB: DISHES LIST */}
                  {foodSubTab === 'dishes' && (
                    <div className="space-y-4">
                      {foodPhotos.map((dish) => (
                        <div
                          key={dish.id}
                          className="bg-white border border-[#E0D8CC] rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start"
                        >
                          {/* Media Thumbnail */}
                          <div className="w-28 h-24 bg-[#F4EFE6] rounded border border-[#D5CDC0] overflow-hidden shrink-0 relative group">
                            {dish.imageUrl ? (
                              isVideoMedia(dish.imageUrl, dish.mediaType) ? (
                                <video
                                  src={dish.imageUrl}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.title}
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9E978C] text-[10px]">
                                {t('未登録', '미등록', 'No media')}
                              </div>
                            )}
                            <label className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] cursor-pointer transition-opacity">
                              <Upload className="w-4 h-4 mb-0.5" />
                              <span>{dish.imageUrl ? t('変更', '변경', 'Change') : t('登録', '등록', 'Upload')}</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => handleDishMediaUpload(dish.id, e)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Editable fields */}
                          <div className="flex-1 space-y-2 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="sm:col-span-2">
                                <span className="block text-[#827A70] text-[10px] mb-0.5">
                                  {t('料理名', '요리명', 'Dish Name')}
                                </span>
                                <input
                                  type="text"
                                  value={dish.title}
                                  onChange={(e) =>
                                    handleUpdateDishField(dish.id, 'title', e.target.value)
                                  }
                                  className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                                />
                              </div>
                              <div>
                                <span className="block text-[#827A70] text-[10px] mb-0.5">
                                  {t('カテゴリー', '카테고리', 'Category')}
                                </span>
                                <input
                                  type="text"
                                  value={dish.category}
                                  onChange={(e) =>
                                    handleUpdateDishField(dish.id, 'category', e.target.value)
                                  }
                                  className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="block text-[#827A70] text-[10px] mb-0.5">
                                {t('詳細説明', '상세 설명', 'Detailed Description')}
                              </span>
                              <textarea
                                rows={2}
                                value={dish.description}
                                onChange={(e) =>
                                  handleUpdateDishField(dish.id, 'description', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5] leading-relaxed"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="w-44">
                                <input
                                  type="text"
                                  placeholder={t('時期 / 担当店舗 (任意)', '시기 / 담당 매장 (선택)', 'Period / Location (Optional)')}
                                  value={dish.date || ''}
                                  onChange={(e) =>
                                    handleUpdateDishField(dish.id, 'date', e.target.value)
                                  }
                                  className="w-full px-2 py-1 text-[11px] border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    confirm(
                                      t(
                                        `「${dish.title}」を削除しますか？`,
                                        `「${dish.title}」 요리를 삭제하시겠습니까?`,
                                        `Delete "${dish.title}"?`
                                      )
                                    )
                                  ) {
                                    onDeleteFoodPhoto(dish.id);
                                    showNotify(
                                      t('削除しました', '삭제되었습니다', 'Deleted dish')
                                    );
                                  }
                                }}
                                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{t('削除', '삭제', 'Delete')}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SUBTAB: ADD DISH */}
                  {foodSubTab === 'add' && (
                    <form
                      onSubmit={handleAddDishSubmit}
                      className="bg-white border border-[#E0D8CC] rounded-lg p-4 sm:p-5 space-y-3"
                    >
                      <span className="font-medium text-[#2E2822] block">
                        {t('新しい料理・メニューの登録', '새로운 요리 등록하기', 'Register New Dish')}
                      </span>

                      {/* Photo / Video preview */}
                      <div>
                        {newDishImage ? (
                          <div className="flex items-center gap-3">
                            {newDishMediaType === 'video' ? (
                              <video
                                src={newDishImage}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-24 h-16 object-cover rounded border"
                              />
                            ) : (
                              <img
                                src={newDishImage}
                                alt="Preview"
                                className="w-24 h-16 object-cover rounded border"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setNewDishImage(null)}
                              className="text-red-600 text-xs underline cursor-pointer"
                            >
                              {t('変更', '변경', 'Change')}
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center p-4 border border-dashed border-[#DDD7CC] rounded cursor-pointer bg-[#F8F5EE]">
                            <Upload className="w-4 h-4 mr-2 text-[#7E776D]" />
                            <span>
                              {t(
                                '料理写真または動画ファイルを選択 (任意)',
                                '요리 사진 또는 동영상 파일 선택 (선택 사항)',
                                'Select dish photo or video file (optional)'
                              )}
                            </span>
                            <input
                              type="file"
                              accept="image/*,video/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  const isVideo = f.type.startsWith('video/');
                                  const r = new FileReader();
                                  r.onload = (ev) => {
                                    setNewDishImage(ev.target?.result as string);
                                    setNewDishMediaType(isVideo ? 'video' : 'image');
                                  };
                                  r.readAsDataURL(f);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] text-[#7A7369] block mb-0.5">
                            {t('料理名 *', '요리명 *', 'Dish Name *')}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={t('例: 薪窯ピッツァ マルゲリータ', '예: 화덕 피자 마르게리따', 'e.g. Wood-fired Margherita Pizza')}
                            value={newDishTitle}
                            onChange={(e) => setNewDishTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-[#7A7369] block mb-0.5">
                            {t('カテゴリー', '카테고리', 'Category')}
                          </label>
                          <select
                            value={newDishCategory}
                            onChange={(e) => setNewDishCategory(e.target.value)}
                            className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                          >
                            {foodCategories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-[#7A7369] block mb-0.5">
                          {t('時期・店舗名 (任意)', '시기·매장명 (선택)', 'Period / Location (Optional)')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('例: GARB GREEN WALK / 2023 - 現在', '예: GARB GREEN WALK / 2023 - 현재', 'e.g. GARB GREEN WALK / 2023 - Present')}
                          value={newDishDate}
                          onChange={(e) => setNewDishDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-[#7A7369] block mb-0.5">
                          {t('調理内容・詳細説明', '조리 내용·상세 설명', 'Cooking Methods & Details')}
                        </label>
                        <textarea
                          rows={3}
                          placeholder={t('生地の発酵状態、火入れのポイント、盛り付けの工夫など', '반죽 발효 상태, 불 조절 포인트, 플레이팅 등', 'Fermentation, flame control, plating, etc.')}
                          value={newDishDesc}
                          onChange={(e) => setNewDishDesc(e.target.value)}
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#5E4735] hover:bg-[#4D3A2B] text-white rounded cursor-pointer font-medium"
                      >
                        {t('料理を登録する', '새 요리 등록하기', 'Register Dish')}
                      </button>
                    </form>
                  )}

                  {/* SUBTAB: FOOD OVERVIEW */}
                  {foodSubTab === 'overview' && (
                    <div className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-3">
                      <span className="font-medium text-[#2E2822] block">
                        {t('料理・キッチン全体の紹介文', '요리·주방 전체 소개글', 'Kitchen & Food Overview')}
                      </span>
                      <div>
                        <label className="text-[11px] text-[#7A7369] block mb-0.5">
                          {t('勤務状況バッジ', '현재 근무 상태 / 배지', 'Role Status Badge')}
                        </label>
                        <input
                          type="text"
                          value={foodOverviewForm.roleBadge}
                          onChange={(e) =>
                            setFoodOverviewForm({
                              ...foodOverviewForm,
                              roleBadge: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#7A7369] block mb-0.5">
                          {t('担当パート名', '담당 파트 타이틀', 'Station / Role Title')}
                        </label>
                        <input
                          type="text"
                          value={foodOverviewForm.roleTitle}
                          onChange={(e) =>
                            setFoodOverviewForm({
                              ...foodOverviewForm,
                              roleTitle: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#7A7369] block mb-0.5">
                          {t('現在の主な業務・調理内容', '현재 주된 조리 및 실무 설명', 'Current Kitchen Duties')}
                        </label>
                        <textarea
                          rows={3}
                          value={foodOverviewForm.roleDesc}
                          onChange={(e) =>
                            setFoodOverviewForm({
                              ...foodOverviewForm,
                              roleDesc: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#7A7369] block mb-0.5">
                          {t('過去の経験・補足', '이전 경험 및 역량 보충 설명', 'Past Experience & Notes')}
                        </label>
                        <textarea
                          rows={2}
                          value={foodOverviewForm.pastNote}
                          onChange={(e) =>
                            setFoodOverviewForm({
                              ...foodOverviewForm,
                              pastNote: e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 border rounded bg-[#FAF8F5] leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onResetFoodOverview();
                            showNotify(
                              t('初期状態に復元しました', '기본 내용으로 복원되었습니다', 'Restored to default content')
                            );
                          }}
                          className="text-xs text-[#8A8276] hover:text-[#222] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('初期状態', '초기화', 'Reset to Default')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateFoodOverview(foodOverviewForm);
                            showNotify(
                              t('紹介文を保存しました', '요리 소개글이 저장되었습니다', 'Saved kitchen overview')
                            );
                          }}
                          className="px-4 py-1.5 bg-[#5E4735] text-white rounded cursor-pointer font-medium hover:bg-[#4D3A2B] flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {t('変更を保存', '소개글 저장', 'Save Changes')}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-serif-jp text-sm font-medium text-[#222] mb-1">
                      {t('プロフィール & 連絡先情報', '프로필 & 연락처 정보', 'Profile & Contact Information')}
                    </h4>
                    <p className="text-[11px] text-[#7A7369]">
                      {t(
                        '名前、メールアドレス、勤務希望地域などの情報を更新できます。',
                        '성명, 이메일, 근무 가능 지역 등의 정보를 수정할 수 있습니다.',
                        'Update your name, email, target work location, and SNS links.'
                      )}
                    </p>
                  </div>

                  <div className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-3">
                    <div>
                      <span className="block text-[#827A70] text-[10px] mb-0.5">
                        {t('お名前 (Name)', '성명 (Name)', 'Name')}
                      </span>
                      <input
                        type="text"
                        value={profileInfo.name}
                        onChange={(e) =>
                          onUpdateProfileInfo({ ...profileInfo, name: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                      />
                    </div>

                    <div>
                      <span className="block text-[#827A70] text-[10px] mb-0.5">
                        {t('メールアドレス (Email)', '이메일 주소 (Email)', 'Email Address')}
                      </span>
                      <input
                        type="email"
                        value={profileInfo.email}
                        onChange={(e) =>
                          onUpdateProfileInfo({ ...profileInfo, email: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                      />
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8C8477]">
                        <span>{t('※ お問い合わせ通知先と連動しています', '※ 문의 알림 수신처와 실시간 연동됩니다', '※ Synchronized with inquiry notification recipient')}</span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('contactSettings')}
                          className="text-[#634832] hover:underline font-medium cursor-pointer"
                        >
                          {t('お問い合わせ・メール設定を開く →', '문의 및 이메일 설정 열기 →', 'Open Contact & Email Settings →')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[#827A70] text-[10px] mb-0.5">
                        Instagram
                      </span>
                      <input
                        type="text"
                        value={profileInfo.instagram}
                        onChange={(e) =>
                          onUpdateProfileInfo({
                            ...profileInfo,
                            instagram: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                      />
                    </div>

                    <div>
                      <span className="block text-[#827A70] text-[10px] mb-0.5">
                        {t('勤務地 / 居住エリア (Location)', '근무지 / 거주 지역 (Location)', 'Work Location / Area')}
                      </span>
                      <input
                        type="text"
                        value={profileInfo.location}
                        onChange={(e) =>
                          onUpdateProfileInfo({
                            ...profileInfo,
                            location: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 border border-[#DDD6CB] rounded text-[#222] bg-[#FAF8F5]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: BACKUP & RECOVERY */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-serif-jp text-sm font-medium text-[#222] mb-1">
                      {t(
                        'データのバックアップ & 安全復元・初期化',
                        '데이터 백업 & 안전 복원·초기화',
                        'Data Backup & Safe Recovery'
                      )}
                    </h4>
                    <p className="text-[11px] text-[#7A7369]">
                      {t(
                        'すべての登録写真やテキストの安全スナップショット管理、ファイルダウンロード・復元を行えます。',
                        '모든 등록 사진과 텍스트의 안전 스냅샷 관리, 백업 파일 다운로드 및 복원을 수행할 수 있습니다.',
                        'Manage safe local snapshots, export/import JSON backups, and restore portfolio state.'
                      )}
                    </p>
                  </div>

                  {/* Explicit Recovery Scope & Limitations Banner */}
                  <div className="bg-[#FAF3EB] border border-[#E2D5C5] rounded-lg p-3.5 space-y-1.5 text-xs text-[#634832]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#8C6239] shrink-0" />
                      <span>
                        {t(
                          '復元スコープの明確な定義 (Recovery Scope)',
                          '복원 적용 범위 명시 (Recovery Scope)',
                          'Explicit Recovery Scope Specification'
                        )}
                      </span>
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-[#785C42]">
                      <li>
                        <strong>{t('ローカルストレージ安全スナップショット:', '로컬 브라우저 안전 스냅샷:', 'Local Browser Snapshot:')}</strong>{' '}
                        {t(
                          'ブラウザ内に保存された公開データ、下書き、旧形式のコーヒーキャッシュを安全に復元します。',
                          '브라우저에 보관된 게시 데이터, 임시저장(Draft), 레거시 커피 캐시를 안전하게 복원합니다.',
                          'Safely restores browser-stored published content, drafts, and legacy coffee data.'
                        )}
                      </li>
                      <li>
                        <strong>{t('クラウド Firestore の状態:', '클라우드 Firestore 상태:', 'Cloud Firestore Status:')}</strong>{' '}
                        {t(
                          'リモート Firestore のドキュメントは Google Cloud 上に個別に保管されており、クライアント側のローカルスナップショットには含まれません。復元処理はローカルデータを対象とします。',
                          '원격 Firestore 문서는 Google Cloud 상에 별도로 안전하게 보관되며 클라이언트 로컬 스냅샷에 중복 백업되지 않습니다. 복원 시에도 로컬 데이터를 안전하게 처리합니다.',
                          'Remote Firestore documents are stored separately on Google Cloud Firestore and are not bundled into local client snapshots. Recovery targets local client storage.'
                        )}
                      </li>
                    </ul>
                  </div>

                  {/* Safety Snapshots Card */}
                  <div className="bg-white border border-[#E0D8CC] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-[#2E2822] block text-xs">
                          {t('ローカル安全スナップショット', '로컬 자동 안전 스냅샷', 'Local Safety Snapshot')}
                        </span>
                        <span className="text-[11px] text-[#7D766C]">
                          {localStorage.getItem(COFFEE_BACKUP_KEY)
                            ? t(
                                `作成日時: ${new Date(JSON.parse(localStorage.getItem(COFFEE_BACKUP_KEY) || '{}').createdAt || Date.now()).toLocaleString()}`,
                                `생성 시각: ${new Date(JSON.parse(localStorage.getItem(COFFEE_BACKUP_KEY) || '{}').createdAt || Date.now()).toLocaleString()}`,
                                `Created: ${new Date(JSON.parse(localStorage.getItem(COFFEE_BACKUP_KEY) || '{}').createdAt || Date.now()).toLocaleString()}`
                              )
                            : t('保存されたスナップショットはありません', '저장된 스냅샷이 없습니다', 'No snapshot saved')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isRestoringSnapshot || !localStorage.getItem(COFFEE_BACKUP_KEY)}
                          onClick={() => handleRestoreFromSafetySnapshot(false)}
                          className="px-3 py-1.5 bg-[#4A3B2E] hover:bg-[#3D2F23] disabled:opacity-50 text-white rounded cursor-pointer font-medium text-xs flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('スナップショットから復元', '스냅샷에서 복원', 'Restore Snapshot')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Snapshot result message if available */}
                    {snapshotResult && (
                      <div className="p-2.5 rounded bg-[#F8F5EE] border border-[#E0D8CC] text-[11px] text-[#4A3B2E]">
                        {snapshotResult}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-[#E0D8CC] rounded-lg p-5 space-y-4">
                    {/* Export */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
                      <div>
                        <span className="font-medium text-[#2E2822] block text-xs">
                          {t(
                            'バックアップをダウンロード',
                            '전체 데이터 백업 다운로드',
                            'Export Portfolio Backup JSON'
                          )}
                        </span>
                        <span className="text-[11px] text-[#7D766C]">
                          {t(
                            'すべての登録データ（写真・文章・記録）をJSONファイルとして保存します。',
                            '수정한 사진, 텍스트, 요리, 카페 기록 전체를 파일로 저장합니다.',
                            'Downloads all registered media, dishes, coffee notes, and site content as a JSON file.'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="px-3.5 py-1.5 bg-[#4A3B2E] hover:bg-[#3D2F23] text-white rounded cursor-pointer font-medium flex items-center gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{t('ダウンロード', '백업 받기', 'Download JSON')}</span>
                      </button>
                    </div>

                    {/* Import */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
                      <div>
                        <span className="font-medium text-[#2E2822] block text-xs">
                          {t(
                            'バックアップから復元',
                            '백업 파일에서 불러오기 (복원)',
                            'Restore from JSON Backup'
                          )}
                        </span>
                        <span className="text-[11px] text-[#7D766C]">
                          {t(
                            '以前保存したJSONファイルを読み込みます（現在の状態は安全のため自動的に事前バックアップされます）。',
                            '이전에 저장해 둔 JSON 백업 파일을 선택하여 복원합니다 (현재 상태는 안전을 위해 자동 사전 백업됩니다).',
                            'Restores data from a JSON file (a pre-recovery safety backup of current data will be created first).'
                          )}
                        </span>
                      </div>
                      <label className="px-3.5 py-1.5 border border-[#DDD5C9] bg-[#FAF8F5] hover:bg-white text-[#2C2926] rounded cursor-pointer font-medium flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t('ファイル選択', '파일 선택', 'Choose File')}</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Reset All */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="font-medium text-red-700 block text-xs">
                          {t(
                            'すべてのデータを初期状態に戻す',
                            '모든 데이터를 최초 기본값으로 초기화',
                            'Reset All Data to Initial Defaults'
                          )}
                        </span>
                        <span className="text-[11px] text-[#8C8477]">
                          {t(
                            'ローカル保存データを初期ポートフォリオ状態に戻します（現在の状態は自動的に安全スナップショットに保管されます）。',
                            '추가 또는 수정한 모든 데이터를 지우고 처음 상태로 되돌립니다 (현재 상태는 자동 안전 스냅샷에 보관됩니다).',
                            'Resets all custom portfolio entries to defaults (current state is preserved in a pre-reset safety snapshot).'
                          )}
                        </span>
                      </div>
                      <button
                        onClick={onResetAllData}
                        className="px-3.5 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded cursor-pointer font-medium flex items-center gap-1.5 shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{t('初期化', '초기화', 'Reset All')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ADMIN EMAIL SETTINGS (Dual Method A & B) */}
              {activeTab === 'adminEmail' && (
                <div className="space-y-6">
                  {/* Section Title & Overview */}
                  <div className="flex items-start justify-between border-b border-[#EAE3D6] pb-4">
                    <div>
                      <h4 className="font-serif-jp text-sm sm:text-base font-medium text-[#221F1B] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#614936]" />
                        <span>
                          {t(
                            '管理者アカウント & 認証セキュリティ設定',
                            '관리자 계정 및 인증 보안 설정',
                            'Administrator Account & Security Settings'
                          )}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#7A7266] mt-1 leading-relaxed">
                        {t(
                          'ポートフォリオのコンテンツ編集や公開を行えるGoogle管理者アカウントを管理します。管理画面からの即時変更（方法A）と環境設定によるデプロイ変更（方法B）の双方向に対応しています。',
                          '포트폴리오 콘텐츠 수정 및 게시 권한을 가진 Google 관리자 계정을 관리합니다. 관리 화면 즉시 변경(방법 A)과 환경 설정 배포 변경(방법 B)을 모두 지원합니다.',
                          'Manage the authorized Google Administrator account. Supports instant change via this admin interface (Method A) and deployment configuration via environment variables (Method B).'
                        )}
                      </p>
                    </div>
                  </div>


                  {/* Status Card: Currently Authorized Email */}
                  <div className="bg-[#FAF8F5] border border-[#DDD5C9] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#5A4F43] uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {t(
                          '現在アクセス許可されている管理者アカウント',
                          '현재 접근 승인된 관리자 계정',
                          'Currently Authorized Administrator Account'
                        )}
                      </span>
                      {authService.isCustomEmailActive() ? (
                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
                          {t('管理画面カスタム設定', '관리 화면 설정됨', 'Custom Override Active')}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-medium">
                          {t('環境設定 / デフォルト', '환경 설정 / 기본값', 'Configured Default')}
                        </span>
                      )}
                    </div>

                    <div className="bg-white border border-[#DDD5C9] rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-mono text-sm font-semibold text-[#1F1E1D]">
                          {authService.getAllowedAdminEmail()}
                        </div>
                        <div className="text-[10px] text-[#7A7266]">
                          {t('ベースライン設定値: ', '기준 기본값: ', 'Baseline Default: ')}
                          <span className="font-mono">{authService.getConfiguredDefaultEmail()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#7A7266]">
                          {t('ログイン中セッション: ', '현재 세션: ', 'Current Session: ')}
                          <span className="font-mono font-medium text-[#1F1E1D]">
                            {adminUser?.email || authService.getAllowedAdminEmail()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Server-Enforced Single Administrator Architecture Panel */}
                  <div className="bg-white border border-[#E0D8CC] rounded-lg p-5 space-y-4">
                    <div className="border-b border-[#EAE3D6] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[10px] font-bold">
                          SECURITY
                        </span>
                        <h5 className="font-medium text-[#2E2822] text-xs sm:text-sm">
                          {t(
                            '単一管理者アカウント（サーバーサイド厳格検証）',
                            '단일 관리자 계정 (서버사이드 엄격 검증)',
                            'Sole Administrator (Server-Enforced Authorization)'
                          )}
                        </h5>
                      </div>
                      <p className="text-[11px] text-[#7D766C] mt-1 leading-relaxed">
                        {t(
                          'セキュリティ保護のため、クライアントストレージによる管理者メール変更やローカルPINは廃止されました。Google Identity Servicesによる暗号署名検証と、サーバー環境変数（ADMIN_EMAIL）により、許可された単一アカウントのみが厳格に保護されます。',
                          '보안 강화를 위해 브라우저 로컬 스토리지를 통한 관리자 계정 변경 및 임시 PIN 인증이 전면 폐지되었습니다. Google 공식 ID 토큰의 암호화 서명 검증과 서버 환경 변수(ADMIN_EMAIL)를 통해 지정된 단일 관리자만 안전하게 접근할 수 있습니다.',
                          'For enterprise security, client storage overrides and local PINs have been retired. Authentication is strictly enforced via Google cryptographic ID token verification and server environment configuration.'
                        )}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-medium text-[#4A3B2E] block mb-1">
                          {t('唯一の認可管理者メールアドレス (Server White-list):', '유일하게 승인된 관리자 이메일 (Server White-list):', 'Authorized Administrator Email:')}
                        </span>
                        <pre className="bg-[#26201B] text-emerald-300 p-3 rounded text-[11px] font-mono overflow-x-auto flex items-center justify-between">
                          <span>{authService.getAllowedAdminEmail()}</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                            VERIFIED
                          </span>
                        </pre>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-[#4A3B2E] block mb-1">
                          {t('Netlify / サーバー環境変数設定:', 'Netlify / 서버 환경 변수 설정:', 'Netlify / Server Environment Variables:')}
                        </span>
                        <pre className="bg-[#26201B] text-amber-200 p-3 rounded text-[11px] font-mono overflow-x-auto space-y-1">
                          <div>ADMIN_EMAIL="{authService.getAllowedAdminEmail()}"</div>
                          <div>GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"</div>
                          <div>SESSION_SECRET="your-32-char-random-secret"</div>
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Security Architecture Audit & Transparency Card */}
                  <div className="bg-[#FAF8F5] border border-[#E0D8CC] rounded-lg p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#6B533E]" />
                      <h5 className="font-medium text-[#2E2822] text-xs">
                        {t(
                          'セキュリティ & アーキテクチャ監査概要',
                          '보안 및 아키텍처 감사 요약',
                          'Security & Architecture Audit Summary'
                        )}
                      </h5>
                    </div>

                    <div className="text-[11px] text-[#63594C] space-y-2 leading-relaxed">
                      <p>
                        {t(
                          '本ポートフォリオは Vite ベースの React クライアント SPA として稼働しており、コンテンツや下書き・バージョン履歴はブラウザの localStorage / sessionStorage に保管されています。',
                          '본 포트폴리오는 Vite 기반 React 클라이언트 SPA로 동작하며, 콘텐츠 및 임시저장·버전 이력은 브라우저의 localStorage / sessionStorage에 안전하게 보관됩니다.',
                          'This portfolio runs as a client-side React SPA with Vite, storing content, drafts, and version snapshots in browser localStorage/sessionStorage.'
                        )}
                      </p>
                      <p>
                        {t(
                          '管理者権限の検証は authService.isAuthorizedAdmin() を通じてクライアント側で厳格に照合されています。バックエンドDB（Firestore等）を接続する場合は、サーバーサイドのセキュリティルール（firestore.rules）に request.auth.token.email == adminEmail の照合を組み込むことで、完全なサーバーサイド検証が実現可能です。',
                          '관리자 권한 검증은 authService.isAuthorizedAdmin()을 통해 브라우저 앱 런타임에서 단일 관리자 화이트리스트로 엄격히 대조됩니다. 향후 백엔드 DB(Firestore 등) 연동 시에는 firestore.rules를 통해 서버 차원의 완벽한 권한 강제가 가능합니다.',
                          'Administrator authorization is strictly checked against the allowlisted admin email via authService.isAuthorizedAdmin(). For multi-user environments with a cloud database, configuring server-side security rules in firestore.rules ensures end-to-end enforcement.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
