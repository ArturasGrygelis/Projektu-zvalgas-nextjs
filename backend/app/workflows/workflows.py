import os
from langchain.schema.retriever import BaseRetriever
from typing_extensions import TypedDict, List
from IPython.display import Image, display
from langchain_core.pydantic_v1 import BaseModel, Field

from langgraph.graph import START, END, StateGraph

import uuid
from langchain_groq import ChatGroq

from langchain.schema import Document
from dotenv import load_dotenv
from langchain_core.documents import Document
import logging
from typing import Annotated
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
logger = logging.getLogger(__name__)
from app.workflows.workflow_functions import (
    retrieve_summaries,
    grade_summary_documents, 
    retrieve_full_documents,
    generate,
    InstructRetriever ,
    ask_question,
    answer_chit_chat,
    QA_chain, 
)
from app.workflows.checkers import check_chit_chat,  retrieval_grader_grader



load_dotenv()

# Get API keys from environment variables
LANGCHAIN_API_KEY = os.environ.get('LANGCHAIN_API_KEY')
LANGCHAIN_TRACING_V2 = os.environ.get('LANGCHAIN_TRACING_V2')
LANGCHAIN_ENDPOINT = os.environ.get('LANGCHAIN_ENDPOINT')
LANGCHAIN_PROJECT = os.environ.get('LANGCHAIN_PROJECT')
GROQ_API_KEY = os.environ.get('GROQ_API_KEY')
SERPER_API_KEY = os.environ.get('SERPER_API_KEY')
EXA_API_KEY = os.environ.get('EXA_API_KEY')


task_description="Atrask aktualiausius objektus iš duombazės, jei miestas ar tipas , ar darbo pobūdis paminėti, užtikrink kad jie būtu gražinti kaip tinkamiausi"



def create_minimal_workflow(full_vectorstore, summaries_vectorstore,  k_sum, search_type, generator_name, generator_temperature, helper_name, helper_temperature):
    
    class GraphState(TypedDict):
        """
        Represents the state of our graph.
        Attributes:
            question: question
            generation: LLM generation
            search: whether to add search
            documents: list of documents
            generations_count : generations count
        """
        question: Annotated[str, "Single"]
        questions: Annotated[List[str], "Multiple"]  # Ensuring only one value per step
        generation: str
        search: str
        documents: List[str]
        steps: List[str]
        generation_count: int
        decomposed_documents: dict[str, List[str]] 
        processed_question: Annotated[str, "Single"]
        sub_questions : List[str]
        document_uuids: List[str]
        full_documents: List[str]
        filtered_summaries: List[str]
        

    
    llm = ChatGroq(
            model=generator_name,  
           temperature=generator_temperature,
            max_tokens=1000,
            max_retries=3,

        )
    llm_checker = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )

    llm_question_enricher = ChatGroq(
            model=helper_name,
            temperature=helper_temperature,
            max_tokens=400,
            max_retries=3,
       )   



        

    


    workflow = StateGraph(GraphState)
    
    # Define the nodes
    workflow.add_node("ask_question", lambda state: ask_question(state))  
    workflow.add_node("answer_chit_chat", lambda state: answer_chit_chat(state, llm))
    workflow.add_node("retrieve_summaries", lambda state: retrieve_summaries(state, summaries_vectorstore,k_sum, search_type))
    workflow.add_node(
    "grade_summary_documents",
    lambda state: grade_summary_documents(state, retrieval_grader_grader(llm_checker))
)

    workflow.add_node("retrieve_full_documents", lambda state: retrieve_full_documents(state, full_vectorstore))
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    

    # Build graph
    workflow.set_entry_point("ask_question")
    workflow.add_conditional_edges(
        "ask_question", # Coming FROM check_chit_chat node 
        lambda state: check_chit_chat(state, llm), # Function directly returns "chit_chat" or "work_related"
        {
            "chit_chat": "answer_chit_chat", # If chit_chat, go to answer node
            "work_related": "retrieve_summaries" # If work_related, start normal workflow
        }
    )
    
    
    workflow.add_edge("retrieve_summaries", "grade_summary_documents")
    workflow.add_edge("grade_summary_documents", "retrieve_full_documents")
    workflow.add_edge("retrieve_full_documents", "generate")
    
    workflow.add_edge("generate", END)

    
    custom_graph = workflow.compile()

    return custom_graph









