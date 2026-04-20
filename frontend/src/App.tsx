import { useEffect } from 'react'
import { MannequinViewer } from './components/canvas/MannequinViewer'
import { UploadPanel } from './components/ui/UploadPanel'
import { SculptPanel } from './components/ui/SculptPanel'
import { HomePanel } from './components/ui/HomePanel'
import { ArchivePanel } from './components/ui/ArchivePanel'
import { AboutPanel } from './components/ui/AboutPanel'
import { useFittingStore } from './store/useFittingStore'

const LOADING_STAGES = {
  '3d': [
    { label: '신체 윤곽 분석 중...', icon: (
      <svg className="w-12 h-12 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { label: '3D 메시 생성 중...', icon: (
      <svg className="w-12 h-12 text-cyan-400 animate-[spin_3s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )},
    { label: '텍스처 매핑 중...', icon: (
      <svg className="w-12 h-12 text-indigo-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )},
    { label: '최종 렌더링...', icon: (
      <svg className="w-12 h-12 text-blue-200 animate-[spin_2s_linear_infinite]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )},
  ],
  'vton': [
    { label: '의류 패턴 분석 중...', icon: (
      <svg className="w-12 h-12 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
      </svg>
    )},
    { label: '체형 맞춤 피팅 중...', icon: (
      <svg className="w-12 h-12 text-fuchsia-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    )},
    { label: 'AI 합성 처리 중...', icon: (
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-[spin_1.5s_linear_infinite]"></div>
        <div className="absolute inset-1.5 rounded-full border-r-2 border-fuchsia-400 animate-[spin_2s_linear_infinite_reverse]"></div>
        <div className="absolute inset-3 rounded-full border-b-2 border-blue-400 animate-[spin_1s_linear_infinite]"></div>
      </div>
    )},
    { label: '최종 보정 중...', icon: (
      <svg className="w-12 h-12 text-fuchsia-200 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )},
  ],
} as const

function App() {
  const { 
    currentPage, setCurrentPage, activeTab, setActiveTab, 
    activeTool, setActiveTool, modelUrl, vtonResultUrl, 
    isLoading, loadingType, loadingStage, toastMessage, dismissToast,
    isDarkMode, toggleDarkMode
  } = useFittingStore()

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => dismissToast(), 5000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage, dismissToast])

  return (
    <div className={`${isDarkMode ? 'dark' : ''} w-full min-h-screen flex flex-col bg-[#f8f7f5] dark:bg-zinc-950 transition-colors duration-500`}>
      {/* Top Navigation */}
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-white/5 px-8 py-4 flex items-center justify-between z-20 transition-colors duration-500">
        <h1 
          className="font-serif text-xl font-bold tracking-wide text-gray-900 dark:text-white cursor-pointer"
          onClick={() => setCurrentPage('HOME')}
        >
          RealFIT
        </h1>
        <nav className="flex gap-8 text-sm font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
          <button 
            onClick={() => setCurrentPage('HOME')}
            className={`transition-colors ${currentPage === 'HOME' ? 'text-gray-900 dark:text-white border-b-2 border-zinc-900 dark:border-white pb-1' : 'hover:text-gray-900 dark:hover:text-zinc-300'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentPage('ATELIER')}
            className={`transition-colors relative ${currentPage === 'ATELIER' ? 'text-gray-900 dark:text-white border-b-2 border-zinc-900 dark:border-white pb-1' : 'hover:text-gray-900 dark:hover:text-zinc-300'}`}
          >
            Atelier
            {isLoading && currentPage !== 'ATELIER' && (
              <span className="absolute -top-1 -right-4 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            )}
          </button>
          <button 
            onClick={() => setCurrentPage('ARCHIVE')}
            className={`transition-colors ${currentPage === 'ARCHIVE' ? 'text-gray-900 dark:text-white border-b-2 border-zinc-900 dark:border-white pb-1' : 'hover:text-gray-900 dark:hover:text-zinc-300'}`}
          >
            Archive
          </button>
          <button 
            onClick={() => setCurrentPage('ABOUT')}
            className={`transition-colors ${currentPage === 'ABOUT' ? 'text-gray-900 dark:text-white border-b-2 border-zinc-900 dark:border-white pb-1' : 'hover:text-gray-900 dark:hover:text-zinc-300'}`}
          >
            About
          </button>
        </nav>
        <div className="flex gap-5 text-gray-400 dark:text-zinc-500 items-center">
          <button 
            onClick={toggleDarkMode}
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700"></div>
          <button className="hover:text-gray-900 dark:hover:text-white transition-colors">🛒</button>
          <button className="hover:text-gray-900 dark:hover:text-white transition-colors">👤</button>
        </div>
      </header>

      {/* Main Content Routing */}
      {currentPage === 'HOME' ? (
        <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950 transition-colors duration-500">
          <HomePanel />
        </div>
      ) : currentPage === 'ARCHIVE' ? (
        <div className="flex-1 overflow-auto bg-[#f8f7f5] dark:bg-zinc-900 transition-colors duration-500">
          <ArchivePanel />
        </div>
      ) : currentPage === 'ABOUT' ? (
        <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950 transition-colors duration-500">
          <AboutPanel />
        </div>
      ) : (
        <div className="flex-1 flex max-h-[calc(100vh-73px)]">
        {/* Left Tool Sidebar */}
        <aside className="w-16 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-white/5 flex flex-col items-center py-6 gap-6 z-10 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-none transition-colors duration-500">
          {[
            { id: 'VIEW', icon: '👁️', label: 'VIEW' },
            { id: 'SCULPT', icon: '🔧', label: 'SCULPT' },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id as any)}
              className={`flex flex-col items-center gap-1 transition-colors group relative ${activeTool === tool.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}
              title={activeTool === tool.id ? '패널 닫기' : '패널 열기'}
            >
              {activeTool === tool.id && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
              )}
              <span className={`text-lg transition-transform ${activeTool === tool.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tool.icon}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider">{tool.label}</span>
            </button>
          ))}
        </aside>

        {/* Left Upload/Tool Panel */}
        <aside className={`${activeTool ? 'w-[420px] border-r' : 'w-0 border-transparent'} bg-white dark:bg-zinc-900 border-gray-200 dark:border-white/5 overflow-x-hidden overflow-y-auto z-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shrink-0`}>
          <div className="w-[420px] h-full">
            {activeTool === 'VIEW' && <UploadPanel />}
            {activeTool === 'SCULPT' && <SculptPanel />}
          </div>
        </aside>

        {/* Right 3D Viewer */}
        <main className="flex-1 flex flex-col p-4 bg-[#f8f7f5] dark:bg-zinc-950 transition-colors duration-500">
          {/* Center Tabs: 3D vs 2D */}
          <div className="mb-3 flex justify-center">
            <div className="flex bg-gray-200/50 dark:bg-zinc-800 p-1 rounded-lg shadow-inner">
              <button 
                className={`px-8 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === '3d' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                onClick={() => setActiveTab('3d')}
              >
                3D Avatar
              </button>
              <button 
                className={`px-8 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === '2d' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                onClick={() => setActiveTab('2d')}
              >
                2D Fitting Result
              </button>
            </div>
          </div>

          {/* 3D or 2D Canvas View */}
          <div className="flex-1 max-w-5xl w-full mx-auto rounded-2xl overflow-hidden shadow-lg min-h-[400px] bg-[#1a1a1a] flex items-center justify-center relative">
            
            {activeTab === '3d' ? (
              modelUrl ? (
                <MannequinViewer />
              ) : (
                <div className="text-gray-500 text-sm tracking-widest uppercase">Upload a photo to generate 3D Map</div>
              )
            ) : (
              vtonResultUrl ? (
                <div className="relative w-full h-full flex items-center justify-center group bg-[#151515]">
                  <img src={vtonResultUrl} alt="VTON Result" className="h-full object-contain max-h-[600px]" />
                  <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={() => {
                        useFittingStore.getState().saveToArchive(vtonResultUrl, 'My Custom Fit', ['Custom', 'AI Generated']);
                        useFittingStore.getState().showToast('✅ 옷장에 피팅 결과가 저장되었습니다!');
                        setCurrentPage('ARCHIVE');
                      }}
                      className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold uppercase tracking-widest text-xs shadow-2xl hover:bg-black hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">📥</span> Save to Closet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm tracking-widest uppercase">Select garment to start fitting</div>
              )
            )}

            {/* Loading Overlay - Multi-stage Progress */}
            {isLoading && loadingType && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
                <div className="flex flex-col items-center max-w-sm w-full px-8">
                  {/* Stage Dots */}
                  <div className="flex gap-3 mb-8">
                    {LOADING_STAGES[loadingType].map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        i < loadingStage ? 'bg-blue-500 scale-100' 
                        : i === loadingStage ? 'bg-blue-400 scale-125 animate-pulse' 
                        : 'bg-white/20'
                      }`} />
                    ))}
                  </div>

                  {/* Current Stage Icon & Label */}
                  <div className="mb-6 flex items-center justify-center bg-gray-900/50 p-4 rounded-full shadow-inner ring-1 ring-white/10">
                    {LOADING_STAGES[loadingType][loadingStage].icon}
                  </div>
                  <span className="text-white font-medium tracking-widest uppercase text-sm mb-2">
                    {LOADING_STAGES[loadingType][loadingStage].label}
                  </span>
                  <span className="text-white/40 text-xs mb-8">
                    Step {loadingStage + 1} / {LOADING_STAGES[loadingType].length}
                  </span>

                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-8">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((loadingStage + 1) / LOADING_STAGES[loadingType].length) * 100}%` }}
                    />
                  </div>

                  {/* Navigate Away Button */}
                  <button 
                    onClick={() => setCurrentPage('HOME')}
                    className="text-white/50 hover:text-white text-xs font-medium tracking-wider uppercase transition-colors flex items-center gap-2 hover:gap-3"
                  >
                    다른 페이지 둘러보기 →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-white/5 px-8 py-3 flex items-center justify-between text-xs text-gray-400 dark:text-zinc-500 z-10 transition-colors duration-500">
        <span className="font-serif font-semibold text-gray-600 dark:text-zinc-400">RealFIT Editorial</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-gray-900 dark:hover:text-zinc-300">Privacy</a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-zinc-300">Terms</a>
          <a href="#" className="hover:text-gray-900 dark:hover:text-zinc-300">Help</a>
        </div>
        <span>© 2026 RealFIT. All rights reserved.</span>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-black/30 flex items-center gap-4 border border-white/10">
            <span className="text-sm font-medium">{toastMessage}</span>
            <button 
              onClick={() => {
                if (toastMessage.includes('✅')) {
                  setCurrentPage('ATELIER')
                }
                dismissToast()
              }}
              className="text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap"
            >
              {toastMessage.includes('✅') ? '결과 보기 →' : '닫기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
