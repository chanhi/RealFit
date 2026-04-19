from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "hello"}


@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "server is running"
    }