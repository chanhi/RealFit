## 현재 상태
- Docker 실행 가능
- PostgreSQL 연결 완료
- 백엔드 docs 확인 가능: http://localhost:8000/docs
- AI 더미 서버 확인 가능: http://localhost/ai/health

## 실행 전 준비
- Docker Desktop 실행
- backend 폴더에서 명령어 실행
- `.env` 파일 필요

## 실행
- backend 폴더에서 powershell / cmd
- docker compose down -v
- docker compose up --build

## 프론트 연결용 api
- POST /api/v1/jobs
- GET /api/v1/jobs/{job_id} 
- GET /api/v1/jobs/{job_id}/result

- /api/v1/jobs 요청 curl 예시

curl -X POST "http://localhost:8000/api/v1/jobs" \
  -F "user_image=@./user.png" \
  -F "cloth_image=@./cloth.png" \
  -F "category=top"

응답 : 
{"success":true,"message":"Job created successfully","data":{"job_id":"6840c85e-5c79-41ac-82fe-ca49c4ddb78e","status":"COMPLETED","category":"top","user_image_path":"storage/input/6840c85e-5c79-41ac-82fe-ca49c4ddb78e/user.png","cloth_image_path":"storage/input/6840c85e-5c79-41ac-82fe-ca49c4ddb78e/cloth.png","result_image_path":"https://v3b.fal.media/files/b/0a96dfa0/zyHFw_wAmIQPeJhX16jDS_tripo_model_855a2675-0348-4c0f-945d-c543433bda99.glb","error_message":null}}%   

## 주의사항
- .env 확인
- 프론트는 우선 더미 결과 기준으로 연결 가능
