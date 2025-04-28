from fastapi import APIRouter
from langchain_groq import ChatGroq

router = APIRouter()

# Existing code...
# ...existing routes...

@router.get("/test-chat-groq")
def test_chat_groq_query(prompt: str = "Hello, how are you?"):
    llm = ChatGroq(model="llama2-70b-chat", temperature=0.6, max_retries=2, max_tokens=512)
    response = llm.invoke(prompt)
    return {"Prompt": prompt, "Response": response}