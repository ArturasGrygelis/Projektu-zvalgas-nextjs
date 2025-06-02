
import os
from langchain.schema.retriever import BaseRetriever
from typing_extensions import TypedDict, List
from IPython.display import Image, display
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.schema import Document
from langchain.prompts import PromptTemplate,ChatPromptTemplate
import uuid
from sentence_transformers import SentenceTransformer
from langchain.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain.schema import Document
from dotenv import load_dotenv
from langchain_core.documents import Document
import logging
from typing import Annotated
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
logger = logging.getLogger(__name__)




def retrieval_grader_grader(llm):
    """
    Function to create a grader object using a passed LLM model.
    
    Args:
        llm: The language model to be used for grading.
        
    Returns:
        Callable: A pipeline function that grades relevance based on the LLM.
    """
    class GradeDocuments(BaseModel):
        """Ar dokumentas  padės atsakyti į klausimą."""
        binary_score: str = Field(
            description="Documentas yra aktualūs klausimui, 'yes' arba 'no'"
        )
    
    # Create the structured LLM grader using the passed LLM
    structured_llm_grader = llm.with_structured_output(GradeDocuments) 
  
   


    # Define the prompt template
    prompt = PromptTemplate(
        template="""Tu esi dokumentu tikrintojas kuris žiuri ar dokumentas reikšmingas klausimui.
Pavyzdziui jei klausime miestas yra tai ar dokumente jis sutampa, jei dokumento tipas yra tada ar dokumento tipoas sutampa,
 jeigu paminėta darbo specifika pamineta ziuri ar ir dokumente tokia pamineta.
 Kartais šių punktų nėra dokumente, jei kausime tai randi o dokumente ne, praleisk toki dokumentą.
 Jei pvz adresas yra Šilutės pl.   44, Klaipėda, tai miestas yra klaipėda o gatvė yra Šilutės pl. 44.
 Jei adresas Keramikų g. 20, Vilnius , tai miestas yra Vilnius o gatvė yra Keramikų g. 20.

        
        Klausimas: {question} \n
        FAKTAS: \n\n {documents} \n\n
        
        Suteikite dvejetainį balą „yes“ arba „no“, kad nurodytumėte, ar dokumentas yra susijęs su klausimu. \n
        Pateikite dvejetainį balą kaip JSON su vienu raktu „balu“ ir be įžangos ar paaiškinimo.
        """,
        input_variables=['documents', 'question'],
    )
    
    # Combine the prompt with the structured LLM grader
    retrieval_grader = prompt | structured_llm_grader

    # Return the grader object
    return retrieval_grader    





def check_chit_chat(state, llm):
    """
    Classifies the query as 'chit_chat' or 'work_related'.
    Simple version without using structured output which causes Groq API issues.
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("Chit Chat check")
    logger.info(f"Checking if query is chit-chat: '{question}'")
    
    # Quick dictionary check first for common greetings
    CHIT_CHAT_PATTERNS = [
        "labas", "hi", "hello", "sveiki", "laba diena", "kaip sekasi", 
        "how are you", "sveikas", "heyo", "hey", "hola"
    ]
    
    # Check if the question contains any chit-chat patterns
    question_lower = question.lower().strip()
    for pattern in CHIT_CHAT_PATTERNS:
        if pattern in question_lower or question_lower == pattern:
            logger.info(f"Query '{question}' matched chit-chat pattern: {pattern}")
            return "chit_chat"
    
    # For more complex classification, use a simpler prompt approach
    prompt = PromptTemplate(
        template="""Tu esi bendravimo expertas, kuris turi patirties ir statybose. Tu turi atskirti kada žmogus klausia apie statybas, apie dominančius objektus, projektus o kada tiesiog nori paplepeti

Chit-chat Buna  tokie (like hi, hello, labas, sveiki), lengvi klausimai kaip (kaip tau sekasi, kaip laikaisi?, kas yra Lietuvos sostinė?, koks oras Klaipėdoje?), ir kita kalba kuri nesusijusi su statybu ar darbų konkursais projektais, objektais.
Jei vartotojas klausia pvz, kokie objektai yra Klaipėdoje, tai yra darbo susijęs klausimas, o ne chit-chat.



User query: {question}

Atsakyk vienu žodžiu tik tais :  "chit_chat" arba "work_related".
""",
        input_variables=["question"],
    )
    
    # Use a simple chain with string output
    chit_chat_checker = prompt | llm | StrOutputParser()
    
    try:
        # Get the classification result
        result = chit_chat_checker.invoke({"question": question})
        logger.info(f"LLM classification result for '{question}': {result}")
        
        # Clean up and normalize the result
        result = result.lower().strip()
        
        if "chit" in result or "chat" in result or result.startswith("chit"):
            logger.info("Query classified as: chit_chat")
            return "chit_chat"
        else:
            logger.info("Query classified as: work_related")
            return "work_related"
            
    except Exception as e:
        logger.error(f"Error during chit-chat classification: {e}", exc_info=True)
        # Default to work_related on error
        return "work_related"