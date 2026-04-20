import React from 'react'
import { useFittingStore } from '../../store/useFittingStore'

export const ArchivePanel: React.FC = () => {
  const { setCurrentPage, setVtonResultUrl, setActiveTab, savedArchives, removeFromArchive } = useFittingStore()

  const handleLoadArchive = (imageUrl: string) => {
    setVtonResultUrl(imageUrl)
    setActiveTab('2d')
    setCurrentPage('ATELIER')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-12 transition-colors duration-500">
      <div className="flex flex-col mb-12 border-b border-gray-200 dark:border-white/10 pb-8 transition-colors duration-500">
        <h2 className="text-4xl font-serif font-medium text-gray-900 dark:text-white mb-3 tracking-tight transition-colors duration-500">My Virtual Closet</h2>
        <p className="text-gray-500 dark:text-zinc-400 font-light flex items-center justify-between transition-colors duration-500">
          <span>이전에 생성한 가상 피팅 결과물들을 한곳에서 편하게 확인해보세요.</span>
          <span className="text-xs font-bold tracking-widest uppercase bg-gray-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-1 rounded-full">{savedArchives.length} Saved</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {savedArchives.map((item) => (
          <div key={item.id} className="group cursor-pointer relative rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 bg-white dark:bg-zinc-900 flex flex-col">
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-zinc-800">
              <img 
                src={item.imageUrl} 
                alt={item.description} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <button 
                  onClick={() => handleLoadArchive(item.imageUrl)}
                  className="w-full py-3 bg-white text-gray-900 text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300"
                >
                  Load to Atelier
                </button>
              </div>
              
              {/* Delete Button (visible on hover) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm('이 항목을 삭제하시겠습니까?')) {
                    removeFromArchive(item.id);
                  }
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm z-10"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="p-5 border border-t-0 border-gray-100 dark:border-white/5 rounded-b-2xl">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 dark:text-zinc-100 text-lg leading-tight">{item.description}</h3>
                <span className="text-xs text-gray-400 dark:text-zinc-500 font-mono tracking-tighter shrink-0">{item.date}</span>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md border border-gray-100 dark:border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty State Mock */}
      {savedArchives.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl text-gray-300 dark:text-zinc-600">📦</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-zinc-100 mb-2">옷장이 비어있습니다</h3>
          <p className="text-gray-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">아직 저장된 가상 피팅 결과가 없습니다. 아뜰리에로 이동하여 나만의 피팅 결과를 만들어보세요.</p>
          <button 
            onClick={() => setCurrentPage('ATELIER')}
            className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Open Atelier
          </button>
        </div>
      )}
    </div>
  )
}
