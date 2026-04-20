import React from 'react'

export const AboutPanel: React.FC = () => {
  return (
    <div className="w-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 selection:bg-blue-100 dark:selection:bg-zinc-800 min-h-full transition-colors duration-500">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-32 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-6xl md:text-7xl font-serif font-light leading-tight mb-8">
            Redefining <br />
            <span className="font-bold">Digital</span> Fitting
          </h1>
          <p className="text-xl text-gray-500 dark:text-zinc-400 font-light leading-relaxed max-w-lg mb-10">
            RealFIT은 최첨단 AI 렌더링 기술과 사실적인 3D 토폴로지를 결합하여 옷을 구매하기 전 직접 가상으로 착용해 볼 수 있는 경험을 제공합니다. 스크린 너머로 만나는 지속 가능한 패션을 경험해 보세요.
          </p>
          <div className="flex gap-6 items-center border-l-2 border-gray-900 dark:border-white pl-6 h-20">
            <div className="flex flex-col">
              <span className="text-3xl font-bold font-serif mb-1 uppercase tracking-tight text-gray-900 dark:text-white">0%</span>
              <span className="text-xs font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">Data Kept</span>
            </div>
            <div className="flex flex-col border-l border-gray-200 dark:border-white/10 pl-6">
              <span className="text-3xl font-bold font-serif mb-1 uppercase tracking-tight text-gray-900 dark:text-white">40+</span>
              <span className="text-xs font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">Garments</span>
            </div>
            <div className="flex flex-col border-l border-gray-200 dark:border-white/10 pl-6">
              <span className="text-3xl font-bold font-serif mb-1 uppercase tracking-tight text-gray-900 dark:text-white">3s</span>
              <span className="text-xs font-bold tracking-widest text-gray-400 dark:text-zinc-500 uppercase">Latency</span>
            </div>
          </div>
        </div>
        <div className="relative h-[60vh] bg-gray-100 dark:bg-zinc-900 rounded-3xl overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop" 
            alt="Virtual Fitting Model" 
            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-1000 ease-out"
          />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="backdrop-blur-md bg-white/30 p-6 rounded-2xl border border-white/20 text-white">
              <h3 className="text-sm font-bold tracking-widest uppercase mb-2">Sustainable Fashion</h3>
              <p className="text-sm font-light leading-relaxed opacity-90">가상 피팅 솔루션으로 반품률을 낮추고, 글로벌 패션 산업의 탄소 발자국을 줄여나갑니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-gray-50 dark:bg-zinc-900/50 py-32 border-t border-gray-200 dark:border-white/5 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl font-serif mb-6 text-gray-900 dark:text-white">Built on Privacy</h2>
            <p className="text-gray-500 dark:text-zinc-400 font-light leading-relaxed text-lg">
              신체 데이터의 민감성을 누구보다 잘 이해하고 있습니다. RealFIT은 처음부터 고객의 프라이버시를 최우선으로 보호하도록 설계되었습니다.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                icon: '🔒', 
                title: 'No Image Storage', 
                desc: '업로드된 모든 사진은 메모리 내에서만 처리되며, 데이터베이스나 외부 서버에 절대 저장되지 않습니다.'
              },
              { 
                icon: '⚡', 
                title: 'Real-Time Edge AI', 
                desc: 'WebGL과 최적화된 디퓨전 파이프라인을 활용하여 복잡한 연산을 빠르고 안전하게 클라이언트-서버 간 통합 환경에서 생성합니다.'
              },
              { 
                icon: '🎯', 
                title: 'Parametric 3D Avatars', 
                desc: '실제 신체의 디테일한 형상을 직접 스캔하는 대신, 익명성이 완벽히 보장되는 파라메트릭 3D 아바타 모델(SCULPT)을 활용합니다.'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-10 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 hover:-translate-y-2 transition-transform duration-500">
                <span className="text-4xl mb-6 border border-gray-100 dark:border-white/10 w-16 h-16 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-zinc-800 grayscale opacity-80">{feature.icon}</span>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-white/10 pb-4 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-500 dark:text-zinc-400 font-light leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer minimal */}
      <footer className="w-full text-center py-12 border-t border-gray-200 dark:border-white/5 text-gray-400 dark:text-zinc-500 text-sm font-mono uppercase tracking-widest transition-colors duration-500">
        © 2026 RealFIT Technologies
      </footer>
    </div>
  )
}
