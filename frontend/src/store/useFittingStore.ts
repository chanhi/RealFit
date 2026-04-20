import { create } from 'zustand'

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

const INITIAL_ARCHIVES: ArchiveItem[] = [
  {
    id: 1,
    date: '2026.03.31',
    description: 'Casual Spring Look',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
    tags: ['Daily', 'Denim']
  },
  {
    id: 2,
    date: '2026.03.28',
    description: 'Formal Setup for Interview',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
    tags: ['Suit', 'Dark']
  },
  {
    id: 3,
    date: '2026.03.25',
    description: 'Weekend Streetwear',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop',
    tags: ['Street', 'Oversized']
  },
  {
    id: 4,
    date: '2026.03.10',
    description: 'Summer Vibe Check',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop',
    tags: ['Summer', 'Tee']
  },
  {
    id: 5,
    date: '2026.02.14',
    description: 'Valentine Date Outfit',
    imageUrl: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?q=80&w=600&auto=format&fit=crop',
    tags: ['Date', 'Knit']
  },
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
  activeTool: 'VIEW' | 'SCULPT' | null;
  
  // 라우팅
  currentPage: 'HOME' | 'ATELIER' | 'ARCHIVE' | 'ABOUT';
  isDarkMode: boolean;

  // 아카이브
  savedArchives: ArchiveItem[];

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
  setActiveTool: (tool: 'VIEW' | 'SCULPT' | null) => void;
  setCurrentPage: (page: 'HOME' | 'ATELIER' | 'ARCHIVE' | 'ABOUT') => void;
  saveToArchive: (imageUrl: string, description: string, tags: string[]) => void;
  removeFromArchive: (id: string | number) => void;
  setSculptModifier: (axis: 'width' | 'height' | 'depth', value: number) => void;
  resetSculptModifiers: () => void;
  toggleDarkMode: () => void;
  setCurrentJobId: (jobId: string | null) => void;
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
  activeTool: 'VIEW',
  currentPage: 'HOME',
  isDarkMode: false, // 라이트 모드 기본 시작
  savedArchives: INITIAL_ARCHIVES,
  sculptModifiers: { width: 1.0, height: 1.0, depth: 1.0 },
  currentJobId: null,

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
}))
