from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from app.models.schemas import ChatRequest, ChatResponse, SourceDocument
from app.services.chat_service import get_chat_response
from app.workflows.workflows import create_direct_document_workflow
from app.vectorstore.store import get_vectorstore
import uuid
from datetime import datetime
import logging

# Create router and logger
router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process a chat request and generate a response."""
    try:
        # Normal chat processing - use existing service
        return get_chat_response(request)
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat: {str(e)}")

@router.post("/document", response_model=ChatResponse)
async def document_chat(request: ChatRequest):
    """Handle document-focused chat using the direct document workflow."""
    try:
        if not request.document_id:
            raise HTTPException(status_code=400, detail="document_id is required for document chat endpoint")
            
        logger.info(f"Document chat request: document_id={request.document_id}, message='{request.message[:50]}...'")
        
        # Get the full vector store
        full_vectorstore = get_vectorstore(store_type="full")
        if not full_vectorstore:
            raise HTTPException(status_code=500, detail="Vector store not initialized properly")
        
        # Create conversation ID if not provided
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get model name with fallback
        model_name = request.model_name or "meta-llama/llama-4-scout-17b-16e-instruct"
        
        # Create the direct document workflow
        workflow = create_direct_document_workflow(
            full_vectorstore=full_vectorstore,
            generator_name=model_name,
            generator_temperature=0.0,
            document_uuid=request.document_id
        )
        
        # Set up initial state with the message and document ID
        initial_state = {
            "messages": [{"role": "user", "content": request.message}],
            "context": {},
            "steps": [],
            "question": request.message,
            "generation_count": 0,
            "document_uuids": [request.document_id]  # Pre-populate with the document ID
        }
        
        # Invoke workflow
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
        
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            created_at=datetime.now(),
            sources=formatted_sources
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in document_chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process document chat: {str(e)}")

@router.post("/document-workflow")
async def create_document_workflow(data: Dict[str, Any]):
    """Endpoint to fetch a document by ID and prepare for direct document workflow."""
    try:
        document_id = data.get("document_id")
        if not document_id:
            raise HTTPException(status_code=400, detail="document_id is required")
        
        logger.info(f"Fetching document for ID: {document_id}")
        
        # Get document from vectorstore
        full_vectorstore = get_vectorstore(store_type="full")
        if not full_vectorstore:
            raise HTTPException(status_code=500, detail="Vector store not initialized properly")
        
        # Use similarity_search with filter to find the document
        results = full_vectorstore.similarity_search(
            query="",  # Empty query since we're using filter
            k=1,
            filter={"$or": [{"uuid": document_id}, {"id": document_id}]}
        )
        
        if not results:
            raise HTTPException(status_code=404, detail=f"Document with ID {document_id} not found")
        
        document = results[0]
        
        # Convert LangChain document to SourceDocument format
        source_doc = SourceDocument(
            page_content=document.page_content,
            metadata=document.metadata or {}
        )
        
        return {
            "document": source_doc,
            "success": True,
            "workflow_id": f"doc-workflow-{document_id}"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating document workflow: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {str(e)}")