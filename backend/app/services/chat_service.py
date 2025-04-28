from app.models.schemas import ChatRequest, ChatResponse
from app.workflows.workflows import create_minimal_workflow
from app.vectorstore.store import get_vectorstore
from datetime import datetime
import uuid
import logging

# Set up logging for this specific file
logger = logging.getLogger(__name__)

def get_chat_response(request: ChatRequest) -> ChatResponse:
    """
    Process a chat request and generate a response using the LangGraph workflow.
    """
    try:
        logger.info(f"Received chat request: '{request.message[:50]}...'")
        logger.info(f"Using model: {request.model if hasattr(request, 'model') else 'default'}")

        # Create a conversation ID if not provided
        conversation_id = request.conversation_id or str(uuid.uuid4())
        logger.info(f"Conversation ID: {conversation_id}")

        # Create initial state for the workflow
        initial_state = {
            "messages": [{"role": "user", "content": request.message}],
            "context": {}
        }
        logger.info(f"Initial state created: {initial_state}")

        # Get the vectorstore
        vectorstore = get_vectorstore()
        
        # Get the workflow with all required parameters
        logger.info("Creating workflow...")
        workflow = create_minimal_workflow(
            vectorstore=vectorstore,
            k=3,
            search_type="similarity",
            generator_name="meta-llama/llama-4-maverick-17b-128e-instruct",
            generator_temperature=0.7,
            helper_name="meta-llama/llama-4-scout-17b-16e-instruct",
            helper_temperature=0.7
        )

        # Execute the workflow with the initial state
        logger.info("Executing workflow...")
        final_state = workflow.invoke(initial_state)
        logger.info(f"Workflow execution completed. Final state keys: {final_state.keys()}")

        # Get the assistant's response (last message)
        logger.info("Extracting assistant response...")
        if "messages" not in final_state:
             logger.error("Key 'messages' not found in final_state!")
             raise ValueError("Workflow did not return 'messages' in the final state.")

        assistant_messages = [m for m in final_state["messages"] if m["role"] == "assistant"]
        if not assistant_messages:
            logger.warning("No assistant messages found in final state.")
            response_text = "I could not generate a response."
        else:
            response_text = assistant_messages[-1]["content"]

        logger.info(f"Generated response text (first 100 chars): {response_text[:100]}...")

        return ChatResponse(
            message=response_text,
            conversation_id=conversation_id,
            created_at=datetime.now()
        )
    except Exception as e:
        logger.error(f"Error in get_chat_response: {str(e)}", exc_info=True)
        # Re-raise the exception so the router can catch it and return a 500 error
        raise