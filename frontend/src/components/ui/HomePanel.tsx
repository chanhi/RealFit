import React, { useRef } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { BodyTypeIcon, BODY_TYPE_COLORS } from './BodyTypeIcon'

export const HomePanel: React.FC = () => {
  const { 
    photoFile, photoPreviewUrl,
    selectedBaseModel, setSelectedBaseModel,
    setPhoto, setCurrentPage, showToast
  } = useFittingStore()
  
  const photoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)
      setPhoto(file, previewUrl)
      setSelectedBaseModel(null)
    }
  }

  const handleClearPhoto = () => {
    setPhoto(null, null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleEnterAtelier = () => {
    if (!photoFile && !selectedBaseModel) {
      showToast('❌ 기본 체형을 선택하거나 사진을 업로드해주세요.')
      return
    }
    setCurrentPage('ATELIER')
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6 sm:p-12 transition-colors duration-500 overflow-y-auto">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[5%] w-[30%] h-[30%] bg-zinc-100 dark:bg-zinc-800/40 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[5%] left-[5%] w-[30%] h-[30%] bg-zinc-50 dark:bg-zinc-900/40 rounded-full blur-[100px] opacity-60" />
      </div>

      <div className="relative max-w-6xl w-full flex flex-col items-center">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-5xl md:text-7xl font-serif font-light tracking-tighter text-zinc-900 dark:text-zinc-100">
            Digital <span className="italic font-normal">Atelier</span>
          </h1>
          <div className="w-16 h-px bg-zinc-300 dark:bg-zinc-700 mx-auto" />
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg font-light leading-relaxed tracking-wide break-keep">
            첨단 AI 기술로 구현된 정교한 가상 피팅 시스템입니다.
            <br />
            나만의 프로필을 설정하고 디지털 아뜰리에의 여정을 시작하세요.
          </p>
        </div>

        {/* Main Interface Card */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Option A: Base Models */}
          <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 uppercase">Collection 01</span>
              <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
            </div>
            
            <h3 className="text-2xl font-serif mb-8 text-zinc-800 dark:text-zinc-200">기본 체형 선택</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {([
                { id: 'male-slim', label: '남성 슬림' },
                { id: 'male-large', label: '남성 건장' },
                { id: 'female-slim', label: '여성 슬림' },
                { id: 'female-large', label: '여성 건장' },
              ] as const).map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedBaseModel(model.id as any);
                    handleClearPhoto();
                  }}
                  className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-500 ${
                    selectedBaseModel === model.id 
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-lg' 
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  style={{ borderBottomColor: BODY_TYPE_COLORS[model.id], borderBottomWidth: '3px' }}
                >
                  <BodyTypeIcon type={model.id} selected={selectedBaseModel === model.id} className="w-10 h-14 mb-3" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{model.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Option B: Custom Upload */}
          <div className="group relative bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-8 lg:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] transition-all duration-500 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 dark:text-zinc-500 uppercase">Collection 02</span>
              <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
            </div>

            <h3 className="text-2xl font-serif mb-8 text-zinc-800 dark:text-zinc-200">개인 사진 업로드</h3>

            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/30 border-2 border-dashed border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-300 dark:group-hover:border-zinc-600 transition-all duration-500 flex items-center justify-center max-w-xs mx-auto w-full shadow-inner">
              {photoPreviewUrl ? (
                <>
                  <img src={photoPreviewUrl} alt="Preview" className="w-full h-full object-contain p-3" />
                  <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center">
                    <button 
                      onClick={handleClearPhoto}
                      className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      사진 변경하기
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-zinc-300 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold tracking-wide text-zinc-700 dark:text-zinc-300">전신 사진 업로드</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">정면 전신 실루엣 이미지</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-20 flex flex-col items-center">
          <button 
            onClick={handleEnterAtelier}
            className={`group relative px-20 py-5 rounded-full font-bold uppercase tracking-[0.3em] text-xs transition-all duration-500 ${
              photoFile || selectedBaseModel
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] hover:bg-black dark:hover:bg-zinc-200 hover:-translate-y-1'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            아뜰리에 입장하기
          </button>
          <p className="mt-6 text-zinc-400 dark:text-zinc-500 text-[9px] uppercase tracking-[0.5em] font-medium">
            당신만의 스타일링 여정을 시작하세요
          </p>
        </div>
      </div>
    </div>
  )
}
