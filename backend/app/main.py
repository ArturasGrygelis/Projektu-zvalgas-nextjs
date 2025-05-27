import logging
from fastapi import FastAPI
from app.api.routes import chat
from fastapi.middleware.cors import CORSMiddleware
from app.vectorstore.store import get_vectorstore

summary_vectorstore =  get_vectorstore("summary")

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
    logger.info("Initializing Chroma vector store during app startup...")
    # This creates the singleton instance that will be reused
    vector_store = summary_vectorstore()
    # Test if it's working
    if vector_store.get_store():
        logger.info("✓ Vector store initialized successfully")
        # Perform a small test query to fully load embeddings
        try:
            docs = vector_store.similarity_search("startup test query", k=1)
            logger.info(f"Vector store test query returned {len(docs)} documents")
        except Exception as e:
            logger.error(f"Test query failed: {str(e)}")
    else:
        logger.error("✗ Vector store initialization failed!")

# Include routers
app.include_router(chat.router, prefix="/api", tags=["chat"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify service is running"""
    # Check if vector store is initialized
    from app.vectorstore.store import get_vectorstore
    vectorstore = get_vectorstore()
    vector_store_status = vectorstore is not None
    
    return {
        "status": "healthy",
        "vectorstore_initialized": vector_store_status,
        "default_model": "meta-llama/llama-4-maverick-17b-128e-instruct"
    }