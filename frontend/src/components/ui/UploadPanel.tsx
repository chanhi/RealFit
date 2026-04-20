import React, { useRef } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { generate3DModel, generateVTONResult, uploadAndRemoveBackground } from '../../api'



export const UploadPanel: React.FC = () => {
  const { 
    photoFile, photoPreviewUrl, 
    clothingFile, clothingPreviewUrl,
    isLoading, isRemovingBg,
    setPhoto, setClothing,
    setIsLoading, setIsRemovingBg, setModelUrl, setVtonResultUrl, setActiveTab 
  } = useFittingStore()
  
  const photoInputRef = useRef<HTMLInputElement>(null)
  const clothingInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)
      setPhoto(file, previewUrl)
      // 초기화
      setModelUrl(null)
      setVtonResultUrl(null)
    }
  }

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
        showToast('🧥 배경이 제거된 상품 이미지가 DB에 저장되었습니다.')
      } catch (err) {
        console.error('배경 제거 실패:', err)
        showToast('❌ 상품 이미지 전처리에 실패했습니다.')
      } finally {
        setIsRemovingBg(false)
        setIsLoading(false)
      }
    }
  }

  const handleGenerate3D = async () => {
    if (!photoFile) return
    const { setLoadingType, setLoadingStage, showToast } = useFittingStore.getState()
    setIsLoading(true)
    setLoadingType('3d')
    setLoadingStage(0)

    // Simulate stage progression while waiting for API
    const timers = [
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(1), 3000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(2), 7000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(3), 12000),
    ]

    try {
      const { url, measurements } = await generate3DModel(photoFile)
      timers.forEach(clearTimeout)
      setModelUrl(url, measurements)
      setActiveTab('3d')

      // If user navigated away, show toast notification
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
    // 누끼 따는 중이면 대기
    if (!photoFile || !clothingFile || isRemovingBg) return

    const { setLoadingType, setLoadingStage, showToast, setActiveTab } = useFittingStore.getState()
    setIsLoading(true)
    setLoadingType('vton')
    setLoadingStage(0)

    const timers = [
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(1), 4000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(2), 9000),
      setTimeout(() => useFittingStore.getState().isLoading && setLoadingStage(3), 15000),
    ]

    try {
      const url = await generateVTONResult(photoFile, clothingFile, 'transparent')
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

  const handleClearPhoto = () => {
    setPhoto(null, null)
    setModelUrl(null)
    setVtonResultUrl(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleClearClothing = () => {
    setClothing(null, null)
    if (clothingInputRef.current) clothingInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-full p-6 text-gray-900 dark:text-zinc-100 transition-colors duration-500">
      <h2 className="font-serif text-2xl font-bold mb-1">Atelier Controls</h2>
      <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">디지털 아뜰리에에서 당신만의 실루엣을 완성하세요.</p>

      {/* 01: Photo Upload */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-zinc-900 dark:text-white font-bold text-sm">01</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Photo Upload</span>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 aspect-[3/4] mb-4 group cursor-pointer transition-colors duration-500">
        {photoPreviewUrl ? (
          <img src={photoPreviewUrl} alt="User Upload" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors pointer-events-none">
            <svg className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-medium">내 전신 사진 업로드</span>
          </div>
        )}
        <input
          type="file"
          accept="image/jpeg, image/png"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handlePhotoChange}
          ref={photoInputRef}
        />
      </div>

      <button
        onClick={handleGenerate3D}
        disabled={!photoFile || isLoading}
        className="w-full py-3.5 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 disabled:bg-gray-200 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-white/20 text-white dark:text-zinc-900 text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-zinc-900/10 dark:shadow-white/10 active:scale-[0.98]"
      >
        {isLoading ? 'Processing...' : 'Generate 3D Avatar'}
      </button>

      {photoFile && (
        <button onClick={handleClearPhoto} className="mt-3 text-xs text-gray-400 hover:text-red-400 transition-colors self-center">
          바디 사진 변경하기
        </button>
      )}

      <div className="border-t border-gray-200 dark:border-white/10 my-6 transition-colors duration-500" />

      {/* 02: Clothing Upload */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-zinc-900 dark:text-white font-bold text-sm">02</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Clothing Upload</span>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 aspect-square mb-4 group cursor-pointer flex items-center justify-center transition-colors duration-500">
        {clothingPreviewUrl ? (
          <>
            <img src={clothingPreviewUrl} alt="Clothing Upload" className={`w-full h-full object-cover transition-opacity duration-300 ${isRemovingBg ? 'opacity-30 grayscale' : 'opacity-100'}`} />
            {isRemovingBg && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white pointer-events-none gap-2">
                 <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 <span className="text-xs font-bold tracking-widest">상품 이미지 출력 중...</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors pointer-events-none">
            <span className="text-3xl mb-2 grayscale opacity-50 dark:opacity-30">👕</span>
            <span className="text-xs font-medium">착용해 볼 옷 사진 업로드</span>
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
        disabled={!photoFile || !clothingFile || isLoading}
        className="w-full py-3.5 bg-gray-900 dark:bg-amber-500 hover:bg-black dark:hover:bg-amber-400 disabled:bg-gray-200 dark:disabled:bg-white/5 disabled:text-gray-400 dark:disabled:text-white/20 text-white dark:text-amber-950 text-sm font-bold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-gray-900/20 active:scale-[0.98]"
      >
        {isLoading ? 'Processing...' : 'Start Virtual Fitting'}
      </button>

      {clothingFile && (
        <button onClick={handleClearClothing} className="mt-3 text-xs text-gray-400 hover:text-red-400 transition-colors self-center">
          의류 사진 변경하기
        </button>
      )}
    </div>
  )
}
