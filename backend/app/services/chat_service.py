from app.models.schemas import ChatRequest, ChatResponse, SourceDocument
from app.workflows.workflows import create_minimal_workflow
from app.vectorstore.store import get_vectorstore
from datetime import datetime
import uuid
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

def get_chat_response(request: ChatRequest) -> ChatResponse:
    """Process a chat request and generate a response using the LangGraph workflow."""
    try:
        logger.info(f"Received chat request: '{request.message[:50]}...'")
        
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get vectorstore - this should just work, no debugging needed
        summaries_vectorstore = get_vectorstore(store_type="summary")
        if summaries_vectorstore is None:
            raise ValueError("Vector store not initialized properly")
        full_vectorstore = get_vectorstore(store_type="full")
        if full_vectorstore is None:
            raise ValueError("Full vector store not initialized properly")
        # Create workflow
        model_name = getattr(request, 'model_name', "meta-llama/llama-4-scout-17b-16e-instruct")
        
        workflow = create_minimal_workflow(
            summaries_vectorstore=summaries_vectorstore,
            full_vectorstore=full_vectorstore,
            k_sum=15,
            search_type="similarity",
            generator_name=model_name,
            generator_temperature=0.0,
            helper_name="llama-3.3-70b-versatile",
            helper_temperature=0.1
        )
        
        # Execute workflow
        initial_state = {
            "messages": [{"role": "user", "content": request.message}],
            "context": {},
            "steps": [],
            "question": request.message,
            "generation_count": 0
        }
        
        final_state = workflow.invoke(initial_state)
        response_text = final_state.get("generation", "Atsiprašau, nepavyko sugeneruoti atsakymo.")
        
        # Format sources
        formatted_sources = None
        if final_state.get("full_documents"):
            formatted_sources = [
                SourceDocument(
                    page_content=doc.page_content,
                    metadata=doc.metadata or {}
                ) for doc in final_state["full_documents"]
            ]
        
        summary_documents = None
        if final_state.get("filtered_summaries"):
            summary_documents = [
                SourceDocument(
                    page_content=doc.page_content,
                    metadata=doc.metadata or {}
                ) for doc in final_state["filtered_summaries"]
            ]
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            created_at=datetime.now(),
            sources=formatted_sources,
            summary_documents=summary_documents  # Add new field for sidebar
        )
        
    except Exception as e:
        logger.error(f"Error in get_chat_response: {str(e)}")
        raise