from app.models.schemas import ChatRequest, ChatResponse
from app.workflows.workflows import create_minimal_workflow
from app.vectorstore.store import get_vectorstore
from datetime import datetime
import uuid
import logging

# Set up logging for this specific file
logger = logging.getLogger(__name__)

def get_chat_response(request: ChatRequest) -> ChatResponse:
    """Process a chat request and generate a response using the LangGraph workflow."""
    try:
        logger.info(f"Received chat request: '{request.message[:50]}...'")
        logger.info(f"Using model: {request.model_name if hasattr(request, 'model_name') else 'default'}")

        # Create a conversation ID if not provided
        conversation_id = request.conversation_id or str(uuid.uuid4())
        logger.info(f"Conversation ID: {conversation_id}")

        # Create initial state for the workflow with all required keys
        initial_state = {
            "messages": [{"role": "user", "content": request.message}],
            "context": {},
            "steps": [],
            "question": request.message,  # <-- ADD THIS LINE
            "generation_count": 0        # <-- Keep this if you added it before
        }
        logger.info(f"Initial state created: {initial_state}")

        # Get the vectorstore
        vectorstore = get_vectorstore()
        logger.info(f"Vector store retrieved: {vectorstore is not None}")
        
        # Get the workflow with all required parameters
        logger.info("Creating workflow...")
        model_name = request.model_name if hasattr(request, 'model_name') and request.model_name else "meta-llama/llama-4-maverick-17b-128e-instruct"
        workflow = create_minimal_workflow(
            vectorstore=vectorstore,
            k=3,
            search_type="similarity",
            generator_name=model_name,
            generator_temperature=0.7,
            helper_name="meta-llama/llama-4-scout-17b-16e-instruct",
            helper_temperature=0.7
        )
        logger.info("Workflow created successfully")

        # Execute the workflow with the initial state
        logger.info("Executing workflow...")
        final_state = workflow.invoke(initial_state)
        logger.info(f"Workflow execution completed. Final state keys: {final_state.keys() if final_state else 'None'}")

        # --- START OF CHANGES ---
        # Get the assistant's response from the 'generation' key
        logger.info("Extracting assistant response...")
        if not final_state or "generation" not in final_state:
            logger.error("Final state missing or 'generation' not found in final_state!")
            raise ValueError("Workflow did not return the 'generation' key")

        response_text = final_state.get("generation")

        if not response_text:
            logger.warning("No response text found in 'generation' key.")
            response_text = "Atsiprašau, nepavyko sugeneruoti atsakymo." # Default error message
        else:
            logger.info(f"Generated response (first 100 chars): {response_text[:100]}...")
        # --- END OF CHANGES ---

        # Create and return the response
        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error in get_chat_response: {str(e)}", exc_info=True)
        # Re-raise to let the API route handle it
        raise