import os
from langchain.schema.retriever import BaseRetriever
from typing_extensions import TypedDict, List
from IPython.display import Image, display
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain.prompts import PromptTemplate,ChatPromptTemplate
import uuid
from langchain_groq import ChatGroq
from sentence_transformers import SentenceTransformer
from langchain.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.output_parsers import JsonOutputParser
from langchain.schema import Document
from dotenv import load_dotenv
from langchain_core.documents import Document
import logging
from typing import Annotated
from concurrent.futures import ThreadPoolExecutor
import concurrent.futures
from app.workflows.checkers import retrieval_grader_grader,check_chit_chat
logger = logging.getLogger(__name__)

task_description="Atrask aktualiausius objektus iš duombazės, jei miestas ar tipas , ar darbo pobūdis paminėti, užtikrink kad jie būtu gražinti kaip tinkamiausi"

class InstructRetriever(BaseRetriever):
    """Retriever that adds instruction to queries before retrieval."""
    
    base_retriever: BaseRetriever = Field(...)
    task_description: str = Field(...)

    @staticmethod
    def get_detailed_instruct(task_description: str, query: str) -> str:
        """Format a query with a task description to guide the model."""
        return f'Instruct: {task_description}\nQuery: {query}'

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Add instruction to the query before passing to the base retriever."""
        formatted_query = self.get_detailed_instruct(self.task_description, query)
        return self.base_retriever.invoke(formatted_query)


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
        Atsakyk į klausimą, kalba, kuria buvo užduotas klausimas.
        Atsakymas:
        """,
        input_variables=["question", "documents"],
    )

    rag_chain = prompt | llm | StrOutputParser()
    
    return rag_chain



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
    
    filtered_doc_uuids = []  
    filtered_summaries = []  
    search = "No"
    today = datetime.datetime.now().date()
    
    # First filter out expired documents
    def is_not_expired(doc):
        """Check if document is not expired based on Pasiulyma_pateikti_iki date"""
       
        pateikti_iki = doc.metadata.get('Pasiulyma_pateikti_iki') or doc.metadata.get('pateikti_iki')
        
        if not pateikti_iki:
            return True  
        
        try:
            
            if isinstance(pateikti_iki, str):
                
                if "," in pateikti_iki:
                    date_part = pateikti_iki.split(",")[0].strip()
                else:
                    date_part = pateikti_iki.split(" ")[0].strip()
                
                
                for fmt in ('%Y-%m-%d', '%d.%m.%Y', '%Y/%m/%d', '%d-%m-%Y'):
                    try:
                        expiration_date = datetime.datetime.strptime(date_part, fmt).date()
                        break
                    except ValueError:
                        continue
                else:
                    
                    logger.warning(f"Could not parse date: {pateikti_iki}")
                    return True
            elif isinstance(pateikti_iki, (datetime.date, datetime.datetime)):
                expiration_date = pateikti_iki if isinstance(pateikti_iki, datetime.date) else pateikti_iki.date()
            else:
                logger.warning(f"Unknown date format: {type(pateikti_iki)}")
                return True
            
            
            is_valid = today <= expiration_date
            if not is_valid:
                logger.info(f"Document expired: date = {pateikti_iki} is older than today ({today}), skipping")
            else:
                logger.info(f"Document valid: date = {pateikti_iki} is valid for today ({today}), keeping")
            
            return is_valid
        except Exception as e:
            logger.error(f"Error parsing date: {e}")
            return True  # On error, include document
    
    
    def batch_documents(docs_list, batch_size=3):
        """Split documents list into batches of specified size"""
        for i in range(0, len(docs_list), batch_size):
            yield docs_list[i:i + batch_size]
    
    
    if decomposed_documents is None:
        
        valid_docs = [doc for doc in documents if is_not_expired(doc)]
        logger.info(f"Date filtering: {len(valid_docs)}/{len(documents)} documents remain after checking expiration dates")
        
        def process_document_batch(q, doc_batch):
            """Helper function to grade a batch of documents"""
            results = []
            
            for doc in doc_batch:
                try:
                    
                    score = retrieval_grader.invoke({"question": q, "documents": doc})
                    logger.info(f"Grader output for document: {score}")
                    
                    
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
        
        # Process documents in batches of 3
        with ThreadPoolExecutor(max_workers=10) as executor:
            
            future_to_batch = {}
            for doc_batch in batch_documents(valid_docs, 3):
                future = executor.submit(process_document_batch, question, doc_batch)
                future_to_batch[future] = doc_batch
            
         
            for future in concurrent.futures.as_completed(future_to_batch):
                batch_results = future.result()
                for uuid, doc in batch_results:
                    filtered_doc_uuids.append(uuid)
                    filtered_summaries.append(doc)  
            
            if len(filtered_doc_uuids) < 4:
                search = "Yes"
                
            logger.info(f"Final decision - Perform web search: {search}")
            logger.info(f"Filtered document UUIDs count: {len(filtered_doc_uuids)}")
            logger.info(f"Filtered summaries count: {len(filtered_summaries)}")
    
    else:
        
        valid_decomposed = {q: d for q, d in decomposed_documents.items() if is_not_expired(d)}
        logger.info(f"Date filtering: {len(valid_decomposed)}/{len(decomposed_documents)} decomposed documents remain")
        
        def process_document_batch(items_batch):
            """Helper function to grade a batch of question-document pairs"""
            results = []
            
            for q, doc in items_batch:
                try:
                    
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
        

        items_list = list(valid_decomposed.items())
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Create batches of items and submit each batch
            future_to_batch = {}
            for i in range(0, len(items_list), 3):  # Process in batches of 3
                batch = items_list[i:i + 3]
                future = executor.submit(process_document_batch, batch)
                future_to_batch[future] = batch
            
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
            documents.extend(document)  

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
    documents = state.get("full_documents",[])
    steps = state["steps"]
    steps.append("generate_answer")
    generation_count = state["generation_count"]
    

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
        "generation_count": generation_count  
    }


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
Answer in same language as the question is asked.
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
    




