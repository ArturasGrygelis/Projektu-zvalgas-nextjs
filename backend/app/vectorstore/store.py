import os
from typing import Optional, List, Dict
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from pydantic import Field
import logging

logger = logging.getLogger(__name__)



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
            self.summary_store_path = os.path.join(os.getcwd(), "docs2", "chroma")  # Summaries
            self.full_store_path = os.path.join(os.getcwd(), "docs", "chroma")      # Full articles
            
            logger.info(f"Summary store path: {self.summary_store_path}")
            logger.info(f"Full articles store path: {self.full_store_path}")
            
            self._load_stores()
            self.initialized = True
            logger.info("Dual vector store initialization completed")

    def _load_stores(self):
        """Load both summary and full article vector stores"""
        # Load summary store
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
    
        # Load full articles store - USING THE CORRECT PATH
        try:
            if os.path.exists(self.full_store_path) and os.listdir(self.full_store_path):
                logger.info(f"Loading full articles vector store from {self.full_store_path}")
                self.full_store = Chroma(
                    persist_directory=self.full_store_path,  # Using full_store_path now!
                    embedding_function=self.embeddings
                )
                count = self.full_store._collection.count()
                logger.info(f"Successfully loaded full articles store with {count} documents")
            else:
                logger.warning(f"Full articles vector store path does not exist: {self.full_store_path}")
                self.full_store = None
        except Exception as e:
            logger.error(f"Error loading full articles vector store: {str(e)}", exc_info=True)
            self.full_store = None
    
    def get_store(self, store_type="summary") -> Optional[Chroma]:
        """Get the vector store instance"""
        if store_type == "summary":
            return self.summary_store
        elif store_type == "full":
            return self.full_store
        else:
            # Default behavior - return whichever one is available
            if self.summary_store is not None:
                return self.summary_store
            elif self.full_store is not None:
                logger.warning("Summary store not available, returning full store")
                return self.full_store
            else:
                logger.error("No vector stores available")
                return None
    
   

# Helper functions
def get_vectorstore(store_type="summary") -> Optional[Chroma]:
    """Get vectorstore instance"""
    return VectorStore().get_store(store_type)

