import React, { useRef, useEffect } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { generate3DModel, generateVTONResult, uploadAndRemoveBackground } from '../../api'

export const UploadPanel: React.FC = () => {
  const { 
    photoFile, photoPreviewUrl, 
    clothingFile, clothingPreviewUrl,
    isLoading, isRemovingBg,
    selectedBaseModel,
    setClothing,
    setIsLoading, setIsRemovingBg, setModelUrl, setVtonResultUrl,
    wardrobeItems, isWardrobeLoading, fetchWardrobe, addWardrobeItem
  } = useFittingStore()
  
  const clothingInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wardrobeItems.length === 0) {
      fetchWardrobe()
    }
  }, [fetchWardrobe, wardrobeItems.length])

  const handleClothingChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)
      
      // 1. 초기 원본 이미지 세팅 및 로딩 상태 시작
      setClothing(file, previewUrl)
      
      const { showToast } = useFittingStore.getState()
      setIsRemovingBg(true) // 누끼 작업 전용 로딩 시작
      setIsLoading(true)

      try {
        // 2. 누끼 따기 및 DB 저장 가상 API 호출
        const transparentUrl = await uploadAndRemoveBackground(file)
        
        // 3. 백엔드에서 내려준 상품(투명/누끼) 이미지로 UI 업데이트
        setClothing(file, transparentUrl)
        
        // [백엔드 연동 포인트] DB에 새로운 상품이 저장되었다고 가정하고 상단 옷장에도 썸네일 추가
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
    // 갤러리 내의 옷을 선택했을 때: (기존 로컬 업로드와 동일하게 VTON을 구동하기 위해 Blob으로 변환하여 세팅합니다)
    // 실제 백엔드 연동 시에는 DB의 ID값 반환으로 구조를 변경하실 수 있습니다.
    try {
      const { showToast } = useFittingStore.getState()
      setClothing(null, url) // Loading state visually
      
      const response = await fetch(url)
      const blob = await response.blob()
      const file = new File([blob], 'wardrobe_item.png', { type: blob.type })
      
      setClothing(file, url)
      showToast('✅ 옷장에서 의상을 불러왔습니다.')
    } catch (err) {
      console.error("의상 로드 실패:", err)
    }
  }

  // 홈 화면에서 사진을 들고 넘어온 경우, 컴포넌트 마운트 시 최초 1회 자동 생성 시작
  useEffect(() => {
    const state = useFittingStore.getState()
    if (state.photoFile && !state.currentJobId && !state.isLoading) {
      handleGenerate3D()
    } else if (state.selectedBaseModel && !state.modelUrl) {
      // 기본 마네킹을 선택하고 넘어온 경우 더미 모델 세팅
      setModelUrl('/mock/my_A_pose_mannequin%20(1)%20(1).obj')
    }
  }, [])

  const handleGenerate3D = async () => {
    // 사진이 없으면 진행 불가 (기본 모델은 useEffect에서 처리)
    if (!photoFile) return;
    
    const { setLoadingType, setLoadingStage, showToast, setModelUrl, setCurrentJobId } = useFittingStore.getState()
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

  const handleGenerateVTON = async () => {
    const { currentJobId, selectedBaseModel, setLoadingType, setLoadingStage, showToast, setActiveTab } = useFittingStore.getState()
    
    // 누끼 따는 중이면 대기
    if ((!currentJobId && !selectedBaseModel) || !clothingFile || isRemovingBg) {
      if (!currentJobId && !selectedBaseModel) showToast('❌ 마네킹 생성을 먼저 진행해주세요.');
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
      let url = '';
      if (!currentJobId || currentJobId.startsWith('mock-')) {
        // 더미 데이터 폴백: 백엔드를 거치지 않고 로컬 결과 반환 (기본 마네킹용)
        await new Promise(resolve => setTimeout(resolve, 3000));
        url = '/mock/result.glb';
      } else {
        url = await generateVTONResult(currentJobId, clothingFile, 'transparent')
      }
      timers.forEach(clearTimeout)

      // 백엔드가 2D VTON 대신 3D .glb 파일을 반환하는 경우, 3D 뷰어로 연결
      if (url.toLowerCase().endsWith('.glb')) {
        useFittingStore.getState().setModelUrl(url);
        setActiveTab('3d');
        if (useFittingStore.getState().currentPage !== 'ATELIER') {
          showToast('✅ 3D 피팅 결과가 생성되었습니다!');
        }
      } else {
        setVtonResultUrl(url)
        setActiveTab('2d')
        if (useFittingStore.getState().currentPage !== 'ATELIER') {
          showToast('✅ 가상 피팅이 완료되었습니다!')
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
    <div className="flex flex-col h-full p-6 text-gray-900 dark:text-zinc-100 transition-colors duration-500">
      <h2 className="font-serif text-2xl font-bold mb-1">Atelier Controls</h2>
      <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">원하는 의류를 선택하여 피팅을 진행하세요.</p>

      {/* Mannequin Status */}
      <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
            {photoPreviewUrl ? (
              <img src={photoPreviewUrl} alt="My Body" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl opacity-80">
                {selectedBaseModel?.includes('female') ? '🧍‍♀️' : '🧍‍♂️'}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Current Mannequin</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-200">
              {photoFile ? 'Custom Generated 3D Body' : (selectedBaseModel || 'Base Model')}
            </p>
          </div>
        </div>
      </div>

      {/* 01: Select Clothing */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 dark:text-white font-bold text-sm">01</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Select Clothing</span>
        </div>
      </div>

      {/* Wardrobe Gallery Slider */}
      <div className="mb-4">
        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">My Wardrobe (DB)</p>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {isWardrobeLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-16 h-16 shrink-0 rounded-lg bg-gray-200 dark:bg-zinc-800 animate-pulse"></div>
            ))
          ) : (
            wardrobeItems.map(item => (
              <button 
                key={item.id} 
                className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${clothingPreviewUrl === item.imageUrl ? 'border-amber-500 scale-105' : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-700'}`}
                onClick={() => handleSelectWardrobeItem(item.imageUrl)}
              >
                <img src={item.imageUrl} alt="Wardrobe" className="w-full h-full object-cover" />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border-2 border-dashed border-gray-200 dark:border-zinc-700 aspect-square mb-4 group cursor-pointer flex items-center justify-center transition-colors duration-500">
        {clothingPreviewUrl ? (
          <>
            <img src={clothingPreviewUrl} alt="Clothing Upload" className={`w-full h-full object-cover transition-opacity duration-300 ${isRemovingBg ? 'opacity-30 grayscale' : 'opacity-100'}`} />
            {isRemovingBg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white pointer-events-none gap-2">
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 <span className="text-xs font-bold tracking-widest">누끼 제거 & DB 저장 중...</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors pointer-events-none">
            <span className="text-3xl mb-2 grayscale opacity-50 dark:opacity-30">➕</span>
            <span className="text-xs font-medium text-center px-4">새 옷을 업로드하고<br/>옷장 DB에 추가하기</span>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg, image/png"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleClothingChange}
          ref={clothingInputRef}
        />
      </div>

      <button
        onClick={handleGenerateVTON}
        disabled={(!photoFile && !selectedBaseModel) || !clothingFile || isLoading}
        className="w-full py-3.5 bg-gray-900 dark:bg-amber-500 hover:bg-black dark:hover:bg-amber-400 disabled:bg-gray-200 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-white/20 text-white dark:text-amber-950 text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-gray-900/20 active:scale-[0.98]"
      >
        {isLoading ? 'Processing...' : 'Start Virtual Fitting'}
      </button>

      {clothingPreviewUrl && (
        <button onClick={handleClearClothing} className="mt-3 text-xs text-gray-400 hover:text-red-400 transition-colors self-center mb-10">
          선택된 옷 취소하기
        </button>
      )}
    </div>
  )
}
