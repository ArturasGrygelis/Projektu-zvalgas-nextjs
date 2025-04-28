from app.models.schemas import ChatRequest, ChatResponse
from app.workflows.workflows import create_chat_workflow
from datetime import datetime
import uuid

def get_chat_response(request: ChatRequest) -> ChatResponse:
    """
    Process a chat request and generate a response using the LangGraph workflow.
    """
    # Create a conversation ID if not provided
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    # Create initial state for the workflow
    initial_state = {
        "messages": [{"role": "user", "content": request.message}],
        "context": {}
    }
    
    # Get the workflow
    workflow = create_chat_workflow()
    
    # Execute the workflow with the initial state
    final_state = workflow.invoke(initial_state)
    
    # Get the assistant's response (last message)
    assistant_messages = [m for m in final_state["messages"] if m["role"] == "assistant"]
    response_text = assistant_messages[-1]["content"] if assistant_messages else "No response generated"
    
    return ChatResponse(
        message=response_text,
        conversation_id=conversation_id,
        created_at=datetime.now()
    )