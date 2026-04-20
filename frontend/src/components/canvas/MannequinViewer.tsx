import React, { Suspense, useMemo, Component, ReactNode } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { useFittingStore } from '../../store/useFittingStore'

// [에러 바운더리] 3D 모델 렌더링 중 발생하는 예외가 앱 전체를 중단시키지 않도록 보호합니다.
class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode, fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  // 에러 발생 시 상태 업데이트
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // 에러 로그 기록
  componentDidCatch(error: any, errorInfo: any) {
    console.error("3D Viewer Critical Error:", error, errorInfo);
  }

  render() {
    // 에러 발생 시 지정된 fallback UI(에러 메시지)를 보여줍니다.
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// OBJ 파일 렌더링 컴포넌트: 자동 중심점 계산 및 크기 조절 기능 포함
const ObjModel = ({ url }: { url: string }) => {
  const obj = useLoader(OBJLoader, url)
  const { sculptModifiers } = useFittingStore()

  // 1단계: 원본 캐시 오염을 방지하기 위해 모델을 복제하고 재질(Material) 및 법선(Normal)을 설정합니다.
  const clonedObj = useMemo(() => {
    const clone = obj.clone(true)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const geometry = mesh.geometry
        // 법선 데이터가 없으면 자동 계산 (그림자 및 반사 표현에 필수)
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals()
        }

        // 색상 유무에 따라 기본 재질 설정
        if (geometry.attributes.color) {
          mesh.material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.6,
            metalness: 0.0,
          })
        } else {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#d4c096',
            roughness: 0.7,
            metalness: 0.0,
          })
        }
      }
    })
    return clone
  }, [obj])

  // 2단계: 모델의 전체 크기와 중심점을 계산하여 뷰포트 정중앙에 배치합니다.
  const { center, maxDim, minY } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedObj)
    const c = box.getCenter(new THREE.Vector3())
    const s = box.getSize(new THREE.Vector3())
    return {
      center: c,
      maxDim: Math.max(s.x, s.y, s.z),
      minY: box.min.y
    }
  }, [clonedObj])

  const targetSize = 3.0 // 화면에 보일 대상 크기
  const scale = maxDim > 0 ? targetSize / maxDim : 1.0

  return (
    <group position={[0, -targetSize / 2, 0]}>
      {/* 사용자가 조절하는 체형 변형(sculptModifiers)을 최종 스케일에 반영합니다. */}
      <group scale={[
        scale * sculptModifiers.width, 
        scale * sculptModifiers.height, 
        scale * sculptModifiers.depth
      ]}>
        <primitive 
          object={clonedObj} 
          position={[-center.x, -minY, -center.z]} 
        />
      </group>
    </group>
  )
}

// GLB 파일 렌더링 컴포넌트: Tripo3D 등에서 생성된 표준 3D 포맷을 지원합니다.
const GlbModel = ({ url }: { url: string }) => {
  const { sculptModifiers } = useFittingStore()
  // 개발용 목업(Mock) 파일인 경우 실제 외부 샘플 모델로 대체하여 테스트합니다.
  const loadUrl = url === '/mock/mock_mannequin.glb'
    ? 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Xbot.glb'
    : url

  const { scene } = useGLTF(loadUrl)

  // [자동 스케일링] 모델의 경계 상자(Bounding Box)를 계산하여 어떤 크기의 모델이라도 화면에 꽉 차게 조절합니다.
  const { maxDim } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const s = box.getSize(new THREE.Vector3())
    return {
      maxDim: Math.max(s.x, s.y, s.z),
    }
  }, [scene])

  const targetSize = 2.8 // 카메라 시야에 맞춘 최적의 타겟 크기
  const autoScale = maxDim > 0 ? targetSize / maxDim : 1.0

  return (
    <Center position={[0, -0.2, 0]}>
      <primitive 
        object={scene} 
        rotation={[0, -Math.PI / 2, 0]}
        scale={[
          autoScale * sculptModifiers.width, 
          autoScale * sculptModifiers.height, 
          autoScale * sculptModifiers.depth
        ]} 
      />
    </Center>
  )
}

const MannequinModel = ({ url }: { url: string }) => {
  if (url.endsWith('.obj')) {
    return <ObjModel url={url} />
  }
  return <GlbModel url={url} />
}

export const MannequinViewer: React.FC = () => {
  const { modelUrl, isLoading } = useFittingStore()

  return (
    <div className="w-full h-full bg-[#1a1a1a] rounded-2xl overflow-hidden relative">
      <ErrorBoundary fallback={
        <div className="absolute inset-0 flex items-center justify-center text-red-400 p-8 text-center bg-zinc-900 z-50">
          <div className="flex flex-col items-center gap-4">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-medium">3D 모델을 불러오는 중 에러가 발생했습니다.<br/>파일 형식이 올바른지 확인해 주세요.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs"
            >
              새로고침
            </button>
          </div>
        </div>
      }>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-blue-400 font-semibold text-lg animate-pulse">Loading 3D Mannequin...</div>
          </div>
        )}

        <Canvas camera={{ position: [0, 0, 3.5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 10, 5]} angle={0.25} penumbra={1} intensity={1} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.5} />

          <Environment preset="city" />

          <Suspense fallback={null}>
            {modelUrl ? (
              <MannequinModel url={modelUrl} />
            ) : (
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[0.5, 2, 0.5]} />
                <meshStandardMaterial color="#4f46e5" wireframe />
              </mesh>
            )}
          </Suspense>

          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={5} blur={2} far={4} />
          <OrbitControls
            enablePan={false}
            minDistance={1.5}
            maxDistance={5}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  )
}
