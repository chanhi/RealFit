# 1. 환경 설정
FROM nvidia/cuda:12.1.1-cudnn8-devel-ubuntu22.04
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# 2. 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    python3.10 python3-pip python3.10-venv python3.10-dev \
    git ninja-build build-essential \
    libglib2.0-0 libsm6 libxrender-dev libxext6 libgl1-mesa-glx \
    libegl1-mesa-dev libgles2-mesa-dev \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3.10 /usr/bin/python
WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
RUN pip install --no-cache-dir fvcore iopath
ENV MAX_JOBS=1
RUN pip install --no-cache-dir --no-build-isolation "git+https://github.com/facebookresearch/pytorch3d.git"
RUN pip install --no-cache-dir --no-build-isolation chumpy==0.70

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN git clone https://github.com/shubham-goel/4D-Humans.git
COPY . .
# 스크립트 및 SMPL 데이터 모델 삽입
RUN mv generate_mannequin.py 4D-Humans/
# 4D-Humans 폴더 안에 data 폴더를 확실히 만들어 줍니다.
RUN mkdir -p 4D-Humans/data
# 로컬에 있는 파일을 이름 변경이나 하위 폴더 없이, 요구하는 위치에 그대로 복사합니다.
RUN cp data/basicModel_neutral_lbs_10_207_0_v1.0.0.pkl 4D-Humans/data/basicModel_neutral_lbs_10_207_0_v1.0.0.pkl

EXPOSE 9002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "9002", "--reload"]