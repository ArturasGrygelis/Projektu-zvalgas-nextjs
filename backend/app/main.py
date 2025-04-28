from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, payment, workflow_router
from app.api.routes import workflow_router 


app = FastAPI(
    title="Darbo Asistentas API",
    description="API for Darbo Asistentas chat assistant",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(payment.router, prefix="/api", tags=["payment"])
app.include_router(workflow_router.router, prefix="/api", tags=["workflow"])

@app.get("/")
async def root():
    return {"message": "Welcome to Darbo Asistentas API"}