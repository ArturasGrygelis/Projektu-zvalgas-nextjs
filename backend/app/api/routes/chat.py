from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import random  # For generating test data

# Create the router instance at the module level
router = APIRouter()
logger = logging.getLogger(__name__)

# Import the service after defining router to avoid circular imports
from app.services.chat_service import get_chat_response

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
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def list_models():
    """
    Return a list of available AI models.
    """
    logger.info("Models endpoint called")
    
    models = [
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

# Add these new endpoints for RecentProjects component

@router.get("/cities")
async def get_cities():
    """Return a list of available cities for filtering projects"""
    logger.info("Cities endpoint called")
    
    # Sample data for demonstration
    cities = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"]
    
    logger.info(f"Returning {len(cities)} cities")
    return {"cities": cities}

@router.get("/recent-projects")
async def get_recent_projects(city: Optional[str] = None):
    """Return a list of recent projects, optionally filtered by city"""
    logger.info(f"Recent projects endpoint called with city filter: {city}")
    
    # Generate some sample projects
    all_projects = [
        {
            "id": f"project-{i}",
            "title": f"{'Renovacija' if i % 3 == 0 else 'Statyba'} - {'Daugiabučio' if i % 2 == 0 else 'Administracinio pastato'} {['modernizavimas', 'atnaujinimas', 'rekonstrukcija'][i % 3]}",
            "deadline": (datetime.now().replace(day=datetime.now().day + i % 30)).isoformat(),
            "location": random.choice(["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys"]),
            "summary": f"Projektas Nr. {i+1}: {'Energetinio efektyvumo didinimo' if i % 2 == 0 else 'Rekonstrukcijos'} darbai. Reikalingi specialistai su patirtimi {random.randint(1, 5)} metų."
        }
        for i in range(10)
    ]
    
    # Filter by city if provided
    if city:
        filtered_projects = [p for p in all_projects if p["location"] == city]
    else:
        filtered_projects = all_projects
    
    logger.info(f"Returning {len(filtered_projects)} projects")
    return {"projects": filtered_projects}