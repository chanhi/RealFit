import React, { useState } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { MOCK_PRODUCTS, CATEGORIES } from '../../data/mockProducts'

export const ShopPanel: React.FC = () => {
  const { 
    setClothing, setCurrentPage, 
    wishlistIds, toggleWishlist, 
    showToast, setIsRemovingBg, addWardrobeItem 
  } = useFittingStore()
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const handleTryOn = async (product: typeof MOCK_PRODUCTS[0]) => {
    setLoadingProductId(product.id)
    try {
      const response = await fetch(product.imageUrl)
      const blob = await response.blob()
      
      const file = new File([blob], `${product.id}_clothing.jpg`, { type: blob.type })
      
      setClothing(file, product.imageUrl)
      setCurrentPage('ATELIER')

      // 백그라운드 누끼 제거 시작
      const { uploadAndRemoveBackground } = await import('../../api')
      setIsRemovingBg(true)
      try {
        const transparentUrl = await uploadAndRemoveBackground(file)
        setClothing(file, transparentUrl)
        
        addWardrobeItem({
          id: `product-${product.id}`,
          imageUrl: transparentUrl,
          category: 'top'
        })
        showToast('🧥 선택하신 상품 이미지의 배경 제거가 완료되었습니다.')
      } catch (err) {
        console.error('ShopPanel 배경 제거 실패:', err)
        showToast('❌ 상품 이미지 배경 제거에 실패했습니다.')
      } finally {
        setIsRemovingBg(false)
      }

    } catch (error) {
      console.error("Failed to load image for Try-On", error)
      alert("이미지를 불러오는데 실패했습니다.")
    } finally {
      setLoadingProductId(null)
    }
  }

  // 필터 로직: My Wishlist 카테고리면 찜한 상품만, 아니면 일반 카테고리 필터
  const filteredProducts = activeCategory === 'My Wishlist'
    ? MOCK_PRODUCTS.filter(p => wishlistIds.includes(p.id))
    : activeCategory === 'All' 
      ? MOCK_PRODUCTS 
      : MOCK_PRODUCTS.filter(p => p.category === activeCategory)

  const extendedCategories = ['All', 'My Wishlist', ...CATEGORIES]

  return (
    <div className="w-full min-h-full bg-[#f9fafb] dark:bg-zinc-950 pt-8 px-8 pb-32 md:pt-12 md:px-12 md:pb-48 overflow-y-auto transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Discover Collection
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto break-keep">
            다양한 스타일의 의류를 구경하고 위시리스트에 담아보세요. 마음에 드는 상품은 언제든지 디지털 아뜰리에에서 직접 입어볼 수 있습니다.
          </p>
        </div>

        {/* Category Filter Bar */}
        <div className="flex justify-center gap-3 mb-12 overflow-x-auto pb-2 scrollbar-hide">
          {extendedCategories.map(category => (
            <button 
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase whitespace-nowrap transition-all ${
                activeCategory === category 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black shadow-md cursor-default' 
                  : category === 'My Wishlist'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40'
                    : 'bg-white dark:bg-zinc-900 text-gray-400 hover:text-gray-900 dark:hover:text-zinc-200 border border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-zinc-500'
              }`}
            >
              {category === 'My Wishlist' ? '❤️ ' : ''}{category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
            {activeCategory === 'My Wishlist' ? '아직 찜한 상품이 없습니다.' : '해당 카테고리에 상품이 없습니다.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => {
              const isWished = wishlistIds.includes(product.id)
              
              return (
                <div key={product.id} className="group flex flex-col cursor-pointer">
                  
                  {/* Product Image Container */}
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 mb-4 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    
                    {/* Wishlist Toggle Button (Top Right) */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                      className="absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md bg-white/30 dark:bg-black/30 hover:bg-white/50 dark:hover:bg-black/50 transition-colors shadow-sm"
                    >
                      <svg 
                        className={`w-6 h-6 transition-colors ${isWished ? 'text-red-500 fill-red-500' : 'text-gray-700 dark:text-white'}`} 
                        fill={isWished ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Try On Button Overlay */}
                    <div className="absolute inset-0 bg-black/10 dark:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTryOn(product);
                        }}
                        disabled={loadingProductId === product.id}
                        className="translate-y-4 group-hover:translate-y-0 transition-all duration-300 px-6 py-3 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingProductId === product.id ? 'Loading...' : 'Try On in 3D'}
                      </button>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                      {product.brand}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                      {product.name}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-zinc-400">
                      ₩{product.price.toLocaleString()}
                    </span>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
