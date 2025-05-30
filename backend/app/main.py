import logging
from fastapi import FastAPI
from app.api.routes import chat, projects
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
# Keep the API prefix for the regular chat router
app.include_router(chat.router, prefix="/api", tags=["chat"])

# Add a separate include_router for document_query without the prefix
# This allows both /api/document_query and /document_query to work
app.include_router(chat.router, tags=["chat"])

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

# Add debug endpoint to list all routes at runtime
@app.get("/debug/routes", tags=["debug"])
async def list_routes():
    """List all registered routes for debugging"""
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": list(route.methods) if route.methods else []
        })
    return {"routes": routes}