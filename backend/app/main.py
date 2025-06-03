import logging
from fastapi import FastAPI
from app.api.routes import chat, projects  # Make sure to import projects too
from fastapi.middleware.cors import CORSMiddleware
from app.vectorstore.store import get_vectorstore, VectorStore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Darbo Asistentas API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector store singleton on startup
@app.on_event("startup")
async def initialize_vectorstore():
    logger.info("Initializing vector store system during app startup...")
    
    # Initialize the singleton VectorStore instance
    vector_store = VectorStore()
    
    # Test the store
    store = vector_store.get_store()  # No parameters
    
    if store:
        logger.info("✓ Vector store initialized successfully")
        logger.info(f"Vector store collection count: {store._collection.count()}")
    else:
        logger.error("✗ Vector store initialization failed!")

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(projects.router, prefix="/api", tags=["projects"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify service is running"""
    # Check if vector store is initialized
    vectorstore = get_vectorstore()  # No parameters
    
    return {
        "status": "healthy",
        "vectorstore_initialized": vectorstore is not None,
        "vectorstore_count": vectorstore._collection.count() if vectorstore else 0
    }