import os
from typing import Optional, List, Dict
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
            logger.info("Initializing dual vector store system...")
            # Using the same embeddings for both stores
            self.embeddings = HuggingFaceEmbeddings(
                model_name="intfloat/multilingual-e5-large-instruct",
                model_kwargs={'device': 'cpu', 'trust_remote_code': False},
                encode_kwargs={'normalize_embeddings': True}
            )
            
            # Paths for both vector stores
            self.summary_store_path = os.path.join(os.getcwd(), "docs2/chroma")  # Summaries
            self.full_store_path = os.path.join(os.getcwd(), "docs/chroma")      # Full articles
            
            logger.info(f"Summary store path: {self.summary_store_path}")
            logger.info(f"Full articles store path: {self.full_store_path}")
            
            self._load_stores()
            self.initialized = True
            logger.info("Dual vector store initialization completed")

    def _load_stores(self):
        """Load both summary and full article vector stores"""
        # Load summary store (docs2)
        try:
            if os.path.exists(self.summary_store_path) and os.listdir(self.summary_store_path):
                logger.info(f"Loading summary vector store from {self.summary_store_path}")
                self.summary_store = Chroma(
                    persist_directory=self.summary_store_path,
                    embedding_function=self.embeddings
                )
                count = self.summary_store._collection.count()
                logger.info(f"Successfully loaded summary store with {count} documents")
            else:
                logger.error(f"Summary vector store does not exist at {self.summary_store_path}")
                self.summary_store = None
        except Exception as e:
            logger.error(f"Error loading summary vector store: {str(e)}", exc_info=True)
            self.summary_store = None
        
        # Load full articles store (docs)
        try:
            if os.path.exists(self.full_store_path) and os.listdir(self.full_store_path):
                logger.info(f"Loading full articles vector store from {self.full_store_path}")
                self.full_store = Chroma(
                    persist_directory=self.full_store_path,
                    embedding_function=self.embeddings
                )
                count = self.full_store._collection.count()
                logger.info(f"Successfully loaded full articles store with {count} documents")
            else:
                logger.error(f"Full articles vector store does not exist at {self.full_store_path}")
                self.full_store = None
        except Exception as e:
            logger.error(f"Error loading full articles vector store: {str(e)}", exc_info=True)
            self.full_store = None
    
    def get_store(self, store_type="summary") -> Optional[Chroma]:
        """Get the vector store instance"""
        return self.summary_store if store_type == "summary" else self.full_store
    
    def similarity_search(self, query, k=3, store_type="summary"):
        """Search for similar documents in the specified vector store."""
        store = self.summary_store if store_type == "summary" else self.full_store
        
        if not store:
            logger.warning(f"{store_type} vector store not available. Cannot perform similarity search.")
            return []
            
        try:
            logger.info(f"Performing similarity search in {store_type} store for: {query[:50]}...")
            docs = store.similarity_search(query, k=k)
            logger.info(f"Found {len(docs)} documents")
            return docs
        except Exception as e:
            logger.error(f"Error during similarity search: {str(e)}", exc_info=True)
            return []
    
    def get_retriever(self, search_type="similarity", k=3, store_type="summary"):
        """Get a base retriever from the specified vector store."""
        store = self.summary_store if store_type == "summary" else self.full_store
        
        if not store:
            logger.warning(f"{store_type} vector store not available. Cannot create retriever.")
            return None
        
        try:
            if search_type == "similarity":
                return store.as_retriever(search_type="similarity", search_kwargs={"k": k})
            elif search_type == "mmr":
                return store.as_retriever(search_type="mmr", search_kwargs={"k": k})
            else:
                logger.warning(f"Unknown search type: {search_type}. Using similarity.")
                return store.as_retriever(search_type="similarity", search_kwargs={"k": k})
        except Exception as e:
            logger.error(f"Error creating retriever: {str(e)}", exc_info=True)
            return None

# Helper functions
def get_vectorstore(store_type="summary") -> Optional[Chroma]:
    """Get vectorstore instance"""
    return VectorStore().get_store(store_type)

def search_documents(query, k=20, store_type="summary"):
    """Search documents in specified store"""
    vectorstore = VectorStore()
    return vectorstore.similarity_search(query, k=k, store_type=store_type)

def get_retriever(search_type="similarity", k=3, store_type="summary"):
    """Get retriever for specified store"""
    vectorstore = VectorStore()
    return vectorstore.get_retriever(search_type=search_type, k=k, store_type=store_type)