from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.services.chat_service import get_chat_response

router = APIRouter()

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
    return {
        "models": [
            {"id": "default", "name": "Default Assistant"},
            {"id": "advanced", "name": "Advanced Assistant"}
        ]
    }