import React, { useRef, useEffect } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { generate3DModel, generateVTONResult, uploadAndRemoveBackground } from '../../api'
import { BodyTypeIcon, BODY_TYPE_COLORS } from './BodyTypeIcon'

export const FittingPanel: React.FC = () => {
  const {
    // 1단계: 마네킹/전신 사진 상태
    photoFile,
    photoPreviewUrl,
    selectedBaseModel,
    setPhoto,
    setSelectedBaseModel,
    setModelUrl,
    setCurrentJobId,
    
    // 2단계: 의류 사진 상태
    clothingFile,
    clothingPreviewUrl,
    setClothing,
    
    // 결과물 제어 및 로딩 상태
    isLoading,
    isRemovingBg,
    setIsLoading,
    setIsRemovingBg,
    setVtonResultUrl,
    setLoadingType,
    setLoadingStage,
    showToast,
    
    // 옷장 데이터
    wardrobeItems,
    isWardrobeLoading,
    fetchWardrobe,
    addWardrobeItem
  } = useFittingStore()

  const photoInputRef = useRef<HTMLInputElement>(null)
  const clothingInputRef = useRef<HTMLInputElement>(null)

  // 컴포넌트 마운트 시 옷장 DB 데이터 불러오기 및 최초 자동 3D 생성 검사
  useEffect(() => {
    if (wardrobeItems.length === 0) {
      fetchWardrobe()
    }

    const state = useFittingStore.getState()
    if (state.photoFile && !state.currentJobId && !state.isLoading) {
      handleGenerate3D()
    } else if (state.selectedBaseModel && !state.modelUrl) {
      // 기본 마네킹을 선택하고 넘어온 경우 더미 모델 세팅
      setModelUrl('/mock/mannequin.obj')
    }
  }, [fetchWardrobe, wardrobeItems.length])

  // ================= 3D 마네킹 생성 / 체형 선택 제어 핸들러 =================

  const handleBaseModelSelect = (modelId: 'male-slim' | 'male-large' | 'female-slim' | 'female-large') => {
    // 1. 개인 업로드 사진 클리어 및 기본 모델로 전환
    setPhoto(null, null)
    setSelectedBaseModel(modelId)
    setCurrentJobId(null)
    
    // 2. 기본 마네킹 3D 오브젝트 주입
    setModelUrl('/mock/mannequin.obj')
    showToast('🧍 기본 체형 마네킹이 아뜰리에에 셋업되었습니다.')
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)

      // 1. 기본 마네킹 클리어 및 업로드 사진 등록
      setSelectedBaseModel(null)
      setPhoto(file, previewUrl)

      // 2. 실시간 AI 3D 아바타 생성 파이프라인 트리거
      setIsLoading(true)
      setLoadingType('3d')
      setLoadingStage(0)

      // 시각적 단계 로딩 시뮬레이터 구동
      const timers = [
        setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(1), 3000),
        setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(2), 7000),
        setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(3), 12000),
      ]

      try {
        const { url, jobId, measurements } = await generate3DModel(file)
        setCurrentJobId(jobId)
        timers.forEach(clearTimeout)
        setModelUrl(url, measurements)
        useFittingStore.getState().setActiveTab('3d')
        showToast('✅ 나만의 3D 아바타가 새로 구축되었습니다!')
      } catch (err) {
        console.error('3D Model generation failed:', err)
        timers.forEach(clearTimeout)
        showToast('❌ 3D 생성에 실패했습니다. 다시 시도해 주세요.')
      } finally {
        setIsLoading(false)
        setLoadingType(null)
        setLoadingStage(0)
      }
    }
  }

  const handleClearPhoto = () => {
    setPhoto(null, null)
    if (photoInputRef.current) photoInputRef.current.value = ''
    setSelectedBaseModel('male-slim') // Fallback to basic male slim
    setModelUrl('/mock/mannequin.obj')
  }

  const handleGenerate3D = async () => {
    if (!photoFile) return

    setIsLoading(true)
    setLoadingType('3d')
    setLoadingStage(0)

    const timers = [
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(1), 3000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(2), 7000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(3), 12000),
    ]

    try {
      const { url, jobId, measurements } = await generate3DModel(photoFile)
      setCurrentJobId(jobId)
      timers.forEach(clearTimeout)
      setModelUrl(url, measurements)
      useFittingStore.getState().setActiveTab('3d')
      
      if (useFittingStore.getState().currentPage !== 'ATELIER') {
        showToast('✅ 3D 아바타 생성이 완료되었습니다!')
      }
    } catch (e) {
      console.error(e)
      timers.forEach(clearTimeout)
      showToast('❌ 3D 생성에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
      setLoadingType(null)
      setLoadingStage(0)
    }
  }

  // ================= 의류 선택 및 가상 피팅 제어 핸들러 =================

  const handleClothingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)
      
      // 1. 초기 원본 이미지 세팅 및 로딩 상태 시작
      setClothing(file, previewUrl)
      setIsRemovingBg(true) // 누끼 작업 전용 로딩 시작
      setIsLoading(true)

      try {
        // 2. 누끼 따기 및 DB 저장 가상 API 호출
        const transparentUrl = await uploadAndRemoveBackground(file)
        
        // 3. 백엔드에서 내려준 상품(투명/누끼) 이미지로 UI 업데이트
        setClothing(file, transparentUrl)
        
        // 4. DB에 저장되었다고 가정하고 옷장 갤러리에 추가
        addWardrobeItem({
          id: `new-${Date.now()}`,
          imageUrl: transparentUrl,
          category: 'top'
        })
        
        showToast('🧥 배경이 제거된 상품 이미지가 옷장 DB에 저장되었습니다.')
      } catch (err) {
        console.error('배경 제거 실패:', err)
        showToast('❌ 상품 이미지 전처리에 실패했습니다.')
      } finally {
        setIsRemovingBg(false)
        setIsLoading(false)
      }
    }
  }

  const handleSelectWardrobeItem = async (url: string) => {
    try {
      // 1. If background is already removed (data URL or mock transparent), load instantly
      if (url.startsWith('data:image') || url.includes('transparent') || url.includes('mock-')) {
        setClothing(null, url)
        const response = await fetch(url)
        const blob = await response.blob()
        const file = new File([blob], 'wardrobe_item.png', { type: blob.type })
        setClothing(file, url)
        showToast('✅ Clothing loaded from wardrobe.')
        return
      }

      // 2. Trigger real-time AI background removal for raw Unsplash images
      setIsRemovingBg(true)
      setIsLoading(true)
      setClothing(null, url)
      
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], 'wardrobe_item.png', { type: blob.type })
      
      const transparentUrl = await uploadAndRemoveBackground(file)
      
      // 3. Update the item URL in the wardrobe store to cache the transparent version
      const storeItems = useFittingStore.getState().wardrobeItems
      const updatedItems = storeItems.map(item => 
        item.imageUrl === url ? { ...item, imageUrl: transparentUrl } : item
      )
      useFittingStore.setState({ wardrobeItems: updatedItems })
      
      setClothing(file, transparentUrl)
      showToast('🧥 Background removed and clothing loaded successfully.')
    } catch (err) {
      console.error("Failed to load and remove background:", err)
      showToast('❌ Failed to process clothing from wardrobe.')
    } finally {
      setIsRemovingBg(false)
      setIsLoading(false)
    }
  }

  const handleGenerateVTON = async () => {
    const { currentJobId, setActiveTab } = useFittingStore.getState()
    
    // 누끼 따는 중이거나 마네킹/의상 셋업이 안된 경우 가드
    if ((!currentJobId && !selectedBaseModel) || !clothingFile || isRemovingBg) {
      if (!currentJobId && !selectedBaseModel) showToast('❌ 마네킹 생성을 먼저 진행해주세요.')
      return
    }

    setIsLoading(true)
    setLoadingType('vton')
    setLoadingStage(0)

    const timers = [
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(1), 4000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(2), 9000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(3), 15000),
    ]

    try {
      let vtonUrl = ''
      let modelUrl = ''
      if (!currentJobId || currentJobId.startsWith('mock-')) {
        // 더미 데이터 폴백: 백엔드를 거치지 않고 로컬 결과 반환 (기본 마네킹용)
        await new Promise(resolve => setTimeout(resolve, 3000))
        vtonUrl = '/mock/result.glb'
        modelUrl = '/mock/result.glb'
      } else {
        const res = await generateVTONResult(currentJobId, clothingFile, 'transparent')
        vtonUrl = res.vtonUrl
        modelUrl = res.modelUrl
      }
      timers.forEach(clearTimeout)

      // 양쪽 결과물을 모두 저장소에 보관합니다.
      if (vtonUrl) setVtonResultUrl(vtonUrl)
      if (modelUrl) useFittingStore.getState().setModelUrl(modelUrl)

      // 3D 모델 결과가 존재하는 경우 3D 뷰어 탭을 우선 활성화하고, 2D는 2D 탭에서 확인하도록 세팅합니다.
      if (modelUrl) {
        setActiveTab('3d')
        if (useFittingStore.getState().currentPage !== 'ATELIER') {
          showToast('✅ 3D 피팅 결과가 생성되었습니다!')
          useFittingStore.setState({ showCompleteModal: true, completeModalType: '3d' })
        }
      } else if (vtonUrl) {
        setActiveTab('2d')
        if (useFittingStore.getState().currentPage !== 'ATELIER') {
          showToast('✅ 가상 피팅이 완료되었습니다!')
          useFittingStore.setState({ showCompleteModal: true, completeModalType: '2d' })
        }
      }
    } catch (e) {
      console.error(e)
      timers.forEach(clearTimeout)
      showToast('❌ 가상 피팅에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
      setLoadingType(null)
      setLoadingStage(0)
    }
  }

  const handleClearClothing = () => {
    setClothing(null, null)
    if (clothingInputRef.current) clothingInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-full p-6 text-gray-900 dark:text-zinc-100 transition-colors duration-500 overflow-y-auto">
      
      {/* ================ [헤더 타이틀] ================= */}
      <h2 className="font-serif text-2xl font-bold mb-1">Atelier Fitting Center</h2>
      <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">나만의 체형 모델과 피팅할 의류를 한 번에 설정하세요.</p>

      {/* ================= [섹션 01: 마네킹 및 프로필 설정] ================= */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 dark:text-white font-bold text-sm">01</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">마네킹 체형 설정 (Mannequin Profile)</span>
        </div>
      </div>

      {/* 4종 체형 그리드 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {([
          { id: 'male-slim', label: '남성 슬림' },
          { id: 'male-large', label: '남성 건장' },
          { id: 'female-slim', label: '여성 슬림' },
          { id: 'female-large', label: '여성 건장' },
        ] as const).map((model) => {
          const isSelected = selectedBaseModel === model.id
          return (
            <button
              key={model.id}
              onClick={() => handleBaseModelSelect(model.id as any)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg'
                  : 'bg-gray-50 dark:bg-zinc-800/30 border-transparent text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-600 dark:hover:text-zinc-300'
              }`}
              style={{ borderBottomColor: BODY_TYPE_COLORS[model.id], borderBottomWidth: '3px' }}
            >
              <BodyTypeIcon type={model.id} selected={isSelected} className="w-8 h-12 mb-2" />
              <span className="text-[9px] font-bold uppercase tracking-widest">{model.label}</span>
            </button>
          )
        })}
      </div>

      {/* 내 전신 사진 업로드 드롭존 (세로 길이를 10% 컴팩트하게 줄인 aspect-[3/4] 비율 적용) */}
      <div className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800/30 border-2 border-dashed border-gray-200 dark:border-zinc-800 aspect-[3/4] group flex items-center justify-center transition-colors duration-500 mb-6 max-w-xs mx-auto w-full shadow-inner">
        {photoPreviewUrl ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img src={photoPreviewUrl} alt="Model Preview" className="w-full h-full object-contain p-2" />
            
            {/* Elegant Circular X Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleClearPhoto();
              }}
              className="absolute top-3 right-3 z-30 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95"
              title="Delete photo & restore default body"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors pointer-events-none p-4 text-center">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm mb-2">
                <svg className="w-4 h-4 text-gray-300 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 mb-0.5">나의 정면 전신 사진 업로드</span>
              <span className="text-[8px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest">3D 아바타 자동 생성 지원</span>
            </div>
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              disabled={isLoading}
              onChange={handlePhotoChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </>
        )}
      </div>

      {/* ================= 우아한 엣지 디바이더 ================= */}
      <hr className="border-gray-200 dark:border-white/5 my-4" />

      {/* ================= [섹션 02: 의상 선택 및 피팅 시작] ================= */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 dark:text-white font-bold text-sm">02</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">의류 및 가상 피팅 설정 (Clothing Selection)</span>
        </div>
      </div>

      {/* 옷장 갤러리 슬라이더 */}
      <div className="mb-4">
        <p className="text-[9px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">나의 옷장 갤러리 (My Wardrobe)</p>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {isWardrobeLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-14 h-14 shrink-0 rounded-lg bg-gray-200 dark:bg-zinc-800 animate-pulse"></div>
            ))
          ) : (
            wardrobeItems.map(item => (
              <button 
                key={item.id} 
                className={`w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${clothingPreviewUrl === item.imageUrl ? 'border-amber-500 scale-105' : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-700'}`}
                onClick={() => handleSelectWardrobeItem(item.imageUrl)}
              >
                <img src={item.imageUrl} alt="Wardrobe" className="w-full h-full object-cover" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* 피팅 의상 업로드 드롭존 (옷이 더욱 널찍하고 풍성하게 보이도록 aspect-[1/1] 정사각형 비율로 확대 적용) */}
      <div className="relative rounded-xl overflow-hidden bg-gray-50 dark:bg-zinc-800/30 border-2 border-dashed border-gray-200 dark:border-zinc-700 aspect-[1/1] mb-4 group flex items-center justify-center transition-colors duration-500">
        {clothingPreviewUrl ? (
          <div className="relative w-full h-full">
            <img src={clothingPreviewUrl} alt="Clothing Upload" className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${isRemovingBg ? 'opacity-30 grayscale' : 'opacity-100'}`} />
            
            {/* Elegant Circular X Delete Button */}
            {!isRemovingBg && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleClearClothing();
                }}
                className="absolute top-3 right-3 z-30 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-all shadow-lg active:scale-95"
                title="Delete clothing selection"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {isRemovingBg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white pointer-events-none gap-1.5">
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 <span className="text-[10px] font-bold tracking-widest">배경(누끼) 제거 및 저장 중...</span>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors pointer-events-none">
              <span className="text-2xl mb-1 grayscale opacity-50 dark:opacity-30">➕</span>
              <span className="text-[10px] font-medium text-center px-4">새로운 피팅용 의상 업로드<br/>(배경 자동 제거)</span>
            </div>
            <input
              type="file"
              accept="image/jpeg, image/png"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleClothingChange}
              ref={clothingInputRef}
            />
          </>
        )}
      </div>

      {/* 피팅 시작 버튼 */}
      <button
        onClick={handleGenerateVTON}
        disabled={(!photoFile && !selectedBaseModel) || !clothingFile || isLoading}
        className="w-full py-3.5 bg-gray-900 dark:bg-amber-500 hover:bg-black dark:hover:bg-amber-400 disabled:bg-gray-200 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-white/20 text-white dark:text-amber-950 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-gray-900/20 active:scale-[0.98] mb-12"
      >
        {isLoading ? '연산 처리 중...' : '가상 피팅 시작 (Start Fitting)'}
      </button>

      {clothingPreviewUrl && (
        <button onClick={handleClearClothing} className="mt-[-20px] mb-8 text-[10px] text-gray-400 hover:text-red-400 transition-colors self-center">
          선택된 의상 취소하기
        </button>
      )}
    </div>
  )
}
