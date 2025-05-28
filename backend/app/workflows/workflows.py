import os
from langchain.schema.retriever import BaseRetriever
from typing_extensions import TypedDict, List
from IPython.display import Image, display
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.schema import Document
from langgraph.graph import START, END, StateGraph
from langchain.prompts import PromptTemplate,ChatPromptTemplate
import uuid
from langchain_groq import ChatGroq
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_community.document_loaders import NewsURLLoader
from langchain_community.retrievers.wikipedia import WikipediaRetriever
from sentence_transformers import SentenceTransformer
from langchain.vectorstores import Chroma
from langchain_community.document_loaders import UnstructuredURLLoader, NewsURLLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.output_parsers import JsonOutputParser
from langchain_community.vectorstores.utils import filter_complex_metadata
from langchain.schema import Document
from langchain_community.document_loaders.directory import DirectoryLoader
from langchain.document_loaders import TextLoader
from langgraph.graph import START, END, StateGraph
from langchain.retrievers import WebResearchRetriever
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from exa_py import Exa
from dotenv import load_dotenv
from langchain_core.documents import Document
import logging
from typing import Annotated
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
logger = logging.getLogger(__name__)





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
    #workflow.add_node("contextualize_user_query", lambda state: contextualize_user_query(state, llm))
    workflow.add_node("answer_chit_chat", lambda state: answer_chit_chat(state, llm))
    #workflow.add_node("process_question_for_chroma", lambda state : process_question_for_chroma (state,llm_question_enricher))
    #workflow.add_node("decompose_question", lambda state : decompose_question (state,llm_question_enricher))
    workflow.add_node("retrieve_summaries", lambda state: retrieve_summaries(state, summaries_vectorstore,k_sum, search_type))
    workflow.add_node(
    "grade_summary_documents",
    lambda state: grade_summary_documents(state, retrieval_grader_grader(llm_checker))
)

    workflow.add_node("retrieve_full_documents", lambda state: retrieve_full_documents(state, full_vectorstore))
    #workflow.add_node("grade_documents", lambda state: grade_documents(state, retrieval_grader_grader(llm_checker)))
    workflow.add_node("generate", lambda state: generate(state, QA_chain(llm)))
    
    #workflow.add_node("transform_query", lambda state: transform_query(state, create_question_rewriter(llm)))

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




def QA_chain(llm):
    """
    Creates a question-answering chain using the provided language model.
    Args:
        llm: The language model to use for generating answers.
    Returns:
        An LLMChain configured with the question-answering prompt and the provided model.
    """
    # Define the prompt template
    prompt = PromptTemplate(
        template="""Esi asistentas, kuris padeda atsakyti i klausimus apie statybos arba aplinkos darbus, remiantis pateiktais dokumentais, apie konkrečius objektus. 
        Tavo užduotis yra paaiškinti, atsakyti  išsamiai ir tuo pačiu glaustai į klausimą: {question}, remiantis pateiktais dokumentais: {documents}.
        Turi suformuluoti atsakymą pagal pateiktus dokumentus ir tau jų turi užtekti. 
        
        Atsakyk tik remdamasis pateiktais dokumentais. Jei atsakymo negalima rasti dokumentuose, pasakyk, iš kur žinai atsakymą. 
        Jei negali atsakyti į klausimą, pasakyk: „Atsiprašau, nežinau atsakymo į jūsų klausimą.“ 
        Nepateik papildomų klausimų ir nesikartok atsakyme.
        Svarbiausia atsakyme paminėk visus objektus , jei prasoma isvardinti objektus, išvardink juos , jei klausia apie konkrečia detalę, pateik ta detalę.
        Atsakymas turi būti glaustas, bet išsamus, kad vartotojas galėtų suprasti atsakymą be papildomų paaiškinimų.
        
        Atsakymas:
        """,
        input_variables=["question", "documents"],
    )

    rag_chain = prompt | llm | StrOutputParser()
    
    return rag_chain




def ask_question(state):
    """
    Initialize question
    Args:
        state (dict): The current graph state
    Returns:
        state (dict): Question
    """
    steps = state["steps"]
    question = state["question"]
    generations_count = state.get("generations_count", 0) 
    
    
    steps.append("question_asked")
    return {"question": question, "steps": steps,"generation_count": generations_count}
        
        






        
def retrieve_full_documents(state, full_vectorstore):
    """
    Retrieve full documents using UUIDs from the summary grading step
    """
    steps = state["steps"]
    question = state["question"]
    document_uuids = state.get("document_uuids", [])
    
    steps.append("retrieve_full_documents")
    
    logger.info(f"State keys in retrieve_full_documents: {state.keys()}")
    logger.info(f"document_uuids: {document_uuids}")
    
    if not document_uuids:
        logger.warning("No document UUIDs provided for retrieval")
        return {
            "documents": [],
            "steps": steps
        }
    
    logger.info(f"Retrieving {len(document_uuids)} full documents by UUID")
    
    # Get documents by UUID from the full vectorstore
    retrieved_docs = []
    for uuid in document_uuids:
        try:
            # Get documents with this UUID - result is a dict, not an object
            results = full_vectorstore._collection.get(where={"uuid": uuid})
            
            if results and 'documents' in results and len(results['documents']) > 0:
                # Convert to Document objects
                for i, doc_content in enumerate(results['documents']):
                    metadata = results['metadatas'][i] if i < len(results['metadatas']) else {}
                    doc = Document(
                        page_content=doc_content,
                        metadata=metadata
                    )
                    retrieved_docs.append(doc)
                    logger.info(f"Retrieved document with UUID: {uuid}")
            else:
                logger.warning(f"No document found with UUID: {uuid}")
        except Exception as e:
            logger.error(f"Error retrieving document with UUID {uuid}: {e}")
    
    logger.info(f"Retrieved {len(retrieved_docs)} documents by UUID")
    
    return {
        "full_documents": retrieved_docs,
        "steps": steps
    }

def get_detailed_instruct(task_description: str, query: str) -> str:
    """Format a query with a task description to guide the model."""
    return f'Instruct: {task_description}\nQuery: {query}'

# Custom Retriever class with instruction-augmented queries
class InstructRetriever(BaseRetriever):
    """Retriever that adds instruction to queries before retrieval."""
    
    base_retriever: BaseRetriever = Field(...)
    task_description: str = Field(...)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Add instruction to the query before passing to the base retriever."""
        formatted_query = get_detailed_instruct(self.task_description, query)
        return self.base_retriever.invoke(formatted_query)


def retrieve_summaries(state, summaries_vectorstore, k, search_type):
    """
    Retrieve documents based on the processed question.
    """
    steps = state["steps"]
    sub_questions = state.get("sub_questions")
    processed_question = state.get("processed_question")
    question = state["question"]

    if sub_questions is None:
        if processed_question is not None:
            basic_retriever = summaries_vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            

            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(processed_question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
        else:
            basic_retriever = summaries_vectorstore.as_retriever(
                search_type=search_type,
                search_kwargs={"k": k}
            )
            instruct_retriever = InstructRetriever(
                base_retriever=basic_retriever,
                task_description=task_description
            )
            documents = instruct_retriever.invoke(question)

            steps.append("retrieve_documents")
            return {
                "documents": documents,
                "steps": steps
            }
    else:
        documents = []
        import math
        
        k = math.ceil(k / 2)
        retriever = summaries_vectorstore.as_retriever(
            search_type=search_type,
            search_kwargs={"k": k}
        )
        
        for q in sub_questions:
            # Ensure each sub-question is a string
            if not isinstance(q, str):
                raise TypeError(f"Each sub-question must be a string, got {type(q)} for question: {q}")
            
            document = retriever.invoke(q)
            documents.extend(document)  # Append the documents retrieved for this sub-question

        steps.append("retrieve_documents")
        return {
            "documents": documents,
            "steps": steps
        }


def generate(state, QA_chain):
    """
    Generate answer based on documents or return default message if no documents
    """
    question = state["question"]
    documents = state["full_documents"]
    steps = state["steps"]
    steps.append("generate_answer")
    generation_count = state["generation_count"]
    
    # Check if documents list is empty
    if not documents:
        logger.info("No valid documents found for query, returning default message")
        generation = "Nėra galiojančių projektų, pagal šią užklausą"
    else:
        logger.info(f"Generating answer using {len(documents)} documents")
        generation = QA_chain.invoke({"documents": documents, "question": question})
    
    generation_count += 1
        
    return {
        "full_documents": documents,
        "question": question,
        "generation": generation,
        "steps": steps,
        "generation_count": generation_count  # Include generation_count in return
    }



    


def grade_summary_documents(state, retrieval_grader):
    """
    Grade summary documents and return UUIDs of relevant documents for later retrieval
    Also keep the filtered summary documents for display in the sidebar
    Process documents in batches of three for improved efficiency
    """
    import datetime
    
    question = state["question"]
    documents = state["documents"]
    decomposed_documents = state.get('decomposed_documents')
    steps = state["steps"]
    steps.append("grade_summary_documents")
    
    filtered_doc_uuids = []  # Store UUIDs instead of full documents
    filtered_summaries = []  # Store actual documents that passed grading
    search = "No"
    today = datetime.datetime.now().date()
    
    # First filter out expired documents
    def is_not_expired(doc):
        """Check if document is not expired based on Pasiulyma_pateikti_iki date"""
        # Check both possible field names
        pateikti_iki = doc.metadata.get('Pasiulyma_pateikti_iki') or doc.metadata.get('pateikti_iki')
        
        if not pateikti_iki:
            return True  # No expiration date, so consider valid
        
        try:
            # Extract just the date part if there's a time component
            if isinstance(pateikti_iki, str):
                # First try to split by comma to separate date and time
                if "," in pateikti_iki:
                    date_part = pateikti_iki.split(",")[0].strip()
                else:
                    date_part = pateikti_iki.split(" ")[0].strip()
                
                # Try common date formats
                for fmt in ('%Y-%m-%d', '%d.%m.%Y', '%Y/%m/%d', '%d-%m-%Y'):
                    try:
                        expiration_date = datetime.datetime.strptime(date_part, fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    # If all formats failed, log and consider valid
                    logger.warning(f"Could not parse date: {pateikti_iki}")
                    return True
            elif isinstance(pateikti_iki, (datetime.date, datetime.datetime)):
                expiration_date = pateikti_iki if isinstance(pateikti_iki, datetime.date) else pateikti_iki.date()
            else:
                logger.warning(f"Unknown date format: {type(pateikti_iki)}")
                return True
            
            # Document is valid if expiration date is in the future or today
            is_valid = today <= expiration_date
            if not is_valid:
                logger.info(f"Document expired: date = {pateikti_iki} is older than today ({today}), skipping")
            else:
                logger.info(f"Document valid: date = {pateikti_iki} is valid for today ({today}), keeping")
            
            return is_valid
        except Exception as e:
            logger.error(f"Error parsing date: {e}")
            return True  # On error, include document
    
    # Utility function to batch documents
    def batch_documents(docs_list, batch_size=3):
        """Split documents list into batches of specified size"""
        for i in range(0, len(docs_list), batch_size):
            yield docs_list[i:i + batch_size]
    
    # Filter documents by date first
    if decomposed_documents is None:
        # Filter the regular documents by date
        valid_docs = [doc for doc in documents if is_not_expired(doc)]
        logger.info(f"Date filtering: {len(valid_docs)}/{len(documents)} documents remain after checking expiration dates")
        
        def process_document_batch(q, doc_batch):
            """Helper function to grade a batch of documents"""
            results = []
            
            for doc in doc_batch:
                try:
                    # Call the grading function for each document in the batch
                    score = retrieval_grader.invoke({"question": q, "documents": doc})
                    logger.info(f"Grader output for document: {score}")
                    
                    # Extract the grade
                    grade = getattr(score, 'binary_score', None)
                    if grade and grade.lower() in ["yes", "true", "1", 'taip']:
                        # Extract UUID from document metadata
                        doc_uuid = doc.metadata.get('uuid')
                        if doc_uuid:
                            results.append((doc_uuid, doc))  # Append tuple of UUID and document
                        else:
                            logger.warning(f"Document has no UUID in metadata: {doc.metadata}")
                except Exception as e:
                    logger.error(f"Error grading document: {e}")
            
            return results
        
        # Process documents in batches of 3
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Create batches of documents and submit each batch
            future_to_batch = {}
            for doc_batch in batch_documents(valid_docs, 3):
                future = executor.submit(process_document_batch, question, doc_batch)
                future_to_batch[future] = doc_batch
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_batch):
                batch_results = future.result()
                for uuid, doc in batch_results:
                    filtered_doc_uuids.append(uuid)
                    filtered_summaries.append(doc)  # Store the full document
            
            if len(filtered_doc_uuids) < 4:
                search = "Yes"
                
            logger.info(f"Final decision - Perform web search: {search}")
            logger.info(f"Filtered document UUIDs count: {len(filtered_doc_uuids)}")
            logger.info(f"Filtered summaries count: {len(filtered_summaries)}")
    
    else:
        # Handle decomposed documents (dictionary with question-document pairs)
        # Filter decomposed documents by date
        valid_decomposed = {q: d for q, d in decomposed_documents.items() if is_not_expired(d)}
        logger.info(f"Date filtering: {len(valid_decomposed)}/{len(decomposed_documents)} decomposed documents remain")
        
        def process_document_batch(items_batch):
            """Helper function to grade a batch of question-document pairs"""
            results = []
            
            for q, doc in items_batch:
                try:
                    # Call the grading function for this question-document pair
                    score = retrieval_grader.invoke({"question": q, "documents": doc})
                    logger.info(f"Grader output for document: {score}")
                    
                    # Extract the grade
                    grade = getattr(score, 'binary_score', None)
                    if grade and grade.lower() in ["yes", "true", "1", 'taip']:
                        # Extract UUID from document metadata
                        doc_uuid = doc.metadata.get('uuid')
                        if doc_uuid:
                            results.append((doc_uuid, doc))
                        else:
                            logger.warning(f"Document has no UUID in metadata: {doc.metadata}")
                except Exception as e:
                    logger.error(f"Error grading document: {e}")
            
            return results
        
        # Convert dictionary to list of tuples for batch processing
        items_list = list(valid_decomposed.items())
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Create batches of items and submit each batch
            future_to_batch = {}
            for i in range(0, len(items_list), 3):  # Process in batches of 3
                batch = items_list[i:i + 3]
                future = executor.submit(process_document_batch, batch)
                future_to_batch[future] = batch
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_batch):
                batch_results = future.result()
                for uuid, doc in batch_results:
                    filtered_doc_uuids.append(uuid)
                    filtered_summaries.append(doc)
            
            logger.info(f"Final decision - Perform web search: {search}")
            logger.info(f"Filtered decomposed document UUIDs count: {len(filtered_doc_uuids)}")
            logger.info(f"Filtered summaries count: {len(filtered_summaries)}")

    return {
        "document_uuids": filtered_doc_uuids,  # Return UUIDs instead of full documents
        "question": question,
        "search": search,
        "steps": steps,
        "filtered_summaries": filtered_summaries  # Include the filtered summary documents
    }
    



    





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
        template="""You are an expert classifier. Your task is to determine if a user's query is simple chit-chat or a substantive question.

Chit-chat includes greetings (like hi, hello, labas, sveiki), simple pleasantries (like how are you?, kaip sekasi?), and other non-work-related small talk.

Substantive questions are those asking about work rights, labor law, or specific employment situations.

User query: {question}

Respond with ONLY ONE WORD: either "chit_chat" or "work_related".
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
    


def answer_chit_chat(state, llm):
    """
    Generates a simple response for chit-chat queries.
    """
    question = state["question"]
    steps = state["steps"]
    steps.append("answer_chit_chat")
    logger.info(f"Answering chit-chat: '{question}'")
    
    # Quick dictionary lookup for common greetings
    CHIT_CHAT_RESPONSES = {
        "labas": "Labas! Kuo galėčiau padėti?",
        "hi": "Hi! How can I assist you?",
        "hello": "Hello! How can I help you today?",
        "sveiki": "Sveiki! Kuo galėčiau jums padėti?",
        "laba diena": "Laba diena! Kuo galėčiau padėti?",
        "kaip sekasi?": "Man sekasi puikiai! O kaip jums? Kuo galėčiau padėti?",
        "how are you?": "I'm doing well, thank you! How can I assist you?",
    }
    
    # Try to find direct match in dictionary
    question_lower = question.lower().strip()
    response = CHIT_CHAT_RESPONSES.get(question_lower)
    
    # If no direct match, use the LLM
    if not response:
        logger.info("No direct dictionary response, generating with LLM...")
        prompt = PromptTemplate(
            template="""You are a friendly assistant. Respond naturally to this casual greeting or small talk.
Respond in the same language as the user's message. Keep your response friendly, brief and conversational.
Add a prompt encouraging the user to ask about work-related legal questions since you're specialized in Lithuanian labor law.

User message: {question}

Your response:""",
            input_variables=["question"],
        )
        
        chit_chat_chain = prompt | llm | StrOutputParser()
        
        try:
            response = chit_chat_chain.invoke({"question": question})
        except Exception as e:
            logger.error(f"Error generating chit-chat response: {e}", exc_info=True)
            response = "Atsiprašau, įvyko klaida. Kuo galėčiau padėti?"
    
    logger.info(f"Generated chit-chat response: '{response}'")
    
    # Return updated state with the generation
    return {
        "question": question,
        "generation": response,
        "steps": steps,
        "documents": [] # Empty documents for chit-chat
    }