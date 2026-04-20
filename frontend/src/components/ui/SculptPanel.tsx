import React, { useState, useEffect } from 'react'
import { useFittingStore } from '../../store/useFittingStore'
import { getSizeRecommendation } from '../../api'

export const SculptPanel: React.FC = () => {
  const { modelUrl, bodyMeasurements, setActiveTool, sculptModifiers, setSculptModifier, resetSculptModifiers } = useFittingStore()

  return (
    <div className="flex flex-col h-full p-6 animate-in fade-in slide-in-from-left-4 duration-300 text-gray-900 dark:text-zinc-100 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-serif text-2xl font-bold">Body Measurements</h2>
        <button 
          onClick={() => setActiveTool(null)}
          className="text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center font-bold"
          title="패널 닫기"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-400 dark:text-zinc-500 mb-8">내 아바타에서 AI가 추출한 신체 상세 치수입니다.</p>

      {!modelUrl || !bodyMeasurements ? (
        <div className="mt-10 py-16 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-zinc-500 transition-colors">
          <span className="text-4xl mb-3 grayscale opacity-50">📏</span>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-zinc-400 mb-2">No Data Available</p>
          <p className="text-xs">상단의 VIEW 탭에서 3D 아바타를 먼저 생성해 주세요.</p>
          <button 
            onClick={() => setActiveTool('VIEW')}
            className="mt-6 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            Go to Upload
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5 overflow-y-auto pr-2 pb-10 custom-scrollbar">
          
          {/* Header Info */}
          <div className="bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl p-4 flex items-center justify-between shadow-lg shadow-gray-900/10 dark:shadow-white/5 transition-colors">
            <div>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Base Height</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{(bodyMeasurements.height_cm * sculptModifiers.height).toFixed(1)}</span>
                <span className="text-xs text-gray-400 dark:text-zinc-500">cm</span>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-700 dark:bg-zinc-300"></div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Scale Factor</p>
              <span className="text-sm font-mono font-bold dark:text-zinc-900">{bodyMeasurements.scale_factor.toFixed(2)}x</span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 my-2 transition-colors"></div>

          {/* Sculpting Controls */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-sm rounded-xl p-5 mb-1 mt-1 transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl grayscale opacity-80">🛠️</span>
                <span className="font-bold text-sm text-gray-900 dark:text-zinc-100 uppercase tracking-widest">Manual Sculpt</span>
              </div>
              <button 
                onClick={resetSculptModifiers}
                className="text-[10px] text-gray-400 dark:text-zinc-400 font-bold uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100/50 dark:bg-zinc-800 px-2 py-1 rounded"
              >
                Reset
              </button>
            </div>
            
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Height (Y-Axis)</label>
                <span className="text-[10px] text-zinc-900 dark:text-zinc-300 font-mono font-bold text-right w-8">{(sculptModifiers.height * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.8" max="1.2" step="0.01" 
                value={sculptModifiers.height} 
                onChange={(e) => setSculptModifier('height', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Girth / Width (X,Z-Axis)</label>
                <span className="text-[10px] text-zinc-900 dark:text-zinc-300 font-mono font-bold text-right w-8">{(sculptModifiers.width * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.8" max="1.5" step="0.01" 
                value={sculptModifiers.width} 
                onChange={(e) => {
                  setSculptModifier('width', parseFloat(e.target.value))
                  setSculptModifier('depth', parseFloat(e.target.value)) // sync width and depth for realistic girth
                }}
                className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white"
              />
            </div>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-4 leading-relaxed bg-gray-50 dark:bg-zinc-800/50 p-2 rounded transition-colors">
              💡 슬라이더를 움직여 3D 기본 메쉬의 형태를 수정할 수 있습니다. 변경된 체형에 맞춰 AI 사이즈 추천 결과가 실시간으로 업데이트됩니다.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-white/10 my-2 transition-colors"></div>

          {/* Measurements List */}
          
          <MeasurementItem 
            label="Shoulder Width" 
            value={bodyMeasurements.shoulder_width_cm * sculptModifiers.width} 
            icon="↕️" 
            transform="rotate-90"
            desc="양쪽 어깨 끝점 사이의 직선 직선 거리"
          />
          
          <MeasurementItem 
            label="Chest Width" 
            value={bodyMeasurements.chest_width_cm * sculptModifiers.width} 
            icon="📏" 
            desc="가슴의 가장 넓은 부분을 측정한 너비"
          />
          
          <MeasurementItem 
            label="Waist Width" 
            value={bodyMeasurements.waist_width_cm * sculptModifiers.width} 
            icon="⭕" 
            desc="허리의 가장 얇은 부분을 측정한 너비"
          />
          
          <MeasurementItem 
            label="Hip Width" 
            value={bodyMeasurements.hip_width_cm * sculptModifiers.width} 
            icon="👖" 
            desc="골반의 가장 넓은 부분을 측정한 너비"
          />

          <div className="mt-4 p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-transparent flex gap-3 items-start transition-colors">
            <span className="text-zinc-500 dark:text-zinc-400 text-lg">💡</span>
            <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed font-medium">
              위 치수들은 입력하신 실제 키 데이터를 기준으로 당사의 3D 체형 시뮬레이션 엔진이 계산한 추정값입니다.
            </p>
          </div>

          {/* Size Recommendation Section */}
          <SizeRecommendation chestWidth={bodyMeasurements.chest_width_cm * sculptModifiers.width} />
          
        </div>
      )}
    </div>
  )
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const

const SizeRecommendation = ({ chestWidth }: { chestWidth: number }) => {
  const [recommended, setRecommended] = useState<string>('M')
  const [confidence, setConfidence] = useState<number>(0)
  const [detail, setDetail] = useState<string>('추천 사이즈를 분석 중입니다...')
  const [isFetching, setIsFetching] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setIsFetching(true)
    
    getSizeRecommendation(chestWidth).then(res => {
      if (isMounted) {
        setRecommended(res.size)
        setConfidence(res.confidence)
        setDetail(res.detail)
        setIsFetching(false)
      }
    })

    return () => { isMounted = false }
  }, [chestWidth])
  
  return (
    <div className="mt-2 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-zinc-100 dark:to-zinc-300 rounded-xl p-5 shadow-lg shadow-gray-900/10 dark:shadow-white/10 transition-colors relative overflow-hidden">
      {isFetching && (
        <div className="absolute inset-0 bg-gray-900/50 dark:bg-zinc-100/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white dark:border-zinc-900"></div>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg grayscale opacity-80">👕</span>
        <p className="text-[10px] text-gray-400 dark:text-zinc-600 font-bold uppercase tracking-widest">AI Size Recommendation</p>
      </div>

      {/* Size Chips */}
      <div className="flex gap-2 mb-4 justify-center relative z-0">
        {SIZES.map((size) => (
          <div 
            key={size}
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wider transition-all
              ${size === recommended 
                ? 'bg-white dark:bg-zinc-900 text-black dark:text-white ring-2 ring-white/50 dark:ring-black/50 ring-offset-2 ring-offset-gray-900 dark:ring-offset-zinc-200 scale-110 shadow-lg' 
                : 'bg-gray-700/50 dark:bg-black/10 text-gray-400 dark:text-zinc-600'
              }
            `}
          >
            {size}
          </div>
        ))}
      </div>

      {/* Basis Info & Match Rate */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-2xl font-bold text-white dark:text-zinc-900 font-serif">{recommended}</span>
        <div className="flex flex-col text-left">
           <span className="text-[10px] text-gray-400 dark:text-zinc-600 font-medium leading-tight">가슴너비 {chestWidth.toFixed(1)}cm 기준</span>
           <span className="text-xs font-bold text-green-400 dark:text-green-600 leading-tight">{confidence}% 매칭률</span>
        </div>
      </div>
      
      <p className="text-center text-[11px] text-white/80 dark:text-zinc-800 mb-4 font-medium">{detail}</p>

      {/* Disclaimer */}
      <div className="bg-yellow-500/10 dark:bg-yellow-900/10 rounded-lg px-3 py-2 flex gap-2 items-start mt-2">
        <span className="text-yellow-500 text-xs mt-0.5">⚠️</span>
        <p className="text-[10px] text-yellow-200/70 dark:text-yellow-700 leading-relaxed">
          AI 추정치입니다. 브랜드별 실제 사이즈 차트와 비교해 보세요.
        </p>
      </div>
    </div>
  )
}

const MeasurementItem = ({ label, value, icon, desc, transform = "" }: { label: string, value: number, icon: string, desc: string, transform?: string }) => (
  <div className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-zinc-900 dark:hover:border-zinc-100 hover:shadow-md transition-all flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-lg border border-gray-100 dark:border-white/5 group-hover:bg-zinc-100 dark:group-hover:bg-white/10 transition-colors grayscale opacity-80 ${transform}`}>
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm text-gray-900 dark:text-white tracking-tight leading-tight">{label}</p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <div className="text-right flex items-baseline gap-1">
      <span className="font-mono text-xl font-bold text-zinc-900 dark:text-white">{value.toFixed(1)}</span>
      <span className="text-xs font-bold text-gray-400 dark:text-zinc-500">cm</span>
    </div>
  </div>
)
