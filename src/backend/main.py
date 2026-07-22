from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.transcript import router as transcript_router

app = FastAPI(
    title="CPA Analyzer API",
    description="API phân tích bảng điểm HUST",
    version="1.0.0",
)

# CORS - cho phép mọi origin trong môi trường dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcript_router)


@app.get("/")
def root():
    return {"message": "CPA Analyzer API is running 🚀"}
