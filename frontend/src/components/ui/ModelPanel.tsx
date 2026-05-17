import React, { useRef } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { generate3DModel } from '../../api'
import { BodyTypeIcon, BODY_TYPE_COLORS } from './BodyTypeIcon'

export const ModelPanel: React.FC = () => {
  const {
    photoPreviewUrl,
    selectedBaseModel,
    isLoading,
    setPhoto,
    setSelectedBaseModel,
    setModelUrl,
    setIsLoading,
    setLoadingType,
    setLoadingStage,
    showToast,
    setCurrentJobId
  } = useFittingStore()

  const photoInputRef = useRef<HTMLInputElement>(null)

  const handleBaseModelSelect = (modelId: 'male-slim' | 'male-large' | 'female-slim' | 'female-large') => {
    // 1. 개인 업로드 정보 클리어 및 기본 모델로 설정
    setPhoto(null, null)
    setSelectedBaseModel(modelId)
    setCurrentJobId(null)
    
    // 2. 기본 마네킹 3D 오브젝트 주입
    setModelUrl('/mock/my_A_pose_mannequin%20(1)%20(1).obj')
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
    setModelUrl('/mock/my_A_pose_mannequin%20(1)%20(1).obj')
  }

  return (
    <div className="flex flex-col h-full p-6 text-gray-900 dark:text-zinc-100 transition-colors duration-500 overflow-y-auto">
      <h2 className="font-serif text-2xl font-bold mb-1">Atelier Model Profile</h2>
      <p className="text-sm text-gray-400 dark:text-zinc-500 mb-6">피팅을 진행할 마네킹 체형 또는 실사진 프로필을 선택하세요.</p>

      {/* 01: Standard Models Selection */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 dark:text-white font-bold text-sm">01</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">기본 체형 선택 (Standard Models)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
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
              className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 ${
                isSelected
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg'
                  : 'bg-gray-50 dark:bg-zinc-800/30 border-transparent text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800/80 hover:text-gray-600 dark:hover:text-zinc-300'
              }`}
              style={{ borderBottomColor: BODY_TYPE_COLORS[model.id], borderBottomWidth: '3px' }}
            >
              <BodyTypeIcon type={model.id} selected={isSelected} className="w-10 h-14 mb-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{model.label}</span>
            </button>
          )
        })}
      </div>

      {/* 02: Custom Photo Upload */}
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 dark:text-white font-bold text-sm">02</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">개인 사진 업로드 (Personal Image)</span>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-800/30 border-2 border-dashed border-gray-200 dark:border-zinc-800 aspect-[3/4] group cursor-pointer flex items-center justify-center transition-colors duration-500 mb-8 max-w-xs mx-auto w-full shadow-inner">
        {photoPreviewUrl ? (
          <>
            <img src={photoPreviewUrl} alt="Model Preview" className="w-full h-full object-contain p-2" />
            <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm flex items-center justify-center">
              <button
                onClick={handleClearPhoto}
                className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform"
              >
                사진 삭제 & 기본 체형 전환
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors pointer-events-none p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm mb-3">
              <svg className="w-5 h-5 text-gray-300 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">전신 사진 업로드</span>
            <span className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest">정면 전신 실루엣 이미지 (3D 아바타 자동 생성)</span>
          </div>
        )}
        <input
          type="file"
          ref={photoInputRef}
          accept="image/*"
          disabled={isLoading}
          onChange={handlePhotoChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  )
}
