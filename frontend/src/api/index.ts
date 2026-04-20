import type { BodyMeasurements } from "../store/useFittingStore";
import { removeBackground } from '@imgly/background-removal';

// ===== Configuration =====
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ===== Job API Types =====
interface JobData {
  job_id: string;
  status: string;
  category: string;
  user_image_path: string;
  cloth_image_path: string;
  result_image_path: string | null;
  error_message: string | null;
}

// ===== Category Mapping =====
function mapCategoryToBackend(frontendCategory: string): string {
  if (['T-Shirts', 'Shirts', 'Sweatshirts', 'Knitwear', 'Outerwear'].includes(frontendCategory)) {
    return 'top';
  }
  return 'dress';
}

// ===== Job-Based API (New Backend) =====

/**
 * 1단계: 피팅 작업 생성
 * POST /api/v1/jobs — 사용자 이미지 + 의류 이미지 + 카테고리를 전송하여 Job을 생성한다.
 */
export const createFittingJob = async (
  userImage: File,
  clothImage: File,
  category: string = 'top'
): Promise<string> => {
  const formData = new FormData();
  formData.append('user_image', userImage);
  formData.append('cloth_image', clothImage);
  formData.append('category', mapCategoryToBackend(category));

  console.log(`--- [API] POST ${API_BASE}/api/v1/jobs (category: ${category}) ---`);

  const response = await fetch(`${API_BASE}/api/v1/jobs`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Job creation failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const jobId = result.data.job_id;
  console.log(`--- [API] Job created: ${jobId} ---`);
  return jobId;
};

/**
 * 2단계: 작업 상태 폴링
 * GET /api/v1/jobs/{job_id} — 2초 간격으로 상태를 확인하며 COMPLETED 또는 FAILED를 기다린다.
 */
export const pollJobStatus = async (
  jobId: string,
  timeoutMs: number = 120000,
  onStatusCheck?: (status: string) => void
): Promise<JobData> => {
  const startTime = Date.now();
  const pollInterval = 2000;

  console.log(`--- [API] Polling job ${jobId} (timeout: ${timeoutMs}ms) ---`);

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(`${API_BASE}/api/v1/jobs/${jobId}`);
    if (!response.ok) throw new Error(`Job status check failed: ${response.status}`);

    const result = await response.json();
    const jobData: JobData = result.data;

    console.log(`--- [API] Job ${jobId} status: ${jobData.status} ---`);
    onStatusCheck?.(jobData.status);

    if (jobData.status === 'COMPLETED') return jobData;
    if (jobData.status === 'FAILED') {
      throw new Error(jobData.error_message || 'Job failed on server');
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Job ${jobId} timed out after ${timeoutMs / 1000}s`);
};

/**
 * 3단계: 작업 결과 조회
 * GET /api/v1/jobs/{job_id}/result — 완료된 Job의 결과 파일 경로를 조회한다.
 */
export const getJobResult = async (jobId: string): Promise<string> => {
  const response = await fetch(`${API_BASE}/api/v1/jobs/${jobId}/result`);
  if (!response.ok) throw new Error(`Job result fetch failed: ${response.status}`);

  const result = await response.json();
  const resultPath = result.data.result_image_path;

  if (!resultPath) throw new Error('Result not ready yet');

  // Convert relative path to accessible URL
  const fullUrl = resultPath.startsWith('http')
    ? resultPath
    : `http://localhost/static/${resultPath}`;

  console.log(`--- [API] Job ${jobId} result: ${fullUrl} ---`);
  return fullUrl;
};

// ===== High-Level Pipeline Functions =====

/**
 * 3D 마네킹 생성 로직 (사용자 사진만 전송)
 * 기존 엔드포인트 시도 후, 실패 시 로컬 mock OBJ로 폴백한다.
 */
export const generate3DModel = async (
  userPhoto: File
): Promise<{ url: string, measurements?: BodyMeasurements }> => {
  const formData = new FormData();
  formData.append('user_image', userPhoto);

  console.log('--- [API Request: Generate 3D Model] ---');

  const mockMeasurements: BodyMeasurements = {
    height_cm: 175.0,
    model_height_unit: 1.82,
    scale_factor: 175.0 / 1.82,
    shoulder_width_cm: 45.0,
    chest_width_cm: 30.5,
    waist_width_cm: 26.0,
    hip_width_cm: 33.1
  };

  try {
    // Try backend endpoint first
    const response = await fetch(`${API_BASE}/api/v1/generate-3d`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(`API request failed: ${response.status}`);

    const data = await response.json();
    const fullUrl = data.model_url.startsWith('http')
      ? data.model_url
      : `${API_BASE}${data.model_url}`;

    console.log('--- [API Response: Success] 3D Model URL:', fullUrl);
    return { url: fullUrl, measurements: data.measurements || mockMeasurements };
  } catch (e) {
    console.warn('Backend unavailable for 3D, using local mock OBJ:', e);
    return { url: '/mock/my_A_pose_mannequin%20(1).obj', measurements: mockMeasurements };
  }
};

/**
 * 2D VTON(옷 입히기) 생성 — Job 기반 비동기 파이프라인
 * 1) Job 생성 → 2) 폴링 → 3) 결과 조회
 * 백엔드 연결 실패 시 에러를 던진다.
 */
export const generateVTONResult = async (
  userPhoto: File,
  clothingPhoto: File,
  _customColor: string,
  category: string = 'top'
): Promise<string> => {
  console.log('--- [API] Starting VTON Pipeline (Job-based) ---');

  try {
    // Step 1: Job 생성
    const jobId = await createFittingJob(userPhoto, clothingPhoto, category);

    // Step 2: 상태 폴링 (최대 120초)
    await pollJobStatus(jobId, 120000);

    // Step 3: 결과 조회
    const resultUrl = await getJobResult(jobId);
    return resultUrl;
  } catch (e) {
    console.error('VTON Pipeline failed:', e);
    throw e;
  }
};

/**
 * 가상의 사이즈 추천 API 목업
 * (나중에 실제 백엔드 연동 시 endpoint 호출 로직으로 변경 가능합니다)
 */
export const getSizeRecommendation = async (
  chestWidth: number
): Promise<{ size: string; confidence: number; detail: string }> => {
  return new Promise((resolve) => {
    // API 레이턴시 시뮬레이션
    setTimeout(() => {
      let size = 'XXL';
      let confidence = 85;
      let detail = '체형을 넉넉하게 감싸는 오버핏을 추천합니다.';

      if (chestWidth < 24) { size = 'XS'; detail = '신체에 딱 맞는 타이트한 슬림핏이 예상됩니다.'; confidence = 88; }
      else if (chestWidth < 27) { size = 'S'; detail = '어깨와 가슴선이 단정한 정사이즈 핏입니다.'; confidence = 92; }
      else if (chestWidth < 30) { size = 'M'; detail = '가장 편안하고 세련된 스탠다드 핏입니다.'; confidence = 96; }
      else if (chestWidth < 33) { size = 'L'; detail = '활동성이 좋은 여유로운 루즈핏입니다.'; confidence = 89; }
      else if (chestWidth < 36) { size = 'XL'; detail = '트렌디하게 떨어지는 오버핏 실루엣입니다.'; confidence = 83; }

      resolve({ size, confidence, detail });
    }, 600);
  });
};

/**
 * 옷 사진 누끼 제거 및 로컬 상태(임시 DB) 저장
 * @imgly/background-removal을 활용하여 백엔드 없이 브라우저 내에서 직접 배경을 제거합니다.
 * (추후 AI 서버의 누끼 API가 완성되면 서버 호출로 전환 예정)
 */
export const uploadAndRemoveBackground = async (clothingPhoto: File): Promise<string> => {
  console.log('--- [Client-Side AI: Background Removal] Starting ---');
  
  try {
    const config = {
      model: "isnet" as const, // 고품질 모델로 변경
      output: {
        format: "image/png" as const, // PNG 포맷 적용 (WebP의 알파채널 색상 손실 방지)
      },
      progress: (key: string, current: number, total: number) => {
         const percentage = Math.round((current / total) * 100);
         console.log(`AI Model Loading [${key}]: ${percentage}%`);
      }
    };
    
    // File 객체를 직접 라이브러리에 입력하여 배경 제거된 Blob 추출
    const blob = await removeBackground(clothingPhoto, config);
    
    // Blob을 가상의 상품 이미지 주소(Object URL)로 변환
    const transparentUrl = URL.createObjectURL(blob);
    console.log('--- [Client-Side AI: Background Removal] Success ---');
    
    return transparentUrl;
  } catch (err) {
    console.error('Background removal failed:', err);
    throw err;
  }
};

// ===== Utility =====
export { mapCategoryToBackend };
