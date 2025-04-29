from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import get_chat_response
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Handle chat requests and return responses.
    """
    try:
        # Here the service calls the LangGraph workflow
        response = get_chat_response(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    """
    Return a list of available AI models.
    """
    logger.info("Models endpoint called")
    
    models = [
        
        {"id": "meta-llama/llama-4-maverick-17b-128e-instruct", "name": "LLaMA-4 Maverick (17B)"},
        {"id": "meta-llama/llama-4-scout-17b-16e-instruct", "name": "LLaMA-4 Scout (17B)"}
    ]
    
    logger.info(f"Returning {len(models)} models: {[m['id'] for m in models]}")
    return {"models": models}

@router.post("/raw-response")
async def raw_response(request: ChatRequest):
    """
    Simple endpoint that just returns the message without using workflows.
    Use this to test if basic connectivity works.
    """
    try:
        return {
            "message": f"Echo: {request.message}",
            "model": request.model_name,
            "conversation_id": request.conversation_id or "new-conversation",
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in raw response: {str(e)}")
        return {"error": str(e)}