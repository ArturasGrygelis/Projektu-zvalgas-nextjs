from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class SourceDocument(BaseModel):
    page_content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class MessageBase(BaseModel):
    content: str
    role: str = "user"  # "user" or "assistant"

class Message(MessageBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    model_name: Optional[str] = "meta-llama/llama-4-maverick-17b-128e-instruct"

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    sources: Optional[List[SourceDocument]] = None 

# Payment related models
class StripeWebhookEvent(BaseModel):
    event_type: str
    data: Dict[str, Any]