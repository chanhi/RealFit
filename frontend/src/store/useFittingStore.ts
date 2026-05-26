import { create } from 'zustand'

export type BaseModelType =
  | 'male-slim'
  | 'male-normal'
  | 'male-chubby'
  | 'female-slim'
  | 'female-normal'
  | 'female-chubby'

export interface BodyMeasurements {
  height_cm: number;
  model_height_unit: number;
  scale_factor: number;
  shoulder_width_cm: number;
  chest_width_cm: number;
  waist_width_cm: number;
  hip_width_cm: number;
}

export interface ArchiveItem {
  id: number | string;
  date: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

const INITIAL_ARCHIVES: ArchiveItem[] = [];

export interface WardrobeItem {
  id: string;
  imageUrl: string;
  category: string;
}

const MOCK_WARDROBE: WardrobeItem[] = [
  { id: 'w1', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=200&auto=format&fit=crop', category: 'top' },
  { id: 'w2', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop', category: 'top' },
  { id: 'w3', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200&auto=format&fit=crop', category: 'top' },
];

export interface FittingState {
  // 1단계: 사용자 전신 사진
  photoFile: File | null;
  photoPreviewUrl: string | null;

  // 2단계: 의류 (옷) 사진
  clothingFile: File | null;
  clothingPreviewUrl: string | null;
  
  // 결과물 URL
  modelUrl: string | null;
  vtonResultUrl: string | null;
  bodyMeasurements: BodyMeasurements | null; // 신체 측정치 추가
  
  // 기타 UI 상태
  isLoading: boolean;
  isRemovingBg: boolean;
  loadingType: '3d' | 'vton' | null;
  loadingStage: number; // 0~3
  toastMessage: string | null;
  activeTab: '3d' | '2d';
  activeTool: 'FITTING' | 'SCULPT' | null;
  
  // 라우팅
  currentPage: 'HOME' | 'SHOP' | 'ATELIER' | 'ARCHIVE' | 'ABOUT';
  isDarkMode: boolean;

  // 아카이브, 옷장, 위시리스트
  savedArchives: ArchiveItem[];
  wardrobeItems: WardrobeItem[];
  isWardrobeLoading: boolean;
  wishlistIds: string[];

  // 기본 체형(마네킹) 선택
  selectedBaseModel: BaseModelType | null;

  // 체형 조각(Sculpting) 스케일 조절자
  sculptModifiers: { width: number, height: number, depth: number };

  // 현재 진행 중인 백엔드 Job ID
  currentJobId: string | null;

  // 상태 변경 메서드
  setPhoto: (file: File | null, previewUrl: string | null) => void;
  setClothing: (file: File | null, previewUrl: string | null) => void;
  setModelUrl: (url: string | null, measurements?: BodyMeasurements | null) => void;
  setVtonResultUrl: (url: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsRemovingBg: (loading: boolean) => void;
  setLoadingType: (type: '3d' | 'vton' | null) => void;
  setLoadingStage: (stage: number) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  setActiveTab: (tab: '3d' | '2d') => void;
  setActiveTool: (tool: 'FITTING' | 'SCULPT' | null) => void;
  setCurrentPage: (page: 'HOME' | 'SHOP' | 'ATELIER' | 'ARCHIVE' | 'ABOUT') => void;
  saveToArchive: (imageUrl: string, description: string, tags: string[]) => void;
  removeFromArchive: (id: string | number) => void;
  setSculptModifier: (axis: 'width' | 'height' | 'depth', value: number) => void;
  resetSculptModifiers: () => void;
  toggleDarkMode: () => void;
  setCurrentJobId: (jobId: string | null) => void;
  setSelectedBaseModel: (modelType: BaseModelType | null) => void;
  
  // 옷장 및 위시리스트 메서드
  fetchWardrobe: () => Promise<void>;
  addWardrobeItem: (item: WardrobeItem) => void;
  toggleWishlist: (id: string) => void;

  // 비동기 합성 완료 모달 상태
  showCompleteModal: boolean;
  completeModalType: '2d' | '3d' | null;
  setShowCompleteModal: (show: boolean) => void;
  setCompleteModalType: (type: '2d' | '3d' | null) => void;
}

export const useFittingStore = create<FittingState>((set) => ({
  photoFile: null,
  photoPreviewUrl: null,
  
  clothingFile: null,
  clothingPreviewUrl: null,
  
  modelUrl: null, 
  vtonResultUrl: null,
  bodyMeasurements: null,
  
  isLoading: false,
  isRemovingBg: false,
  loadingType: null,
  loadingStage: 0,
  toastMessage: null,
  activeTab: '3d',
  activeTool: 'FITTING',
  selectedBaseModel: null,
  currentPage: 'HOME',
  isDarkMode: false, // 라이트 모드 기본 시작
  savedArchives: INITIAL_ARCHIVES,
  wardrobeItems: [],
  isWardrobeLoading: false,
  wishlistIds: [],
  sculptModifiers: { width: 1.0, height: 1.0, depth: 1.0 },
  currentJobId: null,
  showCompleteModal: false,
  completeModalType: null,

  setPhoto: (file, previewUrl) => set({ photoFile: file, photoPreviewUrl: previewUrl }),
  setClothing: (file, previewUrl) => set({ clothingFile: file, clothingPreviewUrl: previewUrl }),
  setModelUrl: (url, measurements) => set({ 
    modelUrl: url, 
    bodyMeasurements: measurements || null,
  }),
  setVtonResultUrl: (url) => set({ vtonResultUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsRemovingBg: (loading) => set({ isRemovingBg: loading }),
  setLoadingType: (type) => set({ loadingType: type }),
  setLoadingStage: (stage) => set({ loadingStage: stage }),
  showToast: (message) => set({ toastMessage: message }),
  dismissToast: () => set({ toastMessage: null }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setCurrentPage: (page) => set({ currentPage: page }),
  saveToArchive: (imageUrl, description, tags) => set((state) => {
    // Avoid saving the same image consecutively
    if (state.savedArchives.some(a => a.imageUrl === imageUrl)) return state;
    
    const newItem: ArchiveItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/. /g, '.').replace('.', ''),
      description,
      imageUrl,
      tags
    };
    return { savedArchives: [newItem, ...state.savedArchives] };
  }),
  removeFromArchive: (id) => set((state) => ({
    savedArchives: state.savedArchives.filter(a => a.id !== id)
  })),
  setSculptModifier: (axis, value) => set((state) => ({
    sculptModifiers: { ...state.sculptModifiers, [axis]: value }
  })),
  resetSculptModifiers: () => set({ sculptModifiers: { width: 1.0, height: 1.0, depth: 1.0 } }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),
  setSelectedBaseModel: (modelType) => set({ selectedBaseModel: modelType }),
  
  fetchWardrobe: async () => {
    set({ isWardrobeLoading: true });
    // 가상의 API 호출 지연
    await new Promise(resolve => setTimeout(resolve, 800));
    set({ wardrobeItems: MOCK_WARDROBE, isWardrobeLoading: false });
  },
  addWardrobeItem: (item) => set((state) => ({
    wardrobeItems: [item, ...state.wardrobeItems]
  })),
  toggleWishlist: (id) => set((state) => {
    if (state.wishlistIds.includes(id)) {
      return { wishlistIds: state.wishlistIds.filter(wId => wId !== id) };
    }
    return { wishlistIds: [...state.wishlistIds, id] };
  }),
  setShowCompleteModal: (show) => set({ showCompleteModal: show }),
  setCompleteModalType: (type) => set({ completeModalType: type })
}))
