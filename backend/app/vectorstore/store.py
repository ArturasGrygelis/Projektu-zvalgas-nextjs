import os
from typing import Optional, List
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from pydantic import Field
import logging

logger = logging.getLogger(__name__)

# Helper function to add instructions to the query
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

class VectorStore:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance
    
    def __init__(self):
        if not self.initialized:
            logger.info("Initializing Chroma vector store...")
            # Using the same embeddings as your Streamlit app
            self.embeddings = HuggingFaceEmbeddings(
                model_name="intfloat/multilingual-e5-large-instruct",
                model_kwargs={'device': 'cpu', 'trust_remote_code': False},
                encode_kwargs={'normalize_embeddings': True}
            )
            # Use the same path as your Streamlit app
            self.store_path = os.path.join(os.getcwd(), "docs/chroma")
            logger.info(f"Vector store path: {self.store_path}")
            self._load_store()
            self.initialized = True

    def _load_store(self):
        try:
            if os.path.exists(self.store_path) and os.listdir(self.store_path):
                logger.info(f"Loading existing Chroma vector store from {self.store_path}")
                self.store = Chroma(
                    persist_directory=self.store_path,
                    embedding_function=self.embeddings
                )
                # Test if it works
                count = self.store._collection.count()
                logger.info(f"Successfully loaded vector store with {count} documents")
            else:
                logger.error(f"Vector store does not exist at {self.store_path}")
                self.store = None
        except Exception as e:
            logger.error(f"Error loading vector store: {str(e)}", exc_info=True)
            self.store = None
    
    def similarity_search(self, query, k=3):
        """Search for similar documents in the vector store."""
        if not self.store:
            logger.warning("Vector store not available. Cannot perform similarity search.")
            return []
            
        try:
            logger.info(f"Performing similarity search for: {query[:50]}...")
            docs = self.store.similarity_search(query, k=k)
            logger.info(f"Found {len(docs)} documents")
            return docs
        except Exception as e:
            logger.error(f"Error during similarity search: {str(e)}", exc_info=True)
            return []
    
    def get_store(self) -> Optional[Chroma]:
        """Get the vector store instance"""
        return self.store
    
    def get_retriever(self, search_type="similarity", k=3):
        """Get a base retriever from the vector store."""
        if not self.store:
            logger.warning("Vector store not available. Cannot create retriever.")
            return None
        
        try:
            if search_type == "similarity":
                return self.store.as_retriever(search_type="similarity", search_kwargs={"k": k})
            elif search_type == "mmr":
                return self.store.as_retriever(search_type="mmr", search_kwargs={"k": k})
            else:
                logger.warning(f"Unknown search type: {search_type}. Using similarity.")
                return self.store.as_retriever(search_type="similarity", search_kwargs={"k": k})
        except Exception as e:
            logger.error(f"Error creating retriever: {str(e)}", exc_info=True)
            return None
    
    def get_instruct_retriever(self, task_description=None, search_type="similarity", k=3):
        """Get an instruction-augmented retriever"""
        base_retriever = self.get_retriever(search_type=search_type, k=k)
        if not base_retriever:
            return None
        
        # Default task description for Lithuanian labor law if none provided
        if task_description is None:
            task_description = "Raskite teisinius straipsnius ir nuostatas, kurie tiesiogiai susiję su užklausa apie darbo teisę Lietuvoje"
        
        return InstructRetriever(
            base_retriever=base_retriever,
            task_description=task_description
        )

# Create a singleton instance
def get_vectorstore() -> Optional[Chroma]:
    return VectorStore().get_store()

# Helper function to perform similarity search directly
def search_documents(query, k=3):
    vectorstore = VectorStore()
    return vectorstore.similarity_search(query, k=k)

# Helper function to get an instruct retriever
def get_instruct_retriever(task_description=None, search_type="similarity", k=3):
    vectorstore = VectorStore()
    return vectorstore.get_instruct_retriever(
        task_description=task_description,
        search_type=search_type, 
        k=k
    )